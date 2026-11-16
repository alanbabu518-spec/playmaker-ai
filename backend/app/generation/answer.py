import logging
import re
import time

from app.generation.llm_client import generate
from app.generation.prompts import NO_ANSWER, SYSTEM_PROMPT, build_user_prompt
from app.retrieval.hybrid import hybrid_search

log = logging.getLogger(__name__)

CITATION = re.compile(r"\[(\d+)\]")


def _cited_numbers(text: str, max_n: int) -> set[int]:
    # Keep only numbers that point at a real source, so invented citations like [9] are ignored.
    return {int(n) for n in CITATION.findall(text) if 1 <= int(n) <= max_n}


def answer_question(question: str, top_k: int = 5) -> dict:
    start = time.perf_counter()
    chunks = hybrid_search(question, limit=top_k)
    retrieval_ms = int((time.perf_counter() - start) * 1000)

    text, model = NO_ANSWER, None
    generation_ms = 0
    usage = {"prompt_tokens": None, "output_tokens": None, "total_tokens": None}
    if chunks:  # no evidence means no LLM call, so nothing can be made up
        gen_start = time.perf_counter()
        gen = generate(SYSTEM_PROMPT, build_user_prompt(question, chunks))
        generation_ms = int((time.perf_counter() - gen_start) * 1000)
        text, model = gen.text or NO_ANSWER, gen.model
        usage = {
            "prompt_tokens": gen.prompt_tokens,
            "output_tokens": gen.output_tokens,
            "total_tokens": gen.total_tokens,
        }

    answered = bool(chunks) and not text.startswith(NO_ANSWER)
    cited = _cited_numbers(text, len(chunks)) if answered else set()
    if answered and not cited:
        log.warning("Answer has no valid citations: %r", question)

    sources = []
    if answered:
        sources = [
            {
                "id": i,
                "title": c["title"],
                "section": c["metadata"].get("section"),
                "url": c["url"],
                "snippet": c["content"][:300],
                "cited": i in cited,
            }
            for i, c in enumerate(chunks, start=1)
        ]

    return {
        "answer": text,
        "answered": answered,
        "sources": sources,
        "contexts": [c["content"] for c in chunks],  # full retrieved text, used by RAGAS
        "model": model,
        "retrieval_methods": sorted({m for c in chunks for m in c.get("found_by", [])}),
        "latency_ms": int((time.perf_counter() - start) * 1000),
        "retrieval_ms": retrieval_ms,  # monitoring only: /ask does not return these three
        "generation_ms": generation_ms,
        "usage": usage,
    }