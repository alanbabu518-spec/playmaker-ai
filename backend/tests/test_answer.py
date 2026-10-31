from app.generation import answer as answer_module
from app.generation.answer import answer_question
from app.generation.llm_client import Generation
from app.generation.prompts import NO_ANSWER, build_user_prompt


def chunk(i: int) -> dict:
    return {
        "id": i,
        "title": f"Page {i}",
        "url": f"https://example.org/{i}",
        "content": f"Page {i} - Intro\nText {i}.",
        "metadata": {"section": "Intro"},
    }


def patch(monkeypatch, chunks, reply=""):
    """Replace retrieval and the LLM with fakes. Returns the list of LLM calls."""
    calls = []
    monkeypatch.setattr(answer_module, "hybrid_search", lambda q, limit: chunks)

    def fake_generate(system, prompt):
        calls.append(prompt)
        return Generation(reply, "fake-model")

    monkeypatch.setattr(answer_module, "generate", fake_generate)
    return calls


def test_no_chunks_means_no_llm_call(monkeypatch):
    calls = patch(monkeypatch, [])
    result = answer_question("anything")
    assert result["answer"] == NO_ANSWER
    assert result["answered"] is False
    assert result["sources"] == []
    assert calls == []


def test_model_refusal_returns_no_sources_but_keeps_contexts(monkeypatch):
    patch(monkeypatch, [chunk(1), chunk(2)], reply=NO_ANSWER)
    result = answer_question("unanswerable")
    assert result["answered"] is False
    assert result["sources"] == []
    assert len(result["contexts"]) == 2


def test_cited_flags_match_the_answer(monkeypatch):
    patch(monkeypatch, [chunk(1), chunk(2), chunk(3)], reply="Argentina won [2].")
    result = answer_question("who won")
    assert result["answered"] is True
    assert [s["cited"] for s in result["sources"]] == [False, True, False]
    assert result["model"] == "fake-model"


def test_invented_citation_is_ignored(monkeypatch):
    patch(monkeypatch, [chunk(1), chunk(2)], reply="Something happened [9].")
    result = answer_question("q")
    assert result["answered"] is True
    assert not any(s["cited"] for s in result["sources"])


def test_empty_model_reply_counts_as_no_answer(monkeypatch):
    patch(monkeypatch, [chunk(1)], reply="")
    result = answer_question("q")
    assert result["answer"] == NO_ANSWER
    assert result["answered"] is False


def test_prompt_numbers_sources_and_ends_with_question():
    prompt = build_user_prompt("Who won?", [chunk(1), chunk(2)])
    assert "[1] Page 1 - Intro" in prompt
    assert "[2] Page 2 - Intro" in prompt
    assert prompt.endswith("Question: Who won?")