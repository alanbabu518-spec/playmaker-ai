import pytest

from eval.publish_results import build, markdown, update_readme

RAGAS = {
    "complete": True,
    "judge_model": "judge-x",
    "questions_scored": 30,
    "mean_scores": {"faithfulness": 0.9, "llm_context_precision_with_reference": 0.8, "context_recall": 0.7},
}
RETRIEVAL = {"k": 5, "questions": 50, "scored": 48, "keyword_only": 0, "hit_at_1": 0.7, "hit_at_3": 0.85, "hit_at_k": 0.9, "mrr": 0.78}
COMPARE = {
    "keyword": {"scored": 48, "hit_at_1": 0.5, "hit_at_3": 0.7, "hit_at_k": 0.8, "mrr": 0.6},
    "hybrid": {"scored": 48, "hit_at_1": 0.7, "hit_at_3": 0.85, "hit_at_k": 0.9, "mrr": 0.78},
}
ROWS = [
    {"answerable": True, "answered": True, "cited": True, "latency_ms": 100},
    {"answerable": True, "answered": False, "cited": False, "latency_ms": 300},
    {"answerable": False, "answered": False, "cited": False, "latency_ms": 200},
]


def test_builds_from_complete_results():
    d = build(RAGAS, RETRIEVAL, COMPARE, ROWS, "2026-11-12")
    assert d["ragas"]["context_precision"] == 0.8
    assert d["retrieval"]["compare"]["hybrid"]["mrr"] == 0.78
    assert d["pipeline"]["answered_rate"] == 0.5
    assert d["pipeline"]["refused_unanswerable_rate"] == 1.0


def test_incomplete_ragas_run_is_refused():
    with pytest.raises(ValueError, match="incomplete"):
        build({**RAGAS, "complete": False}, RETRIEVAL, None, None, "d")


def test_missing_inputs_are_refused():
    with pytest.raises(ValueError):
        build(None, RETRIEVAL, None, None, "d")
    with pytest.raises(ValueError):
        build(RAGAS, None, None, None, "d")


def test_keyword_fallback_run_is_refused():
    with pytest.raises(ValueError, match="keyword-only"):
        build(RAGAS, {**RETRIEVAL, "keyword_only": 3}, None, None, "d")


def test_markdown_shows_the_numbers():
    md = markdown(build(RAGAS, RETRIEVAL, COMPARE, ROWS, "2026-11-12"))
    assert "judge-x" in md and "0.90" in md and "| Hybrid | 70% |" in md


def test_readme_section_is_replaced_not_duplicated():
    once = update_readme("# T\n", "first")
    twice = update_readme(once, "second")
    assert twice.count("<!-- EVAL:START -->") == 1
    assert "second" in twice and "first" not in twice