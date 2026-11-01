import json
import logging
import sys

from fastapi.testclient import TestClient

from app.core.logging import JsonFormatter, request_id_var
from app.main import app

client = TestClient(app)


def make_record(msg: str = "hello", exc_info=None, **extra) -> logging.LogRecord:
    return logging.getLogger("t").makeRecord("t", logging.INFO, __file__, 1, msg, (), exc_info, extra=extra)


def test_json_line_has_standard_fields():
    data = json.loads(JsonFormatter().format(make_record("hello")))
    assert data["message"] == "hello"
    assert data["level"] == "INFO"
    assert data["request_id"] == "-"
    assert "ts" in data


def test_request_id_comes_from_context():
    token = request_id_var.set("abc12345")
    try:
        data = json.loads(JsonFormatter().format(make_record()))
    finally:
        request_id_var.reset(token)
    assert data["request_id"] == "abc12345"


def test_extra_fields_are_included_and_unicode_is_kept():
    line = JsonFormatter().format(make_record("done", status=200, player="Mbappé"))
    assert "Mbappé" in line
    assert json.loads(line)["status"] == 200


def test_exception_is_included():
    try:
        raise ValueError("boom")
    except ValueError:
        record = make_record("failed", exc_info=sys.exc_info())
    assert "ValueError: boom" in json.loads(JsonFormatter().format(record))["exc"]


def test_response_gets_a_generated_request_id():
    r = client.get("/openapi.json")
    assert len(r.headers["x-request-id"]) == 32


def test_valid_incoming_request_id_is_kept():
    r = client.get("/openapi.json", headers={"X-Request-ID": "my-test-id-12345"})
    assert r.headers["x-request-id"] == "my-test-id-12345"


def test_unsafe_incoming_request_id_is_replaced():
    r = client.get("/openapi.json", headers={"X-Request-ID": "bad id with spaces!"})
    assert r.headers["x-request-id"] != "bad id with spaces!"
    assert len(r.headers["x-request-id"]) == 32