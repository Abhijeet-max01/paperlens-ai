import pytest
from fastapi import HTTPException
from app.core.pdf_extractor import pdf_extractor

def test_empty_pdf_rejection(empty_pdf_path):
    with pytest.raises(ValueError) as excinfo:
        pdf_extractor.extract(empty_pdf_path)
    assert "empty" in str(excinfo.value).lower()

def test_corrupted_pdf_handling(corrupted_pdf_path):
    with pytest.raises(ValueError) as excinfo:
        pdf_extractor.extract(corrupted_pdf_path)
    assert "corrupted" in str(excinfo.value).lower() or "invalid" in str(excinfo.value).lower()

def test_nonexistent_pdf():
    with pytest.raises(FileNotFoundError):
        pdf_extractor.extract("/nonexistent/path/to/paper.pdf")
