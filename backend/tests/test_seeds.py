from app.ingestion.seeds import LEAGUES, SEEDS, season


def test_season_titles_use_an_en_dash_and_two_digit_year():
    assert season(2007) == "2007\u201308"
    assert season(2025) == "2025\u201326"
    assert season(1999) == "1999\u201300"


def test_no_duplicate_titles():
    assert len(SEEDS) == len(set(SEEDS))


def test_every_league_season_from_2007_is_listed():
    for league in LEAGUES:
        for y in range(2007, 2026):
            assert f"{season(y)} {league}" in SEEDS


def test_isl_starts_in_2014():
    assert "2014 Indian Super League season" in SEEDS
    assert "2007\u201308 Indian Super League season" not in SEEDS