import logging

from app.chunking.chunker import build_chunks
from app.embeddings.embedder import DailyQuotaExceeded, embed
from app.ingestion.wikipedia import fetch_page
from app.vectordb import store

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("ingest")

SEEDS = [
    "FIFA World Cup", "2022 FIFA World Cup", "2022 FIFA World Cup final",
    "UEFA Champions League", "Premier League", "La Liga",
    "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappé", "Pelé",
    "Diego Maradona", "Real Madrid CF", "FC Barcelona", "Manchester United F.C.",
    "Offside (association football)", "Tiki-taka", "Gegenpressing",
]


def ingest_title(conn, title: str) -> str:
    page = fetch_page(title)
    if page is None:
        return "not found"

    new_hash = store.content_hash(page["text"])
    if store.get_hash(conn, page["url"]) == new_hash:
        return "unchanged, skipped"  # no embedding calls spent

    chunks = build_chunks(page["title"], page["text"])
    embeddings = embed([c["content"] for c in chunks])
    store.save_document(
        conn,
        source="wikipedia",
        url=page["url"],
        title=page["title"],
        text_hash=new_hash,
        chunks=chunks,
        embeddings=embeddings,
    )
    return f"ingested {len(chunks)} chunks"


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