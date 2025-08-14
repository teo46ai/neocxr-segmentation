# apps/api/app/models/models.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base

class UserRole(str, enum.Enum):
    ANNOTATOR = "annotator"
    ADJUDICATOR = "adjudicator"
    PM = "pm"
    ADMIN = "admin"

class TaskStatus(str, enum.Enum):
    QUEUED = "queued"
    LOCKED = "locked"
    COMPLETED = "completed"
    NEEDS_REVIEW = "needs_review"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.ANNOTATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tasks = relationship("Task", back_populates="assignee")
    annotations = relationship("Annotation", back_populates="user")

class Study(Base):
    __tablename__ = "studies"
    
    id = Column(Integer, primary_key=True)
    study_uid = Column(String, unique=True, index=True)
    patient_id = Column(String)
    patient_name = Column(String)
    study_date = Column(DateTime)
    meta_json = Column(JSON)
    path_root = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    instances = relationship("Instance", back_populates="study")
    tasks = relationship("Task", back_populates="study")

class Instance(Base):
    __tablename__ = "instances"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"))
    sop_uid = Column(String, unique=True, index=True)
    instance_number = Column(Integer)
    path_abs = Column(String)
    frame_count = Column(Integer, default=1)
    meta_json = Column(JSON)
    thumbnail_path = Column(String)
    
    study = relationship("Study", back_populates="instances")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.QUEUED)
    lock_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    study = relationship("Study", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")
    annotations = relationship("Annotation", back_populates="task")

class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)  # scribble, polyline, mask
    class_id = Column(Integer, ForeignKey("ontology_classes.id"))
    polarity = Column(String, nullable=True)  # pos, neg
    payload_json = Column(JSON)
    confidence = Column(Integer, default=100)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task = relationship("Task", back_populates="annotations")
    user = relationship("User", back_populates="annotations")
    ontology_class = relationship("OntologyClass")

class OntologyClass(Base):
    __tablename__ = "ontology_classes"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    name_tr = Column(String)
    kind = Column(String)  # pathology, device
    color = Column(String)
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)