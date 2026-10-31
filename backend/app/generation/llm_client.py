import logging
from typing import NamedTuple

import httpx
from google import genai
from google.genai import errors, types
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.core.config import settings

log = logging.getLogger(__name__)

_client = genai.Client(
    api_key=settings.gemini_api_key,
    http_options=types.HttpOptions(timeout=45_000),  # milliseconds, per request
)


class Generation(NamedTuple):
    text: str
    model: str  # which model actually answered


class GenerationFailed(RuntimeError):
    """Every configured model failed."""


class GenerationQuotaExceeded(GenerationFailed):
    """Every configured model has hit its daily quota."""


def _is_daily_quota(exc: BaseException) -> bool:
    return (
        isinstance(exc, errors.ClientError)
        and exc.code == 429
        and "PerDay" in str(exc)
    )


def _is_fatal(exc: BaseException) -> bool:
    # Problems that no other model can fix, such as a bad API key.
    return isinstance(exc, errors.ClientError) and (
        exc.code in (401, 403) or "API key" in str(exc)
    )


def _retry_same_model(exc: BaseException) -> bool:
    # Short per-minute rate limits and brief overloads are worth one retry.
    if _is_daily_quota(exc):
        return False
    if isinstance(exc, errors.ServerError) and exc.code == 503:
        return True
    return isinstance(exc, errors.ClientError) and exc.code == 429


@retry(
    retry=retry_if_exception(_retry_same_model),
    stop=stop_after_attempt(2),
    wait=wait_exponential(min=2, max=10),
    reraise=True,
)
def _call(model: str, system: str, prompt: str) -> str:
    res = _client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            thinking_config=types.ThinkingConfig(thinking_level="low"),
        ),
    )
    return (res.text or "").strip()


def generate(system: str, prompt: str) -> Generation:
    failures: list[BaseException] = []
    for model in settings.generation_models:
        try:
            return Generation(_call(model, system, prompt), model)
        except (errors.APIError, httpx.TimeoutException) as exc:
            if _is_fatal(exc):
                raise
            log.warning("Model %s failed (%s); trying next", model, type(exc).__name__)
            failures.append(exc)

    if failures and all(_is_daily_quota(e) for e in failures):
        raise GenerationQuotaExceeded(
            "All generation models hit their daily quota. Try again later."
        ) from failures[-1]
    raise GenerationFailed("All generation models failed.") from failures[-1]