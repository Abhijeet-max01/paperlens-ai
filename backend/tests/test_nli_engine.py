import pytest
from app.core.nli_filter import nli_filter

def test_nli_candidate_filtering():
    claims = [
        {
            "id": "c1",
            "paper_id": "paper_A",
            "verbatim_text": "Transformer self-attention exhibits quadratic complexity O(N^2) with sequence length.",
            "paper_title": "Paper A",
            "page_number": 2
        },
        {
            "id": "c2",
            "paper_id": "paper_B",
            "verbatim_text": "Self-attention operations require quadratic time and memory as token count grows.",
            "paper_title": "Paper B",
            "page_number": 4
        },
        {
            "id": "c3",
            "paper_id": "paper_B",
            "verbatim_text": "We used Python 3.10 and PyTorch on 8 A100 GPUs for all training runs.",
            "paper_title": "Paper B",
            "page_number": 7
        }
    ]

    # Filter candidate pairs
    pairs = nli_filter.filter_candidate_pairs(claims)
    
    # c1 and c2 are highly semantically similar across distinct papers
    matching_pairs = [p for p in pairs if (p[0]["id"] == "c1" and p[1]["id"] == "c2") or (p[0]["id"] == "c2" and p[1]["id"] == "c1")]
    assert len(matching_pairs) == 1
    assert matching_pairs[0][2] >= 0.50 # High cosine similarity
