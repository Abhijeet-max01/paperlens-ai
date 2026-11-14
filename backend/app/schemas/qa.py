from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class QARequest(BaseModel):
    question: str = Field(..., min_length=3, description="Cross-paper research inquiry")
    paper_ids: Optional[List[str]] = Field(default=None, description="Optional paper UUID filter")
    top_k: int = Field(default=6, ge=1, le=20)
    include_test_papers: bool = Field(default=False, description="Include test fixture documents in unscoped searches")

class CitationItem(BaseModel):
    citation_id: str
    paper_id: str
    paper_title: str
    page_number: int
    chunk_id: str
    section_name: str
    quoted_snippet: str
    is_verified: bool
    provenance_verified: bool = True
    semantic_support_status: Optional[str] = None
    semantic_support_score: Optional[float] = None
    associated_claim: Optional[str] = None
    verification_note: Optional[str] = None

class SearchedPaperItem(BaseModel):
    id: str
    title: str
    filename: str

class EvidencePaperItem(BaseModel):
    id: str
    title: str
    chunk_count: int
    page_numbers: List[int]

class QAResponse(BaseModel):
    question: str
    answer: str
    synthesis_summary: str
    direct_response: Optional[str] = None
    summary_of_evidence: Optional[str] = None
    supporting_findings: List[str] = []
    contradicting_findings: List[str] = []
    inconclusive_evidence: List[str] = []
    methodology_and_dataset_differences: List[str] = []
    balanced_interpretation: Optional[str] = None
    searched_papers: List[SearchedPaperItem] = []
    evidence_papers: List[EvidencePaperItem] = []
    agreements: List[str] = []
    discrepancies: List[str] = []
    citations: List[CitationItem] = []
    verified_citation_count: int = 0
    unverified_citation_count: int = 0
    unique_contributing_paper_count: int = 0
    duplicate_evidence_filtered_count: int = 0
    excluded_out_of_scope_count: int = 0
