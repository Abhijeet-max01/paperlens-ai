from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ClassMetric(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int

class ConfusionMatrixSchema(BaseModel):
    labels: List[str]
    matrix: List[List[int]]

class RetrievalMetric(BaseModel):
    precision_at_3: float
    recall_at_3: float
    precision_at_5: float
    recall_at_5: float
    mrr: float
    sample_queries_evaluated: int

class EvalReportResponse(BaseModel):
    evaluated_at: str
    total_claim_pairs: int
    macro_f1: float
    weighted_f1: float
    accuracy: float
    class_metrics: Dict[str, ClassMetric]
    confusion_matrix: ConfusionMatrixSchema
    retrieval_metrics: Optional[RetrievalMetric] = None
    data_source_description: str
