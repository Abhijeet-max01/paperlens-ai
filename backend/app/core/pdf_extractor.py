import os
import hashlib
import logging
import re
from typing import Dict, Any, List, Tuple
import fitz  # PyMuPDF

from app.core.ocr_engine import ocr_engine
from app.core.section_detector import detect_section_header
from app.core.metadata_extractor import metadata_extractor

logger = logging.getLogger(__name__)

def _normalize_pdf_text(text: str) -> str:
    """
    Normalizes PDF extraction artifacts: Unicode ligatures and end-of-line hyphen splits.
    """
    if not text:
        return ""
    replacements = {
        "\ufb00": "ff",
        "\ufb01": "fi",
        "\ufb02": "fl",
        "\ufb03": "ffi",
        "\ufb04": "ffl",
        "\ufb05": "st",
        "\ufb06": "st",
    }
    for lig, rep in replacements.items():
        if lig in text:
            text = text.replace(lig, rep)
    # Rejoin words broken across PDF line breaks (e.g., 'classi-\nfication' -> 'classification')
    text = re.sub(r"([A-Za-z])-\s*\n\s*([a-z])", r"\1\2", text)
    return text


def compute_sha256(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

class PDFExtractor:
    """
    Robust PDF document extractor.
    Extracts structured layout blocks, respects two-column flow, detects academic sections,
    extracts metadata (title, authors, affiliations, emails, year), and isolates the abstract.
    """

    def extract(self, file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at: {file_path}")

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise ValueError("Uploaded file is empty (0 bytes).")

        sha256 = compute_sha256(file_path)

        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error("Failed to parse PDF '%s': %s", file_path, e)
            raise ValueError(f"Corrupted or invalid PDF format: {e}")

        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            raise ValueError("PDF contains 0 pages.")

        # 1. Extract high-level metadata (title, authors, affiliations, emails, year)
        doc_meta = metadata_extractor.extract(doc)

        pages_data: List[Dict[str, Any]] = []
        all_sections_detected: set = set()
        has_ocr_applied = False
        
        # Start in Frontmatter; transitions to Abstract/Introduction as encountered
        current_section = "Frontmatter"
        has_abstract_started = False

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1
            rect = page.rect
            page_width = rect.width
            page_height = rect.height

            # Get blocks: (x0, y0, x1, y1, text, block_no, block_type)
            # block_type 0 = text, 1 = image
            raw_blocks = page.get_text("blocks")
            text_blocks = [b for b in raw_blocks if b[6] == 0 and b[4].strip()]

            # Filter out top/bottom margins (headers/footers)
            top_margin = page_height * 0.05
            bottom_margin = page_height * 0.95

            filtered_blocks = []
            for b in text_blocks:
                y0, y1 = b[1], b[3]
                # Filter short headers/footers in extreme margins
                if (y1 < top_margin or y0 > bottom_margin) and len(b[4].strip()) < 80:
                    continue
                filtered_blocks.append(b)

            # Sort blocks to handle two-column vs single-column layouts cleanly
            mid_x = page_width / 2.0
            left_col = []
            right_col = []
            full_width_blocks = []

            for b in filtered_blocks:
                x0, x1 = b[0], b[2]
                if x1 <= mid_x + 20:
                    left_col.append(b)
                elif x0 >= mid_x - 20:
                    right_col.append(b)
                else:
                    full_width_blocks.append(b)

            is_two_column = len(left_col) > 1 and len(right_col) > 1
            if is_two_column:
                left_col.sort(key=lambda b: b[1])
                right_col.sort(key=lambda b: b[1])
                full_width_blocks.sort(key=lambda b: b[1])

                sorted_blocks = []
                # Header blocks before column split
                top_blocks = [b for b in full_width_blocks if left_col and b[1] < left_col[0][1]]
                bottom_blocks = [b for b in full_width_blocks if b not in top_blocks]
                sorted_blocks.extend(top_blocks)
                sorted_blocks.extend(left_col)
                sorted_blocks.extend(right_col)
                sorted_blocks.extend(bottom_blocks)
            else:
                sorted_blocks = sorted(filtered_blocks, key=lambda b: (b[1], b[0]))

            # Assemble structured text blocks
            page_text_pieces = []
            structured_blocks = []

            for b in sorted_blocks:
                raw_block_text = b[4].strip()
                raw_lines = [l.strip() for l in raw_block_text.split("\n") if l.strip()]
                block_text = _normalize_pdf_text(raw_block_text)
                first_line = _normalize_pdf_text(raw_lines[0]) if raw_lines else ""

                # Check if block has an inline Abstract or Index Terms split
                # e.g., 'Abstract—...\nIndex Terms—...'
                kw_split = re.search(r"\n\s*(?:index\s+terms|keywords)[\s\:\.\-\—\–]+", block_text, re.I)
                if kw_split and "abstract" in block_text[:kw_split.start()].lower():
                    # Split into Abstract part and Index Terms part
                    abs_part = block_text[:kw_split.start()].strip()
                    kw_part = block_text[kw_split.start():].strip()

                    # Clean abstract prefix
                    abs_clean = re.sub(r"^\s*abstract[\s\:\.\-\—\–]*", "", abs_part, flags=re.I).strip()
                    current_section = "Abstract"
                    has_abstract_started = True
                    all_sections_detected.add("Abstract")
                    structured_blocks.append({
                        "text": abs_clean or abs_part,
                        "section": "Abstract",
                        "bbox": (b[0], b[1], b[2], b[3])
                    })

                    current_section = "Index Terms"
                    all_sections_detected.add("Index Terms")
                    structured_blocks.append({
                        "text": kw_part,
                        "section": "Index Terms",
                        "bbox": (b[0], b[1], b[2], b[3])
                    })
                    page_text_pieces.append(block_text)
                    continue

                # Standard & multi-line section header detection (e.g., '1\nIntroduction', '4\nDiscussion')
                detected = None
                is_table_header_block = (
                    len(raw_lines) >= 2
                    and first_line.lower().rstrip(".:") in ("model", "models", "dataset", "datasets", "system", "task")
                )
                if not is_table_header_block and raw_lines:
                    if len(raw_lines) >= 2 and re.match(
                        r"^(?:\d+(?:\.\d+)*\.?|[IVXLCDM]+\.?|[A-D]\.?(?:\d+)?)$",
                        first_line,
                        re.I
                    ):
                        two_line_candidate = f"{first_line} {_normalize_pdf_text(raw_lines[1])}"
                        detected = detect_section_header(two_line_candidate, has_abstract_started=has_abstract_started)
                    if not detected:
                        detected = detect_section_header(first_line, has_abstract_started=has_abstract_started)

                if detected:
                    current_section = detected
                    all_sections_detected.add(detected)
                    if detected in ("Abstract", "Introduction"):
                        has_abstract_started = True

                # If current_section is Abstract and text begins with 'Abstract—'
                cleaned_text = block_text
                if current_section == "Abstract" and re.match(r"^\s*abstract[\s\:\.\-\—\–]+", block_text, re.I):
                    cleaned_text = re.sub(r"^\s*abstract[\s\:\.\-\—\–]*", "", block_text, flags=re.I).strip()

                structured_blocks.append({
                    "text": cleaned_text or block_text,
                    "section": current_section,
                    "bbox": (b[0], b[1], b[2], b[3])
                })
                page_text_pieces.append(cleaned_text or block_text)

            combined_page_text = "\n\n".join(page_text_pieces).strip()
            page_is_ocr = False

            # Check if page text is insufficient and needs OCR
            if ocr_engine.should_apply_ocr(combined_page_text):
                ocr_success, ocr_text = ocr_engine.extract_text_from_page_pixmap(page)
                if ocr_success and len(ocr_text) > len(combined_page_text):
                    logger.info("Applied OCR to page %d of '%s'", page_num, file_path)
                    combined_page_text = ocr_text
                    page_is_ocr = True
                    has_ocr_applied = True
                    structured_blocks = [{
                        "text": ocr_text,
                        "section": current_section,
                        "bbox": (0, 0, page_width, page_height)
                    }]

            pages_data.append({
                "page_number": page_num,
                "full_text": combined_page_text,
                "blocks": structured_blocks,
                "section": current_section,
                "is_ocr": page_is_ocr
            })

        doc.close()

        # Final title resolution: prefer metadata_extractor title over filename
        final_title = _normalize_pdf_text(doc_meta["title"])
        if not final_title or len(final_title) < 4:
            final_title = os.path.splitext(os.path.basename(file_path))[0]
        final_authors = _normalize_pdf_text(doc_meta["authors"]) if doc_meta.get("authors") else ""

        # Isolate clean abstract from the structured blocks
        abstract_blocks = [
            b["text"] for p in pages_data[:2] for b in p["blocks"] if b["section"] == "Abstract"
        ]
        if abstract_blocks:
            clean_abstract = "\n\n".join(abstract_blocks).strip()
            clean_abstract = re.sub(r"^\s*abstract[\s\:\.\-\—\–]*", "", clean_abstract, flags=re.I).strip()
            if len(clean_abstract) >= 60:
                final_abstract = clean_abstract
                abstract_is_reliable = True
            else:
                final_abstract = "The abstract was not explicitly or reliably identified in the document structure."
                abstract_is_reliable = False
        else:
            final_abstract = "The abstract was not explicitly or reliably identified in the document structure."
            abstract_is_reliable = False

        # Extract keywords
        keyword_blocks = [
            b["text"] for p in pages_data[:2] for b in p["blocks"] if b["section"] == "Index Terms"
        ]
        keywords = []
        for kb in keyword_blocks:
            clean_kw = re.sub(r"^\s*(?:index\s+terms|keywords)[\s\:\.\-\—\–]*", "", kb, flags=re.I).strip()
            if clean_kw:
                keywords.append(clean_kw)

        return {
            "sha256": sha256,
            "title": final_title[:500],
            "authors": final_authors,
            "affiliations": doc_meta["affiliations"],
            "emails": doc_meta["emails"],
            "year": doc_meta["year"],
            "abstract": final_abstract,
            "abstract_is_reliable": abstract_is_reliable,
            "keywords": keywords,
            "total_pages": total_pages,
            "has_ocr_applied": has_ocr_applied,
            "sections_detected": sorted(list(all_sections_detected)),
            "pages": pages_data
        }

pdf_extractor = PDFExtractor()
