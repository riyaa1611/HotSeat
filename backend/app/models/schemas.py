from pydantic import BaseModel
from typing import Literal


class ParseRepoRequest(BaseModel):
    repo_url: str


class ParseRepoResponse(BaseModel):
    repo_name: str
    owner: str
    file_count: int
    tech_stack: list[str]
    context_preview: str


class StartSessionRequest(BaseModel):
    repo_url: str
    persona: Literal["investor", "tech_lead", "hr_manager", "product_manager"]
    focus_areas: list[str] = []


class StartSessionResponse(BaseModel):
    session_id: str
    first_message: str


class RespondRequest(BaseModel):
    session_id: str
    message: str


class RespondResponse(BaseModel):
    response: str
    turn_count: int
    is_final: bool


class EndSessionRequest(BaseModel):
    session_id: str


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


class EndSessionResponse(BaseModel):
    report: EvaluationReport
