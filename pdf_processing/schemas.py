from dataclasses import dataclass
from typing import Optional


@dataclass
class ProcessedPaper:
    paper_id: str
    filename: str
    status: str
    title: Optional[str] = None
    authors: Optional[list] = None
    abstract: Optional[str] = None
    text: Optional[str] = None
    page_count: int = 0
    error: Optional[str] = None