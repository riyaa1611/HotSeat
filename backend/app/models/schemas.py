from pydantic import BaseModel, Field
from typing import Annotated, Literal, Optional

_Url = Annotated[str, Field(max_length=500)]
_ShortText = Annotated[str, Field(max_length=1000)]
_Message = Annotated[str, Field(max_length=2000)]
_FocusTag = Annotated[str, Field(max_length=100)]


class ParseRepoRequest(BaseModel):
    repo_url: _Url


class ParseUrlRequest(BaseModel):
    project_url: _Url
    description: _ShortText = ""


class ParseRepoResponse(BaseModel):
    repo_name: str
    owner: str
    file_count: int
    tech_stack: list[str]
    context_preview: str


class StartSessionRequest(BaseModel):
    repo_url: _Url
    persona: Literal["investor", "tech_lead", "hr_manager", "product_manager"]
    focus_areas: Annotated[list[_FocusTag], Field(max_length=5)] = []
    description: _ShortText = ""
    display_name: Annotated[str, Field(max_length=80)] = ""


class StartSessionResponse(BaseModel):
    session_id: str
    first_message: str


class RespondRequest(BaseModel):
    session_id: str
    message: _Message


class RespondResponse(BaseModel):
    response: str
    turn_count: int
    is_final: bool


class EndSessionRequest(BaseModel):
    session_id: str


class AnswerBreakdownItem(BaseModel):
    turn: int
    score: int
    note: str


class EvaluationReport(BaseModel):
    clarity: int
    technical_depth: int
    business_sense: int
    pressure_handling: int
    honesty: int
    overall: int
    strengths: list[str]
    weaknesses: list[str]
    action_item: str
    answer_breakdown: Optional[list[AnswerBreakdownItem]] = None


class EndSessionResponse(BaseModel):
    report: EvaluationReport


class InterviewReport(BaseModel):
    communication: int
    confidence: int
    problem_solving: int
    culture_fit: int
    honesty: int
    overall: int
    strengths: list[str]
    weaknesses: list[str]
    action_item: str
    answer_breakdown: Optional[list[AnswerBreakdownItem]] = None


class EndInterviewResponse(BaseModel):
    report: InterviewReport
