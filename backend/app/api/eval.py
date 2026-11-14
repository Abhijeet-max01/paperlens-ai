from fastapi import APIRouter
from app.schemas.eval import EvalReportResponse
from app.core.eval_engine import eval_engine

router = APIRouter(prefix="/eval", tags=["Evaluation"])

@router.get("/benchmark-results", response_model=EvalReportResponse)
def get_benchmark_evaluation():
    """
    Executes empirical evaluation against curated gold-standard benchmark.
    Returns real Precision, Recall, F1, and Confusion Matrix.
    """
    report = eval_engine.evaluate_nli_benchmark()
    return EvalReportResponse(**report)
