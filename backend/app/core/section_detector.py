import re
from typing import Optional

# Comprehensive academic section patterns supporting Roman numerals (I, II...),
# Arabic numerals (1, 1.1...), letter Appendix headings (A., B., C...), inline headers,
# and standard ACL/IEEE/Springer/ACM conference layouts.
SECTION_PATTERNS = {
    "Abstract": [
        r"^\s*abstract[\s\:\.\-\—\–]*$",
        r"^\s*abstract[\s\:\.\-\—\–]+",
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*abstract\b"
    ],
    "Index Terms": [
        r"^\s*(?:index\s+terms|keywords)[\s\:\.\-\—\–]*",
    ],
    "Introduction": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*introduction\b",
        r"^\s*introduction\s*$",
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*background\s+and\s+motivation\b"
    ],
    "Related Work": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*(?:related\s+work|literature\s+review|prior\s+work|background)\b",
        r"^\s*(?:related\s+work|literature\s+review|prior\s+work)\s*$"
    ],
    "Methodology": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*(?:(?:proposed\s+)?(?:method(?:s|ology)?|framework|approach|architecture|models?)|system\s+design|implementation|review\s+methodology|experimental\s+set(?:up|ting)|evaluation\s+set(?:up|ting)|datasets?\s+and\s+(?:models?|baselines?|methods?))\b",
        r"^\s*(?:(?:proposed\s+)?(?:methods?|methodology|framework|architecture)|system\s+design|experimental\s+set(?:up|ting)|model\s+architecture)\s*$"
    ],
    "Results": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*(?:results?(?:\s+and\s+discussion)?|evaluation|experiments?(?:\s+and\s+results?)?|experimental\s+results?|empirical\s+findings?|analysis|ablation\s+stud(?:y|ies)|findings?)\b",
        r"^\s*(?:results?(?:\s+and\s+discussion)?|experiments?|experimental\s+results?|ablation\s+stud(?:y|ies)|evaluation|findings?)\s*$"
    ],
    "Discussion": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*(?:discussion(?:\s+and\s+recommendations?)?|qualitative\s+analysis)\b",
        r"^\s*(?:discussion(?:\s+and\s+recommendations?)?)\s*$"
    ],
    "Limitations": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?|[A-Z]\.)\s*(?:limitations?(?:\s+and\s+(?:challenges|future\s+work))?|threats\s+to\s+validity|summary\s+of\s+limitations?|ethical\s+considerations)\b",
        r"^\s*(?:limitations?(?:\s+and\s+(?:challenges|future\s+work))?|threats\s+to\s+validity)\s*$"
    ],
    "Conclusion": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*(?:conclusions?(?:\s+and\s+future\s+work)?|concluding\s+remarks|future\s+directions?)\b",
        r"^\s*(?:conclusions?(?:\s+and\s+future\s+work)?|concluding\s+remarks)\s*$"
    ],
    "References": [
        r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*(?:references|bibliography)\b",
        r"^\s*(?:references|bibliography)\s*$"
    ],
    "Appendix": [
        r"^\s*(?:appendix(?:\s+[A-Z])?\b|A\.\d*\s+|B\.\d*\s+|C\.\d*\s+|D\.\d*\s+|[A-D]\s+(?:analysis|hyperparameters?|datasets?|results?|detailed\s+experimental|additional\s+ablation|code\s+availability))",
    ]
}

# Table column names / tokens that must never be mistaken for section headers
TABLE_HEADER_TOKENS = {
    "model", "models", "dataset", "datasets", "system", "task", "tasks",
    "metric", "metrics", "baseline", "average", "accuracy", "micro-f1", "macro-f1"
}

def detect_section_header(line: str, has_abstract_started: bool = True) -> Optional[str]:
    """
    Checks if a given line (or 2-line combined header like '1 Introduction') resembles
    a major academic section header.
    """
    clean = re.sub(r"\s+", " ", line.strip()).lower()
    if len(clean) > 95 or len(clean) < 3:
        return None

    # Discard single-word table column labels like bare 'Model' or 'Dataset'
    if clean.rstrip(".:") in TABLE_HEADER_TOKENS:
        return None

    # Discard table column headers or figure captions that happen to contain section words
    if re.match(r"^\s*(?:table|fig|figure|tab\.)\b", clean, re.I):
        return None
    if re.search(r"\b(evidence|ref\.|p-value|std\s+dev|hyper-|# train|# dev|# test|# bert)\b", clean, re.I):
        return None

    # 1. Inline Abstract or Keywords checks
    if re.match(r"^\s*abstract[\s\:\.\-\—\–]+", clean) or clean == "abstract":
        return "Abstract"
    if re.match(r"^\s*(?:index\s+terms|keywords)[\s\:\.\-\—\–]+", clean):
        return "Index Terms"

    # 2. Check canonical section patterns
    for section_name, patterns in SECTION_PATTERNS.items():
        # Guard: avoid false transitions inside frontmatter before Abstract/Introduction
        if not has_abstract_started and section_name not in ("Abstract", "Introduction"):
            continue

        for pat in patterns:
            if re.search(pat, clean, re.IGNORECASE):
                return section_name

    return None
