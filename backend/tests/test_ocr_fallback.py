import pytest
from app.core.ocr_engine import ocr_engine

def test_ocr_density_heuristics():
    # Dense normal text does not trigger OCR
    normal_text = "This is a comprehensive scientific study containing hundreds of words discussing machine learning models and experiments." * 5
    assert ocr_engine.should_apply_ocr(normal_text, min_words=40) is False

    # Empty text triggers OCR
    assert ocr_engine.should_apply_ocr("", min_words=40) is True

    # Sparse text (few words) triggers OCR
    sparse_text = "Figure 1. Architecture diagram."
    assert ocr_engine.should_apply_ocr(sparse_text, min_words=40) is True

    # Low alphabetic density (e.g. garbled noise or scanned non-text)
    symbols_text = "1234 %%% $$$ !!! --- @@@ +++ === ~~~" * 10
    assert ocr_engine.should_apply_ocr(symbols_text, min_words=40) is True

def test_ocr_graceful_handling():
    # If Tesseract is not installed, extract_text_from_page_pixmap returns (False, "")
    # without crashing the process
    class MockPage:
        number = 1
        def get_pixmap(self, dpi=200):
            import fitz
            # Return empty pixmap
            doc = fitz.open()
            p = doc.new_page()
            return p.get_pixmap()

    success, text = ocr_engine.extract_text_from_page_pixmap(MockPage())
    # Should either succeed if Tesseract is on machine or fail gracefully with False
    assert isinstance(success, bool)
    assert isinstance(text, str)
