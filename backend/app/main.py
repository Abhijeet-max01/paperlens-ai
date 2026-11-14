import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.logging_config import setup_logging
from app.db.session import init_db
from app.api import papers, tasks, search, claims, nli, gaps, qa, eval, system

logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing %s v%s database & models...", settings.PROJECT_NAME, settings.VERSION)
    init_db()
    
    # Reconcile any interrupted tasks and synchronize FAISS vectors with database
    from app.db.session import SessionLocal
    from app.core.vector_store import vector_store
    from app.db.models import Paper, BackgroundTask
    db = SessionLocal()
    try:
        stuck_tasks = db.query(BackgroundTask).filter(BackgroundTask.status.in_(["RUNNING", "PENDING"])).all()
        for st in stuck_tasks:
            st.status = "FAILED"
            st.error_message = "Task interrupted by previous server restart."
        stuck_papers = db.query(Paper).filter(Paper.processing_status == "PROCESSING").all()
        for sp in stuck_papers:
            if not sp.chunks:
                sp.processing_status = "FAILED"
                sp.error_message = "Processing was interrupted by server shutdown."
        db.commit()
        vector_store.sync_with_db(db)
    except Exception as e:
        logger.warning("Startup reconciliation note: %s", e)
    finally:
        db.close()

    logger.info("Database & FAISS synchronization verified.")
    yield
    logger.info("Shutting down %s...", settings.PROJECT_NAME)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-Research-Paper Analysis Platform with NLI Contradiction Detection & Verified Citations.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all for smooth local connection
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(papers.router, prefix=settings.API_PREFIX)
app.include_router(tasks.router, prefix=settings.API_PREFIX)
app.include_router(search.router, prefix=settings.API_PREFIX)
app.include_router(claims.router, prefix=settings.API_PREFIX)
app.include_router(nli.router, prefix=settings.API_PREFIX)
app.include_router(gaps.router, prefix=settings.API_PREFIX)
app.include_router(qa.router, prefix=settings.API_PREFIX)
app.include_router(eval.router, prefix=settings.API_PREFIX)
app.include_router(system.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
