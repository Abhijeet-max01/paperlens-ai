import logging
from typing import List
import numpy as np
from app.core.model_manager import model_manager

logger = logging.getLogger(__name__)

class EmbeddingEngine:
    def __init__(self):
        pass

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        if not texts:
            return np.empty((0, 384), dtype=np.float32)
        
        model = model_manager.get_embedding_model()
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embeddings.astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        model = model_manager.get_embedding_model()
        # BGE models recommend query instruction prefix for semantic passage retrieval
        formatted_query = f"Represent this sentence for searching relevant passages: {query}"
        embedding = model.encode(
            [formatted_query],
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embedding[0].astype(np.float32)

embedding_engine = EmbeddingEngine()
