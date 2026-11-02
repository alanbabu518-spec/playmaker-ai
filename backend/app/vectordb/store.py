import hashlib

import psycopg
from pgvector import Vector
from pgvector.psycopg import register_vector
from psycopg.types.json import Jsonb

from app.core.config import settings


def connect() -> psycopg.Connection:
    conn = psycopg.connect(settings.database_url, autocommit=True)
    register_vector(conn)
    return conn


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _as_vector(value) -> Vector:
    # Stored embeddings come back from the database as Vector objects, fresh ones are plain lists.
    return value if isinstance(value, Vector) else Vector(value)


def get_hash(conn, url: str) -> str | None:
    row = conn.execute(
        "SELECT content_hash FROM documents WHERE url = %s", (url,)
    ).fetchone()
    return row[0] if row else None


def existing_embeddings(conn, url: str) -> dict:
    """Chunk text -> embedding for a page that is already stored, so unchanged text is never re-embedded."""
    rows = conn.execute(
        """
        SELECT c.content, c.embedding
        FROM chunks c JOIN documents d ON d.id = c.document_id
        WHERE d.url = %s
        """,
        (url,),
    ).fetchall()
    return {content: _as_vector(emb) for content, emb in rows}


def save_document(conn, *, source, url, title, text_hash, chunks, embeddings) -> None:
    with conn.transaction():  # all or nothing
        doc_id = conn.execute(
            """
            INSERT INTO documents (source, url, title, content_hash)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (url) DO UPDATE
              SET title = EXCLUDED.title,
                  content_hash = EXCLUDED.content_hash,
                  fetched_at = now()
            RETURNING id
            """,
            (source, url, title, text_hash),
        ).fetchone()[0]

        conn.execute("DELETE FROM chunks WHERE document_id = %s", (doc_id,))

        rows = [
            (doc_id, i, c["content"], _as_vector(emb), Jsonb(c["metadata"]))
            for i, (c, emb) in enumerate(zip(chunks, embeddings))
        ]
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO chunks (document_id, chunk_index, content, embedding, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                rows,
            )