from pgvector import Vector
from psycopg.rows import dict_row

from app.core.db import pool
from app.embeddings.embedder import embed

SQL = """
    SELECT c.id, c.content, c.metadata, d.title, d.url,
           1 - (c.embedding <=> %(v)s) AS score
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    ORDER BY c.embedding <=> %(v)s
    LIMIT %(limit)s
"""


def search_by_vector(vector, limit: int = 20) -> list[dict]:
    v = vector if isinstance(vector, Vector) else Vector(vector)
    with pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        return cur.execute(SQL, {"v": v, "limit": limit}).fetchall()


def vector_search(query: str, limit: int = 20) -> list[dict]:
    [vec] = embed([query], task_type="RETRIEVAL_QUERY")
    return search_by_vector(vec, limit)