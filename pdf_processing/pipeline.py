from .validator import validate_pdf
from .extractor import extract_pdf
from .cleaner import clean_text
from .metadata import extract_metadata
from .schemas import ProcessedPaper


def process_pdf(file_path):
    is_valid, message = validate_pdf(file_path)

    if not is_valid:
        return ProcessedPaper(
            paper_id="unknown",
            filename=str(file_path),
            status="failed",
            error=message
        )

    extracted = extract_pdf(file_path)
    metadata = extract_metadata(file_path)

    cleaned_text = clean_text(extracted["text"])

    return ProcessedPaper(
        paper_id="paper_1",
        filename=str(file_path),
        status="success",
        title=metadata["title"],
        authors=[metadata["author"]] if metadata["author"] else [],
        text=cleaned_text,
        page_count=extracted["page_count"]
    )