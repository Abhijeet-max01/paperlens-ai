from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class LimitationResponse(BaseModel):
    id: str
    paper_id: str
    paper_title: str
    page_number: int
    limitation_text: str
    section_found: str
    tier: str # EXPLICIT_AUTHOR_STATED
    created_at: datetime

    class Config:
        from_attributes = True

class InferredGapResponse(BaseModel):
    id: str
    title: str
    description: str
    confidence_score: float
    conflicting_paper_titles: List[str]
    supporting_claim_snippets: List[str]
    suggested_research_question: str
    tier: str = "INFERRED_DISCREPANCY"

class GapAnalysisResponse(BaseModel):
    total_explicit_limitations: int
    total_inferred_gaps: int
    explicit_limitations: List[LimitationResponse]
    inferred_gaps: List[InferredGapResponse]
