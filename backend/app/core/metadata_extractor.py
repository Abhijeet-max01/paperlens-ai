import re
import logging
from typing import Dict, Any, List, Optional, Tuple
import fitz

logger = logging.getLogger(__name__)

# Broad academic affiliation keywords across disciplines, institutions, and geographies
AFFILIATION_KEYWORDS = {
    # Departments & Units
    "department", "dept", "faculty", "school", "division", "institute", "institution",
    "laboratory", "lab", "center", "centre", "unit", "program", "programme", "group",
    # Academic Institutions
    "university", "univ", "college", "polytechnic", "academy", "universit",
    # Industry & Research Labs
    "corporation", "corp", "inc", "ltd", "gmbh", "technologies", "research",
    "google", "microsoft", "meta", "amazon", "ibm", "apple", "deepmind", "openai",
    "intel", "bell", "cisco", "oracle", "adobe", "huawei", "tencent", "alibaba",
    # Common Locations / Countries
    "india", "punjab", "phagwara", "delhi", "bangalore", "mumbai", "hyderabad",
    "usa", "united states", "uk", "united kingdom", "germany", "france", "canada",
    "australia", "china", "japan", "korea", "singapore", "switzerland", "netherlands",
    "sweden", "california", "massachusetts", "new york", "texas", "washington",
    "cambridge", "oxford", "zurich", "tokyo", "beijing", "toronto"
}

NON_AUTHOR_WORDS = {
    "abstract", "index", "terms", "keywords", "table", "figure", "ieee", "acm",
    "springer", "elsevier", "proceedings", "conference", "journal", "volume",
    "issue", "pages", "doi", "issn", "isbn", "copyright", "published", "received",
    "accepted", "revised", "all rights reserved", "open access", "creative commons",
    "author", "authors", "correspondence", "corresponding", "email", "e-mail"
}

class AcademicMetadataExtractor:
    """
    Robust metadata extraction for scientific research papers.
    Extracts paper title, authors, affiliations, email addresses, and publication year.
    """

    def extract(self, doc: fitz.Document) -> Dict[str, Any]:
        if len(doc) == 0:
            return self._empty_result()

        page1 = doc[0]
        page_dict = page1.get_text("dict")
        page_width = page1.rect.width
        page_height = page1.rect.height

        # 1. Gather all line spans with bounding boxes and font sizes
        lines = []
        for b in page_dict.get("blocks", []):
            if "lines" in b:
                for l in b["lines"]:
                    text = "".join(s["text"] for s in l["spans"]).strip()
                    if text:
                        max_sz = max(s["size"] for s in l["spans"])
                        bbox = l["bbox"]
                        lines.append({
                            "text": text,
                            "size": max_sz,
                            "bbox": bbox,
                            "x0": bbox[0],
                            "y0": bbox[1],
                            "x1": bbox[2],
                            "y1": bbox[3]
                        })

        if not lines:
            return self._empty_result(doc)

        # Sort top-to-bottom
        lines.sort(key=lambda l: (l["y0"], l["x0"]))

        # 2. Locate Abstract or Introduction Boundary on Page 1
        abstract_start_idx = None
        for idx, l in enumerate(lines):
            if re.match(r"^\s*abstract[\s\:\.\-\—\–]*", l["text"], re.I):
                abstract_start_idx = idx
                break

        intro_start_idx = None
        for idx, l in enumerate(lines):
            if re.match(r"^\s*(?:(?:SECTION|CHAPTER)\s+)?(?:[IVXLCDM]+\b\.?|\d+(?:\.\d+)*\.?)\s*introduction\b", l["text"], re.I) or re.match(r"^\s*introduction\s*$", l["text"], re.I):
                intro_start_idx = idx
                break

        # 3. Extract Title
        title = self._extract_title(doc, lines, abstract_start_idx or intro_start_idx, page_height)

        # 4. Extract Authors, Affiliations, and Emails
        authors, affiliations, emails = self._extract_author_zone(
            doc, lines, title, abstract_start_idx, intro_start_idx, page_width, page_height
        )

        # 5. Extract Publication Year
        year = self._extract_year(doc, lines)

        return {
            "title": title,
            "authors": authors,
            "affiliations": affiliations,
            "emails": emails,
            "year": year
        }

    def _extract_title(
        self,
        doc: fitz.Document,
        lines: List[Dict[str, Any]],
        boundary_idx: Optional[int],
        page_height: float
    ) -> str:
        meta_title = (doc.metadata.get("title") or "").strip()
        if meta_title and len(meta_title) > 5 and not meta_title.lower().endswith(".pdf") and not any(g in meta_title.lower() for g in ["untitled", "microsoft word", "tex", "latex"]):
            return re.sub(r"\s+", " ", meta_title)

        candidate_lines = lines[:boundary_idx] if boundary_idx else [l for l in lines if l["y0"] < page_height * 0.35]
        if not candidate_lines:
            return "Untitled Research Paper"

        max_size = max(l["size"] for l in candidate_lines)
        
        title_lines = []
        for l in candidate_lines:
            if abs(l["size"] - max_size) < 1.5 and l["y0"] < page_height * 0.35:
                if not any(k in l["text"].lower() for k in ["arxiv:", "doi:", "issn:", "http:", "https:"]):
                    title_lines.append(l["text"])

        if title_lines:
            full_title = " ".join(title_lines)
            full_title = re.sub(r"\s+", " ", full_title).strip()
            return full_title

        return candidate_lines[0]["text"]

    def _extract_author_zone(
        self,
        doc: fitz.Document,
        lines: List[Dict[str, Any]],
        title: str,
        abstract_idx: Optional[int],
        intro_idx: Optional[int],
        page_width: float,
        page_height: float
    ) -> Tuple[str, List[str], List[str]]:
        meta_author = (doc.metadata.get("author") or "").strip()

        title_bottom = 0.0
        candidate_header = lines[:abstract_idx] if abstract_idx else [l for l in lines if l["y0"] < page_height * 0.35]
        if candidate_header:
            max_size = max(l["size"] for l in candidate_header)
            matching_title_lines = [l for l in candidate_header if abs(l["size"] - max_size) < 1.5 and l["y0"] < page_height * 0.35]
            if matching_title_lines:
                title_bottom = max(l["y1"] for l in matching_title_lines)

        end_idx = abstract_idx if abstract_idx is not None else intro_idx
        abstract_top = lines[end_idx]["y0"] if end_idx is not None else page_height * 0.40

        mid_x = page_width / 2.0
        
        zone_lines = []
        for l in lines:
            if l["y0"] >= title_bottom - 2.0 and l["y1"] <= abstract_top + 5.0:
                if abstract_idx is not None and lines[abstract_idx]["x1"] <= mid_x + 20 and l["x0"] > mid_x - 20:
                    continue
                zone_lines.append(l["text"])

        emails: List[str] = []
        affiliations: List[str] = []
        authors: List[str] = []

        for raw_line in zone_lines:
            txt = raw_line.strip()
            if not txt:
                continue

            # 1. Extract email addresses
            found_emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", txt)
            if found_emails:
                emails.extend(found_emails)
                txt = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "", txt).strip()
                if not txt:
                    continue

            # 2. Check for institutional / geographic affiliations
            words = set(re.findall(r"\b\w+\b", txt.lower()))
            if words.intersection(AFFILIATION_KEYWORDS):
                affiliations.append(txt)
            else:
                # 3. Check for candidate author names
                if re.match(r"^[A-Z][a-zA-Z\.\s\-\'\,\&]+$", txt) and len(txt) < 80:
                    if not any(w in txt.lower() for w in NON_AUTHOR_WORDS):
                        if not any(w in title.lower() for w in txt.lower().split() if len(w) > 4):
                            authors.append(txt)

        author_str = ", ".join(authors) if authors else meta_author
        return author_str, affiliations, emails

    def _extract_year(self, doc: fitz.Document, lines: List[Dict[str, Any]]) -> Optional[int]:
        meta_date = doc.metadata.get("creationDate") or doc.metadata.get("modDate") or ""
        date_match = re.search(r"20\d{2}|19\d{2}", meta_date)
        if date_match:
            try:
                y = int(date_match.group(0))
                if 1950 <= y <= 2035:
                    return y
            except ValueError:
                pass

        for l in lines:
            m = re.search(r"\b(19\d{2}|20\d{2})\b", l["text"])
            if m:
                try:
                    y = int(m.group(1))
                    if 1990 <= y <= 2035:
                        return y
                except ValueError:
                    continue
        return None

    def _empty_result(self, doc: Optional[fitz.Document] = None) -> Dict[str, Any]:
        meta_title = (doc.metadata.get("title") or "").strip() if doc else ""
        meta_author = (doc.metadata.get("author") or "").strip() if doc else ""
        return {
            "title": meta_title or "Untitled Document",
            "authors": meta_author,
            "affiliations": [],
            "emails": [],
            "year": None
        }

metadata_extractor = AcademicMetadataExtractor()
