from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class AskRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    question: str = Field(..., min_length=3, max_length=500)
    top_k: int = Field(5, ge=1, le=10)


class Source(BaseModel):
    id: int
    title: str
    section: str | None = None
    url: str
    snippet: str
    cited: bool


class AskResponse(BaseModel):
    answer: str
    answered: bool
    sources: list[Source]
    model: str | None = None
    latency_ms: int

PageTitle = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class IngestRequest(BaseModel):
    titles: list[PageTitle] = Field(..., min_length=1, max_length=10)


class IngestResponse(BaseModel):
    status: str
    titles: list[str]