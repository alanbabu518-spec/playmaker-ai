import re
import threading
import time
from collections import OrderedDict

FULL_TTL = 3600     # answers from full hybrid search: 1 hour
DEGRADED_TTL = 600  # answers from keyword-only fallback: 10 minutes, so better ones replace them soon


class TTLCache:
    """Small in-memory cache: entries expire, and the least recently used are evicted."""

    def __init__(self, maxsize: int = 256, clock=time.monotonic):
        self.maxsize = maxsize
        self._clock = clock
        self._data: OrderedDict = OrderedDict()
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        with self._lock:
            item = self._data.get(key)
            if item is not None and item[0] > self._clock():
                self._data.move_to_end(key)
                self.hits += 1
                return item[1]
            self._data.pop(key, None)  # expired or missing
            self.misses += 1
            return None

    def set(self, key, value, ttl: float) -> None:
        with self._lock:
            self._data[key] = (self._clock() + ttl, value)
            self._data.move_to_end(key)
            while len(self._data) > self.maxsize:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()
            self.hits = self.misses = 0


def normalize_question(question: str) -> str:
    # "Who won the final?" and "  who won the FINAL " should hit the same entry.
    return re.sub(r"\s+", " ", question.strip().lower()).rstrip("?!. ")


def cache_key(question: str, top_k: int) -> tuple[str, int]:
    return (normalize_question(question), top_k)


answer_cache = TTLCache()