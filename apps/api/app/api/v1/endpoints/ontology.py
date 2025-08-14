# apps/api/app/api/v1/endpoints/ontology.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.deps import get_db, get_current_user
from app.models.models import OntologyClass, User
from app.schemas.ontology import OntologyClassResponse

router = APIRouter()

@router.get("/classes", response_model=List[OntologyClassResponse])
async def get_ontology_classes(
    kind: Optional[str] = Query(None, description="Filter by kind: pathology or device"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ontology classes"""
    query = db.query(OntologyClass).filter(OntologyClass.is_active == True)
    
    if kind:
        query = query.filter(OntologyClass.kind == kind)
    
    classes = query.order_by(OntologyClass.priority).all()
    
    return [
        {
            "id": cls.id,
            "name": cls.name,
            "name_tr": cls.name_tr,
            "kind": cls.kind,
            "color": cls.color,
            "priority": cls.priority,
            "is_active": cls.is_active
        }
        for cls in classes
    ]

@router.get("/classes/{class_id}", response_model=OntologyClassResponse)
async def get_ontology_class(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific ontology class"""
    cls = db.query(OntologyClass).filter(OntologyClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Ontology class not found")
    
    return {
        "id": cls.id,
        "name": cls.name,
        "name_tr": cls.name_tr,
        "kind": cls.kind,
        "color": cls.color,
        "priority": cls.priority,
        "is_active": cls.is_active
    }