import os
import logging
import threading
from typing import Optional
import torch

from app.config import settings

logger = logging.getLogger(__name__)

class ModelManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        
        self.device = settings.DEVICE
        if self.device == "cpu":
            num_threads = max(1, min(8, os.cpu_count() or 4))
            torch.set_num_threads(num_threads)
            logger.info("Configured PyTorch CPU threads to %d", num_threads)
        else:
            logger.info("Using GPU acceleration on device: %s", self.device)

        self._spacy_nlp = None
        self._embedding_model = None
        self._nli_model = None
        self._model_lock = threading.Lock()
        self._initialized = True

    def get_spacy(self):
        with self._model_lock:
            if self._spacy_nlp is None:
                import spacy
                try:
                    logger.info("Loading spaCy model: %s", settings.SPACY_MODEL_NAME)
                    self._spacy_nlp = spacy.load(settings.SPACY_MODEL_NAME)
                except Exception as e:
                    logger.warning("spaCy model '%s' not found locally. Installing or falling back to blank model. Error: %s", settings.SPACY_MODEL_NAME, e)
                    try:
                        from spacy.cli import download
                        download(settings.SPACY_MODEL_NAME)
                        self._spacy_nlp = spacy.load(settings.SPACY_MODEL_NAME)
                    except Exception as inner_e:
                        logger.error("Failed to auto-download spaCy model: %s. Using blank 'en' model.", inner_e)
                        self._spacy_nlp = spacy.blank("en")
                        if "sentencizer" not in self._spacy_nlp.pipe_names:
                            self._spacy_nlp.add_pipe("sentencizer")
            return self._spacy_nlp

    def get_embedding_model(self):
        with self._model_lock:
            if self._embedding_model is None:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading SentenceTransformer: %s on %s", settings.EMBEDDING_MODEL_NAME, self.device)
                try:
                    self._embedding_model = SentenceTransformer(
                        settings.EMBEDDING_MODEL_NAME,
                        device=self.device,
                        local_files_only=True
                    )
                except Exception:
                    self._embedding_model = SentenceTransformer(
                        settings.EMBEDDING_MODEL_NAME,
                        device=self.device
                    )
            return self._embedding_model

    def get_nli_model(self):
        with self._model_lock:
            if self._nli_model is None:
                from sentence_transformers import CrossEncoder
                logger.info("Loading Cross-Encoder NLI: %s on %s", settings.NLI_MODEL_NAME, self.device)
                try:
                    self._nli_model = CrossEncoder(
                        settings.NLI_MODEL_NAME,
                        device=self.device,
                        num_labels=3,
                        local_files_only=True
                    )
                except Exception:
                    self._nli_model = CrossEncoder(
                        settings.NLI_MODEL_NAME,
                        device=self.device,
                        num_labels=3
                    )
            return self._nli_model

    def unload(self, model_name: Optional[str] = None):
        with self._model_lock:
            if model_name in (None, "spacy"):
                self._spacy_nlp = None
            if model_name in (None, "embedding"):
                self._embedding_model = None
            if model_name in (None, "nli"):
                self._nli_model = None
            
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            import gc
            gc.collect()
            logger.info("Unloaded models: %s", model_name or "ALL")

model_manager = ModelManager()
