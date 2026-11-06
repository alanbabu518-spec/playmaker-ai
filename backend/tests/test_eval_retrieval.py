import json

from eval.run_retrieval import CASES, score, summarize

KINDS = {"world_cup", "season", "table", "near_twin", "ballon_dor", "isl", "entity", "concept"}


def case(i, pages, kind="season"):
    return {"id": f"r{i}", "kind": kind, "question": f"Question {i}?", "pages": pages}


def searching(titles, methods=("keyword", "vector")):
    def search(question, limit):
        return [{"title": t, "found_by": list(methods)} for t in titles][:limit]
    return search


def test_the_test_set_is_well_formed():
    cases = json.loads(CASES.read_text(encoding="utf-8"))
    assert len({c["id"] for c in cases}) == len(cases)
    for c in cases:
        assert 3 <= len(c["question"].strip()) <= 500  # the same limits the API enforces
        assert c["kind"] in KINDS
        assert c["pages"] and all(isinstance(p, str) and p for p in c["pages"])


def test_rank_is_the_position_of_the_first_expected_page():
    row = score(case(1, ["B"]), {"A", "B"}, 5, searching(["A", "B", "C"]))
    assert row["status"] == "scored" and row["rank"] == 2


def test_an_absent_page_gives_no_rank():
    row = score(case(1, ["B"]), {"B"}, 5, searching(["A", "C"]))
    assert row["rank"] is None


def test_pages_that_are_not_stored_are_skipped_without_searching():
    def boom(question, limit):
        raise AssertionError("must not search")

    assert score(case(1, ["B"]), {"A"}, 5, boom)["status"] == "not_loaded"


def test_summary_rates_and_groups():
    rows = [
        score(case(1, ["A"], "season"), {"A"}, 5, searching(["A", "X"])),
        score(case(2, ["B"], "season"), {"B"}, 5, searching(["X", "B"])),
        score(case(3, ["C"], "table"), {"C"}, 5, searching(["X", "Y", "Z", "W", "V"])),
        score(case(4, ["D"], "table"), {"A"}, 5, searching(["D"])),  # not loaded
    ]
    s = summarize(rows, 5)
    assert (s["questions"], s["scored"], s["not_loaded"]) == (4, 3, 1)
    assert s["hit_at_1"] == 0.333 and s["hit_at_k"] == 0.667
    assert s["mrr"] == 0.5  # (1 + 1/2 + 0) / 3
    assert s["by_kind"]["season"]["hit_at_1"] == 0.5
    assert s["by_kind"]["table"]["hit_at_k"] == 0.0


def test_keyword_only_results_are_flagged():
    row = score(case(1, ["A"]), {"A"}, 5, searching(["A"], methods=("keyword",)))
    assert summarize([row], 5)["keyword_only"] == 1