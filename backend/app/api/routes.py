import logging

from fastapi import APIRouter, HTTPException

from app.api.schemas import AskRequest, AskResponse
from app.core.db import pool
from app.generation.answer import answer_question
from app.generation.llm_client import GenerationFailed, GenerationQuotaExceeded

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


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest) -> dict:
    try:
        return answer_question(req.question, top_k=req.top_k)
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