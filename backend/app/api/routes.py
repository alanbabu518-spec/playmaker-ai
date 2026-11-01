import logging
import secrets
import threading
import time

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException

from app.api.middleware import llm_budget, rate_limit_ask
from app.api.schemas import AskRequest, AskResponse, IngestRequest, IngestResponse
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


@router.post("/ask", response_model=AskResponse, dependencies=[Depends(rate_limit_ask)])
def ask(req: AskRequest) -> dict:
    start = time.perf_counter()
    key = cache_key(req.question, req.top_k)
    hit = answer_cache.get(key)
    if hit is not None:
        elapsed = int((time.perf_counter() - start) * 1000)
        return {**hit, "cached": True, "latency_ms": elapsed}

    # Only uncached answers cost quota, so only they count against the daily budget.
    if not llm_budget.try_spend():
        raise HTTPException(
            status_code=503,
            detail="The demo's daily answer budget is used up. Previously asked questions still work.",
        )

    try:
        result = answer_question(req.question, top_k=req.top_k)
    except GenerationQuotaExceeded:
        raise HTTPException(
            status_code=503,
            detail="The AI model's daily quota is used up. Please try again later.",
        )
    except GenerationFailed:
        raise HTTPException(
            status_code=503,
            detail="The AI model is temporarily unavailable. Please try again.",
        )
    except Exception:
        log.exception("Unhandled error while answering")
        raise HTTPException(status_code=500, detail="Something went wrong while answering.")

    full_hybrid = "vector" in result.get("retrieval_methods", [])
    answer_cache.set(key, result, FULL_TTL if full_hybrid else DEGRADED_TTL)
    return {**result, "cached": False}


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