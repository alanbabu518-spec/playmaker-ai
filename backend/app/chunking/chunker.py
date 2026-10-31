import re

SKIP_SECTIONS = {
    "see also", "references", "external links",
    "further reading", "notes", "sources", "bibliography",
}
HEADING = re.compile(r"^=+\s*(.+?)\s*=+\s*$", re.MULTILINE)


def split_sections(text: str) -> list[tuple[str, str]]:
    parts = HEADING.split(text)  # [intro, heading1, body1, heading2, body2, ...]
    sections = [("Introduction", parts[0])]
    for i in range(1, len(parts), 2):
        sections.append((parts[i], parts[i + 1]))
    return [
        (h, b.strip())
        for h, b in sections
        if h.lower() not in SKIP_SECTIONS and b.strip()
    ]


def _units(body: str, max_chars: int):
    for para in body.split("\n"):
        para = para.strip()
        while len(para) > max_chars:  # very long paragraph: cut at a sentence end
            cut = para.rfind(". ", 0, max_chars)
            cut = cut + 1 if cut > 0 else max_chars
            yield para[:cut].strip()
            para = para[cut:].strip()
        if para:
            yield para


def chunk_text(body: str, max_chars: int = 1000) -> list[str]:
    chunks, current = [], ""
    for unit in _units(body, max_chars):
        if current and len(current) + len(unit) + 1 > max_chars:
            chunks.append(current)
            current = unit
        else:
            current = f"{current}\n{unit}" if current else unit
    if current:
        chunks.append(current)
    return chunks


def build_chunks(title: str, text: str, max_chars: int = 1000) -> list[dict]:
    result = []
    for section, body in split_sections(text):
        for piece in chunk_text(body, max_chars):
            if len(piece) < 50:  # skip fragments that carry no meaning
                continue
            result.append({
                "content": f"{title} - {section}\n{piece}",
                "metadata": {"title": title, "section": section},
            })
    return result