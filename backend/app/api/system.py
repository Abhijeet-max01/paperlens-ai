import os
import torch
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.api.deps import get_db
from app.core.ocr_engine import ocr_engine
from app.core.vector_store import vector_store
from app.core.model_manager import model_manager
from app.db.models import Paper, Claim, ClaimPair, Limitation, QASession, Chunk

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/health")
def get_system_health():
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (Optimized Intra-op Threads)"
    
    loaded_models = []
    if model_manager._spacy_nlp is not None:
        loaded_models.append("spaCy NLP (en_core_web_sm)")
    if model_manager._embedding_model is not None:
        loaded_models.append("Sentence-Transformers Embeddings (BAAI/bge-small-en-v1.5)")
    if model_manager._nli_model is not None:
        loaded_models.append("DeBERTa-v3 Cross-Encoder NLI (cross-encoder/nli-deberta-v3-small)")

    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "device": settings.DEVICE,
        "hardware": device_name,
        "cpu_count": os.cpu_count(),
        "tesseract_ocr_available": ocr_engine.available,
        "tesseract_path": ocr_engine.tesseract_cmd,
        "faiss_indexed_vectors": vector_store.index.ntotal if vector_store.index else 0,
        "loaded_models_in_memory": loaded_models
    }

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """
    Returns empirical platform overview statistics backed by actual SQLite database records.
    Every metric has an understandable description.
    """
    total_papers = db.query(Paper).count()
    indexed_papers = db.query(Paper).filter(Paper.processing_status == "INDEXED").count()
    processing_papers = db.query(Paper).filter(Paper.processing_status.in_(["PENDING", "PROCESSING"])).count()
    failed_papers = db.query(Paper).filter(Paper.processing_status == "FAILED").count()
    test_papers = db.query(Paper).filter(Paper.is_test_document == True).count()
    user_papers = total_papers - test_papers

    total_claims = db.query(Claim).count()
    comparisons_performed = db.query(ClaimPair).count()
    questions_asked = db.query(QASession).count()
    author_limitations = db.query(Limitation).count()
    total_chunks = db.query(Chunk).count()
    total_vectors = vector_store.index.ntotal if vector_store.index else 0

    return {
        "total_uploaded_papers": {
            "value": total_papers,
            "label": "Total Uploaded Papers",
            "description": "Total scientific PDF documents currently registered in the platform."
        },
        "user_research_papers": {
            "value": user_papers,
            "label": "Research Papers",
            "description": "User-uploaded scientific papers excluding synthetic automated test fixtures."
        },
        "test_fixture_papers": {
            "value": test_papers,
            "label": "Test Fixtures",
            "description": "Automated unit test fixtures and sample dummy papers."
        },
        "indexed_papers": {
            "value": indexed_papers,
            "label": "Successfully Indexed",
            "description": "Papers with extracted text, FAISS vector embeddings, and searchable chunks."
        },
        "processing_papers": {
            "value": processing_papers,
            "label": "Currently Processing",
            "description": "Documents actively undergoing background extraction and embedding generation."
        },
        "failed_papers": {
            "value": failed_papers,
            "label": "Failed Processing",
            "description": "Documents that encountered formatting, extraction, or indexing errors."
        },
        "total_extracted_claims": {
            "value": total_claims,
            "label": "Extracted Scientific Claims",
            "description": "Empirical finding statements identified by spaCy linguistic dependency parsing."
        },
        "comparisons_performed": {
            "value": comparisons_performed,
            "label": "Cross-Paper Comparisons",
            "description": "Pairwise DeBERTa NLI inferences evaluated between related scientific claims."
        },
        "questions_asked": {
            "value": questions_asked,
            "label": "Research Questions Asked",
            "description": "Evidence-grounded cross-paper Q&A sessions synthesized with citations."
        },
        "research_gaps_identified": {
            "value": author_limitations,
            "label": "Limitations & Inferred Gaps",
            "description": "Author-acknowledged constraints and cross-paper empirical discrepancy hypotheses."
        },
        "searchable_passages": {
            "value": total_chunks,
            "label": "Searchable Passages",
            "description": "Section-grounded passage chunks (300 tokens) indexed for semantic retrieval."
        },
        "faiss_vectors": {
            "value": total_vectors,
            "label": "Indexed FAISS Vectors",
            "description": "Dense 384-dimensional normalized vector representations stored on disk."
        }
    }
