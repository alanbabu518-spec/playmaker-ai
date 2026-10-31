import math
from concurrent.futures import ThreadPoolExecutor

from google import genai
from google.genai import errors, types
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.core.config import settings

_client = genai.Client(api_key=settings.gemini_api_key)
MAX_WORKERS = 4


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def _is_transient(exc: BaseException) -> bool:
    # Retry only temporary failures: server errors and rate limits.
    if isinstance(exc, errors.ServerError):
        return True
    return isinstance(exc, errors.ClientError) and exc.code == 429


@retry(
    retry=retry_if_exception(_is_transient),
    stop=stop_after_attempt(5),
    wait=wait_exponential(min=2, max=30),
    reraise=True,
)
def _embed_one(text: str, task_type: str) -> list[float]:
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
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        return list(pool.map(lambda t: _embed_one(t, task_type), texts))