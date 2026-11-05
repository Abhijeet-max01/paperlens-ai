from pathlib import Path


def validate_pdf(file_path):
    path = Path(file_path)

    if not path.exists():
        return False, "File does not exist"

    if not path.is_file():
        return False, "Path is not a file"

    if path.suffix.lower() != ".pdf":
        return False, "File is not a PDF"

    if path.stat().st_size == 0:
        return False, "PDF file is empty"

    return True, "Valid PDF"