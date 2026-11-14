import logging
from typing import List, Dict, Any, Tuple
import numpy as np

from app.config import settings
from app.core.embeddings import embedding_engine

logger = logging.getLogger(__name__)

class NLICandidateFilter:
    def __init__(self, threshold: float = None, max_pairs_per_claim: int = None):
        self.threshold = threshold or settings.NLI_CANDIDATE_SIMILARITY_THRESHOLD
        self.max_pairs = max_pairs_per_claim or settings.MAX_CANDIDATE_PAIRS_PER_CLAIM

    def filter_candidate_pairs(
        self,
        claims: List[Dict[str, Any]]
    ) -> List[Tuple[Dict[str, Any], Dict[str, Any], float]]:
        """
        Stage 1: Uses dense vector cosine similarity to pre-filter related claim pairs across distinct papers.
        Prevents O(N^2) CPU bottleneck.
        Returns: List of (claim_a, claim_b, similarity_score)
        """
        if len(claims) < 2:
            return []

        # Group claims by paper
        papers_represented = set(c["paper_id"] for c in claims)
        if len(papers_represented) < 2:
            logger.info("Fewer than 2 papers represented in claims. No cross-paper pairs to compare.")
            return []

        texts = [c["verbatim_text"] for c in claims]
        embeddings = embedding_engine.embed_texts(texts) # Normalized vectors (N, 384)

        # Compute cosine similarity matrix: (N, N)
        similarity_matrix = np.dot(embeddings, embeddings.T)

        candidate_pairs: List[Tuple[Dict[str, Any], Dict[str, Any], float]] = []
        seen_pairs = set()

        for i in range(len(claims)):
            claim_a = claims[i]
            paper_a = claim_a["paper_id"]
            
            # Find indices of claims from other papers
            other_indices = [
                j for j in range(len(claims))
                if claims[j]["paper_id"] != paper_a and j > i
            ]
            
            if not other_indices:
                continue

            sim_scores = [(j, float(similarity_matrix[i, j])) for j in other_indices]
            # Filter by threshold
            valid_candidates = [s for s in sim_scores if s[1] >= self.threshold]
            # Sort descending by similarity
            valid_candidates.sort(key=lambda x: x[1], reverse=True)
            # Limit top-K
            top_candidates = valid_candidates[:self.max_pairs]

            for j, score in top_candidates:
                claim_b = claims[j]
                pair_key = tuple(sorted([claim_a["id"], claim_b["id"]]))
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    candidate_pairs.append((claim_a, claim_b, round(score, 4)))

        logger.info(
            "Stage 1 NLI Filtering: Selected %d candidate pairs from %d total combinations.",
            len(candidate_pairs),
            (len(claims) * (len(claims) - 1)) // 2
        )
        return candidate_pairs

nli_filter = NLICandidateFilter()
