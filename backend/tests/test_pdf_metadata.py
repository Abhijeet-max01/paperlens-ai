import os
import fitz
import pytest
from pathlib import Path
from app.core.pdf_extractor import pdf_extractor
from app.core.metadata_extractor import metadata_extractor, AcademicMetadataExtractor
from app.core.section_detector import detect_section_header
from app.core.chunker import chunker
from app.db.session import SessionLocal
from app.core.paper_analyzer import paper_analyzer
from app.db.models import Paper

TARGET_PDF_PATH = Path("backend/data/uploads/6af6bd32-28a4-45c5-9677-18a3390cb2d1_pairProgrammingAgileTermPaper.pdf")

def test_pair_programming_pdf_metadata_and_sections():
    """
    Regression test on actual research paper:
    'Pair Programming in Agile: Benefits and Limitations'
    Verifies author extraction, clean isolated abstract, affiliations, and section detection.
    """
    if not TARGET_PDF_PATH.exists():
        pytest.skip(f"Target test PDF not present at {TARGET_PDF_PATH}")

    extracted = pdf_extractor.extract(str(TARGET_PDF_PATH))

    # 1. Title verification
    assert "Pair Programming in Agile: Benefits and Limitations" in extracted["title"]

    # 2. Author verification
    assert extracted["authors"] == "Abhijeet Sirohi"

    # 3. Affiliation verification
    affiliations_text = " ".join(extracted["affiliations"])
    assert "Lovely Professional University" in affiliations_text
    assert "Department of Computer Science" in affiliations_text

    # 4. Email verification
    assert "aabhijeetsirohi@gmail.com" in extracted["emails"]

    # 5. Abstract isolation verification
    abstract = extracted["abstract"]
    assert extracted["abstract_is_reliable"] is True
    assert abstract.startswith("Pair programming")
    
    # Must NOT contain frontmatter noise
    assert "Abhijeet Sirohi" not in abstract
    assert "Lovely Professional University" not in abstract
    assert "aabhijeetsirohi@gmail.com" not in abstract
    assert "Index Terms" not in abstract
    assert "I. INTRODUCTION" not in abstract
    assert "1. INTRODUCTION" not in abstract

    # 6. Section detection (Roman numerals, Index terms, etc.)
    sections = extracted["sections_detected"]
    expected_sections = [
        "Abstract",
        "Index Terms",
        "Introduction",
        "Related Work",
        "Methodology",
        "Results",
        "Limitations",
        "Conclusion",
        "References"
    ]
    for exp in expected_sections:
        assert exp in sections, f"Expected section '{exp}' was not detected in {sections}"

    # 7. Page structure & block provenance
    assert extracted["total_pages"] == 7
    for p in extracted["pages"]:
        assert 1 <= p["page_number"] <= 7
        assert len(p["blocks"]) > 0
        for b in p["blocks"]:
            assert "section" in b
            assert "bbox" in b
            assert len(b["bbox"]) == 4


def test_missing_abstract_does_not_assume_first_paragraph(tmp_path):
    """
    Verifies requirement:
    - Do NOT assume the first paragraph is the abstract.
    - If abstract cannot be confidently identified, explicitly report:
      'The abstract was not explicitly or reliably identified in the document structure.'
    """
    doc = fitz.open()
    page = doc.new_page()
    page.insert_textbox(
        fitz.Rect(50, 50, 550, 750),
        "A Novel Approach to Distributed Systems\n\n"
        "Alice Smith and Bob Jones\n"
        "MIT Computer Science Laboratory\n\n"
        "1. Introduction\n"
        "Distributed consensus is fundamental to fault-tolerant computation. "
        "In this report, we evaluate raft vs paxos under high churn rates.\n\n"
        "2. Methods\n"
        "We deployed 50 nodes across 3 geographic zones.",
        fontsize=11
    )
    test_pdf = tmp_path / "paper_without_abstract.pdf"
    doc.save(str(test_pdf))
    doc.close()

    extracted = pdf_extractor.extract(str(test_pdf))

    assert extracted["abstract_is_reliable"] is False
    assert extracted["abstract"] == "The abstract was not explicitly or reliably identified in the document structure."
    assert "Introduction" in extracted["sections_detected"]


def test_roman_numeral_section_header_detection():
    """
    Verifies that standard IEEE / ACM Roman numeral headers are correctly classified.
    """
    assert detect_section_header("I. INTRODUCTION") == "Introduction"
    assert detect_section_header("II. LITERATURE REVIEW") == "Related Work"
    assert detect_section_header("III. PROPOSED METHODOLOGY") == "Methodology"
    assert detect_section_header("IV. EXPERIMENTAL RESULTS") == "Results"
    assert detect_section_header("V. LIMITATIONS AND THREATS TO VALIDITY") == "Limitations"
    assert detect_section_header("VI. CONCLUSION") == "Conclusion"
    assert detect_section_header("VII. REFERENCES") == "References"


def test_chunker_prevents_cross_section_contamination():
    """
    Verifies that SectionAwareChunker flushes on section change and does not leak
    words across section boundaries.
    """
    pages = [
        {
            "page_number": 1,
            "blocks": [
                {"text": "Paper Title: Deep Learning for Code. Author: Jane Doe.", "section": "Frontmatter", "bbox": (0, 0, 100, 100)},
                {"text": "This paper presents an evaluation of transformer architectures for neural code search.", "section": "Abstract", "bbox": (0, 100, 100, 200)},
                {"text": "Software engineering requires reliable semantic code retrieval systems.", "section": "Introduction", "bbox": (0, 200, 100, 300)}
            ]
        }
    ]

    chunks = chunker.chunk_paper(pages)
    assert len(chunks) == 3

    assert chunks[0]["section_name"] == "Frontmatter"
    assert "Jane Doe" in chunks[0]["content"]
    assert "Abstract" not in chunks[0]["content"]

    assert chunks[1]["section_name"] == "Abstract"
    assert "This paper presents an evaluation" in chunks[1]["content"]
    assert "Jane Doe" not in chunks[1]["content"]
    assert "Software engineering" not in chunks[1]["content"]

    assert chunks[2]["section_name"] == "Introduction"
    assert "Software engineering requires" in chunks[2]["content"]
    assert "Jane Doe" not in chunks[2]["content"]


def test_analyzer_returns_structured_metadata_and_reliable_abstract():
    """
    Verifies that paper_analyzer returns author, affiliations, emails,
    and accurate abstract reliability status.
    """
    db = SessionLocal()
    try:
        paper_id = "6af6bd32-28a4-45c5-9677-18a3390cb2d1"
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            pytest.skip("Target paper record not in database")

        analysis = paper_analyzer.analyze_paper(db, paper_id)
        assert analysis["authors"] == "Abhijeet Sirohi"
        assert len(analysis["affiliations"]) >= 1
        assert len(analysis["emails"]) >= 1
        assert analysis["abstract"]["is_reliable"] is True
        assert len(analysis["abstract"]["text"]) > 100
        assert "Abhijeet Sirohi" not in analysis["abstract"]["text"]
    finally:
        db.close()
