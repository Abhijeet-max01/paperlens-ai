import re
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class SectionAwareChunker:
    def __init__(self, target_chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = target_chunk_size or settings.CHUNK_SIZE
        self.overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_paper(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Chunks extracted pages into section- and page-grounded text passages.
        Preserves page number, section name, and chunk index.
        """
        chunks: List[Dict[str, Any]] = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            blocks = page["blocks"]

            if not blocks:
                # If page is empty or only had whitespace
                if page.get("full_text", "").strip():
                    text = page["full_text"].strip()
                    words = text.split()
                    if words:
                        chunks.append({
                            "chunk_index": global_chunk_idx,
                            "page_number": page_num,
                            "section_name": page.get("section", "General"),
                            "content": text,
                            "token_count": len(words)
                        })
                        global_chunk_idx += 1
                continue

            current_section = blocks[0]["section"]
            buffer_words: List[str] = []

            for block in blocks:
                block_text = block["text"].strip()
                if not block_text:
                    continue

                block_section = block["section"]
                
                # If section changes, flush buffer completely without cross-section overlap
                if block_section != current_section:
                    if buffer_words:
                        chunk_text = " ".join(buffer_words)
                        chunks.append({
                            "chunk_index": global_chunk_idx,
                            "page_number": page_num,
                            "section_name": current_section,
                            "content": chunk_text,
                            "token_count": len(buffer_words)
                        })
                        global_chunk_idx += 1
                        buffer_words = []
                    current_section = block_section

                words = block_text.split()
                buffer_words.extend(words)

                while len(buffer_words) >= self.chunk_size:
                    chunk_slice = buffer_words[:self.chunk_size]
                    chunk_text = " ".join(chunk_slice)
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "section_name": current_section,
                        "content": chunk_text,
                        "token_count": len(chunk_slice)
                    })
                    global_chunk_idx += 1
                    buffer_words = buffer_words[self.chunk_size - self.overlap:]

            # Flush remaining words on page
            if buffer_words:
                chunk_text = " ".join(buffer_words)
                chunks.append({
                    "chunk_index": global_chunk_idx,
                    "page_number": page_num,
                    "section_name": current_section,
                    "content": chunk_text,
                    "token_count": len(buffer_words)
                })
                global_chunk_idx += 1

        return chunks

chunker = SectionAwareChunker()
