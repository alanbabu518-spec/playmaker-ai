from types import SimpleNamespace

from app.core import metrics
from app.generation.llm_client import _tokens


def test_tokens_add_thinking_to_output():
    usage = SimpleNamespace(prompt_token_count=100, candidates_token_count=30, thoughts_token_count=20, total_token_count=150)
    assert _tokens(SimpleNamespace(usage_metadata=usage)) == (100, 50, 150)


def test_missing_usage_gives_none():
    assert _tokens(SimpleNamespace(usage_metadata=None)) == (None, None, None)
    usage = SimpleNamespace(prompt_token_count=5, candidates_token_count=None, thoughts_token_count=None, total_token_count=5)
    assert _tokens(SimpleNamespace(usage_metadata=usage)) == (5, None, 5)


def test_record_keeps_only_known_fields_and_the_request_id(monkeypatch):
    rows = []
    monkeypatch.setattr(metrics, "_insert", rows.append)
    token = metrics.request_id_var.set("req-123456")
    try:
        metrics.record(status=200, total_ms=12, question="must never be stored").result(timeout=5)
    finally:
        metrics.request_id_var.reset(token)
    assert rows[0]["request_id"] == "req-123456" and rows[0]["total_ms"] == 12
    assert "question" not in rows[0] and set(rows[0]) == set(metrics.FIELDS)


def test_a_failing_write_never_raises(monkeypatch):
    class BrokenPool:
        def connection(self):
            raise RuntimeError("db down")

    monkeypatch.setattr(metrics, "pool", BrokenPool())
    metrics.record(status=200).result(timeout=5)  # logs a warning and returns


def test_stats_shape_handles_an_empty_window():
    empty = {
        "requests": 0, "cache_hits": 0, "errors": 0, "answered": 0, "refused": 0,
        "total_p50": None, "total_p95": None, "retrieval_p50": None, "retrieval_p95": None,
        "generation_p50": None, "generation_p95": None,
        "prompt_tokens": 0, "output_tokens": 0, "total_tokens": 0, "avg_tokens_per_answer": None,
    }
    s = metrics.shape_stats(24, empty, [], [])
    assert s["cache_hit_rate"] is None and s["latency_ms"]["total"]["p95"] is None


def test_stats_shape_computes_rates_and_rounds():
    row = {
        "requests": 10, "cache_hits": 4, "errors": 1, "answered": 4, "refused": 1,
        "total_p50": 812.4, "total_p95": 2100.6, "retrieval_p50": 90.0, "retrieval_p95": 150.0,
        "generation_p50": 700.0, "generation_p95": 1900.0,
        "prompt_tokens": 4000, "output_tokens": 800, "total_tokens": 4800, "avg_tokens_per_answer": 960.0,
    }
    s = metrics.shape_stats(24, row, [{"error": "quota_exceeded", "n": 1}], [{"model": "m1", "n": 5}])
    assert s["cache_hit_rate"] == 0.4 and s["answered_rate"] == 0.8
    assert s["latency_ms"]["total"] == {"p50": 812, "p95": 2101}
    assert s["errors_by_type"] == {"quota_exceeded": 1} and s["answers_by_model"] == {"m1": 5}