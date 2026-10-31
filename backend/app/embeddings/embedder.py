import math
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from google import genai
from google.genai import errors, types
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.core.config import settings

_client = genai.Client(api_key=settings.gemini_api_key)

MAX_WORKERS = 4
MIN_INTERVAL = 0.75  # seconds between request starts: at most about 80 per minute
_lock = threading.Lock()
_last_call = 0.0


class DailyQuotaExceeded(RuntimeError):
    """Daily embedding quota is used up, so retrying today is pointless."""


def _throttle() -> None:
    # All worker threads take turns here, so request starts stay evenly spaced.
    global _last_call
    with _lock:
        wait = _last_call + MIN_INTERVAL - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_call = time.monotonic()


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def _is_daily_quota(exc: BaseException) -> bool:
    return (
        isinstance(exc, errors.ClientError)
        and exc.code == 429
        and "PerDay" in str(exc)
    )


def _is_transient(exc: BaseException) -> bool:
    # Retry only temporary failures: server errors and per-minute rate limits.
    if _is_daily_quota(exc):
        return False
    if isinstance(exc, errors.ServerError):
        return True
    return isinstance(exc, errors.ClientError) and exc.code == 429


@retry(
    retry=retry_if_exception(_is_transient),
    stop=stop_after_attempt(8),
    wait=wait_exponential(min=4, max=60),
    reraise=True,
)
def _embed_one(text: str, task_type: str) -> list[float]:
    _throttle()  # inside the retried function, so retries are throttled too
    res = _client.models.embed_content(
        model=settings.embedding_model,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=settings.embedding_dim,
        ),
    )
    if len(res.embeddings) != 1:
        raise ValueError(f"Expected 1 embedding, got {len(res.embeddings)}")
    return _normalize(res.embeddings[0].values)


def embed(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    pool = ThreadPoolExecutor(max_workers=MAX_WORKERS)
    try:
        return list(pool.map(lambda t: _embed_one(t, task_type), texts))
    except errors.ClientError as exc:
        if _is_daily_quota(exc):
            raise DailyQuotaExceeded(
                "Gemini daily embedding quota reached. Finished pages are saved; "
                "rerun later to resume."
            ) from exc
        raise
    finally:
        pool.shutdown(wait=True, cancel_futures=True)  # drop queued work on failure