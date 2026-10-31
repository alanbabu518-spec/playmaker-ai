import httpx

from app.core.config import settings

API = "https://en.wikipedia.org/w/api.php"


def fetch_page(title: str) -> dict | None:
    params = {
        "action": "query",
        "prop": "extracts",
        "explaintext": 1,   # plain text, no HTML
        "redirects": 1,     # "Messi" -> "Lionel Messi"
        "titles": title,
        "format": "json",
    }
    resp = httpx.get(
        API,
        params=params,
        headers={"User-Agent": settings.wiki_user_agent},
        timeout=30,
    )
    resp.raise_for_status()
    page = next(iter(resp.json()["query"]["pages"].values()))
    if "missing" in page or not page.get("extract"):
        return None
    return {
        "title": page["title"],
        "url": f"https://en.wikipedia.org/wiki/{page['title'].replace(' ', '_')}",
        "text": page["extract"],
    }