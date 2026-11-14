import re
import logging
from typing import List, Dict, Any, Tuple
import numpy as np
import scipy.special

from app.core.model_manager import model_manager

logger = logging.getLogger(__name__)

class NLIEngine:
    def __init__(self):
        pass

    def predict_pairs(
        self,
        candidate_pairs: List[Tuple[Dict[str, Any], Dict[str, Any], float]]
    ) -> List[Dict[str, Any]]:
        """
        Stage 2: Runs Cross-Encoder NLI inference on filtered candidate pairs.
        candidate_pairs: [(claim_a, claim_b, similarity_score), ...]
        Returns calibrated predictions with probabilities and epistemic notes.
        """
        if not candidate_pairs:
            return []

        model = model_manager.get_nli_model()

        # Build sentence pairs for CrossEncoder: (Premise, Hypothesis)
        sentence_pairs = [
            (pair[0]["verbatim_text"], pair[1]["verbatim_text"])
            for pair in candidate_pairs
        ]

        logger.info("Stage 2 NLI Inference: Evaluating %d pairs with CrossEncoder...", len(sentence_pairs))
        
        # Predict logits
        raw_scores = model.predict(sentence_pairs, show_progress_bar=False)
        # Apply softmax if raw logits are returned
        if len(raw_scores.shape) == 2 and raw_scores.shape[1] == 3:
            probabilities = scipy.special.softmax(raw_scores, axis=1)
        else:
            probabilities = raw_scores

        # Determine label mapping from model config
        # Standard DeBERTa NLI mapping is usually: {0: 'contradiction', 1: 'entailment', 2: 'neutral'}
        id2label = getattr(model.model.config, "id2label", None)
        if id2label:
            norm_id2label = {i: id2label[i].upper() for i in range(len(id2label))}
        else:
            norm_id2label = {0: "CONTRADICTION", 1: "ENTAILMENT", 2: "NEUTRAL"}

        results: List[Dict[str, Any]] = []

        for idx, (claim_a, claim_b, sim_score) in enumerate(candidate_pairs):
            probs = probabilities[idx]
            
            # Map index to class
            prob_dict = {}
            for class_idx, class_name in norm_id2label.items():
                prob_dict[class_name] = float(probs[class_idx])

            entailment_p = prob_dict.get("ENTAILMENT", 0.0)
            contradiction_p = prob_dict.get("CONTRADICTION", 0.0)
            neutral_p = prob_dict.get("NEUTRAL", 0.0)

            # Assign dominant label with confidence threshold
            if contradiction_p >= 0.50 and contradiction_p > entailment_p:
                label = "CONTRADICTION"
            elif entailment_p >= 0.50 and entailment_p > contradiction_p:
                label = "ENTAILMENT"
            else:
                label = "NEUTRAL"

            # Formulate nuanced scientific context note
            has_metric_a = bool(re.search(r"\b\d+(\.\d+)?%\b", claim_a["verbatim_text"]))
            has_metric_b = bool(re.search(r"\b\d+(\.\d+)?%\b", claim_b["verbatim_text"]))
            has_metric_divergence = has_metric_a and has_metric_b

            note = ""
            if label == "CONTRADICTION":
                if has_metric_divergence:
                    relationship = "INCOMPARABLE_EXPERIMENTAL_OUTCOMES"
                    note = (
                        f"Divergent numerical findings reported between '{claim_a.get('paper_title', 'Paper A')}' (p. {claim_a['page_number']}) "
                        f"and '{claim_b.get('paper_title', 'Paper B')}' (p. {claim_b['page_number']}). "
                        f"Scientific Context: Distinct quantitative results across independent studies frequently reflect differences in datasets, baseline implementations, or sample sizes rather than direct empirical refutation."
                    )
                else:
                    # Check if comparable domain/subject is shared
                    shared_keywords = {"pair programming", "agile", "copilot", "student", "consultant", "defect", "effort", "transformer", "attention", "resnet"}
                    a_lower = claim_a["verbatim_text"].lower()
                    b_lower = claim_b["verbatim_text"].lower()
                    if any(k in a_lower and k in b_lower for k in shared_keywords):
                        relationship = "POTENTIAL_SCIENTIFIC_CONTRADICTION"
                    else:
                        relationship = "DIRECT_TEXTUAL_CONTRADICTION"
                    note = (
                        f"Direct inferential tension detected between '{claim_a.get('paper_title', 'Paper A')}' (p. {claim_a['page_number']}) "
                        f"and '{claim_b.get('paper_title', 'Paper B')}' (p. {claim_b['page_number']}). "
                        f"Automated NLI detects directional opposition in claim phrasing; inspect experimental conditions for comparability."
                    )
            elif label == "ENTAILMENT":
                relationship = "SUPPORTING_FINDINGS"
                note = f"Mutually corroborating scientific findings between '{claim_a.get('paper_title', 'Paper A')}' and '{claim_b.get('paper_title', 'Paper B')}'."
            else:
                relationship = "NEUTRAL_OR_INSUFFICIENT_EVIDENCE"
                note = "Thematically related scientific findings; context provides compatible or orthogonal evidence without direct entailment."

            results.append({
                "claim_a_id": claim_a["id"],
                "claim_a_text": claim_a["verbatim_text"],
                "claim_a_paper_title": claim_a.get("paper_title", ""),
                "claim_a_page": claim_a["page_number"],
                "claim_b_id": claim_b["id"],
                "claim_b_text": claim_b["verbatim_text"],
                "claim_b_paper_title": claim_b.get("paper_title", ""),
                "claim_b_page": claim_b["page_number"],
                "semantic_similarity": sim_score,
                "nli_label": label,
                "scientific_relationship": relationship,
                "entailment_score": round(entailment_p, 4),
                "contradiction_score": round(contradiction_p, 4),
                "neutral_score": round(neutral_p, 4),
                "context_comparison_note": note
            })

        logger.info("Stage 2 NLI Inference Complete. Generated %d pair assessments.", len(results))
        return results

nli_engine = NLIEngine()
