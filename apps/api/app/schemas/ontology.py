# apps/api/app/schemas/ontology.py
from pydantic import BaseModel
from typing import Optional

class OntologyClassBase(BaseModel):
    name: str
    name_tr: Optional[str] = None
    kind: str  # pathology or device
    color: str
    priority: int = 0
    is_active: bool = True

class OntologyClassCreate(OntologyClassBase):
    pass

class OntologyClassUpdate(BaseModel):
    name: Optional[str] = None
    name_tr: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class OntologyClassResponse(OntologyClassBase):
    id: int
    
    class Config:
        from_attributes = True