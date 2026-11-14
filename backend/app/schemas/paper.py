from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PaperBase(BaseModel):
    title: str
    authors: Optional[str] = ""
    affiliations: List[str] = []
    emails: List[str] = []
    year: Optional[int] = None
    filename: str

class PaperResponse(PaperBase):
    id: str
    total_pages: int
    processing_status: str
    error_message: Optional[str] = None
    has_ocr_applied: bool
    is_test_document: bool = False
    unextractable_pages: List[int] = []
    created_at: datetime
    chunk_count: int = 0
    claim_count: int = 0
    limitation_count: int = 0
    searchable_passages_count: int = 0
    candidate_claims_count: int = 0
    author_limitations_count: int = 0
    ai_inferred_limitations_count: int = 0

    class Config:
        from_attributes = True

class PaperDetailResponse(PaperResponse):
    file_path: str
    sections_detected: List[str] = []

class ProcessingStage(BaseModel):
    id: int
    name: str
    status: str # waiting, in_progress, completed, failed, skipped
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    detail: str

class ProcessingTransparencyResponse(BaseModel):
    paper_id: str
    title: str
    filename: str
    processing_status: str
    total_pages: int
    unextractable_pages: List[int] = []
    has_ocr_applied: bool
    ocr_engine_available: bool
    chunk_count: int
    claim_count: int
    limitation_count: int
    stages: List[ProcessingStage] = []

class ProblemStatementItem(BaseModel):
    statement: str
    section: str
    page_number: int
    chunk_id: Optional[str] = None

class ContributionItem(BaseModel):
    statement: str
    section: str
    page_number: int
    chunk_id: Optional[str] = None

class MethodologyItem(BaseModel):
    description: str
    section: str
    page_number: int
    chunk_id: Optional[str] = None

class DatasetItem(BaseModel):
    dataset_info: str
    section: str
    page_number: int

class NumericalResultItem(BaseModel):
    finding: str
    section: str
    page_number: int
    chunk_id: Optional[str] = None
    is_own_finding: Optional[bool] = True
    metric_category: Optional[str] = None

class AbstractOverview(BaseModel):
    text: str
    source: Optional[Dict[str, Any]] = None
    is_reliable: bool = True

class ConclusionOverview(BaseModel):
    text: str
    page_number: Optional[int] = None

class ClaimDetailItem(BaseModel):
    id: str
    verbatim_text: str
    normalized_claim: str
    category: str
    page_number: int
    confidence_score: float
    extracted_verb: str
    extraction_method: str
    is_candidate: bool = True

class LimitationItem(BaseModel):
    id: str
    text: str
    section: str
    page_number: int
    tier: str

class InferredLimitationItem(BaseModel):
    title: str
    description: str
    evidence: str
    page_number: int
    tier: str
    significance: str

class PotentialGapItem(BaseModel):
    title: str
    description: str
    page_number: int
    suggested_question: str

class LimitationsAndGapsSection(BaseModel):
    author_stated_limitations: List[LimitationItem] = []
    ai_inferred_limitations: List[InferredLimitationItem] = []
    potential_research_gaps: List[PotentialGapItem] = []

class EvidencePassageItem(BaseModel):
    chunk_id: str
    page_number: int
    section_name: str
    content: str
    token_count: int
    chunk_index: int

class PaperAnalysisResponse(BaseModel):
    paper_id: str
    title: str
    authors: str
    affiliations: List[str] = []
    emails: List[str] = []
    year: Optional[int] = None
    filename: str
    total_pages: int
    processing_status: str
    has_ocr_applied: bool
    is_test_document: bool
    unextractable_pages: List[int] = []
    sections_detected: List[str] = []
    abstract: AbstractOverview
    research_problems: List[ProblemStatementItem] = []
    contributions: List[ContributionItem] = []
    methodology_overview: List[MethodologyItem] = []
    datasets: List[DatasetItem] = []
    numerical_results: List[NumericalResultItem] = []
    conclusion: ConclusionOverview
    claims: List[ClaimDetailItem] = []
    limitations_and_gaps: LimitationsAndGapsSection
    evidence_passages: List[EvidencePassageItem] = []
