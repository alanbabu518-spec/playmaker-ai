import logging
import secrets
import threading
import time

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query

from app.api.middleware import llm_budget, rate_limit_ask
from app.api.schemas import AskRequest, AskResponse, IngestRequest, IngestResponse
from app.core import metrics
from app.core.config import settings
from app.core.db import pool
from app.generation.answer import answer_question
from app.generation.llm_client import GenerationFailed, GenerationQuotaExceeded
from app.ingestion.pipeline import ingest_titles
from app.utils.cache import DEGRADED_TTL, FULL_TTL, answer_cache, cache_key

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
def health() -> dict:
    try:
        with pool.connection() as conn:
            conn.execute("SELECT 1")
    except Exception:
        log.exception("Health check failed")
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok"}


def _observe(
    start: float,
    *,
    status: int = 200,
    cached: bool = False,
    error: str | None = None,
    result: dict | None = None,
    top_k: int | None = None,
) -> None:
    """One structured log line and one stored metrics row for every /ask outcome."""
    result = result or {}
    usage = result.get("usage") or {}
    fields = {
        "status": status,
        "cached": cached,
        "answered": result.get("answered"),
        "error": error,
        "model": result.get("model"),
        "retrieval_methods": result.get("retrieval_methods", []),
        "retrieval_ms": result.get("retrieval_ms"),
        "generation_ms": result.get("generation_ms"),
        "total_ms": int((time.perf_counter() - start) * 1000),
        "prompt_tokens": usage.get("prompt_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "total_tokens": usage.get("total_tokens"),
        "top_k": top_k,
    }
    shown = {k: v for k, v in fields.items() if v is not None}
    if error:
        log.warning("ask_failed", extra=shown)
    else:
        log.info("ask_completed", extra=shown)
    metrics.record(**fields)


@router.post("/ask", response_model=AskResponse, dependencies=[Depends(rate_limit_ask)])
def ask(req: AskRequest) -> dict:
    start = time.perf_counter()
    key = cache_key(req.question, req.top_k)
    hit = answer_cache.get(key)
    if hit is not None:
        elapsed = int((time.perf_counter() - start) * 1000)
        # Pass no usage or stage timings: a cache hit cost no tokens, and counting the old ones again would inflate totals.
        _observe(start, cached=True, result={"answered": hit.get("answered"), "model": hit.get("model")}, top_k=req.top_k)
        return {**hit, "cached": True, "latency_ms": elapsed}

    # Only uncached answers cost quota, so only they count against the daily budget.
    if not llm_budget.try_spend():
        _observe(start, status=503, error="budget_exhausted", top_k=req.top_k)
        raise HTTPException(
            status_code=503,
            detail="The demo's daily answer budget is used up. Previously asked questions still work.",
        )

    try:
        result = answer_question(req.question, top_k=req.top_k)
    except GenerationQuotaExceeded:
        _observe(start, status=503, error="quota_exceeded", top_k=req.top_k)
        raise HTTPException(
            status_code=503,
            detail="The AI model's daily quota is used up. Please try again later.",
        )
    except GenerationFailed:
        _observe(start, status=503, error="model_unavailable", top_k=req.top_k)
        raise HTTPException(
            status_code=503,
            detail="The AI model is temporarily unavailable. Please try again.",
        )
    except Exception:
        log.exception("Unhandled error while answering")
        _observe(start, status=500, error="internal_error", top_k=req.top_k)
        raise HTTPException(status_code=500, detail="Something went wrong while answering.")

    full_hybrid = "vector" in result.get("retrieval_methods", [])
    answer_cache.set(key, result, FULL_TTL if full_hybrid else DEGRADED_TTL)
    _observe(start, result=result, top_k=req.top_k)
    return {**result, "cached": False}


@router.get("/stats")
def stats(hours: int = Query(24, ge=1, le=168)) -> dict:
    """Aggregate latency, error and token numbers for the last `hours`. No questions or answers are included."""
    try:
        return metrics.fetch_stats(hours)
    except Exception:
        log.exception("Stats query failed")
        raise HTTPException(status_code=503, detail="Stats are unavailable.")


_ingest_lock = threading.Lock()


def require_admin(x_admin_key: str = Header(default="")) -> None:
    expected = settings.admin_api_key
    if not expected:
        raise HTTPException(status_code=503, detail="Ingestion is disabled on this server.")
    # Constant-time comparison, so response timing can't reveal the key.
    if not secrets.compare_digest(x_admin_key.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid admin key.")


def _run_ingest(titles: list[str]) -> None:
    try:
        ingest_titles(titles)
    finally:
        _ingest_lock.release()


@router.post(
    "/ingest",
    status_code=202,
    response_model=IngestResponse,
    dependencies=[Depends(require_admin)],
)
def ingest(req: IngestRequest, background: BackgroundTasks) -> dict:
    if not _ingest_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="An ingestion run is already in progress.")
    background.add_task(_run_ingest, req.titles)
    return {"status": "started", "titles": req.titles}