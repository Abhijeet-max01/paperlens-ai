import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import Claim, Paper, Chunk
from app.schemas.claim import ClaimResponse
from app.core.claim_extractor import claim_extractor

router = APIRouter(prefix="/claims", tags=["Claims"])

@router.get("", response_model=List[ClaimResponse])
def list_claims(
    paper_id: Optional[str] = None,
    category: Optional[str] = None,
    min_confidence: float = 0.0,
    db: Session = Depends(get_db)
):
    query = db.query(Claim, Paper.title).join(Paper, Claim.paper_id == Paper.id)
    
    if paper_id:
        query = query.filter(Claim.paper_id == paper_id)
    if category:
        query = query.filter(Claim.category == category)
    if min_confidence and min_confidence > 0.0:
        query = query.filter(Claim.confidence_score >= min_confidence)

    claims_data = query.order_by(Claim.confidence_score.desc()).all()

    results = []
    for claim, paper_title in claims_data:
        results.append(ClaimResponse(
            id=claim.id,
            paper_id=claim.paper_id,
            paper_title=paper_title,
            chunk_id=claim.chunk_id,
            page_number=claim.page_number,
            verbatim_text=claim.verbatim_text,
            char_start_offset=claim.char_start_offset,
            char_end_offset=claim.char_end_offset,
            category=claim.category,
            confidence_score=claim.confidence_score,
            extracted_verb=claim.extracted_verb,
            normalized_claim=claim.normalized_claim or claim.verbatim_text,
            extraction_method=claim.extraction_method or "spaCy Dependency & Epistemic Parsing",
            is_candidate=claim.is_candidate if claim.is_candidate is not None else True,
            created_at=claim.created_at
        ))
    return results

@router.post("/extract/{paper_id}", response_model=List[ClaimResponse])
def extract_paper_claims(paper_id: str, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found.")

    # Remove existing claims for this paper
    db.query(Claim).filter(Claim.paper_id == paper_id).delete()
    db.commit()

    new_claims = []
    for chunk in paper.chunks:
        extracted = claim_extractor.extract_claims_from_chunk(
            chunk_id=chunk.id,
            paper_id=paper.id,
            page_number=chunk.page_number,
            section_name=chunk.section_name,
            content=chunk.content
        )
        for item in extracted:
            c_db = Claim(
                id=str(uuid.uuid4()),
                paper_id=paper.id,
                chunk_id=chunk.id,
                page_number=item["page_number"],
                verbatim_text=item["verbatim_text"],
                char_start_offset=item["char_start_offset"],
                char_end_offset=item["char_end_offset"],
                category=item["category"],
                confidence_score=item["confidence_score"],
                extracted_verb=item["extracted_verb"],
                normalized_claim=item["verbatim_text"],
                extraction_method="spaCy Dependency & Epistemic Parsing",
                is_candidate=True
            )
            db.add(c_db)
            new_claims.append(c_db)

    db.commit()

    return [
        ClaimResponse(
            id=c.id,
            paper_id=c.paper_id,
            paper_title=paper.title,
            chunk_id=c.chunk_id,
            page_number=c.page_number,
            verbatim_text=c.verbatim_text,
            char_start_offset=c.char_start_offset,
            char_end_offset=c.char_end_offset,
            category=c.category,
            confidence_score=c.confidence_score,
            extracted_verb=c.extracted_verb,
            normalized_claim=c.normalized_claim or c.verbatim_text,
            extraction_method=c.extraction_method or "spaCy Dependency & Epistemic Parsing",
            is_candidate=c.is_candidate if c.is_candidate is not None else True,
            created_at=c.created_at
        )
        for c in new_claims
    ]
