import re
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.models import Paper, Chunk, Claim, Limitation

logger = logging.getLogger(__name__)

# Linguistic heuristic patterns for scientific document analysis
PROBLEM_PATTERNS = [
    r"\b(?:tackle|address|focuses\s+on|motivated\s+by|the\s+problem\s+of|challenge\s+of|limitation\s+of\s+prior|drawback\s+of)\b",
    r"\b(?:however,\s+existing|despite\s+recent\s+progress|remains\s+an\s+open\s+question|insufficiently\s+explored)\b",
    r"\b(?:objective|aim|purpose|goal)\s+of\s+this\s+(?:study|paper|work|research|investigation)\b",
    r"\b(?:remains?|is)\s+(?:intensely\s+)?debated\b",
    r"\b(?:a\s+persistent\s+)?tension\s+between\b",
    r"\b(?:unclear\s+whether|mixed\s+results|conflicting\s+findings|trade-offs?|evidence\s+is\s+mixed)\b",
    r"\b(?:core\s+challenge|central\s+question|practical\s+dilemma|new\s+question)\b",
    r"\b(?:whether\s+[\w\s]+\s+is\s+worthwhile\s+therefore\s+depends)\b",
    r"\b(?:research\s+questions?:?\s*•?\s*rq\d+)\b"
]

CONTRIBUTION_PATTERNS = [
    r"\b(?:we\s+propose|we\s+introduce|we\s+present|our\s+contributions?\s+are|in\s+this\s+work,\s+we|we\s+demonstrate)\b",
    r"\b(?:we\s+make\s+(?:\w+\s+)?contributions?|our\s+contributions?\s+include)\b",
    r"\b(?:first,\s+we|second,\s+we|finally,\s+we|specifically,\s+we)\b",
    r"\bthis\s+(?:paper|study|work|review|article)\s+(?:investigates|examines|analyzes|synthesizes|evaluates|presents|develops|explores|proposes|reviews)\b",
    r"\b(?:to\s+answer\s+them,\s+we|toward\s+this\s+end,\s+we)\b",
    r"\b(?:decision\s+matrix|framework|guidelines?|recommendations?)\s+(?:is|are)\s+(?:developed|proposed|synthesized)\b",
    r"\b(?:main|primary|core)\s+contribution\s+of\s+this\s+(?:paper|study|work)\b"
]

DATASET_PATTERNS = [
    r"\b(\d+[\d,]*\s+(?:professional\s+)?(?:participants|subjects|developers|programmers|consultants|professionals|students|engineers|users|teams))\b",
    r"\b((?:sample|cohort|experiment)\s+with\s+\d+[\d,]*\s+[\w\s]+)\b",
    r"\b(\d+[\d,]*\s+(?:empirical\s+studies|published\s+studies|peer-reviewed\s+papers|articles|repositories|projects))\b",
    r"\b(ImageNet|GLUE|SuperGLUE|SQuAD|WMT|MNIST|CIFAR|WikiText|BookCorpus|Common\s+Crawl|PubMed|GitHub|Stack\s+Overflow)\b",
    r"\b(?:dataset|benchmark|corpus|corpora|evaluated\s+on|tested\s+on)\s+([A-Z][a-zA-Z0-9_\-]+(?:\s+[A-Z][a-zA-Z0-9_\-]+)?)\b"
]

METRIC_PATTERNS = [
    r"\b\d+(\.\d+)?%\b",
    r"\b\d+(\.\d+)?\s+percent\b",
    r"\b\d+(\.\d+)?\s+percentage\s+points\b",
    r"\b\d+(\.\d+)?x\s+(?:speedup|reduction|increase|faster)\b",
    r"\bp\s*[<>=]\s*0\.\d+\b",
    r"\b\d+[\d,]*\s+(?:more|fewer|less|faster|slower|person-hours)\b",
    r"\b(?:accuracy|f1|precision|recall|bleu|rouge|mrr|auc)\s*(?:=|of|reached|achieved|was)?\s*\d+(\.\d+)?%?\b"
]

METHODOLOGY_KEYWORDS = [
    # Empirical & Software Engineering
    "controlled experiment", "case study", "survey", "systematic literature review",
    "meta-analysis", "quasi-experiment", "qualitative analysis", "framework",
    "decision matrix", "protocol", "empirical study", "evaluation methodology",
    "paired", "solo", "pair programming", "agile", "extreme programming",
    "participants", "subjects", "developers", "programmers", "consultants",
    # Architecture & Model Training
    "algorithm", "architecture", "model", "network", "layer", "transformer",
    "train", "loss", "fine-tuning", "optimization", "hyperparameters", "baseline"
]

class PaperAnalyzer:
    def analyze_paper(self, db: Session, paper_id: str) -> Dict[str, Any]:
        """
        Analyzes an ingested paper across its chunks, claims, and limitations.
        Returns a rich structured scientific intelligence report.
        """
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            return {}

        chunks = db.query(Chunk).filter(Chunk.paper_id == paper_id).order_by(Chunk.chunk_index).all()
        claims = db.query(Claim).filter(Claim.paper_id == paper_id).order_by(Claim.confidence_score.desc()).all()
        limitations = db.query(Limitation).filter(Limitation.paper_id == paper_id).all()

        # 1. Abstract
        abstract_chunks = [c for c in chunks if c.section_name and c.section_name.lower() == "abstract"]
        is_reliable = True
        
        if paper.abstract and not paper.abstract.startswith("The abstract was not explicitly or reliably identified"):
            abstract_text = paper.abstract
            abstract_page = abstract_chunks[0].page_number if abstract_chunks else 1
            abstract_source = {"section": "Abstract", "page_number": abstract_page}
        elif abstract_chunks:
            abstract_text = " ".join(c.content for c in abstract_chunks).strip()
            abstract_page = abstract_chunks[0].page_number
            abstract_source = {"section": "Abstract", "page_number": abstract_page}
        else:
            abstract_text = "The abstract was not explicitly or reliably identified in the document structure."
            abstract_source = None
            is_reliable = False

        # 2. Research Problem & Objectives
        problems = []
        for c in chunks:
            if c.section_name.lower() in ("introduction", "background", "motivation", "general", "abstract"):
                sentences = re.split(r"(?<=[.!?])\s+|\n(?=[•\-\*]\s*RQ|\(?\w\)\s*)", c.content)
                for s in sentences:
                    s_clean = s.strip().replace("\n", " ")
                    if s_clean.endswith(",") or s_clean.endswith(":") or s_clean.endswith(";"):
                        continue
                    if len(s_clean) > 35 and any(re.search(p, s_clean, re.IGNORECASE) for p in PROBLEM_PATTERNS):
                        if not any(p["statement"] == s_clean or p["statement"].startswith(s_clean) for p in problems):
                            problems.append({
                                "statement": s_clean,
                                "section": c.section_name,
                                "page_number": c.page_number,
                                "chunk_id": c.id
                            })
                            if len(problems) >= 4:
                                break
            if len(problems) >= 4:
                break

        # 3. Main Contributions
        contributions = []
        for c in chunks:
            if c.section_name.lower() in ("introduction", "abstract", "general", "conclusion", "methodology"):
                sentences = re.split(r"(?<=[.!?])\s+|\n(?=[•\-\*]\s*RQ|\(?\w\)\s*)", c.content)
                for s in sentences:
                    s_clean = s.strip().replace("\n", " ")
                    if s_clean.endswith(",") or s_clean.endswith(":") or s_clean.endswith(";"):
                        continue
                    if len(s_clean) > 35 and any(re.search(p, s_clean, re.IGNORECASE) for p in CONTRIBUTION_PATTERNS):
                        if not any(ct["statement"] == s_clean or ct["statement"].startswith(s_clean) for ct in contributions):
                            contributions.append({
                                "statement": s_clean,
                                "section": c.section_name,
                                "page_number": c.page_number,
                                "chunk_id": c.id
                            })
                            if len(contributions) >= 4:
                                break
            if len(contributions) >= 4:
                break

        # 4. Methodology Overview & Algorithms
        methodology_items = []
        datasets_found = []
        for c in chunks:
            s_name = c.section_name.lower()
            if any(k in s_name for k in ("method", "model", "architecture", "approach", "framework", "system", "design", "review")):
                sentences = re.split(r"(?<=[.!?])\s+", c.content)
                for s in sentences:
                    s_clean = s.strip().replace("\n", " ")
                    if 40 < len(s_clean) < 300 and any(k in s_clean.lower() for k in METHODOLOGY_KEYWORDS):
                        methodology_items.append({
                            "description": s_clean,
                            "section": c.section_name,
                            "page_number": c.page_number,
                            "chunk_id": c.id
                        })
                        if len(methodology_items) >= 5:
                            break
            if len(methodology_items) >= 5:
                break

        # Check datasets & participant populations across document
        seen_datasets = set()
        for c in chunks:
            sentences = re.split(r"(?<=[.!?])\s+", c.content)
            for s in sentences:
                s_clean = s.strip().replace("\n", " ")
                for pat in DATASET_PATTERNS:
                    m = re.search(pat, s_clean, re.IGNORECASE)
                    if m:
                        matched_str = m.group(1) if m.groups() else m.group(0)
                        if matched_str.lower() not in seen_datasets and len(s_clean) > 30:
                            seen_datasets.add(matched_str.lower())
                            datasets_found.append({
                                "dataset_info": s_clean,
                                "section": c.section_name,
                                "page_number": c.page_number
                            })
                            break
                if len(datasets_found) >= 5:
                    break
            if len(datasets_found) >= 5:
                break

        # 5. Reported Quantitative Results & Metrics
        numerical_results = []
        seen_findings = set()
        for c in chunks:
            s_name = c.section_name.lower()
            if any(k in s_name for k in ("results", "experiments", "evaluation", "findings", "literature", "review", "related work", "limitations", "discussion", "methodology", "background", "abstract")):
                sentences = re.split(r"(?<=[.!?])\s+", c.content)
                for s in sentences:
                    s_clean = s.strip().replace("\n", " ")
                    if re.match(r"^\s*(?:\||table\s+[0-9ivx]|fig(?:ure)?\s+[0-9ivx]|scenario\s+[0-9ivx])", s_clean, re.I):
                        continue
                    if len(s_clean) > 40 and any(re.search(p, s_clean, re.IGNORECASE) for p in METRIC_PATTERNS):
                        if s_clean.startswith("[") or "IEEE" in s_clean or "ACM" in s_clean:
                            continue
                        sig = s_clean[:55]
                        if sig not in seen_findings:
                            seen_findings.add(sig)
                            is_quoted = bool(re.search(r"(?:\b(?:et\s+al\.?|according\s+to|reported\s+by|surveyed|reviewed|meta-analysis\b)|\[\d+\])", s_clean, re.I))
                            
                            category = "Quantitative Finding"
                            if "accuracy" in s_clean.lower() or "correct" in s_clean.lower():
                                category = "Solution Quality & Correctness"
                            elif "time" in s_clean.lower() or "duration" in s_clean.lower() or "speedup" in s_clean.lower() or "faster" in s_clean.lower():
                                category = "Time & Speedup"
                            elif "effort" in s_clean.lower() or "cost" in s_clean.lower() or "overhead" in s_clean.lower():
                                category = "Development Effort & Cost"
                            elif "defect" in s_clean.lower() or "error" in s_clean.lower() or "vulnerab" in s_clean.lower():
                                category = "Defect Density & Reliability"

                            numerical_results.append({
                                "finding": s_clean,
                                "section": c.section_name,
                                "page_number": c.page_number,
                                "chunk_id": c.id,
                                "is_own_finding": not is_quoted,
                                "metric_category": category
                            })
                            if len(numerical_results) >= 8:
                                break
            if len(numerical_results) >= 8:
                break

        # 6. Conclusion (with table filtering & multi-chunk synthesis)
        conclusion_chunks = [c for c in chunks if any(k in c.section_name.lower() for k in ("conclusion", "summary", "concluding"))]
        conclusion_text = "Not explicitly identified in the document structure."
        conclusion_page = None

        if conclusion_chunks:
            candidate_lines = []
            for c in conclusion_chunks:
                for line in c.content.split("\n"):
                    line_clean = line.strip()
                    if not line_clean:
                        continue
                    if re.match(r"^\s*(?:\||table\s+[0-9ivx]|fig(?:ure)?\s+[0-9ivx]|scenario\s+[0-9ivx]|aspect\s+human)", line_clean, re.I):
                        continue
                    if re.match(r"^\s*(?:references?|acknowledgments?)\b", line_clean, re.I):
                        break
                    line_clean = re.sub(r"^[IVX0-9]+\.\s*(?:CONCLUSION|SUMMARY)\s*", "", line_clean, flags=re.I)
                    if len(line_clean) > 40:
                        candidate_lines.append(line_clean)
                        if conclusion_page is None:
                            conclusion_page = c.page_number
            if candidate_lines:
                conclusion_text = " ".join(candidate_lines)
        if conclusion_text == "Not explicitly identified in the document structure.":
            # Check discussion if conclusion not separately titled
            disc_chunks = [c for c in chunks if "discussion" in c.section_name.lower()]
            if disc_chunks:
                conclusion_text = disc_chunks[-1].content.strip()
                conclusion_page = disc_chunks[-1].page_number

        # 7. Author Stated Limitations (Tier 1)
        author_limitations = []
        for lim in limitations:
            author_limitations.append({
                "id": lim.id,
                "text": lim.limitation_text,
                "section": lim.section_found,
                "page_number": lim.page_number,
                "tier": lim.tier or "EXPLICIT_AUTHOR_STATED"
            })

        # 8. AI-Inferred Limitations (Tier 2)
        inferred_limitations = []
        # Check datasets scope
        if len(datasets_found) == 1:
            inferred_limitations.append({
                "title": "Single Benchmark Generalization Risk",
                "description": f"The experiments are primarily validated on a single benchmark or dataset ({datasets_found[0]['section']}), which may limit cross-domain generalization.",
                "evidence": datasets_found[0]["dataset_info"],
                "page_number": datasets_found[0]["page_number"],
                "tier": "AI_INFERRED",
                "significance": "Findings may require independent verification on broader or out-of-domain benchmarks."
            })
        elif len(datasets_found) == 0:
            inferred_limitations.append({
                "title": "Dataset Documentation Scope",
                "description": "Standard benchmark names were not prominently detected in extracted section headers.",
                "evidence": "No explicit dataset names matching common standard corpora found in main methodology headers.",
                "page_number": 1,
                "tier": "AI_INFERRED",
                "significance": "Experimental reproducibility may depend on proprietary or unindexed data."
            })

        # Check methodology hardware or language constraints
        for lim in limitations:
            lt = lim.limitation_text.lower()
            if "cuda" in lt or "gpu" in lt or "hardware" in lt:
                inferred_limitations.append({
                    "title": "Hardware Acceleration Dependency",
                    "description": "The proposed approach acknowledges specialized hardware or custom kernel dependencies.",
                    "evidence": lim.limitation_text,
                    "page_number": lim.page_number,
                    "tier": "AI_INFERRED",
                    "significance": "Deployment on resource-constrained or edge CPU environments may be restricted."
                })
            if "english" in lt or "multilingual" in lt or "language" in lt:
                inferred_limitations.append({
                    "title": "Linguistic & Multilingual Coverage",
                    "description": "Validation appears restricted to specific language corpora without multilingual evaluation.",
                    "evidence": lim.limitation_text,
                    "page_number": lim.page_number,
                    "tier": "AI_INFERRED",
                    "significance": "Generalization to low-resource or typologically diverse languages remains an open question."
                })

        # 9. Potential Research Gaps
        potential_gaps = []
        if author_limitations:
            for al in author_limitations[:2]:
                potential_gaps.append({
                    "title": f"Extension of Reported Constraint in §{al['section']}",
                    "description": f"Author states: \"{al['text'][:140]}...\". Further research can investigate resolving this specific limitation.",
                    "page_number": al["page_number"],
                    "suggested_question": f"How can subsequent architectures overcome the {al['section'].lower()} limitations identified in this work?"
                })
        else:
            potential_gaps.append({
                "title": "Comparative Cross-Architecture Evaluation",
                "description": "Evaluating performance across diverse sequence lengths, alternative attention patterns, and varied hardware topologies.",
                "page_number": 1,
                "suggested_question": "Does this approach maintain computational scaling advantages under varied distributed training paradigms?"
            })

        affiliations = []
        try:
            affiliations = json.loads(paper.affiliations or "[]")
        except Exception:
            affiliations = []

        emails = []
        try:
            emails = json.loads(paper.emails or "[]")
        except Exception:
            emails = []

        return {
            "paper_id": paper.id,
            "title": paper.title,
            "authors": paper.authors or "Not identified",
            "affiliations": affiliations,
            "emails": emails,
            "year": paper.year,
            "filename": paper.filename,
            "total_pages": paper.total_pages,
            "processing_status": paper.processing_status,
            "has_ocr_applied": paper.has_ocr_applied,
            "is_test_document": paper.is_test_document,
            "unextractable_pages": json.loads(paper.unextractable_pages or "[]"),
            "sections_detected": sorted(list(set(c.section_name for c in chunks if c.section_name))),
            "abstract": {
                "text": abstract_text,
                "source": abstract_source,
                "is_reliable": is_reliable
            },
            "research_problems": problems,
            "contributions": contributions,
            "methodology_overview": methodology_items,
            "datasets": datasets_found,
            "numerical_results": numerical_results,
            "conclusion": {
                "text": conclusion_text,
                "page_number": conclusion_page
            },
            "claims": [
                {
                    "id": c.id,
                    "verbatim_text": c.verbatim_text,
                    "normalized_claim": c.normalized_claim or c.verbatim_text,
                    "category": c.category,
                    "page_number": c.page_number,
                    "confidence_score": c.confidence_score,
                    "extracted_verb": c.extracted_verb,
                    "extraction_method": c.extraction_method or "spaCy Dependency & Epistemic Parsing",
                    "is_candidate": c.is_candidate
                }
                for c in claims
            ],
            "limitations_and_gaps": {
                "author_stated_limitations": author_limitations,
                "ai_inferred_limitations": inferred_limitations,
                "potential_research_gaps": potential_gaps
            },
            "evidence_passages": [
                {
                    "chunk_id": c.id,
                    "page_number": c.page_number,
                    "section_name": c.section_name,
                    "content": c.content,
                    "token_count": c.token_count,
                    "chunk_index": c.chunk_index
                }
                for c in chunks
            ]
        }

paper_analyzer = PaperAnalyzer()
