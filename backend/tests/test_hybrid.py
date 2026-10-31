import pytest

from app.embeddings.embedder import DailyQuotaExceeded
from app.retrieval import hybrid
from app.retrieval.hybrid import rrf_merge


def item(i: int) -> dict:
    return {"id": i, "content": f"chunk {i}", "title": "T", "url": "u", "metadata": {}}


def test_chunk_found_by_both_lists_ranks_first():
    lists = {"keyword": [item(1), item(2)], "vector": [item(3), item(2)]}
    assert rrf_merge(lists)[0]["id"] == 2


def test_score_matches_rrf_formula():
    result = rrf_merge({"keyword": [item(1)]})
    assert result[0]["score"] == pytest.approx(1 / 61)


def test_found_by_tracks_sources():
    result = rrf_merge({"keyword": [item(1), item(2)], "vector": [item(2)]})
    by_id = {r["id"]: r for r in result}
    assert by_id[1]["found_by"] == ["keyword"]
    assert sorted(by_id[2]["found_by"]) == ["keyword", "vector"]


def test_empty_input():
    assert rrf_merge({}) == []
    assert rrf_merge({"keyword": []}) == []


def test_falls_back_to_keyword_when_quota_exhausted(monkeypatch):
    monkeypatch.setattr(hybrid, "keyword_search", lambda q, n: [item(1), item(2)])

    def quota_error(q, n):
        raise DailyQuotaExceeded("quota")

    monkeypatch.setattr(hybrid, "vector_search", quota_error)

    result = hybrid.hybrid_search("anything", limit=5)
    assert [r["id"] for r in result] == [1, 2]
    assert all(r["found_by"] == ["keyword"] for r in result)