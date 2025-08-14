# apps/api/app/api/v1/api.py
from fastapi import APIRouter

from app.api.v1.endpoints import auth, tasks, studies, stats, annotations, dicom, ontology

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(studies.router, prefix="/studies", tags=["studies"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(annotations.router, prefix="/annotations", tags=["annotations"])
api_router.include_router(dicom.router, prefix="/dicom", tags=["dicom"])
api_router.include_router(ontology.router, prefix="/ontology", tags=["ontology"])