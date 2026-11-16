"""Turns the evaluation outputs into the numbers shown on the landing page and in the README.

Run after run_eval, run_ragas and run_retrieval (with --compare):  python -m eval.publish_results

It refuses to publish incomplete or unrepresentative runs, so nothing here is estimated or invented.
"""
import json
import sys
from datetime import date
from pathlib import Path

EVAL_DIR = Path(__file__).parent
RESULTS = EVAL_DIR / "results"
ROOT = EVAL_DIR.parents[1]
FRONTEND_JSON = ROOT / "frontend" / "src" / "data" / "evalResults.json"
README = ROOT / "README.md"
MARK_START, MARK_END = "<!-- EVAL:START -->", "<!-- EVAL:END -->"


def _load(name: str):
    path = RESULTS / name
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def _ragas_scores(mean_scores: dict) -> dict:
    """Finds each metric by a word in its name, so a renamed RAGAS metric still maps correctly."""
    def pick(word: str):
        matches = [v for k, v in mean_scores.items() if word in k.lower()]
        return matches[0] if len(matches) == 1 else None

    return {"faithfulness": pick("faith"), "context_precision": pick("precision"), "context_recall": pick("recall")}


def _pipeline(rows: list[dict]) -> dict:
    answerable = [r for r in rows if r["answerable"]]
    unanswerable = [r for r in rows if not r["answerable"]]
    answered = [r for r in answerable if r["answered"]]
    lat = sorted(r["latency_ms"] for r in rows)

    def rate(part, whole):
        return round(part / whole, 3) if whole else None

    return {
        "questions_run": len(rows),
        "answered_rate": rate(len(answered), len(answerable)),
        "refused_unanswerable_rate": rate(sum(not r["answered"] for r in unanswerable), len(unanswerable)),
        "citation_rate": rate(sum(r["cited"] for r in answered), len(answered)),
        "latency_p50_ms": lat[len(lat) // 2],
        "latency_p95_ms": lat[min(len(lat) - 1, int(0.95 * len(lat)))],
    }


def build(ragas: dict | None, retrieval: dict | None, compare: dict | None, run_rows: list | None, today: str) -> dict:
    """The published numbers. Raises ValueError when something is missing or untrustworthy."""
    if not ragas:
        raise ValueError("No RAGAS summary. Run: python -m eval.run_eval, then python -m eval.run_ragas")
    if not ragas.get("complete"):
        raise ValueError("The RAGAS run is incomplete (some judge calls failed). Rerun it after the quota resets.")
    scores = _ragas_scores(ragas["mean_scores"])
    if any(v is None for v in scores.values()):
        raise ValueError(f"Could not map every RAGAS metric: {sorted(ragas['mean_scores'])}")
    if not retrieval or not retrieval.get("scored"):
        raise ValueError("No retrieval results. Run: python -m eval.run_retrieval --compare")
    if retrieval.get("keyword_only"):
        raise ValueError("Some retrieval questions fell back to keyword-only search. Rerun when embeddings are available.")

    out = {
        "published": True,
        "generated": today,
        "ragas": {"judge_model": ragas["judge_model"], "questions_scored": ragas["questions_scored"], **scores},
        "retrieval": {
            "k": retrieval["k"],
            "questions": retrieval["questions"],
            "scored": retrieval["scored"],
            "hit_at_1": retrieval["hit_at_1"],
            "hit_at_3": retrieval["hit_at_3"],
            "hit_at_k": retrieval["hit_at_k"],
            "mrr": retrieval["mrr"],
            "compare": None,
        },
        "pipeline": _pipeline(run_rows) if run_rows else None,
    }
    if compare:
        out["retrieval"]["compare"] = {
            name: {key: s[key] for key in ("scored", "hit_at_1", "hit_at_3", "hit_at_k", "mrr")}
            for name, s in compare.items()
            if s.get("scored")
        }
    return out


def _pct(v) -> str:
    return "n/a" if v is None else f"{v:.0%}"


def markdown(d: dict) -> str:
    r, ret = d["ragas"], d["retrieval"]
    lines = [
        f"_Measured on {d['generated']}. These come from the evaluation scripts in `backend/eval/`, not estimates._",
        "",
        f"**Answer quality (RAGAS)**: {r['questions_scored']} answerable questions, judged by `{r['judge_model']}`.",
        "",
        "| Metric | Score (0 to 1) |",
        "| --- | --- |",
        f"| Faithfulness | {r['faithfulness']:.2f} |",
        f"| Context precision | {r['context_precision']:.2f} |",
        f"| Context recall | {r['context_recall']:.2f} |",
        "",
        f"**Retrieval**: is the right Wikipedia page in the top {ret['k']}? {ret['scored']} of {ret['questions']} questions scored.",
        "",
    ]
    if ret["compare"]:
        lines += ["| Method | Rank 1 | Top 3 | Top %d | MRR |" % ret["k"], "| --- | --- | --- | --- | --- |"]
        for name in ("keyword", "vector", "hybrid"):
            s = ret["compare"].get(name)
            if s:
                lines.append(f"| {name.capitalize()} | {_pct(s['hit_at_1'])} | {_pct(s['hit_at_3'])} | {_pct(s['hit_at_k'])} | {s['mrr']:.2f} |")
    else:
        lines += [
            "| Rank 1 | Top 3 | Top %d | MRR |" % ret["k"],
            "| --- | --- | --- | --- |",
            f"| {_pct(ret['hit_at_1'])} | {_pct(ret['hit_at_3'])} | {_pct(ret['hit_at_k'])} | {ret['mrr']:.2f} |",
        ]
    p = d.get("pipeline")
    if p:
        lines += [
            "",
            f"**End to end** ({p['questions_run']} questions): answered {_pct(p['answered_rate'])} of answerable ones, "
            f"refused {_pct(p['refused_unanswerable_rate'])} of unanswerable ones, cited a source in {_pct(p['citation_rate'])} of answers. "
            f"Latency p50 {p['latency_p50_ms']} ms, p95 {p['latency_p95_ms']} ms.",
        ]
    return "\n".join(lines)


def _read_text(path: Path) -> str:
    raw = path.read_bytes()
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16")
    return raw.decode("utf-8-sig")


def update_readme(text: str, block: str) -> str:
    section = f"{MARK_START}\n{block}\n{MARK_END}"
    if MARK_START in text and MARK_END in text:
        head, rest = text.split(MARK_START, 1)
        return head + section + rest.split(MARK_END, 1)[1]
    return text.rstrip() + "\n\n## Evaluation\n\n" + section + "\n"


def main() -> None:
    try:
        data = build(
            _load("ragas_summary.json"), _load("retrieval_summary.json"), _load("retrieval_compare.json"), _load("run.json"),
            date.today().isoformat(),
        )
    except ValueError as exc:
        print(f"Not published: {exc}")
        sys.exit(1)

    FRONTEND_JSON.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = markdown(data)
    (RESULTS / "RESULTS.md").write_text(md + "\n", encoding="utf-8")
    if README.exists():
        README.write_text(update_readme(_read_text(README), md), encoding="utf-8")  # saved as UTF-8
    print(md)
    print(f"\nSaved: {FRONTEND_JSON}, {RESULTS / 'RESULTS.md'} and the Evaluation section of README.md")


if __name__ == "__main__":
    main()