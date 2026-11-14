import pytest
from app.core.chunker import SectionAwareChunker

def test_section_aware_chunker():
    chunker = SectionAwareChunker(target_chunk_size=50, chunk_overlap=10)

    pages = [
        {
            "page_number": 1,
            "blocks": [
                {
                    "text": "This is a detailed paragraph discussing deep learning. " * 10,
                    "section": "Abstract",
                    "bbox": (0, 0, 100, 100)
                }
            ]
        },
        {
            "page_number": 2,
            "blocks": [
                {
                    "text": "In this section we present the experimental evaluation and benchmarks. " * 8,
                    "section": "Results",
                    "bbox": (0, 0, 100, 100)
                }
            ]
        }
    ]

    chunks = chunker.chunk_paper(pages)
    assert len(chunks) >= 2

    # Check page 1 chunk
    c1 = chunks[0]
    assert c1["page_number"] == 1
    assert c1["section_name"] == "Abstract"
    assert c1["token_count"] > 0
    assert c1["chunk_index"] == 0

    # Check page 2 chunk
    c2 = chunks[-1]
    assert c2["page_number"] == 2
    assert c2["section_name"] == "Results"
