from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import Limitation, ClaimPair, Claim, Paper
from app.schemas.gap import GapAnalysisResponse, LimitationResponse
from app.core.gap_analyzer import gap_analyzer

router = APIRouter(prefix="/gaps", tags=["Research Gaps"])

@router.get("/all", response_model=GapAnalysisResponse)
def get_research_gaps(db: Session = Depends(get_db)):
    # 1. Explicit author limitations
    limits = db.query(Limitation, Paper.title).join(Paper, Limitation.paper_id == Paper.id).all()
    explicit_limitations = []
    for lim, paper_title in limits:
        explicit_limitations.append(LimitationResponse(
            id=lim.id,
            paper_id=lim.paper_id,
            paper_title=paper_title,
            page_number=lim.page_number,
            limitation_text=lim.limitation_text,
            section_found=lim.section_found,
            tier=lim.tier,
            created_at=lim.created_at
        ))

    # 2. Contradictory pairs for inferred gap synthesis
    contra_pairs_db = db.query(ClaimPair).filter(ClaimPair.nli_label == "CONTRADICTION").all()
    contradictory_pairs_data = []
    for p in contra_pairs_db:
        ca = db.query(Claim).filter(Claim.id == p.claim_a_id).first()
        cb = db.query(Claim).filter(Claim.id == p.claim_b_id).first()
        if not ca or not cb:
            continue
        pa = db.query(Paper).filter(Paper.id == ca.paper_id).first()
        pb = db.query(Paper).filter(Paper.id == cb.paper_id).first()
        contradictory_pairs_data.append({
            "claim_a_text": ca.verbatim_text,
            "claim_b_text": cb.verbatim_text,
            "claim_a_paper_title": pa.title if pa else "Paper A",
            "claim_b_paper_title": pb.title if pb else "Paper B",
            "contradiction_score": p.contradiction_score
        })

    synthesis = gap_analyzer.synthesize_gaps(
        explicit_limitations=[l.model_dump() for l in explicit_limitations],
        contradictory_pairs=contradictory_pairs_data
    )

    return GapAnalysisResponse(
        total_explicit_limitations=synthesis["total_explicit_limitations"],
        total_inferred_gaps=synthesis["total_inferred_gaps"],
        explicit_limitations=explicit_limitations,
        inferred_gaps=synthesis["inferred_gaps"]
    )
