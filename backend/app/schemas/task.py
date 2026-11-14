from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class TaskResponse(BaseModel):
    id: str
    paper_id: Optional[str] = None
    task_type: str
    status: str
    progress_percent: float
    current_stage: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    stages: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
