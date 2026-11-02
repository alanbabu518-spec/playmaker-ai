import time

import httpx

from app.core.config import settings

API = "https://en.wikipedia.org/w/api.php"


def _get(params: dict) -> dict:
    for attempt in range(4):
        resp = httpx.get(
            API,
            params=params,
            headers={"User-Agent": settings.wiki_user_agent},
            timeout=30,
        )
        if resp.status_code == 429:
            retry_after = resp.headers.get("Retry-After", "")
            wait = int(retry_after) if retry_after.isdigit() else 2 ** (attempt + 1)
            time.sleep(min(wait, 30))
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError("Wikipedia rate limit: too many retries")


def fetch_page(title: str) -> dict | None:
    data = _get(
        {
            "action": "query",
            "prop": "extracts",
            "explaintext": 1,   # plain text, no HTML
            "redirects": 1,     # "Messi" -> "Lionel Messi"
            "titles": title,
            "format": "json",
        }
    )
    page = next(iter(data["query"]["pages"].values()))
    if "missing" in page or not page.get("extract"):
        return None
    return {
        "title": page["title"],
        "url": f"https://en.wikipedia.org/wiki/{page['title'].replace(' ', '_')}",
        "text": page["extract"],
    }


def fetch_html(title: str) -> str | None:
    """The rendered page as HTML, which (unlike the plain-text extract) still contains the tables."""
    data = _get(
        {
            "action": "parse",
            "page": title,
            "prop": "text",
            "redirects": 1,
            "disableeditsection": 1,
            "disabletoc": 1,
            "format": "json",
            "formatversion": 2,
        }
    )
    if "error" in data:
        return None
    return data["parse"]["text"]