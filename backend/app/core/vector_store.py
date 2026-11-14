import os
import json
import logging
import threading
from typing import List, Dict, Any, Optional, Tuple
import torch  # Initialize OpenMP runtime DLLs on Windows before FAISS import
import numpy as np
import faiss

from app.config import settings
from app.core.embeddings import embedding_engine

logger = logging.getLogger(__name__)

class FAISSVectorStore:
    def __init__(self):
        self.index_dir = settings.FAISS_DIR
        self.index_file = self.index_dir / "index.bin"
        self.meta_file = self.index_dir / "id_map.json"
        self.dim = 384 # bge-small-en-v1.5 dimension
        self._lock = threading.Lock()
        
        self.index = None
        self.id_to_metadata: Dict[int, Dict[str, Any]] = {} # faiss_id -> chunk metadata
        self.chunk_id_to_faiss_id: Dict[str, int] = {}
        self.next_faiss_id = 0

        self.load()

    def _init_new_index(self):
        import faiss
        self.index = faiss.IndexFlatIP(self.dim)
        self.id_to_metadata = {}
        self.chunk_id_to_faiss_id = {}
        self.next_faiss_id = 0

    def load(self):
        with self._lock:
            import faiss
            if self.index_file.exists() and self.meta_file.exists():
                try:
                    self.index = faiss.read_index(str(self.index_file))
                    with open(self.meta_file, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        self.id_to_metadata = {int(k): v for k, v in meta.get("id_to_meta", {}).items()}
                        self.chunk_id_to_faiss_id = meta.get("chunk_to_faiss", {})
                        self.next_faiss_id = meta.get("next_faiss_id", len(self.id_to_metadata))
                    logger.info("Loaded FAISS index with %d vectors", self.index.ntotal)
                    return
                except Exception as e:
                    logger.error("Failed to load existing FAISS index: %s. Initializing fresh index.", e)
            
            self._init_new_index()

    def save(self):
        with self._lock:
            import faiss
            if self.index is None:
                return
            try:
                faiss.write_index(self.index, str(self.index_file))
                with open(self.meta_file, "w", encoding="utf-8") as f:
                    json.dump({
                        "id_to_meta": self.id_to_metadata,
                        "chunk_to_faiss": self.chunk_id_to_faiss_id,
                        "next_faiss_id": self.next_faiss_id
                    }, f, indent=2)
                logger.info("Persisted FAISS index with %d vectors", self.index.ntotal)
            except Exception as e:
                logger.error("Error saving FAISS index: %s", e)

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[int]:
        """
        Adds text chunks to FAISS index.
        chunks: [{chunk_id, paper_id, page_number, section_name, content, paper_title}]
        Returns assigned faiss_ids.
        """
        if not chunks:
            return []

        texts = [c["content"] for c in chunks]
        embeddings = embedding_engine.embed_texts(texts)

        with self._lock:
            assigned_ids = []
            for i, chunk in enumerate(chunks):
                faiss_id = self.next_faiss_id
                self.next_faiss_id += 1

                self.id_to_metadata[faiss_id] = {
                    "chunk_id": chunk["chunk_id"],
                    "paper_id": chunk["paper_id"],
                    "paper_title": chunk.get("paper_title", ""),
                    "page_number": chunk["page_number"],
                    "section_name": chunk["section_name"],
                    "content": chunk["content"]
                }
                self.chunk_id_to_faiss_id[chunk["chunk_id"]] = faiss_id
                assigned_ids.append(faiss_id)

            self.index.add(embeddings)
        
        self.save()
        return assigned_ids

    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.35,
        paper_ids: Optional[List[str]] = None,
        exclude_sections: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic similarity search against indexed chunks.
        """
        with self._lock:
            if self.index is None or self.index.ntotal == 0:
                return []

        query_vec = embedding_engine.embed_query(query).reshape(1, -1)

        # When filtering by paper_ids or sections, search the full index so valid target papers
        # are never truncated out by higher-scoring chunks from other documents.
        if paper_ids or exclude_sections:
            search_k = self.index.ntotal
        else:
            search_k = min(self.index.ntotal, max(top_k * 3, 20))
        scores, indices = self.index.search(query_vec, search_k)

        excl_lower = {s.lower() for s in exclude_sections} if exclude_sections else set()
        results = []
        for score, faiss_idx in zip(scores[0], indices[0]):
            if faiss_idx == -1:
                continue
            if score < min_score:
                continue
            
            meta = self.id_to_metadata.get(int(faiss_idx))
            if not meta:
                continue

            if paper_ids and meta["paper_id"] not in paper_ids:
                continue

            sec_name = (meta.get("section_name") or "").lower()
            if excl_lower and any(ex in sec_name for ex in excl_lower):
                continue

            results.append({
                "chunk_id": meta["chunk_id"],
                "paper_id": meta["paper_id"],
                "paper_title": meta.get("paper_title", ""),
                "page_number": meta["page_number"],
                "section_name": meta["section_name"],
                "content": meta["content"],
                "similarity_score": round(float(score), 4)
            })

            if len(results) >= top_k:
                break

        return results

    def remove_paper(self, paper_id: str):
        """
        Removes all chunks associated with paper_id and rebuilds index.
        """
        with self._lock:
            remaining_meta = {}
            remaining_texts = []
            
            for old_id, meta in self.id_to_metadata.items():
                if meta["paper_id"] != paper_id:
                    remaining_meta[len(remaining_texts)] = meta
                    remaining_texts.append(meta["content"])

            self._init_new_index()
            if remaining_texts:
                embeddings = embedding_engine.embed_texts(remaining_texts)
                self.index.add(embeddings)
                self.id_to_metadata = remaining_meta
                self.chunk_id_to_faiss_id = {v["chunk_id"]: k for k, v in self.id_to_metadata.items()}
                self.next_faiss_id = len(remaining_texts)

        self.save()

    def sync_with_db(self, db) -> bool:
        """
        Synchronizes FAISS vector store with active chunks in SQLite database.
        Rebuilds index cleanly if any mismatch is detected, updating Chunk.faiss_id.
        """
        from app.db.models import Chunk, Paper
        with self._lock:
            # Query all chunks from valid indexed papers
            active_chunks = (
                db.query(Chunk)
                .join(Paper, Paper.id == Chunk.paper_id)
                .filter(Paper.processing_status == "INDEXED")
                .order_by(Chunk.created_at.asc(), Chunk.chunk_index.asc())
                .all()
            )
            
            db_chunk_ids = [c.id for c in active_chunks]
            faiss_chunk_ids = list(self.chunk_id_to_faiss_id.keys())

            if set(db_chunk_ids) == set(faiss_chunk_ids) and self.index and self.index.ntotal == len(db_chunk_ids):
                return False  # Already in sync

            logger.info("Syncing FAISS index with database: %d DB chunks vs %d FAISS vectors", len(db_chunk_ids), len(faiss_chunk_ids))
            self._init_new_index()
            if not active_chunks:
                self.save()
                return True

            texts = [c.content for c in active_chunks]
            embeddings = embedding_engine.embed_texts(texts)

            new_meta = {}
            new_chunk_to_faiss = {}
            for i, chunk_obj in enumerate(active_chunks):
                chunk_obj.faiss_id = i
                new_meta[i] = {
                    "chunk_id": chunk_obj.id,
                    "paper_id": chunk_obj.paper_id,
                    "paper_title": chunk_obj.paper.title if chunk_obj.paper else "",
                    "page_number": chunk_obj.page_number,
                    "section_name": chunk_obj.section_name,
                    "content": chunk_obj.content
                }
                new_chunk_to_faiss[chunk_obj.id] = i

            self.index.add(embeddings)
            self.id_to_metadata = new_meta
            self.chunk_id_to_faiss_id = new_chunk_to_faiss
            self.next_faiss_id = len(active_chunks)

        db.commit()
        self.save()
        logger.info("FAISS vector store synchronized: %d vectors indexed.", self.index.ntotal)
        return True

vector_store = FAISSVectorStore()
