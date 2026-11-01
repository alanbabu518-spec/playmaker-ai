import pytest
from starlette.requests import Request

from app.api import middleware
from app.api.middleware import DailyBudget, SlidingWindowLimiter, client_ip


def make_request(forwarded: str | None = None) -> Request:
    headers = [(b"x-forwarded-for", forwarded.encode())] if forwarded else []
    return Request({"type": "http", "headers": headers, "client": ("9.9.9.9", 1234)})


def test_limiter_allows_up_to_limit_then_reports_wait():
    now = [0.0]
    limiter = SlidingWindowLimiter(2, window=60, clock=lambda: now[0])
    assert limiter.check("a") == 0
    now[0] = 10
    assert limiter.check("a") == 0
    now[0] = 20
    assert limiter.check("a") == pytest.approx(40)  # the first hit expires at t=60


def test_limiter_window_expires():
    now = [0.0]
    limiter = SlidingWindowLimiter(2, window=60, clock=lambda: now[0])
    limiter.check("a")
    now[0] = 10
    limiter.check("a")
    now[0] = 61
    assert limiter.check("a") == 0


def test_limiter_tracks_clients_separately():
    limiter = SlidingWindowLimiter(1, clock=lambda: 0.0)
    assert limiter.check("a") == 0
    assert limiter.check("a") > 0
    assert limiter.check("b") == 0


def test_budget_blocks_after_limit():
    budget = DailyBudget(2, today=lambda: "day1")
    assert [budget.try_spend() for _ in range(3)] == [True, True, False]


def test_budget_resets_on_new_day():
    day = ["day1"]
    budget = DailyBudget(1, today=lambda: day[0])
    assert budget.try_spend() is True
    assert budget.try_spend() is False
    day[0] = "day2"
    assert budget.try_spend() is True


def test_client_ip_ignores_forwarded_header_by_default(monkeypatch):
    monkeypatch.setattr(middleware.settings, "trust_proxy", False)
    assert client_ip(make_request("1.1.1.1, 2.2.2.2")) == "9.9.9.9"


def test_client_ip_uses_last_forwarded_entry_when_proxy_trusted(monkeypatch):
    monkeypatch.setattr(middleware.settings, "trust_proxy", True)
    assert client_ip(make_request("1.1.1.1, 2.2.2.2")) == "2.2.2.2"