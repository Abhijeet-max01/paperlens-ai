from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.qa import QARequest, QAResponse
from app.core.citation_engine import citation_engine

router = APIRouter(prefix="/qa", tags=["Cross-Paper Q&A"])

@router.post("/ask", response_model=QAResponse)
def ask_cross_paper_question(request: QARequest, db: Session = Depends(get_db)):
    result = citation_engine.answer_cross_paper_query(
        db=db,
        question=request.question,
        paper_ids=request.paper_ids,
        top_k=request.top_k,
        include_test_papers=request.include_test_papers
    )
    return QAResponse(**result)
