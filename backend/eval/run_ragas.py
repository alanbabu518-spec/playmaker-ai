import argparse
import json
from pathlib import Path

from langchain_google_genai import ChatGoogleGenerativeAI
from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.llms import LangchainLLMWrapper
from ragas.metrics import Faithfulness, LLMContextPrecisionWithReference, LLMContextRecall
from ragas.run_config import RunConfig

from app.core.config import settings

RESULTS = Path(__file__).parent / "results"


def clean(value: float) -> float | None:
    return None if value != value else round(float(value), 3)  # NaN becomes null


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--judge", default="", help="judge model (default: JUDGE_MODEL from .env)")
    ap.add_argument("--limit", type=int, default=0, help="score only the first N answers")
    args = ap.parse_args()

    rows = json.loads((RESULTS / "run.json").read_text(encoding="utf-8"))
    scorable = [r for r in rows if r["answerable"] and r["answered"] and r["contexts"]]
    refused_but_answerable = [r["id"] for r in rows if r["answerable"] and not r["answered"]]
    if args.limit:
        scorable = scorable[: args.limit]
    if not scorable:
        print("Nothing to score. Run: python -m eval.run_eval")
        return

    judge_name = args.judge or settings.judge_model or settings.generation_models[-1]
    if judge_name in settings.generation_models[:1]:
        print(f"WARNING: judge {judge_name} is also the main answering model.")
    judge = LangchainLLMWrapper(
        ChatGoogleGenerativeAI(model=judge_name, google_api_key=settings.gemini_api_key)
    )
    metrics = [
        Faithfulness(llm=judge),
        LLMContextPrecisionWithReference(llm=judge),
        LLMContextRecall(llm=judge),
    ]
    dataset = EvaluationDataset(
        samples=[
            SingleTurnSample(
                user_input=r["question"],
                response=r["answer"],
                retrieved_contexts=r["contexts"],
                reference=r["ground_truth"],
            )
            for r in scorable
        ]
    )

    print(f"Scoring {len(scorable)} answers with judge {judge_name} ...")
    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        run_config=RunConfig(max_workers=2, timeout=180, max_retries=3),
        raise_exceptions=False,  # a failed judge call becomes NaN and does not stop the run
    )
    df = result.to_pandas()
    df.insert(0, "id", [r["id"] for r in scorable])
    df.to_csv(RESULTS / "ragas_scores.csv", index=False, encoding="utf-8")

    names = [m.name for m in metrics if m.name in df.columns]
    failed = {n: int(df[n].isna().sum()) for n in names}
    complete = len(names) == len(metrics) and not any(failed.values())

    summary = {
        "complete": complete,  # false means some judge calls failed, so do not publish
        "judge_model": judge_name,
        "questions_scored": len(scorable),
        "answerable_but_refused": refused_but_answerable,
        "mean_scores": {n: clean(df[n].mean()) for n in names},
        "failed_judgements": failed,
    }
    (RESULTS / "ragas_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print("\n=== RAGAS summary ===")
    for n in names:
        note = "" if not failed[n] else "   <-- INCOMPLETE"
        print(f"{n:<42} {summary['mean_scores'][n]}   (failed: {failed[n]}){note}")
    if refused_but_answerable:
        print(f"Answerable questions the system refused: {refused_but_answerable}")
    weak = df[(df[names] < 0.5).any(axis=1)]["id"].tolist()
    print(f"Questions with any score below 0.5: {weak}")

    if not complete:
        print("\nINCOMPLETE: some judge calls failed, so these means cover only the successful calls.")
        print("Do not publish these numbers. Rerun after the quota resets.")
    print(f"\nSaved: {RESULTS / 'ragas_scores.csv'} and ragas_summary.json")


if __name__ == "__main__":
    main()