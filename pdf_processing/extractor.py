import fitz


def extract_pdf(file_path):
    doc = fitz.open(file_path)

    pages = []
    for page in doc:
        pages.append(page.get_text("text"))

    text = "\n".join(pages)

    return {
        "text": text,
        "page_count": len(doc)
    }