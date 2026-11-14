from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ClaimResponse(BaseModel):
    id: str
    paper_id: str
    paper_title: Optional[str] = ""
    chunk_id: str
    page_number: int
    verbatim_text: str
    char_start_offset: int
    char_end_offset: int
    category: str
    confidence_score: float
    extracted_verb: str
    normalized_claim: Optional[str] = ""
    extraction_method: Optional[str] = "spaCy Dependency & Epistemic Parsing"
    is_candidate: bool = True
    created_at: datetime

    class Config:
        from_attributes = True
