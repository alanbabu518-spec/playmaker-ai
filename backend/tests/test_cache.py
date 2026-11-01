from app.utils.cache import TTLCache, cache_key, normalize_question


def test_normalization_ignores_case_spacing_and_trailing_punctuation():
    assert normalize_question("  Who WON  the final? ") == "who won the final"
    assert cache_key("Who won?", 5) == cache_key("who won", 5)
    assert cache_key("who won", 5) != cache_key("who won", 3)


def test_entry_expires_after_ttl():
    now = [100.0]
    cache = TTLCache(clock=lambda: now[0])
    cache.set("a", 1, ttl=10)
    assert cache.get("a") == 1
    now[0] = 111.0
    assert cache.get("a") is None


def test_least_recently_used_entry_is_evicted():
    cache = TTLCache(maxsize=2, clock=lambda: 0.0)
    cache.set("a", 1, ttl=100)
    cache.set("b", 2, ttl=100)
    cache.get("a")              # "a" is now more recent than "b"
    cache.set("c", 3, ttl=100)  # pushes out "b"
    assert cache.get("b") is None
    assert cache.get("a") == 1
    assert cache.get("c") == 3


def test_hit_and_miss_counters():
    cache = TTLCache(clock=lambda: 0.0)
    cache.set("a", 1, ttl=100)
    cache.get("a")
    cache.get("missing")
    assert (cache.hits, cache.misses) == (1, 1)