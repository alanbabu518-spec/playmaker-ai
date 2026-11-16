"""Per-request metrics for /ask: stored in Postgres so they survive restarts, summarized by /stats.

Only numbers and labels are stored. The question text, answers and retrieved passages are never saved.
"""
import logging
from concurrent.futures import Future, ThreadPoolExecutor

from psycopg.rows import dict_row

from app.core.db import pool
from app.core.logging import request_id_var

log = logging.getLogger(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS request_metrics (
  id                BIGSERIAL PRIMARY KEY,
  ts                TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id        TEXT,
  status            INT NOT NULL,
  cached            BOOLEAN NOT NULL DEFAULT false,
  answered          BOOLEAN,
  error             TEXT,
  model             TEXT,
  retrieval_methods TEXT[],
  top_k             INT,
  retrieval_ms      INT,
  generation_ms     INT,
  total_ms          INT,
  prompt_tokens     INT,
  output_tokens     INT,
  total_tokens      INT
);
CREATE INDEX IF NOT EXISTS request_metrics_ts_idx ON request_metrics (ts);
"""

RETENTION_DAYS = 30

FIELDS = (
    "request_id", "status", "cached", "answered", "error", "model", "retrieval_methods", "top_k",
    "retrieval_ms", "generation_ms", "total_ms", "prompt_tokens", "output_tokens", "total_tokens",
)
INSERT = f"INSERT INTO request_metrics ({', '.join(FIELDS)}) VALUES ({', '.join(f'%({f})s' for f in FIELDS)})"

# One background worker: writes never slow down a request and never pile up threads.
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="metrics")


def ensure_table() -> None:
    """Creates the table if needed and drops old rows. A failure here must not stop the app."""
    try:
        with pool.connection() as conn:
            conn.execute(SCHEMA)
            conn.execute(f"DELETE FROM request_metrics WHERE ts < now() - interval '{RETENTION_DAYS} days'")
    except Exception:
        log.exception("metrics_table_unavailable")


def _insert(row: dict) -> None:
    try:
        with pool.connection() as conn:
            conn.execute(INSERT, row)
    except Exception:
        log.warning("metrics_write_failed", exc_info=True)  # monitoring must never break answering


def record(**fields) -> Future:
    """Queues one row. Returns the future so tests can wait for it."""
    row = {f: fields.get(f) for f in FIELDS}
    row["request_id"] = request_id_var.get()  # read here, because the worker thread has no request context
    return _executor.submit(_insert, row)


def _pct(column: str, q: float, where: str) -> str:
    return f"percentile_cont({q}) WITHIN GROUP (ORDER BY {column}) FILTER (WHERE {where})"


_COMPUTED = "NOT cached AND error IS NULL"  # rows that really ran retrieval and generation

SUMMARY_SQL = f"""
    SELECT
      count(*)                                                AS requests,
      count(*) FILTER (WHERE cached)                          AS cache_hits,
      count(*) FILTER (WHERE error IS NOT NULL)               AS errors,
      count(*) FILTER (WHERE {_COMPUTED} AND answered)        AS answered,
      count(*) FILTER (WHERE {_COMPUTED} AND NOT answered)    AS refused,
      {_pct("total_ms", 0.5, _COMPUTED)}                      AS total_p50,
      {_pct("total_ms", 0.95, _COMPUTED)}                     AS total_p95,
      {_pct("retrieval_ms", 0.5, _COMPUTED)}                  AS retrieval_p50,
      {_pct("retrieval_ms", 0.95, _COMPUTED)}                 AS retrieval_p95,
      {_pct("generation_ms", 0.5, "generation_ms > 0")}       AS generation_p50,
      {_pct("generation_ms", 0.95, "generation_ms > 0")}      AS generation_p95,
      coalesce(sum(prompt_tokens), 0)                         AS prompt_tokens,
      coalesce(sum(output_tokens), 0)                         AS output_tokens,
      coalesce(sum(total_tokens), 0)                          AS total_tokens,
      avg(total_tokens) FILTER (WHERE total_tokens IS NOT NULL) AS avg_tokens_per_answer
    FROM request_metrics
    WHERE ts > now() - make_interval(hours => %(h)s)
"""
ERRORS_SQL = """
    SELECT error, count(*) AS n FROM request_metrics
    WHERE ts > now() - make_interval(hours => %(h)s) AND error IS NOT NULL
    GROUP BY error ORDER BY n DESC
"""
MODELS_SQL = """
    SELECT model, count(*) AS n FROM request_metrics
    WHERE ts > now() - make_interval(hours => %(h)s) AND model IS NOT NULL AND NOT cached
    GROUP BY model ORDER BY n DESC
"""


def _num(value, digits: int = 0):
    if value is None:
        return None
    return round(float(value), digits) if digits else int(round(float(value)))


def _rate(part: int, whole: int) -> float | None:
    return round(part / whole, 3) if whole else None


def shape_stats(hours: int, summary: dict, errors: list[dict], models: list[dict]) -> dict:
    """Turns raw query rows into the JSON that /stats returns."""
    computed = summary["answered"] + summary["refused"]
    return {
        "window_hours": hours,
        "requests": summary["requests"],
        "cache_hit_rate": _rate(summary["cache_hits"], summary["requests"]),
        "error_rate": _rate(summary["errors"], summary["requests"]),
        "answered_rate": _rate(summary["answered"], computed),  # of answers actually computed, not cached
        "refused": summary["refused"],
        "latency_ms": {
            "total": {"p50": _num(summary["total_p50"]), "p95": _num(summary["total_p95"])},
            "retrieval": {"p50": _num(summary["retrieval_p50"]), "p95": _num(summary["retrieval_p95"])},
            "generation": {"p50": _num(summary["generation_p50"]), "p95": _num(summary["generation_p95"])},
        },
        "tokens": {
            "prompt": int(summary["prompt_tokens"]),
            "output": int(summary["output_tokens"]),
            "total": int(summary["total_tokens"]),
            "avg_per_answer": _num(summary["avg_tokens_per_answer"]),
        },
        "errors_by_type": {e["error"]: e["n"] for e in errors},
        "answers_by_model": {m["model"]: m["n"] for m in models},
    }


def fetch_stats(hours: int = 24) -> dict:
    params = {"h": hours}
    with pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        summary = cur.execute(SUMMARY_SQL, params).fetchone()
        errors = cur.execute(ERRORS_SQL, params).fetchall()
        models = cur.execute(MODELS_SQL, params).fetchall()
    return shape_stats(hours, summary, errors, models)