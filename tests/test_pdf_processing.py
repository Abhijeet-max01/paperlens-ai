from pdf_processing.pipeline import process_pdf


def test_process_pdf():
    result = process_pdf("sample_papers/sample.pdf")

    assert result.status == "success"
    assert result.page_count > 0
    assert result.text is not None