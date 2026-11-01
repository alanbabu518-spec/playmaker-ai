import argparse
import json
from pathlib import Path

from app.core.db import pool
from app.generation.answer import answer_question
from app.generation.llm_client import GenerationFailed, GenerationQuotaExceeded

EVAL_DIR = Path(__file__).parent
TESTSET = EVAL_DIR / "testset.json"
DEFAULT_OUT = EVAL_DIR / "results" / "run.json"


def page_hit(contexts: list[str], pages: list[str]) -> bool:
    # Each context starts with "Page title - Section", so the first line names its page.
    heads = [c.split("\n", 1)[0] for c in contexts]
    return any(h.startswith(f"{p} - ") for h in heads for p in pages)


def run_one(item: dict) -> dict:
    res = answer_question(item["question"])
    return {
        "id": item["id"],
        "type": item["type"],
        "question": item["question"],
        "ground_truth": item["ground_truth"],
        "answerable": item["answerable"],
        "pages": item["pages"],
        "answer": res["answer"],
        "answered": res["answered"],
        "contexts": res["contexts"],
        "cited": any(s["cited"] for s in res["sources"]),
        "page_hit": page_hit(res["contexts"], item["pages"]) if item["pages"] else None,
        "model": res["model"],
        "retrieval_methods": res["retrieval_methods"],
        "latency_ms": res["latency_ms"],
    }


def pct(part: int, whole: int) -> str:
    return f"{part}/{whole} ({100 * part / whole:.0f}%)" if whole else "n/a"


def summarize(rows: list[dict]) -> None:
    if not rows:
        print("No results yet.")
        return
    answerable = [r for r in rows if r["answerable"]]
    unanswerable = [r for r in rows if not r["answerable"]]
    answered = [r for r in answerable if r["answered"]]
    with_pages = [r for r in answerable if r["page_hit"] is not None]
    lat = sorted(r["latency_ms"] for r in rows)

    print("\n=== Evaluation summary ===")
    print(f"Questions run:               {len(rows)}")
    print(f"Answered (answerable):       {pct(len(answered), len(answerable))}")
    print(f"Refused (unanswerable):      {pct(sum(not r['answered'] for r in unanswerable), len(unanswerable))}")
    print(f"Answers with a citation:     {pct(sum(r['cited'] for r in answered), len(answered))}")
    print(f"Right page retrieved:        {pct(sum(r['page_hit'] for r in with_pages), len(with_pages))}")
    print(f"Latency p50 / p95:           {lat[len(lat) // 2]} ms / {lat[min(len(lat) - 1, int(0.95 * len(lat)))]} ms")
    models = {}
    for r in rows:
        models[r["model"]] = models.get(r["model"], 0) + 1
    print(f"Models used:                 {models}")
    used_vector = sum("vector" in r["retrieval_methods"] for r in rows)
    print(f"Vector search contributed:   {pct(used_vector, len(rows))}")
    if used_vector < len(rows):
        print("WARNING: some questions ran on keyword search only (embedding quota?).")
        print("         Those scores do not represent full hybrid retrieval.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--fresh", action="store_true", help="ignore saved results and start over")
    ap.add_argument("--limit", type=int, default=0, help="only run the first N questions")
    args = ap.parse_args()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    items = json.loads(TESTSET.read_text(encoding="utf-8"))
    if args.limit:
        items = items[: args.limit]

    rows = []
    if out.exists() and not args.fresh:
        rows = json.loads(out.read_text(encoding="utf-8"))
    done = {r["id"] for r in rows}

    pool.open(wait=True, timeout=15)
    try:
        for item in items:
            if item["id"] in done:
                continue
            print(f"[{item['id']}] {item['question']}", flush=True)
            try:
                rows.append(run_one(item))
            except (GenerationQuotaExceeded, GenerationFailed) as exc:
                print(f"Stopping: {exc}\nProgress is saved. Rerun the same command to resume.")
                break
            out.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    finally:
        pool.close()

    summarize(rows)
    print(f"\nResults file: {out}")


if __name__ == "__main__":
    main()