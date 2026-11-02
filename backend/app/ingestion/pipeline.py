import logging

from app.chunking.chunker import build_chunks
from app.embeddings.embedder import DailyQuotaExceeded, embed
from app.ingestion.seeds import SEEDS
from app.ingestion.tables import build_table_chunks, parse_tables
from app.ingestion.wikipedia import fetch_html, fetch_page
from app.vectordb import store

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)  # one line per HTTP call is noise
log = logging.getLogger("ingest")


def ingest_title(conn, title: str) -> str:
    page = fetch_page(title)
    if page is None:
        return "not found"

    # Prose chunks from the plain-text extract, plus table rows from the rendered HTML.
    chunks = build_chunks(page["title"], page["text"])
    html = fetch_html(title)
    if html:
        chunks += build_table_chunks(page["title"], parse_tables(html))

    # The hash covers the final chunks, so a page is "unchanged" only if every chunk is identical.
    new_hash = store.content_hash("\n".join(c["content"] for c in chunks))
    if store.get_hash(conn, page["url"]) == new_hash:
        return "unchanged, skipped"  # no embedding calls spent

    # Chunks whose text is already stored keep their embedding, so only new text costs quota.
    known = store.existing_embeddings(conn, page["url"])
    todo = [c["content"] for c in chunks if c["content"] not in known]
    fresh = iter(embed(todo))
    embeddings = [known[c["content"]] if c["content"] in known else next(fresh) for c in chunks]

    store.save_document(
        conn,
        source="wikipedia",
        url=page["url"],
        title=page["title"],
        text_hash=new_hash,
        chunks=chunks,
        embeddings=embeddings,
    )
    return f"ingested {len(chunks)} chunks ({len(todo)} newly embedded)"


def ingest_titles(titles: list[str]) -> None:
    with store.connect() as conn:
        for title in titles:
            try:
                log.info("%s: %s", title, ingest_title(conn, title))
            except DailyQuotaExceeded as exc:
                log.error("%s", exc)
                break  # no point trying the remaining pages today
            except Exception:
                log.exception("%s: failed", title)


def main() -> None:
    ingest_titles(SEEDS)


if __name__ == "__main__":
    main()