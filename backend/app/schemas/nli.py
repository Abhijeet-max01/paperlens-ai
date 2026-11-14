from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class CompareRequest(BaseModel):
    paper_ids: Optional[List[str]] = None
    similarity_threshold: Optional[float] = 0.60
    max_pairs: Optional[int] = 50

class ClaimPairResponse(BaseModel):
    id: str
    claim_a_id: str
    claim_a_text: str
    claim_a_paper_title: str
    claim_a_page: int
    claim_b_id: str
    claim_b_text: str
    claim_b_paper_title: str
    claim_b_page: int
    semantic_similarity: float
    nli_label: str # ENTAILMENT, CONTRADICTION, NEUTRAL
    scientific_relationship: Optional[str] = "NEUTRAL_OR_INSUFFICIENT_EVIDENCE"
    entailment_score: float
    contradiction_score: float
    neutral_score: float
    context_comparison_note: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class NLIMatrixCell(BaseModel):
    paper_a_id: str
    paper_a_title: str
    paper_b_id: str
    paper_b_title: str
    entailment_count: int
    contradiction_count: int
    neutral_count: int
    sample_pairs: List[ClaimPairResponse] = []

class NLIMatrixResponse(BaseModel):
    total_comparisons: int
    total_contradictions: int
    total_entailments: int
    matrix_cells: List[NLIMatrixCell]
    pairs: List[ClaimPairResponse]
    epistemic_disclaimer: str = (
        "NLI classifications represent probabilistic semantic inference between extracted claim statements. "
        "Divergent claims indicate potential contradictions or disparate experimental conditions rather than absolute scientific refutation."
    )
