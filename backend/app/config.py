import os
from pathlib import Path
from pydantic_settings import BaseSettings
import torch

# Force local offline cache for fast loading without network check timeouts
os.environ["HF_HUB_OFFLINE"] = os.environ.get("HF_HUB_OFFLINE", "1")
os.environ["TRANSFORMERS_OFFLINE"] = os.environ.get("TRANSFORMERS_OFFLINE", "1")

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
FAISS_DIR = DATA_DIR / "faiss_index"
EVAL_DIR = DATA_DIR / "evaluation"

for d in [DATA_DIR, UPLOAD_DIR, FAISS_DIR, EVAL_DIR]:
    d.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "PaperLens-AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Storage paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    FAISS_DIR: Path = FAISS_DIR
    EVAL_DIR: Path = EVAL_DIR
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'paperlens.db'}"
    
    # Models & Hardware
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    NLI_MODEL_NAME: str = "cross-encoder/nli-deberta-v3-small"
    SPACY_MODEL_NAME: str = "en_core_web_sm"
    
    # Tesseract configuration
    TESSERACT_PATH: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    
    # NLP & Chunker thresholds
    CHUNK_SIZE: int = 300
    CHUNK_OVERLAP: int = 50
    MIN_OCR_WORD_COUNT: int = 40
    NLI_CANDIDATE_SIMILARITY_THRESHOLD: float = 0.60
    MAX_CANDIDATE_PAIRS_PER_CLAIM: int = 5
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"


settings = Settings()
