import logging

from app.embeddings.embedder import DailyQuotaExceeded
from app.retrieval.keyword_search import keyword_search
from app.retrieval.vector_search import vector_search

log = logging.getLogger(__name__)

RRF_K = 60


def rrf_merge(ranked_lists: dict[str, list[dict]], k: int = RRF_K) -> list[dict]:
    """Merge ranked result lists with Reciprocal Rank Fusion."""
    merged: dict[int, dict] = {}
    for name, results in ranked_lists.items():
        for rank, item in enumerate(results, start=1):
            entry = merged.setdefault(
                item["id"], {**item, "score": 0.0, "found_by": []}
            )
            entry["score"] += 1.0 / (k + rank)
            entry["found_by"].append(name)
    return sorted(merged.values(), key=lambda x: x["score"], reverse=True)


def hybrid_search(query: str, limit: int = 5, candidates: int = 20) -> list[dict]:
    lists = {"keyword": keyword_search(query, candidates)}
    try:
        lists["vector"] = vector_search(query, candidates)
    except DailyQuotaExceeded:
        log.warning("Embedding quota reached; falling back to keyword search only")
    return rrf_merge(lists)[:limit]