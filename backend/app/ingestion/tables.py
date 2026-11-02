import re

from bs4 import BeautifulSoup

MAX_COLUMNS = 14   # wider tables are results grids (every team against every team), which read badly as text
MAX_ROWS = 80
MAX_CHARS = 1000
SKIP_CLASSES = {"infobox", "navbox", "sidebar", "ambox", "metadata"}
EMPTY = {"", "-", "–", "—"}

_SPACES = re.compile(r"\s+")
_FOOTNOTE = re.compile(r"\[[^\]]{1,3}\]")  # [a], [1]


def _clean(text: str) -> str:
    return _SPACES.sub(" ", _FOOTNOTE.sub("", text.replace("\xa0", " "))).strip()


def _span(value) -> int:
    try:
        return max(1, min(int(str(value).strip()), 50))
    except ValueError:
        return 1


def _grid(table):
    """Table as a rectangle of text. Returns (grid, copies); copies marks cells filled in by a colspan."""
    rows = table.find_all("tr")
    cells: dict[tuple[int, int], str] = {}
    copies: set[tuple[int, int]] = set()
    for r, tr in enumerate(rows):
        c = 0
        for cell in tr.find_all(["td", "th"], recursive=False):
            while (r, c) in cells:
                c += 1
            text = _clean(cell.get_text(" ", strip=True))
            rowspan, colspan = _span(cell.get("rowspan")), _span(cell.get("colspan"))
            for dr in range(min(rowspan, len(rows) - r)):
                for dc in range(colspan):
                    cells.setdefault((r + dr, c + dc), text)
                    if dc > 0:
                        copies.add((r + dr, c + dc))
            c += colspan
    if not cells:
        return [], set()
    n_rows = max(r for r, _ in cells) + 1
    n_cols = max(c for _, c in cells) + 1
    return [[cells.get((r, c), "") for c in range(n_cols)] for r in range(n_rows)], copies


def _lines(headers: list[str], rows: list[list[str]], copies: set, offset: int) -> list[str]:
    lines = []
    for r, row in enumerate(rows[:MAX_ROWS], start=offset):
        pairs = []
        for i, value in enumerate(row):
            if value in EMPTY or (r, i) in copies:  # a colspan repeats its cell, so print it once
                continue
            label = headers[i] if i < len(headers) else ""
            pairs.append(f"{label}: {value}" if label else value)
        if pairs:
            lines.append("; ".join(pairs))
    return lines


def parse_tables(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    junk = "sup.reference, style, script, .mw-editsection, [style*='display:none'], [style*='display: none']"
    for el in soup.select(junk):
        el.decompose()

    tables, section = [], "Introduction"
    for el in soup.find_all(["h2", "h3", "h4", "table"]):
        if el.name != "table":
            section = _clean(el.get_text(" ", strip=True)) or section
            continue
        classes = set(el.get("class", []))
        if "wikitable" not in classes or classes & SKIP_CLASSES or el.find("table"):
            continue
        grid, copies = _grid(el)
        if not grid or len(grid[0]) > MAX_COLUMNS:
            continue
        first = el.find("tr").find_all(["td", "th"], recursive=False)
        has_header = bool(first) and all(c.name == "th" for c in first)
        headers = grid[0] if has_header else []
        data = grid[1:] if has_header else grid
        lines = _lines(headers, data, copies, 1 if has_header else 0)
        if not lines:
            continue
        caption = el.find("caption")
        tables.append(
            {
                "section": section,
                "caption": _clean(caption.get_text(" ", strip=True)) if caption else "",
                "lines": lines,
            }
        )
    return tables


def build_table_chunks(title: str, tables: list[dict]) -> list[dict]:
    chunks = []
    for t in tables:
        label = f"{t['section']} (table: {t['caption']})" if t["caption"] else f"{t['section']} (table)"
        head = f"{title} - {label}"
        batch: list[str] = []
        size = len(head)
        for line in t["lines"]:
            if batch and size + len(line) + 1 > MAX_CHARS:
                chunks.append(_chunk(title, label, head, batch))
                batch, size = [], len(head)
            batch.append(line)
            size += len(line) + 1
        if batch:
            chunks.append(_chunk(title, label, head, batch))
    return chunks


def _chunk(title: str, label: str, head: str, lines: list[str]) -> dict:
    return {
        "content": head + "\n" + "\n".join(lines),
        "metadata": {"title": title, "section": label},
    }