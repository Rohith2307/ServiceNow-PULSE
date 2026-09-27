from typing import List, Optional

from pydantic import BaseModel, Field


class StudentRead(BaseModel):
    student_id: str
    name: str
    year: int
    program: str
    cohort_group: str


class PulseCreate(BaseModel):
    student_id: str
    date: str
    wellbeing_level: int = Field(..., ge=1, le=10)
    concerns: List[str] = Field(default_factory=list)
    optional_note: Optional[str] = None


class PulseRead(BaseModel):
    pulse_id: str
    student_id: str
    date: str
    wellbeing_level: int
    concerns: List[str]
    optional_note: Optional[str] = None


class ChangeResultRead(BaseModel):
    student_id: str
    date: str
    status: str
    direction: str
    persistence: bool
    magnitude: str
    signal_convergence: bool
    context: str
    support_signal: str
    explanation: str
    recommended_actions: List[str]


class SupportOptionRead(BaseModel):
    option_id: str
    label: str
    type: str
    description: str
    student_controlled: bool = True


class CohortSummaryRead(BaseModel):
    cohort_name: str
    status: str
    wellbeing_trend: str
    prevalence: float
    concerns: List[str]
    explanation: str
