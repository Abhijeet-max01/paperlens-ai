import fitz


def extract_metadata(file_path):
    doc = fitz.open(file_path)
    metadata = doc.metadata

    return {
        "title": metadata.get("title"),
        "author": metadata.get("author"),
        "subject": metadata.get("subject"),
        "page_count": len(doc)
    }