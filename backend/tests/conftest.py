import os
import sys
import tempfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import torch  # Ensure OpenMP/MKL DLLs are loaded into the process on Windows
from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.config import settings

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after session
    pass

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def sample_pdf_path(tmp_path):
    """
    Creates a real, valid 2-page academic PDF with sections and findings using PyMuPDF.
    """
    import fitz
    doc = fitz.open()
    
    # Page 1: Title, Abstract, Introduction
    page1 = doc.new_page()
    page1.insert_textbox(
        fitz.Rect(50, 50, 550, 750),
        "Attention and Efficiency in Long Sequences\n\n"
        "Abstract\n"
        "Transformer models with standard self-attention suffer from quadratic computational complexity. "
        "In this work, we demonstrate that sparse attention mechanisms reduce memory complexity by 65% "
        "while maintaining comparable perplexity on long-document benchmarks.\n\n"
        "1. Introduction\n"
        "Sequence modeling has advanced rapidly. However, scaling to 32k tokens requires architectural efficiency.",
        fontsize=11
    )

    # Page 2: Results, Discussion, Limitations
    page2 = doc.new_page()
    page2.insert_textbox(
        fitz.Rect(50, 50, 550, 750),
        "3. Results\n"
        "Our experiments revealed that the sparse model achieved 89.4% accuracy on multi-hop question answering.\n"
        "The model outperforms the standard baseline by 4.2% on long context tasks with statistical significance (p < 0.01).\n\n"
        "4. Limitations\n"
        "Our method requires custom CUDA kernels and was only evaluated on English corpora. Performance on low-resource languages remains untested.",
        fontsize=11
    )

    out_file = tmp_path / "sample_academic_paper.pdf"
    doc.save(str(out_file))
    doc.close()
    return str(out_file)

@pytest.fixture
def corrupted_pdf_path(tmp_path):
    out_file = tmp_path / "corrupted.pdf"
    out_file.write_bytes(b"%PDF-1.4\nCorrupted content without xref table or catalog\n%%EOF")
    return str(out_file)

@pytest.fixture
def empty_pdf_path(tmp_path):
    out_file = tmp_path / "empty.pdf"
    out_file.write_bytes(b"")
    return str(out_file)
