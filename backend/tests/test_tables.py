from app.ingestion.tables import MAX_CHARS, build_table_chunks, parse_tables

HTML = """
<h2>League table</h2>
<table class="wikitable">
<caption>Final standings</caption>
<tr><th>Pos</th><th>Team</th><th>Pts</th></tr>
<tr><td>1</td><th><span style="display:none">0001</span>Manchester City</th><td>89</td></tr>
<tr><td>2</td><th>Arsenal</th><td>84</td></tr>
</table>
<h2>Season statistics</h2>
<h3>Top scorers</h3>
<table class="wikitable">
<tr><th>Rank</th><th>Player</th><th>Goals</th></tr>
<tr><td rowspan="2">1</td><td>Erling Haaland<sup class="reference">[1]</sup></td><td>36</td></tr>
<tr><td>Harry Kane</td><td>30</td></tr>
</table>
<table class="infobox"><tr><th>Season</th><td>2022-23</td></tr></table>
"""


def test_finds_data_tables_and_skips_infoboxes():
    tables = parse_tables(HTML)
    assert [t["section"] for t in tables] == ["League table", "Top scorers"]
    assert tables[0]["caption"] == "Final standings"


def test_rows_become_header_value_pairs_and_hidden_text_is_dropped():
    first = parse_tables(HTML)[0]
    assert first["lines"][0] == "Pos: 1; Team: Manchester City; Pts: 89"
    assert first["lines"][1] == "Pos: 2; Team: Arsenal; Pts: 84"


def test_rowspan_repeats_the_cell_and_citations_are_removed():
    scorers = parse_tables(HTML)[1]["lines"]
    assert scorers[0] == "Rank: 1; Player: Erling Haaland; Goals: 36"
    assert scorers[1] == "Rank: 1; Player: Harry Kane; Goals: 30"


def test_wide_results_grids_are_skipped():
    cells = "".join(f"<th>T{i}</th>" for i in range(20))
    html = f'<table class="wikitable"><tr>{cells}</tr><tr>{"<td>1</td>" * 20}</tr></table>'
    assert parse_tables(html) == []


def test_chunks_carry_title_and_section_and_stay_small():
    table = {"section": "League table", "caption": "Final standings", "lines": [f"Pos: {i}; Team: Club {i}" + "x" * 40 for i in range(120)]}
    chunks = build_table_chunks("2022\u201323 Premier League", [table])
    assert len(chunks) > 1
    head = "2022\u201323 Premier League - League table (table: Final standings)"
    assert all(c["content"].startswith(head) for c in chunks)
    assert all(len(c["content"]) <= MAX_CHARS for c in chunks)
    assert chunks[0]["metadata"]["section"] == "League table (table: Final standings)"
    
    
def test_equal_neighbouring_values_are_both_kept():
    html = '<table class="wikitable"><tr><th>W</th><th>D</th><th>L</th></tr><tr><td>28</td><td>5</td><td>5</td></tr></table>'
    assert parse_tables(html)[0]["lines"] == ["W: 28; D: 5; L: 5"]


def test_colspan_cell_is_printed_once():
    html = '<table class="wikitable"><tr><th>Team</th><th>A</th><th>B</th></tr><tr><td>City</td><td colspan="2">TBD</td></tr></table>'
    assert parse_tables(html)[0]["lines"] == ["Team: City; A: TBD"]