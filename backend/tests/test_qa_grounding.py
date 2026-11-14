import pytest
from app.db.session import SessionLocal
from app.db.models import Paper, QASession
from app.api.qa import ask_cross_paper_question
from app.schemas.qa import QARequest
from app.core.section_detector import detect_section_header
from app.core.pdf_extractor import _normalize_pdf_text
from app.core.citation_engine import citation_engine


def test_acl_two_line_and_appendix_section_detection():
    # Two-line headers combined cleanly into a canonical line
    assert detect_section_header("1 Introduction", has_abstract_started=True) == "Introduction"
    assert detect_section_header("3 Results", has_abstract_started=True) == "Results"
    assert detect_section_header("4 Discussion and Recommendations", has_abstract_started=True) == "Discussion"
    assert detect_section_header("5 Conclusion and Future Work", has_abstract_started=True) == "Conclusion"
    assert detect_section_header("B Detailed Experimental Setup", has_abstract_started=True) == "Appendix"

    # Bare table column labels must NOT transition section state
    assert detect_section_header("Model", has_abstract_started=True) is None
    assert detect_section_header("Dataset", has_abstract_started=True) is None


def test_pdf_ligature_and_hyphen_normalization():
    raw = "On the Role of Training Data for Text Classi\ufb01cation: Transformer models outper-\nform baselines."
    cleaned = _normalize_pdf_text(raw)
    assert "Classification" in cleaned
    assert "outperform" in cleaned
    assert "\ufb01" not in cleaned


def test_semantic_support_distinguishes_contextual_from_evidential():
    hypothesis = "Transformer-based models consistently outperform simpler text classification approaches."

    # 1. Dataset characteristics only -> CONTEXTUAL_ONLY (not performance support!)
    ctx_excerpt = "The Paired Book Summary dataset contains 5,115 training documents with an average length of 1,148 BERT tokens."
    status_ctx, _, _ = citation_engine.verify_semantic_support(ctx_excerpt, hypothesis)
    assert status_ctx == "CONTEXTUAL_ONLY"

    # 2. Counter-evidence -> CHALLENGES
    chal_excerpt = "Our results show that complex Transformer models for long document classification fail to outperform simple baselines."
    status_chal, _, _ = citation_engine.verify_semantic_support(chal_excerpt, hypothesis)
    assert status_chal == "CHALLENGES"

    # 3. Clear positive performance -> SUPPORTS or CONDITIONAL
    sup_excerpt = "Both BERTBASE and BERTLARGE outperform all prior systems on all GLUE tasks by 4.5% and 7.0% accuracy."
    status_sup, _, _ = citation_engine.verify_semantic_support(sup_excerpt, hypothesis)
    assert status_sup in ("SUPPORTS", "CONDITIONAL")


def test_three_paper_strict_scope_isolation():
    target_ids = [
        "aecf144e-e1ed-4716-afd1-ee55d25d8900",
        "3b44c107-28dc-434b-92a8-2eaeb7b2c225",
        "6d7890a0-6c64-45b1-a451-09d3a4746bd2",
    ]
    db = SessionLocal()
    try:
        found = db.query(Paper).filter(Paper.id.in_(target_ids), Paper.processing_status == "INDEXED").all()
        if len(found) < 3:
            pytest.skip("Three target NLP papers not indexed in current DB.")

        question = (
            "Do the findings in these three papers suggest that simpler models can sometimes perform "
            "competitively with Transformer-based models for text classification? Compare the experimental "
            "evidence, datasets, evaluation metrics, and limitations reported by each paper."
        )
        req = QARequest(question=question, paper_ids=target_ids)
        resp = ask_cross_paper_question(req, db)

        searched_ids = [sp.id for sp in resp.searched_papers]
        evidence_ids = [ep.id for ep in resp.evidence_papers]
        cited_ids = {c.paper_id for c in resp.citations}

        assert set(searched_ids) == set(target_ids)
        assert len(searched_ids) == 3
        assert set(evidence_ids).issubset(set(target_ids))
        assert len(evidence_ids) == len(set(evidence_ids))
        assert resp.unique_contributing_paper_count == len(evidence_ids)
        assert cited_ids.issubset(set(target_ids))
        assert all(c.provenance_verified for c in resp.citations)
    finally:
        db.close()


def test_all_papers_excludes_test_fixtures_and_duplicates():
    db = SessionLocal()
    try:
        real_papers = db.query(Paper).filter(
            Paper.processing_status == "INDEXED",
            Paper.is_test_document == False
        ).all()
        if len(real_papers) < 2:
            pytest.skip("Need at least 2 non-test papers in DB.")

        question = (
            "Do the findings in these papers suggest that simpler models can sometimes perform "
            "competitively with Transformer-based models for text classification?"
        )
        req = QARequest(question=question, paper_ids=None, include_test_papers=False)
        resp = ask_cross_paper_question(req, db)

        test_ids = {
            p.id for p in db.query(Paper).filter(Paper.is_test_document == True).all()
        }
        searched_ids = [sp.id for sp in resp.searched_papers]
        evidence_ids = [ep.id for ep in resp.evidence_papers]
        cited_ids = {c.paper_id for c in resp.citations}

        # Zero test fixture documents allowed in unscoped real search
        assert set(searched_ids).isdisjoint(test_ids)
        assert set(evidence_ids).isdisjoint(test_ids)
        assert cited_ids.isdisjoint(test_ids)
        # Strict uniqueness
        assert len(evidence_ids) == len(set(evidence_ids))
        assert resp.unique_contributing_paper_count == len(evidence_ids)
        # Off-topic Agile paper must NOT appear as an evidence-providing paper for Transformer classification
        assert "6af6bd32-28a4-45c5-9677-18a3390cb2d1" not in evidence_ids
    finally:
        db.close()


def test_attribution_distinction_original_vs_cited():
    assert (
        citation_engine._classify_attribution(
            "Our results show that BERT outperforms fastText (Joulin et al., 2017) as training data increases.",
            "Results"
        )
        == "ORIGINAL_EXPERIMENT"
    )
    assert (
        citation_engine._classify_attribution(
            "Chalkidis et al. (2019) observe that processing only the first two sections yields strong performance.",
            "Related Work"
        )
        == "CITED_PRIOR_STUDY"
    )
    assert (
        citation_engine._classify_attribution(
            "Previous studies showed that SVM outperforms neural baselines on small corpora.",
            "Introduction"
        )
        == "CITED_PRIOR_STUDY"
    )


def test_query_conditioned_semantic_verification_factor_vs_contextual():
    q = (
        "Do these three papers provide evidence that the performance of simpler text classification "
        "models depends on the size of the training dataset?"
    )
    q_info = citation_engine._analyze_query(q)
    claim = q_info["core_hypothesis"]

    direct_status, _, _ = citation_engine.verify_semantic_support(
        excerpt="In settings with small training datasets fastText performs equally well or better than BERT, whereas as the amount of training data increases BERT outperforms fastText.",
        associated_claim=claim,
        nli_probs={"ENTAILMENT": 0.40, "CONTRADICTION": 0.05, "NEUTRAL": 0.55},
        query_info=q_info
    )
    assert direct_status == "SUPPORTS"

    complexity_status, _, _ = citation_engine.verify_semantic_support(
        excerpt="Our results show that more complex models often fail to outperform simple baselines across long documents.",
        associated_claim=claim,
        nli_probs={"ENTAILMENT": 0.65, "CONTRADICTION": 0.05, "NEUTRAL": 0.30},
        query_info=q_info
    )
    assert complexity_status == "CONTEXTUAL_ONLY"

    bert_only_status, _, _ = citation_engine.verify_semantic_support(
        excerpt="Larger BERT models lead to accuracy improvements even on MRPC with 3,600 labeled training examples.",
        associated_claim=claim,
        nli_probs={"ENTAILMENT": 0.50, "CONTRADICTION": 0.05, "NEUTRAL": 0.45},
        query_info=q_info
    )
    assert bert_only_status == "CONTEXTUAL_ONLY"


def test_intra_paper_duplicate_grouping():
    q_info = citation_engine._analyze_query(
        "Do simpler models outperform complex models across datasets?"
    )
    chunks = [
        {
            "chunk_id": "c1",
            "page_number": 1,
            "section_name": "Abstract",
            "content": "Our results show that more complex models often fail to outperform simple baselines across datasets."
        },
        {
            "chunk_id": "c5",
            "page_number": 5,
            "section_name": "Conclusion",
            "content": "Our results show that more sophisticated models are often outperformed by simpler baselines across datasets."
        },
    ]
    selected, dups = citation_engine._select_key_sentences(chunks, [], [], q_info)
    assert dups >= 1
    assert len(selected) == 1
    assert selected[0]["all_pages"] == [1, 5]


def test_training_dataset_size_cross_paper_synthesis():
    db = SessionLocal()
    try:
        target_ids = [
            "aecf144e-e1ed-4716-afd1-ee55d25d8900",  # Go Simple
            "3b44c107-28dc-434b-92a8-2eaeb7b2c225",  # Efficient Classification
            "6d7890a0-6c64-45b1-a451-09d3a4746bd2",  # BERT
        ]
        found = db.query(Paper).filter(Paper.id.in_(target_ids), Paper.processing_status == "INDEXED").all()
        if len(found) < 3:
            pytest.skip("Three target benchmark papers are not all indexed in this DB.")

        question = (
            "Do these three papers provide evidence that the performance of simpler text classification "
            "models depends on the size of the training dataset? Compare the experimental findings, "
            "models, datasets and evaluation metrics. Clearly distinguish direct experimental results "
            "from observations cited from other studies."
        )
        req = QARequest(question=question, paper_ids=target_ids, top_k=6)
        resp = ask_cross_paper_question(req, db)

        # Direct response must explicitly address training dataset size (not reuse generic superiority text)
        dr_low = resp.direct_response.lower()
        assert "training dataset" in dr_low
        assert "contextual" in dr_low

        # Direct vs contextual citation classification
        go_cits = [c for c in resp.citations if c.paper_id == target_ids[0]]
        eff_cits = [c for c in resp.citations if c.paper_id == target_ids[1]]
        bert_cits = [c for c in resp.citations if c.paper_id == target_ids[2]]

        assert any(c.semantic_support_status == "SUPPORTS" for c in go_cits)
        assert all(c.semantic_support_status == "CONTEXTUAL_ONLY" for c in eff_cits)
        assert all(c.semantic_support_status == "CONTEXTUAL_ONLY" for c in bert_cits)
        assert all(c.provenance_verified for c in resp.citations)

        # Dataset & metric separation accuracy
        meth_blob = "\n".join(resp.methodology_and_dataset_differences)
        for expected_tok in ("SE-16", "AG News", "20 Newsgroups", "Hyperpartisan", "EURLEX-57K", "GLUE", "SQuAD", "CoNLL-2003", "Micro-F1", "Macro-F1"):
            assert expected_tok in meth_blob
    finally:
        db.close()


def test_cross_paper_research_objective_retrieval():
    db = SessionLocal()
    try:
        target_ids = [
            "aecf144e-e1ed-4716-afd1-ee55d25d8900",  # Go Simple
            "3b44c107-28dc-434b-92a8-2eaeb7b2c225",  # Efficient Classification
            "6d7890a0-6c64-45b1-a451-09d3a4746bd2",  # BERT
        ]
        found = db.query(Paper).filter(Paper.id.in_(target_ids), Paper.processing_status == "INDEXED").all()
        if len(found) < 3:
            pytest.skip("Three target benchmark papers are not all indexed in this DB.")

        question = (
            "What is the main research problem addressed by each of these three papers? "
            "Explain their objectives and how their approaches differ."
        )
        req = QARequest(question=question, paper_ids=target_ids, top_k=6)
        resp = ask_cross_paper_question(req, db)

        # 1. Scope and participation: all 3 papers must participate with verified evidence
        searched_ids = [sp.id for sp in resp.searched_papers]
        evidence_ids = [ep.id for ep in resp.evidence_papers]
        assert len(searched_ids) == 3
        assert len(evidence_ids) == 3
        assert resp.unique_contributing_paper_count == 3
        assert resp.verified_citation_count >= 3

        # 2. Citations & Provenance
        assert all(c.provenance_verified for c in resp.citations)
        assert all(c.semantic_support_status == "SUPPORTS" for c in resp.citations)
        cited_paper_ids = {c.paper_id for c in resp.citations}
        assert set(target_ids).issubset(cited_paper_ids)

        # 3. Direct response content
        resp_text = resp.direct_response
        assert "Research Problem" in resp_text
        assert "Primary Objective" in resp_text
        assert "Methodological Approach" in resp_text
        assert "How Their Approaches Differ" in resp_text
        assert "Pre-training Paradigm" in resp_text
        assert "BERT" in resp_text
    finally:
        db.close()

