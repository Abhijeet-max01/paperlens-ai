import logging
from typing import List, Any
from app.core.model_manager import model_manager

logger = logging.getLogger(__name__)

class SpacyNLPWrapper:
    def __init__(self):
        pass

    @property
    def nlp(self):
        return model_manager.get_spacy()

    def split_sentences(self, text: str) -> List[str]:
        """
        Splits text into coherent sentences using spaCy sentence boundary detection.
        """
        if not text or not text.strip():
            return []
        
        doc = self.nlp(text)
        return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

    def parse_doc(self, text: str):
        """
        Returns full spaCy Doc with dependency trees, POS tags, and tokens.
        """
        return self.nlp(text)

spacy_nlp = SpacyNLPWrapper()
