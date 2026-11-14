import uuid
import logging
from typing import List, Dict, Any

from app.schemas.gap import LimitationResponse, InferredGapResponse, GapAnalysisResponse

logger = logging.getLogger(__name__)

class ResearchGapAnalyzer:
    def __init__(self):
        pass

    def synthesize_gaps(
        self,
        explicit_limitations: List[Dict[str, Any]],
        contradictory_pairs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes research gaps by cleanly separating:
        1. Explicit author-declared limitations.
        2. Inferred research gaps derived from empirical contradictions across papers.
        """
        inferred_gaps: List[Dict[str, Any]] = []

        for pair in contradictory_pairs:
            claim_a = pair.get("claim_a_text", "")
            claim_b = pair.get("claim_b_text", "")
            paper_a = pair.get("claim_a_paper_title", "Paper A")
            paper_b = pair.get("claim_b_paper_title", "Paper B")
            contra_score = pair.get("contradiction_score", 0.75)

            # Generate suggested research question
            research_q = f"What specific dataset or architectural differences account for the divergent results reported in '{paper_a}' vs '{paper_b}'?"

            inferred_gaps.append({
                "id": str(uuid.uuid4()),
                "title": f"Empirical Divergence: '{paper_a[:30]}...' vs '{paper_b[:30]}...'",
                "description": (
                    f"Potential gap in the uploaded research collection: '{paper_a}' and '{paper_b}' report contrasting findings regarding the evaluated mechanism. "
                    f"NLI model assigned a {round(contra_score * 100, 1)}% probability of contradiction. "
                    f"This indicates a promising direction for reconciling experimental parameters or benchmarking under unified conditions."
                ),
                "confidence_score": round(contra_score, 3),
                "conflicting_paper_titles": [paper_a, paper_b],
                "supporting_claim_snippets": [claim_a, claim_b],
                "suggested_research_question": research_q,
                "tier": "INFERRED_DISCREPANCY"
            })

        return {
            "total_explicit_limitations": len(explicit_limitations),
            "total_inferred_gaps": len(inferred_gaps),
            "explicit_limitations": explicit_limitations,
            "inferred_gaps": inferred_gaps
        }

gap_analyzer = ResearchGapAnalyzer()
