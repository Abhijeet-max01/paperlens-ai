import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import Claim, ClaimPair, Paper
from app.schemas.nli import CompareRequest, NLIMatrixResponse, NLIMatrixCell, ClaimPairResponse
from app.core.nli_filter import nli_filter
from app.core.nli_engine import nli_engine

router = APIRouter(prefix="/nli", tags=["NLI & Contradictions"])

@router.post("/compare-matrix", response_model=NLIMatrixResponse)
def compare_claims_matrix(request: CompareRequest, db: Session = Depends(get_db)):
    query = db.query(Claim, Paper.title).join(Paper, Claim.paper_id == Paper.id)
    if request.paper_ids:
        query = query.filter(Claim.paper_id.in_(request.paper_ids))
    
    claims_rows = query.all()
    if len(claims_rows) < 2:
        return NLIMatrixResponse(
            total_comparisons=0,
            total_contradictions=0,
            total_entailments=0,
            matrix_cells=[],
            pairs=[]
        )

    claims_data = []
    for c, title in claims_rows:
        claims_data.append({
            "id": c.id,
            "paper_id": c.paper_id,
            "paper_title": title,
            "page_number": c.page_number,
            "verbatim_text": c.verbatim_text,
            "category": c.category
        })

    # Stage 1: Dense cosine pre-filtering
    candidate_pairs = nli_filter.filter_candidate_pairs(claims_data)
    if request.max_pairs:
        candidate_pairs = candidate_pairs[:request.max_pairs]

    # Stage 2: Cross-Encoder NLI
    evaluated_pairs = nli_engine.predict_pairs(candidate_pairs)

    # Persist and format responses
    saved_pair_responses: List[ClaimPairResponse] = []
    cell_map: Dict[tuple, Dict[str, Any]] = {}

    for p in evaluated_pairs:
        pair_db = ClaimPair(
            id=str(uuid.uuid4()),
            claim_a_id=p["claim_a_id"],
            claim_b_id=p["claim_b_id"],
            semantic_similarity=p["semantic_similarity"],
            nli_label=p["nli_label"],
            scientific_relationship=p.get("scientific_relationship", "NEUTRAL_OR_INSUFFICIENT_EVIDENCE"),
            entailment_score=p["entailment_score"],
            contradiction_score=p["contradiction_score"],
            neutral_score=p["neutral_score"],
            context_comparison_note=p["context_comparison_note"]
        )
        db.add(pair_db)

        pair_resp = ClaimPairResponse(
            id=pair_db.id,
            claim_a_id=p["claim_a_id"],
            claim_a_text=p["claim_a_text"],
            claim_a_paper_title=p["claim_a_paper_title"],
            claim_a_page=p["claim_a_page"],
            claim_b_id=p["claim_b_id"],
            claim_b_text=p["claim_b_text"],
            claim_b_paper_title=p["claim_b_paper_title"],
            claim_b_page=p["claim_b_page"],
            semantic_similarity=p["semantic_similarity"],
            nli_label=p["nli_label"],
            scientific_relationship=p.get("scientific_relationship", "NEUTRAL_OR_INSUFFICIENT_EVIDENCE"),
            entailment_score=p["entailment_score"],
            contradiction_score=p["contradiction_score"],
            neutral_score=p["neutral_score"],
            context_comparison_note=p["context_comparison_note"],
            created_at=pair_db.created_at
        )
        saved_pair_responses.append(pair_resp)

        # Aggregate for Matrix
        cell_key = tuple(sorted([p["claim_a_paper_title"], p["claim_b_paper_title"]]))
        if cell_key not in cell_map:
            cell_map[cell_key] = {
                "paper_a_id": p["claim_a_id"],
                "paper_a_title": cell_key[0],
                "paper_b_id": p["claim_b_id"],
                "paper_b_title": cell_key[1],
                "entailment_count": 0,
                "contradiction_count": 0,
                "neutral_count": 0,
                "sample_pairs": []
            }
        
        if p["nli_label"] == "ENTAILMENT":
            cell_map[cell_key]["entailment_count"] += 1
        elif p["nli_label"] == "CONTRADICTION":
            cell_map[cell_key]["contradiction_count"] += 1
        else:
            cell_map[cell_key]["neutral_count"] += 1
            
        if len(cell_map[cell_key]["sample_pairs"]) < 3:
            cell_map[cell_key]["sample_pairs"].append(pair_resp)

    db.commit()

    matrix_cells = [NLIMatrixCell(**v) for v in cell_map.values()]
    total_contradictions = sum(1 for p in saved_pair_responses if p.nli_label == "CONTRADICTION")
    total_entailments = sum(1 for p in saved_pair_responses if p.nli_label == "ENTAILMENT")

    return NLIMatrixResponse(
        total_comparisons=len(saved_pair_responses),
        total_contradictions=total_contradictions,
        total_entailments=total_entailments,
        matrix_cells=matrix_cells,
        pairs=saved_pair_responses
    )


@router.get("/contradictions", response_model=List[ClaimPairResponse])
def get_contradictions(db: Session = Depends(get_db)):
    pairs = db.query(ClaimPair).filter(ClaimPair.nli_label == "CONTRADICTION").all()
    results = []
    for p in pairs:
        claim_a = db.query(Claim).filter(Claim.id == p.claim_a_id).first()
        claim_b = db.query(Claim).filter(Claim.id == p.claim_b_id).first()
        if not claim_a or not claim_b:
            continue

        paper_a = db.query(Paper).filter(Paper.id == claim_a.paper_id).first()
        paper_b = db.query(Paper).filter(Paper.id == claim_b.paper_id).first()

        results.append(ClaimPairResponse(
            id=p.id,
            claim_a_id=claim_a.id,
            claim_a_text=claim_a.verbatim_text,
            claim_a_paper_title=paper_a.title if paper_a else "Unknown",
            claim_a_page=claim_a.page_number,
            claim_b_id=claim_b.id,
            claim_b_text=claim_b.verbatim_text,
            claim_b_paper_title=paper_b.title if paper_b else "Unknown",
            claim_b_page=claim_b.page_number,
            semantic_similarity=p.semantic_similarity,
            nli_label=p.nli_label,
            entailment_score=p.entailment_score,
            contradiction_score=p.contradiction_score,
            neutral_score=p.neutral_score,
            context_comparison_note=p.context_comparison_note,
            created_at=p.created_at
        ))
    return results
