from app.chunking.chunker import build_chunks, chunk_text, split_sections

SAMPLE = """Lionel Messi is an Argentine footballer who has won the World Cup and eight Ballon d'Or awards.

== Career ==
He spent most of his career at Barcelona, where he broke many scoring records in La Liga.

== References ==
Some reference text that should never be indexed.
"""


def test_reference_sections_are_dropped():
    headings = [h for h, _ in split_sections(SAMPLE)]
    assert "References" not in headings
    assert "Career" in headings


def test_chunks_respect_max_size():
    text = ("This is a sentence about football. " * 100).strip()
    assert all(len(c) <= 200 for c in chunk_text(text, max_chars=200))


def test_chunks_carry_title_and_section():
    chunks = build_chunks("Lionel Messi", SAMPLE)
    assert chunks
    assert all(c["content"].startswith("Lionel Messi - ") for c in chunks)
    assert {c["metadata"]["section"] for c in chunks} == {"Introduction", "Career"}


def test_tiny_fragments_are_skipped():
    assert build_chunks("Test", "Hi\n\n== A ==\nshort") == []