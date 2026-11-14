import re
import logging
from typing import List, Dict, Any
from app.core.spacy_nlp import spacy_nlp

logger = logging.getLogger(__name__)

SCIENTIFIC_FINDING_VERBS = {
    "demonstrate", "demonstrates", "demonstrated", "demonstrating",
    "show", "shows", "showed", "shown", "showing",
    "reveal", "reveals", "revealed", "revealing",
    "indicate", "indicates", "indicated", "indicating",
    "observe", "observes", "observed", "observing",
    "find", "finds", "found", "finding",
    "confirm", "confirms", "confirmed", "confirming",
    "outperform", "outperforms", "outperformed", "outperforming",
    "achieve", "achieves", "achieved", "achieving",
    "establish", "establishes", "established", "establishing",
    "correlate", "correlates", "correlated", "correlating",
    "exhibit", "exhibits", "exhibited", "exhibiting",
    "yield", "yields", "yielded", "yielding",
    "improve", "improves", "improved", "improving",
    "reduce", "reduces", "reduced", "reducing",
    "enhance", "enhances", "enhanced", "enhancing",
    "increase", "increases", "increased", "increasing",
    "decrease", "decreases", "decreased", "decreasing",
    "report", "reports", "reported", "reporting",
    "produce", "produces", "produced", "producing"
}

COMPARATIVE_METRIC_PATTERNS = [
    r"\bstatistically\s+significant\b",
    r"\bp\s*[<>=]\s*0\.\d+\b",
    r"\b\d+(\.\d+)?%\s*(increase|decrease|improvement|accuracy|gain|drop|faster|higher|lower|more|less)\b",
    r"\boutperforms?\s+(the\s+)?(baseline|state-of-the-art|prior|existing)\b",
    r"\bhigher\s+(accuracy|precision|recall|f1|bleu|rouge|quality|effort|satisfaction)\b",
    r"\bconsistent\s+improvement\b",
    r"\bsignificant\s+(difference|effect|impact|advance)\b"
]

NEGATIVE_FILTERS = [
    r"^\s*(?:table|fig(?:ure)?|chart|diagram|appendix)\b",
    r"\b(?:table|fig(?:ure)?)\s+[0-9ivx]+\s+(?:shows|illustrates|presents|summarizes|depicts|lists|outlines|describes)\b",
    r"\b(?:keyword\s+search(?:es)?|google\s+scholar|ieee\s+xplore|acm\s+digital|scopus|we\s+searched|database\s+search)\b",
    r"\b(?:studies|papers|articles)\s+(?:were\s+)?found\s+through\b",
    r"\b(?:this\s+paper\s+is\s+organized|the\s+rest\s+of\s+the\s+paper|section\s+[ivx0-9]+\s+(?:presents|reviews|summarizes|concludes))\b",
    r"\b(?:to\s+answer\s+them,\s+we\s+make|our\s+contributions?\s+(?:are|include))\b",
    r"\b(?:they\s+are\s+examples\s+constructed\s+for\s+this\s+paper)\b",
    r"^\s*RQ\d+:\b"
]

PRIOR_WORK_CITATION_PATTERNS = [
    r"\b\w+\s+et\s+al\.?\b",
    r"\[\d+(?:,\s*\d+)*\]",
    r"\baccording\s+to\b",
    r"\bprevious\s+(studies|work|literature)\b",
    r"\bwas\s+proposed\s+by\b"
]

HIGH_PRIORITY_SECTIONS = {"results", "discussion", "conclusion", "abstract", "findings", "evaluation", "limitations"}

class ClaimExtractor:
    def __init__(self):
        pass

    def extract_claims_from_chunk(self, chunk_id: str, paper_id: str, page_number: int, section_name: str, content: str) -> List[Dict[str, Any]]:
        """
        Extracts scientific claims with exact character offsets, heuristic confidence scores, and provenance.
        Filters out non-claim table references, literature search meta-text, and incomplete fragments.
        """
        claims: List[Dict[str, Any]] = []
        if not content or len(content.strip()) < 30:
            return claims

        sec_lower = section_name.lower()
        if any(k in sec_lower for k in ("references", "acknowledgments", "bibliography")):
            return claims

        # Pre-clean abbreviations and line breaks that mislead sentence boundary detection
        clean_content = re.sub(r"\bFig\.\s*(\d+)", r"Figure \1", content)
        clean_content = re.sub(r"\bTab\.\s*(\d+)", r"Table \1", clean_content)
        clean_content = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", clean_content)
        clean_content = re.sub(r"(\w+)-\s+(\w+)", r"\1\2", clean_content)

        doc = spacy_nlp.parse_doc(clean_content)

        for sent in doc.sents:
            sent_text = sent.text.strip().replace("\n", " ")
            if len(sent_text) < 35 or len(sent_text.split()) < 6:
                continue

            # Negative filters: exclude table captions, search protocols, roadmaps
            if any(re.search(pat, sent_text, re.IGNORECASE) for pat in NEGATIVE_FILTERS):
                continue

            # Exclude incomplete fragments
            if sent_text.endswith("-") or sent_text.endswith(",") or sent_text.endswith(":") or sent_text.endswith(";"):
                continue
            if re.search(r"\b(?:found|shows|and|or|in|with|that|for)$", sent_text, re.I):
                continue

            # Prior work attribution check
            is_prior_work = False
            for pat in PRIOR_WORK_CITATION_PATTERNS:
                if re.search(pat, sent_text, re.IGNORECASE):
                    is_prior_work = True
                    break

            # Analyze verbs and syntactic dependency
            found_verb = ""
            has_subject = False
            has_finding_verb = False

            for token in sent:
                lemma = token.lemma_.lower()
                text_lower = token.text.lower()
                
                if token.dep_ in ("nsubj", "nsubjpass", "csubj"):
                    has_subject = True

                if (lemma in SCIENTIFIC_FINDING_VERBS or text_lower in SCIENTIFIC_FINDING_VERBS) and token.pos_ in ("VERB", "AUX"):
                    has_finding_verb = True
                    found_verb = lemma

            if not (has_subject and has_finding_verb):
                continue

            # Check comparative and metric patterns
            has_metric_signal = False
            for pat in COMPARATIVE_METRIC_PATTERNS:
                if re.search(pat, sent_text, re.IGNORECASE):
                    has_metric_signal = True
                    break

            # Compute Heuristic Confidence Score (transparent linguistic signal)
            base_score = 0.45
            if has_finding_verb:
                base_score += 0.20
            if has_metric_signal:
                base_score += 0.20
            if sec_lower in HIGH_PRIORITY_SECTIONS:
                base_score += 0.15
            if has_subject:
                base_score += 0.05
            if is_prior_work:
                base_score -= 0.15

            confidence = round(max(0.10, min(0.98, base_score)), 3)

            # Categorization
            if has_metric_signal:
                category = "QUANTITATIVE_FINDING"
            elif any(k in sent_text.lower() for k in ("faster", "slower", "better", "higher", "lower", "compared with", "than")):
                category = "COMPARATIVE_FINDING"
            elif any(k in sent_text.lower() for k in ("limitation", "vulnerable", "cost", "overhead", "obstacle", "problem", "frustration")):
                category = "LIMITATION_STATEMENT"
            elif any(k in sent_text.lower() for k in ("framework", "algorithm", "architecture", "method", "protocol", "step")):
                category = "METHODOLOGICAL_STATEMENT"
            else:
                category = "QUALITATIVE_FINDING"

            if confidence >= 0.50:
                claims.append({
                    "paper_id": paper_id,
                    "chunk_id": chunk_id,
                    "page_number": page_number,
                    "verbatim_text": sent_text,
                    "char_start_offset": sent.start_char,
                    "char_end_offset": sent.end_char,
                    "category": category,
                    "confidence_score": confidence,
                    "extracted_verb": found_verb
                })

        return claims

claim_extractor = ClaimExtractor()
