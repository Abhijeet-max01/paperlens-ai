import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sentence_transformers import SentenceTransformer, CrossEncoder
from app.config import settings

print(f"Downloading and caching embedding model: {settings.EMBEDDING_MODEL_NAME}...")
st_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device="cpu")
print("Embedding model cached successfully!")

print(f"Downloading and caching NLI model: {settings.NLI_MODEL_NAME}...")
nli_model = CrossEncoder(settings.NLI_MODEL_NAME, device="cpu")
print("NLI model cached successfully!")

print("All models cached locally on disk.")
