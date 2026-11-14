import os
import uuid
import pytest
import fitz

from app.db.session import SessionLocal
from app.api.system import get_system_health, get_system_stats
from app.api.papers import (
    run_paper_ingestion_task,
    list_papers,
    get_paper_analysis,
    get_paper_processing_transparency,
    delete_paper
)
from app.api.search import semantic_search
from app.schemas.search import SearchRequest
from app.api.claims import list_claims
from app.api.qa import ask_cross_paper_question
from app.schemas.qa import QARequest
from app.api.gaps import get_research_gaps
from app.db.models import Paper, BackgroundTask

def test_full_api_workflow(sample_pdf_path):
    db = SessionLocal()
    try:
        # 1. Health Check
        health = get_system_health()
        assert health["status"] == "healthy"
        assert "cpu" in health["device"].lower() or "cuda" in health["device"].lower()

        # 2. Ingest valid academic paper
        paper_id = str(uuid.uuid4())
        task_id = str(uuid.uuid4())
        paper = Paper(
            id=paper_id,
            sha256_hash="workflow_hash_" + paper_id,
            title="Attention and Efficiency in Long Sequences",
            filename="sample_academic_paper.pdf",
            file_path=sample_pdf_path,
            is_test_document=True
        )
        task = BackgroundTask(
            id=task_id,
            paper_id=paper_id,
            task_type="INGESTION"
        )
        db.add(paper)
        db.add(task)
        db.commit()

        run_paper_ingestion_task(task_id, paper_id, sample_pdf_path)

        # Refresh paper from db
        db.refresh(paper)
        assert paper.processing_status == "INDEXED"
        assert paper.total_pages == 2

        # 3. List Papers
        papers = list_papers(db, include_test_papers=True)
        assert len(papers) >= 1
        found_paper = next((p for p in papers if p.id == paper_id), None)
        assert found_paper is not None

        # 4. Semantic Search
        search_result = semantic_search(
            SearchRequest(query="quadratic computational complexity self-attention", top_k=3),
            db
        )
        assert search_result.total_results > 0
        assert any(r.paper_id == paper_id for r in search_result.results)

        # 5. Scientific Claim Extraction
        claims = list_claims(paper_id=paper_id, db=db)
        assert len(claims) >= 1
        assert any("outperforms" in c.verbatim_text or "demonstrate" in c.verbatim_text for c in claims)

        # 6. Evidence-Grounded Q&A with Provenance Citations
        qa_response = ask_cross_paper_question(
            QARequest(
                question="What accuracy did the sparse attention model achieve?",
                paper_ids=[paper_id],
                include_test_papers=True
            ),
            db
        )
        assert len(qa_response.citations) > 0
        assert qa_response.verified_citation_count > 0
        assert qa_response.unverified_citation_count == 0
        assert any(c.paper_id == paper_id for c in qa_response.citations)

        # 7. Research Gaps & Limitations
        gaps_response = get_research_gaps(db)
        assert gaps_response.total_explicit_limitations > 0
        assert any(l.paper_id == paper_id for l in gaps_response.explicit_limitations)

        # 8. Individual Paper Analysis Workspace Verification
        analysis_resp = get_paper_analysis(paper_id, db)
        assert analysis_resp.paper_id == paper_id
        assert len(analysis_resp.claims) > 0
        assert len(analysis_resp.evidence_passages) > 0
        assert analysis_resp.abstract.text != ""

        # 9. Processing Transparency Verification (9 stages)
        transparency_resp = get_paper_processing_transparency(paper_id, db)
        assert transparency_resp.paper_id == paper_id
        assert len(transparency_resp.stages) == 9
        assert all(s.name in [stage.name for stage in transparency_resp.stages] for s in transparency_resp.stages)

        # 10. System Stats Verification
        stats_resp = get_system_stats(db)
        assert stats_resp["total_uploaded_papers"]["value"] >= 1
        assert stats_resp["indexed_papers"]["value"] >= 1
        assert "description" in stats_resp["total_uploaded_papers"]

        # 11. Delete Paper & Cleanup
        del_response = delete_paper(paper_id, db)
        assert "deleted successfully" in del_response["message"]

    finally:
        db.close()
