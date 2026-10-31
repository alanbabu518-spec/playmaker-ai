CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  url          TEXT UNIQUE NOT NULL,
  title        TEXT,
  content_hash TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  fetched_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chunks (
  id          BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(768),
  tsv         tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  metadata    JSONB DEFAULT '{}',
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX chunks_tsv_idx ON chunks USING gin (tsv);
CREATE INDEX chunks_doc_idx ON chunks (document_id);