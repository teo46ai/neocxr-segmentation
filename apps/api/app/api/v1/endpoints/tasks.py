# apps/api/app/api/v1/endpoints/tasks.py
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.deps import get_db, get_current_user
from app.models.models import Task, Study, TaskStatus, User
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate

router = APIRouter()

@router.post("/next", response_model=TaskResponse)
async def get_next_task(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Release expired locks
    expired_time = datetime.utcnow() - timedelta(minutes=30)
    db.query(Task).filter(
        and_(
            Task.status == TaskStatus.LOCKED,
            Task.lock_expires_at < datetime.utcnow()
        )
    ).update({
        "status": TaskStatus.QUEUED,
        "assignee_id": None,
        "lock_expires_at": None
    })
    db.commit()
    
    # Get next available task
    task = db.query(Task).filter(
        Task.status == TaskStatus.QUEUED
    ).order_by(Task.created_at).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Kuyrukta bekleyen görev yok")
    
    # Lock task
    task.status = TaskStatus.LOCKED
    task.assignee_id = current_user.id
    task.lock_expires_at = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    db.refresh(task)
    
    return task

@router.post("/{task_id}/complete")
async def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        and_(
            Task.id == task_id,
            Task.assignee_id == current_user.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    task.status = TaskStatus.COMPLETED
    task.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "message": "Görev tamamlandı"}

@router.post("/{task_id}/release")
async def release_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        and_(
            Task.id == task_id,
            Task.assignee_id == current_user.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    task.status = TaskStatus.QUEUED
    task.assignee_id = None
    task.lock_expires_at = None
    db.commit()
    
    return {"status": "success", "message": "Görev serbest bırakıldı"}