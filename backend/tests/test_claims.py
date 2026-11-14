import pytest
from app.core.claim_extractor import claim_extractor

def test_extract_scientific_claims():
    text = (
        "In our extensive evaluation, we demonstrate that the proposed model outperforms the baseline by 15.4% accuracy. "
        "The experiments revealed statistically significant improvements across all benchmarks. "
        "According to Smith et al., prior methods achieved 70% accuracy."
    )

    claims = claim_extractor.extract_claims_from_chunk(
        chunk_id="test_c1",
        paper_id="test_p1",
        page_number=3,
        section_name="Results",
        content=text
    )

    assert len(claims) >= 1
    
    # Check that our finding was extracted
    finding_claim = [c for c in claims if "outperforms" in c["verbatim_text"] or "revealed" in c["verbatim_text"]]
    assert len(finding_claim) > 0

    first = finding_claim[0]
    assert first["page_number"] == 3
    assert first["chunk_id"] == "test_c1"
    assert first["confidence_score"] >= 0.55
    assert first["extracted_verb"] != ""
    assert first["char_start_offset"] >= 0
    assert first["char_end_offset"] > first["char_start_offset"]
