"""Wikipedia pages to ingest, in priority order.

Ingestion is idempotent and stops cleanly when the daily embedding quota runs out,
so the same command can be rerun every day until everything is loaded."""

DASH = "\u2013"  # season titles use an en dash, as in 2007–08
LEAGUES = ["Premier League", "La Liga", "Bundesliga", "Serie A", "UEFA Champions League"]


def season(y: int) -> str:
    return f"{y}{DASH}{(y + 1) % 100:02d}"


def league_seasons(first: int = 2007, last: int = 2025):
    for y in range(last, first - 1, -1):  # newest first, one page per league in turn
        for league in LEAGUES:
            yield f"{season(y)} {league}"


def isl_seasons(last: int = 2025):
    for y in range(last, 2016, -1):
        yield f"{season(y)} Indian Super League season"
    for y in (2016, 2015, 2014):  # the first three seasons were a single calendar year
        yield f"{y} Indian Super League season"


def ballon_dor_years(first: int = 1956, last: int = 2026):
    for y in range(last, first - 1, -1):
        yield f"{y} Ballon d'Or"


WORLD_CUPS = [
    "2026 FIFA World Cup", "2026 FIFA World Cup final", "2026 FIFA World Cup knockout stage",
    "2014 FIFA World Cup", "2014 FIFA World Cup final",
    "FIFA World Cup", "2022 FIFA World Cup", "2022 FIFA World Cup final",
]
COMPETITIONS = [
    "Premier League", "La Liga", "Bundesliga", "Serie A",
    "UEFA Champions League", "Indian Super League",
]
BALLON_DOR = [
    "Ballon d'Or", "Ballon d'Or Féminin", "Kopa Trophy", "Yashin Trophy", "Gerd Müller Trophy",
]
CONCEPTS = ["Offside (association football)", "Tiki-taka", "Gegenpressing"]
PEOPLE_AND_CLUBS = [
    "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappé", "Pelé", "Diego Maradona",
    "Real Madrid CF", "FC Barcelona", "Manchester United F.C.",
]

SEEDS = list(
    dict.fromkeys(  # removes duplicates but keeps the order
        [
            *WORLD_CUPS, *COMPETITIONS, *BALLON_DOR, *CONCEPTS, *PEOPLE_AND_CLUBS,
            *ballon_dor_years(first=2007),  # recent winners first: the most asked questions
            *league_seasons(), *isl_seasons(),
            *ballon_dor_years(),  # the older years last (titles already listed are skipped)
        ]
    )
)