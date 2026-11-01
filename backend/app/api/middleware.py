import math
import threading
import time
from datetime import date, datetime, timezone

from fastapi import HTTPException, Request

from app.core.config import settings


class SlidingWindowLimiter:
    """Allows `limit` requests per `window` seconds for each client."""

    def __init__(self, limit: int, window: float = 60.0, clock=time.monotonic, max_clients: int = 10_000):
        self.limit = limit
        self.window = window
        self.max_clients = max_clients
        self._clock = clock
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> float:
        """Returns 0 if the request is allowed, otherwise the seconds until it would be."""
        now = self._clock()
        with self._lock:
            recent = [t for t in self._hits.get(key, []) if t > now - self.window]
            if len(recent) >= self.limit:
                self._hits[key] = recent
                return recent[0] + self.window - now
            recent.append(now)
            self._hits[key] = recent
            if len(self._hits) > self.max_clients:  # keep memory bounded
                self._hits = {
                    k: v for k, v in self._hits.items() if v and v[-1] > now - self.window
                }
            return 0.0

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


class DailyBudget:
    """Caps how many uncached answers can be computed per UTC day."""

    def __init__(self, limit: int, today=lambda: datetime.now(timezone.utc).date()):
        self.limit = limit
        self._today = today
        self._day: date | None = None
        self._used = 0
        self._lock = threading.Lock()

    def try_spend(self) -> bool:
        with self._lock:
            day = self._today()
            if day != self._day:
                self._day, self._used = day, 0
            if self._used >= self.limit:
                return False
            self._used += 1
            return True

    def reset(self) -> None:
        with self._lock:
            self._day, self._used = None, 0


def client_ip(request: Request) -> str:
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            # The last entry is the address our own proxy saw. Earlier entries can be forged by the client.
            return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


ask_limiter = SlidingWindowLimiter(settings.rate_limit_per_minute)
llm_budget = DailyBudget(settings.daily_llm_budget)


def rate_limit_ask(request: Request) -> None:
    wait = ask_limiter.check(client_ip(request))
    if wait > 0:
        raise HTTPException(
            status_code=429,
            detail="Too many questions. Please wait a moment and try again.",
            headers={"Retry-After": str(math.ceil(wait))},
        )