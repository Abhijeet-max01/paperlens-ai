import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.core.vector_store import vector_store

router = APIRouter(prefix="/search", tags=["Search"])

def highlight_text(text: str, query: str) -> str:
    words = [re.escape(w) for w in query.split() if len(w) > 2]
    if not words:
        return text[:300] + "..." if len(text) > 300 else text
    
    pattern = re.compile(rf"\b({'|'.join(words)})\b", re.IGNORECASE)
    
    # Locate first match to center snippet
    match = pattern.search(text)
    if match:
        start_idx = max(0, match.start() - 100)
        end_idx = min(len(text), match.end() + 200)
        snippet = text[start_idx:end_idx]
        if start_idx > 0:
            snippet = "..." + snippet
        if end_idx < len(text):
            snippet = snippet + "..."
        return snippet
    
    return text[:300] + "..." if len(text) > 300 else text

@router.post("/semantic", response_model=SearchResponse)
def semantic_search(request: SearchRequest, db: Session = Depends(get_db)):
    results = vector_store.search(
        query=request.query,
        top_k=request.top_k,
        min_score=request.min_similarity,
        paper_ids=request.paper_ids
    )

    items = []
    for r in results:
        items.append(SearchResultItem(
            chunk_id=r["chunk_id"],
            paper_id=r["paper_id"],
            paper_title=r["paper_title"],
            page_number=r["page_number"],
            section_name=r["section_name"],
            content=r["content"],
            similarity_score=r["similarity_score"],
            highlighted_snippet=highlight_text(r["content"], request.query)
        ))

    return SearchResponse(
        query=request.query,
        total_results=len(items),
        results=items
    )
