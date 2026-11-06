import json
from collections import defaultdict
from pathlib import Path

from app.core.db import pool
from app.retrieval.hybrid import hybrid_search

EVAL_DIR = Path(__file__).parent
CASES = EVAL_DIR / "retrieval_set.json"
RESULTS = EVAL_DIR / "results"
K = 5


def score(case: dict, stored: set[str], k: int = K, search=hybrid_search) -> dict:
    """One question: is the right page in the top k? A question whose pages are not stored yet is skipped."""
    expected = set(case["pages"])
    if not expected & stored:
        return {**case, "status": "not_loaded"}
    hits = search(case["question"], limit=k)
    titles = [h["title"] for h in hits]
    rank = next((i for i, t in enumerate(titles, start=1) if t in expected), None)
    methods = sorted({m for h in hits for m in h.get("found_by", [])})
    return {**case, "status": "scored", "rank": rank, "top_titles": titles, "methods": methods}


def _hit(rows: list[dict], n: int) -> float:
    return round(sum(1 for r in rows if r["rank"] is not None and r["rank"] <= n) / len(rows), 3)


def _mrr(rows: list[dict]) -> float:
    return round(sum(1 / r["rank"] for r in rows if r["rank"]) / len(rows), 3)


def summarize(rows: list[dict], k: int = K) -> dict:
    scored = [r for r in rows if r["status"] == "scored"]
    summary = {
        "k": k,
        "questions": len(rows),
        "scored": len(scored),
        "not_loaded": len(rows) - len(scored),
        "keyword_only": sum("vector" not in r["methods"] for r in scored),
    }
    if not scored:
        return summary
    summary.update(hit_at_1=_hit(scored, 1), hit_at_3=_hit(scored, 3), hit_at_k=_hit(scored, k), mrr=_mrr(scored))
    groups = defaultdict(list)
    for r in scored:
        groups[r["kind"]].append(r)
    summary["by_kind"] = {
        kind: {"scored": len(rs), "hit_at_1": _hit(rs, 1), "hit_at_k": _hit(rs, k)} for kind, rs in sorted(groups.items())
    }
    return summary


def main() -> None:
    cases = json.loads(CASES.read_text(encoding="utf-8"))
    pool.open(wait=True, timeout=15)
    try:
        with pool.connection() as conn:
            stored = {title for (title,) in conn.execute("SELECT title FROM documents")}
        rows = []
        for case in cases:
            rows.append(score(case, stored))
            print(f"[{case['id']}] {case['question']}", flush=True)
    finally:
        pool.close()

    RESULTS.mkdir(parents=True, exist_ok=True)
    summary = summarize(rows)
    (RESULTS / "retrieval.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    (RESULTS / "retrieval_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n=== Retrieval summary ===")
    print(f"Questions: {summary['questions']} | scored: {summary['scored']} | skipped, pages not loaded yet: {summary['not_loaded']}")
    if summary["scored"]:
        print(f"Right page at rank 1: {summary['hit_at_1']:.0%} | in top 3: {summary['hit_at_3']:.0%} | in top {K}: {summary['hit_at_k']:.0%} | MRR: {summary['mrr']}")
        for kind, s in summary["by_kind"].items():
            print(f"  {kind:<11} {s['scored']:>2} questions | rank 1: {s['hit_at_1']:.0%} | top {K}: {s['hit_at_k']:.0%}")
    if summary["keyword_only"]:
        print(f"\nWARNING: {summary['keyword_only']} questions returned keyword results only (embedding quota?).")
        print("         Those scores do not represent full hybrid search.")

    misses = [r for r in rows if r["status"] == "scored" and (r["rank"] is None or r["rank"] > 3)]
    if misses:
        print("\nMissed (right page not in the top 3):")
        for r in misses:
            print(f"  [{r['id']}] {r['question']}  (rank: {r['rank']})")
            print(f"      expected: {r['pages']}")
            print(f"      got:      {r['top_titles'][:3]}")
    skipped = [r for r in rows if r["status"] == "not_loaded"]
    if skipped:
        print("\nSkipped because none of the expected pages are stored:")
        for r in skipped:
            print(f"  [{r['id']}] {r['pages']}")
    print(f"\nSaved: {RESULTS / 'retrieval.json'} and retrieval_summary.json")


if __name__ == "__main__":
    main()