import pytest
from app.core.pdf_extractor import pdf_extractor

def test_extract_valid_pdf(sample_pdf_path):
    extracted = pdf_extractor.extract(sample_pdf_path)
    
    assert extracted["total_pages"] == 2
    assert "sha256" in extracted
    assert len(extracted["sha256"]) == 64
    assert len(extracted["pages"]) == 2
    
    # Check sections detected
    sections = extracted["sections_detected"]
    assert "Abstract" in sections or "Results" in sections
    
    # Check page content
    page1 = extracted["pages"][0]
    assert page1["page_number"] == 1
    assert "Transformer" in page1["full_text"] or "Attention" in page1["full_text"]

    page2 = extracted["pages"][1]
    assert page2["page_number"] == 2
    assert "89.4%" in page2["full_text"]
