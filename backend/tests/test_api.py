from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient

from app.api import routes
from app.core.config import settings
from app.generation.llm_client import GenerationFailed, GenerationQuotaExceeded
from app.main import app

from app.utils.cache import answer_cache


@pytest.fixture(autouse=True)
def clear_cache():
    answer_cache.clear()  # tests must not see each other's cached answers
    yield

# No "with": this skips the startup hook, so the tests never open a real database pool.
client = TestClient(app)

FAKE_ANSWER = {
    "answer": "Argentina won [1].",
    "answered": True,
    "sources": [
        {"id": 1, "title": "T", "section": "S", "url": "https://x", "snippet": "s", "cited": True}
    ],
    "contexts": ["full retrieved text that must stay private"],
    "model": "fake-model",
    "latency_ms": 5,
}


class FakeConn:
    def execute(self, sql):
        return None


class FakePool:
    def __init__(self, fail: bool = False):
        self.fail = fail

    @contextmanager
    def connection(self):
        if self.fail:
            raise RuntimeError("db down")
        yield FakeConn()


def fake_answer(q, top_k=5):
    return FAKE_ANSWER


def raiser(exc):
    def _raise(q, top_k=5):
        raise exc
    return _raise


# --- /health ---

def test_health_ok(monkeypatch):
    monkeypatch.setattr(routes, "pool", FakePool())
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_reports_database_down(monkeypatch):
    monkeypatch.setattr(routes, "pool", FakePool(fail=True))
    assert client.get("/health").status_code == 503


# --- /ask ---

def test_ask_returns_answer_and_hides_contexts(monkeypatch):
    monkeypatch.setattr(routes, "answer_question", fake_answer)
    r = client.post("/ask", json={"question": "Who won the final?"})
    assert r.status_code == 200
    assert "contexts" not in r.json()
    assert r.json()["sources"][0]["cited"] is True


@pytest.mark.parametrize(
    "body",
    [{"question": "hi"}, {"question": "ok question", "top_k": 99}],
)
def test_ask_rejects_invalid_input(monkeypatch, body):
    monkeypatch.setattr(routes, "answer_question", fake_answer)
    assert client.post("/ask", json=body).status_code == 422


def test_ask_maps_quota_error_to_503(monkeypatch):
    monkeypatch.setattr(routes, "answer_question", raiser(GenerationQuotaExceeded("x")))
    r = client.post("/ask", json={"question": "Who won the final?"})
    assert r.status_code == 503
    assert "quota" in r.json()["detail"].lower()


def test_ask_maps_model_failure_to_503(monkeypatch):
    monkeypatch.setattr(routes, "answer_question", raiser(GenerationFailed("x")))
    r = client.post("/ask", json={"question": "Who won the final?"})
    assert r.status_code == 503


def test_unexpected_error_returns_500_without_leaking_details(monkeypatch):
    monkeypatch.setattr(routes, "answer_question", raiser(RuntimeError("secret internal detail")))
    r = client.post("/ask", json={"question": "Who won the final?"})
    assert r.status_code == 500
    assert "secret" not in r.text
    
def test_repeated_question_is_served_from_cache(monkeypatch):
    calls = []

    def counting_answer(q, top_k=5):
        calls.append(q)
        return FAKE_ANSWER

    monkeypatch.setattr(routes, "answer_question", counting_answer)
    first = client.post("/ask", json={"question": "Who won the final?"}).json()
    second = client.post("/ask", json={"question": "  who WON the final  "}).json()
    assert first["cached"] is False
    assert second["cached"] is True
    assert len(calls) == 1


# --- /ingest ---

BODY = {"titles": ["Lionel Messi"]}


def test_ingest_without_key_is_rejected(monkeypatch):
    monkeypatch.setattr(routes.settings, "admin_api_key", "secret")
    assert client.post("/ingest", json=BODY).status_code == 401


def test_ingest_with_wrong_key_is_rejected(monkeypatch):
    monkeypatch.setattr(routes.settings, "admin_api_key", "secret")
    r = client.post("/ingest", json=BODY, headers={"X-Admin-Key": "wrong"})
    assert r.status_code == 401


def test_ingest_is_disabled_when_no_key_configured(monkeypatch):
    monkeypatch.setattr(routes.settings, "admin_api_key", "")
    r = client.post("/ingest", json=BODY, headers={"X-Admin-Key": ""})
    assert r.status_code == 503


def test_ingest_with_valid_key_starts_job_and_releases_lock(monkeypatch):
    monkeypatch.setattr(routes.settings, "admin_api_key", "secret")
    calls = []
    monkeypatch.setattr(routes, "ingest_titles", lambda titles: calls.append(titles))
    r = client.post("/ingest", json=BODY, headers={"X-Admin-Key": "secret"})
    assert r.status_code == 202
    assert r.json()["status"] == "started"
    assert calls == [["Lionel Messi"]]
    assert routes._ingest_lock.acquire(blocking=False)  # lock was released after the job
    routes._ingest_lock.release()


def test_ingest_rejects_empty_title_list(monkeypatch):
    monkeypatch.setattr(routes.settings, "admin_api_key", "secret")
    r = client.post("/ingest", json={"titles": []}, headers={"X-Admin-Key": "secret"})
    assert r.status_code == 422


def test_ingest_returns_409_when_a_run_is_in_progress(monkeypatch):
    monkeypatch.setattr(routes.settings, "admin_api_key", "secret")
    assert routes._ingest_lock.acquire(blocking=False)
    try:
        r = client.post("/ingest", json=BODY, headers={"X-Admin-Key": "secret"})
        assert r.status_code == 409
    finally:
        routes._ingest_lock.release()


# --- CORS ---

def test_cors_allows_configured_origin():
    origin = settings.cors_origin_list[0]
    r = client.options(
        "/ask",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.headers.get("access-control-allow-origin") == origin


def test_cors_blocks_unknown_origin():
    r = client.options(
        "/ask",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in r.headers