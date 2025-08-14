# apps/api/app/api/v1/endpoints/stats.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from typing import Dict

from app.core.deps import get_db, get_current_user
from app.models.models import Task, Study, Annotation, User, TaskStatus

router = APIRouter()

@router.get("/overview")
async def get_overview_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Get dashboard statistics"""
    
    # Total studies
    total_studies = db.query(Study).count()
    
    # Completed tasks
    completed_tasks = db.query(Task).filter(
        Task.status == TaskStatus.COMPLETED
    ).count()
    
    # Positive findings vocabulary (unique positive pathology annotations)
    positive_vocab = db.query(Annotation.class_id).filter(
        and_(
            Annotation.polarity == 'pos',
            Annotation.type == 'scribble'
        )
    ).distinct().count()
    
    # Completed by current user
    done_by_me = db.query(Task).filter(
        and_(
            Task.assignee_id == current_user.id,
            Task.status == TaskStatus.COMPLETED
        )
    ).count()
    
    # Queued tasks
    queued = db.query(Task).filter(
        Task.status == TaskStatus.QUEUED
    ).count()
    
    # Today's completed
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_done = db.query(Task).filter(
        and_(
            Task.status == TaskStatus.COMPLETED,
            Task.updated_at >= today_start
        )
    ).count()
    
    return {
        'total': total_studies,
        'done': completed_tasks,
        'positive_vocab': positive_vocab,
        'done_by_me': done_by_me,
        'queued': queued,
        'today_done': today_done
    }

@router.get("/timeline")
async def get_timeline_stats(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get completion timeline for charts"""
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Get daily counts
    daily_stats = []
    current_date = start_date
    
    while current_date <= end_date:
        day_start = datetime.combine(current_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        
        count = db.query(Task).filter(
            and_(
                Task.status == TaskStatus.COMPLETED,
                Task.updated_at >= day_start,
                Task.updated_at < day_end
            )
        ).count()
        
        daily_stats.append({
            'date': current_date.isoformat(),
            'count': count
        })
        
        current_date += timedelta(days=1)
    
    return daily_stats

@router.get("/pathology-distribution")
async def get_pathology_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get distribution of pathology findings"""
    results = db.query(
        Annotation.class_id,
        func.count(Annotation.id).label('count')
    ).filter(
        and_(
            Annotation.type == 'scribble',
            Annotation.polarity == 'pos'
        )
    ).group_by(Annotation.class_id).all()
    
    distribution = []
    for class_id, count in results:
        onto_class = db.query(OntologyClass).filter(
            OntologyClass.id == class_id
        ).first()
        
        if onto_class:
            distribution.append({
                'name': onto_class.name_tr or onto_class.name,
                'count': count,
                'color': onto_class.color
            })
    
    return distribution