from app.ingestion import pipeline
from app.vectordb import store as real_store

PAGE = {
    "title": "Test FC",
    "url": "https://en.wikipedia.org/wiki/Test_FC",
    "text": "Test FC is an association football club that plays its home matches in a small stadium.",
}
HTML = (
    "<h2>League table</h2>"
    '<table class="wikitable"><tr><th>Pos</th><th>Team</th></tr><tr><td>1</td><td>City</td></tr></table>'
)
PROSE = "Test FC - Introduction\n" + PAGE["text"]
TABLE = "Test FC - League table (table)\nPos: 1; Team: City"


class FakeStore:
    content_hash = staticmethod(real_store.content_hash)

    def __init__(self, stored_hash=None, known=None):
        self.stored_hash = stored_hash
        self.known = known or {}
        self.saved = None

    def get_hash(self, conn, url):
        return self.stored_hash

    def existing_embeddings(self, conn, url):
        return self.known

    def save_document(self, conn, **kwargs):
        self.saved = kwargs


def setup(monkeypatch, fake):
    calls = []

    def fake_embed(texts):
        calls.append(list(texts))
        return [[float(len(t))] for t in texts]

    monkeypatch.setattr(pipeline, "fetch_page", lambda title: PAGE)
    monkeypatch.setattr(pipeline, "fetch_html", lambda title: HTML)
    monkeypatch.setattr(pipeline, "embed", fake_embed)
    monkeypatch.setattr(pipeline, "store", fake)
    return calls


def test_page_is_split_into_prose_and_table_chunks(monkeypatch):
    fake = FakeStore()
    calls = setup(monkeypatch, fake)
    assert pipeline.ingest_title(None, "Test FC") == "ingested 2 chunks (2 newly embedded)"
    assert [c["content"] for c in fake.saved["chunks"]] == [PROSE, TABLE]
    assert calls == [[PROSE, TABLE]]


def test_unchanged_page_is_skipped_without_embedding(monkeypatch):
    first = FakeStore()
    setup(monkeypatch, first)
    pipeline.ingest_title(None, "Test FC")
    second = FakeStore(stored_hash=first.saved["text_hash"])
    calls = setup(monkeypatch, second)
    assert pipeline.ingest_title(None, "Test FC") == "unchanged, skipped"
    assert calls == [] and second.saved is None


def test_known_chunks_reuse_their_embedding(monkeypatch):
    fake = FakeStore(stored_hash="hash-from-before-tables", known={PROSE: [9.0]})
    calls = setup(monkeypatch, fake)
    assert pipeline.ingest_title(None, "Test FC") == "ingested 2 chunks (1 newly embedded)"
    assert calls == [[TABLE]]
    assert fake.saved["embeddings"][0] == [9.0]


def test_missing_page(monkeypatch):
    setup(monkeypatch, FakeStore())
    monkeypatch.setattr(pipeline, "fetch_page", lambda title: None)
    assert pipeline.ingest_title(None, "Nope") == "not found"