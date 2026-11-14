from typing import List, Optional
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language search query")
    top_k: int = Field(default=5, ge=1, le=50)
    min_similarity: float = Field(default=0.35, ge=0.0, le=1.0)
    paper_ids: Optional[List[str]] = Field(default=None, description="Optional filter by paper UUIDs")

class SearchResultItem(BaseModel):
    chunk_id: str
    paper_id: str
    paper_title: str
    page_number: int
    section_name: str
    content: str
    similarity_score: float
    highlighted_snippet: str

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
