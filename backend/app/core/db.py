from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

from app.core.config import settings

pool = ConnectionPool(
    settings.database_url,
    min_size=1,
    max_size=5,
    kwargs={"autocommit": True},  # retrieval only reads; no transactions needed
    configure=register_vector,    # runs on every new connection
    open=False,                   # opened explicitly at app startup (Branch 5)
)