import os
import shutil
import logging
from typing import Tuple, Optional
from PIL import Image
import io

from app.config import settings

logger = logging.getLogger(__name__)

class OCREngine:
    def __init__(self):
        self.tesseract_cmd = self._find_tesseract()
        if self.tesseract_cmd:
            import pytesseract
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd
            self.available = True
            logger.info("Tesseract OCR initialized at path: %s", self.tesseract_cmd)
        else:
            self.available = False
            logger.warning(
                "Tesseract executable not found. Scanned PDF pages will gracefully fallback without OCR. "
                "To enable OCR on Windows, install Tesseract from UB-Mannheim and set TESSERACT_PATH."
            )

    def _find_tesseract(self) -> Optional[str]:
        # 1. Configured path
        if settings.TESSERACT_PATH and os.path.exists(settings.TESSERACT_PATH):
            return settings.TESSERACT_PATH
        
        # 2. In PATH
        which_path = shutil.which("tesseract")
        if which_path:
            return which_path
            
        # 3. Standard Windows installation paths
        common_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
        ]
        for p in common_paths:
            if os.path.exists(p):
                return p
                
        return None

    def should_apply_ocr(self, text: str, min_words: int = 40) -> bool:
        if not text:
            return True
        words = text.split()
        if len(words) < min_words:
            return True
        
        # Check alphabetic density
        alpha_count = sum(c.isalpha() for c in text)
        if len(text) > 0 and (alpha_count / len(text)) < 0.40:
            return True
            
        return False

    def extract_text_from_page_pixmap(self, page) -> Tuple[bool, str]:
        """
        Renders a PyMuPDF page as a pixmap and executes Tesseract OCR.
        Returns: (success: bool, extracted_text: str)
        """
        if not self.available:
            return False, ""

        try:
            import pytesseract
            # Render at 200 DPI for high-accuracy OCR without excessive memory
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))
            
            # Run OCR
            ocr_text = pytesseract.image_to_string(image, lang="eng")
            return True, ocr_text.strip()
        except Exception as e:
            logger.error("OCR extraction failed on page %s: %s", getattr(page, "number", "unknown"), e)
            return False, ""

ocr_engine = OCREngine()
