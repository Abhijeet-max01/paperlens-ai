import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import BackgroundTask
from app.schemas.task import TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_status(task_id: str, db: Session = Depends(get_db)):
    task = db.query(BackgroundTask).filter(BackgroundTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    stages = []
    if task.stages_json:
        try:
            stages = json.loads(task.stages_json)
        except Exception:
            stages = []

    return TaskResponse(
        id=task.id,
        paper_id=task.paper_id,
        task_type=task.task_type,
        status=task.status,
        progress_percent=task.progress_percent,
        current_stage=task.current_stage,
        error_message=task.error_message,
        created_at=task.created_at,
        updated_at=task.updated_at,
        stages=stages
    )
