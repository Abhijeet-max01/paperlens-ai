from pdf_processing.pipeline import process_pdf

file_path = "sample_papers/sample.pdf"

result = process_pdf(file_path)

print("Status:", result.status)
print("Title:", result.title)
print("Authors:", result.authors)
print("Pages:", result.page_count)
print("\nExtracted Text:\n", result.text[:1000])
