import re

from psycopg.rows import dict_row

from app.core.db import pool

SQL = """
    SELECT c.id, c.content, c.metadata, d.title, d.url,
           ts_rank_cd(c.tsv, to_tsquery('english', %(or_q)s), 1)
             + CASE WHEN c.tsv @@ to_tsquery('english', %(and_q)s) THEN 10 ELSE 0 END
             AS score
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE c.tsv @@ to_tsquery('english', %(or_q)s)
    ORDER BY score DESC
    LIMIT %(limit)s
"""


def _terms(text: str) -> list[str]:
    # Keep only word characters, so user input can never inject tsquery syntax.
    words = [w for w in re.findall(r"\w+", text) if len(w) > 1]
    return list(dict.fromkeys(words))  # drop duplicates, keep order


def keyword_search(query: str, limit: int = 20) -> list[dict]:
    terms = _terms(query)
    if not terms:
        return []
    params = {"or_q": " | ".join(terms), "and_q": " & ".join(terms), "limit": limit}
    with pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        return cur.execute(SQL, params).fetchall()