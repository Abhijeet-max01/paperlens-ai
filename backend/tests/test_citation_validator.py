import uuid
import pytest
from app.db.models import Paper, Chunk
from app.core.citation_engine import citation_engine

def test_citation_validation(db_session):
    paper_id = str(uuid.uuid4())
    # Setup test paper & chunk
    paper = Paper(
        id=paper_id,
        sha256_hash=f"dummy_hash_citation_test_{paper_id}",
        title="Test Citation Paper",
        filename="test.pdf",
        file_path="/dummy/test.pdf",
        total_pages=5,
        is_test_document=True
    )
    db_session.add(paper)

    chunk = Chunk(
        id=str(uuid.uuid4()),
        paper_id=paper.id,
        page_number=3,
        section_name="Results",
        content="The deep model achieved 94.2% test accuracy on the ImageNet benchmark.",
        chunk_index=0
    )
    db_session.add(chunk)
    db_session.commit()

    try:
        # Valid citation
        is_valid, msg = citation_engine.validate_citation(
            db=db_session,
            paper_id=paper.id,
            page_number=3,
            chunk_id=chunk.id,
            quoted_snippet="achieved 94.2% test accuracy on ImageNet"
        )
        assert is_valid is True

        # Invalid citation: wrong page number
        is_valid, msg = citation_engine.validate_citation(
            db=db_session,
            paper_id=paper.id,
            page_number=99, # Fake page
            chunk_id=chunk.id,
            quoted_snippet="achieved 94.2% test accuracy"
        )
        assert is_valid is False
        assert "mismatch" in msg.lower()

        # Invalid citation: non-existent paper
        is_valid, msg = citation_engine.validate_citation(
            db=db_session,
            paper_id="non_existent_paper_id",
            page_number=3,
            chunk_id=chunk.id,
            quoted_snippet="achieved 94.2% test accuracy"
        )
        assert is_valid is False

        # Invalid citation: fabricated text snippet
        is_valid, msg = citation_engine.validate_citation(
            db=db_session,
            paper_id=paper.id,
            page_number=3,
            chunk_id=chunk.id,
            quoted_snippet="Quantum computing teleportation was verified experimentally."
        )
        assert is_valid is False
    finally:
        db_session.delete(paper)
        db_session.commit()
