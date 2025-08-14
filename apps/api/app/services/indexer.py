# apps/api/app/services/indexer.py
import os
import threading
import time
from pathlib import Path
from datetime import datetime
import pydicom
from PIL import Image
import numpy as np
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import Study, Instance, Task

class DicomHandler(FileSystemEventHandler):
    def __init__(self):
        self.processing_queue = []
        self.lock = threading.Lock()
        
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.dcm'):
            with self.lock:
                self.processing_queue.append(event.src_path)
    
    def process_queue(self):
        while True:
            files_to_process = []
            with self.lock:
                files_to_process = self.processing_queue[:]
                self.processing_queue.clear()
            
            for file_path in files_to_process:
                try:
                    self.process_dicom(file_path)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
            
            time.sleep(2)  # Check every 2 seconds
    
    def process_dicom(self, file_path: str):
        db = SessionLocal()
        try:
            # Read DICOM file
            ds = pydicom.dcmread(file_path)
            
            # Extract metadata
            study_uid = str(ds.StudyInstanceUID)
            sop_uid = str(ds.SOPInstanceUID)
            
            # Check if study exists
            study = db.query(Study).filter(Study.study_uid == study_uid).first()
            if not study:
                # Create new study
                study = Study(
                    study_uid=study_uid,
                    patient_id=str(getattr(ds, 'PatientID', 'Unknown')),
                    patient_name=str(getattr(ds, 'PatientName', 'Unknown')),
                    study_date=self._parse_dicom_date(getattr(ds, 'StudyDate', None)),
                    meta_json={
                        'modality': str(getattr(ds, 'Modality', '')),
                        'institution': str(getattr(ds, 'InstitutionName', '')),
                        'manufacturer': str(getattr(ds, 'Manufacturer', '')),
                    },
                    path_root=os.path.dirname(file_path)
                )
                db.add(study)
                db.flush()
                
                # Create task for new study
                task = Task(study_id=study.id)
                db.add(task)
            
            # Check if instance exists
            instance = db.query(Instance).filter(Instance.sop_uid == sop_uid).first()
            if not instance:
                # Copy to store directory
                store_path = self._copy_to_store(file_path, study_uid, sop_uid)
                
                # Generate thumbnail
                thumbnail_path = self._generate_thumbnail(ds, study_uid, sop_uid)
                
                # Create instance
                instance = Instance(
                    study_id=study.id,
                    sop_uid=sop_uid,
                    instance_number=int(getattr(ds, 'InstanceNumber', 1)),
                    path_abs=store_path,
                    frame_count=int(getattr(ds, 'NumberOfFrames', 1)),
                    meta_json={
                        'gestational_age': self._extract_ga(ds),
                        'birth_weight': self._extract_bw(ds),
                        'acquisition_datetime': str(getattr(ds, 'AcquisitionDateTime', '')),
                        'view_position': str(getattr(ds, 'ViewPosition', 'AP')),
                    },
                    thumbnail_path=thumbnail_path
                )
                db.add(instance)
            
            db.commit()
            print(f"Processed DICOM: {sop_uid}")
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def _parse_dicom_date(self, date_str):
        if not date_str:
            return None
        try:
            return datetime.strptime(str(date_str), '%Y%m%d')
        except:
            return None
    
    def _copy_to_store(self, src_path: str, study_uid: str, sop_uid: str) -> str:
        store_dir = Path(settings.DATA_STORE) / study_uid
        store_dir.mkdir(parents=True, exist_ok=True)
        
        dst_path = store_dir / f"{sop_uid}.dcm"
        import shutil
        shutil.copy2(src_path, dst_path)
        
        return str(dst_path)
    
    def _generate_thumbnail(self, ds, study_uid: str, sop_uid: str) -> str:
        cache_dir = Path(settings.CACHE_DIR) / study_uid
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        thumb_path = cache_dir / f"{sop_uid}_thumb.jpg"
        
        # Get pixel array
        pixel_array = ds.pixel_array
        
        # Normalize and resize
        if len(pixel_array.shape) == 3:
            pixel_array = pixel_array[0]  # First frame only
        
        # Window level adjustment
        window_center = float(getattr(ds, 'WindowCenter', pixel_array.mean()))
        window_width = float(getattr(ds, 'WindowWidth', pixel_array.max() - pixel_array.min()))
        
        img_min = window_center - window_width / 2
        img_max = window_center + window_width / 2
        
        pixel_array = np.clip(pixel_array, img_min, img_max)
        pixel_array = ((pixel_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
        
        # Create thumbnail
        img = Image.fromarray(pixel_array)
        img.thumbnail((256, 256), Image.Resampling.LANCZOS)
        img.save(thumb_path, 'JPEG', quality=85)
        
        return str(thumb_path)
    
    def _extract_ga(self, ds):
        # Try to extract gestational age from DICOM tags or description
        description = str(getattr(ds, 'StudyDescription', ''))
        # Simple pattern matching - adjust based on actual data
        import re
        ga_match = re.search(r'(\d+)w', description, re.IGNORECASE)
        if ga_match:
            return int(ga_match.group(1))
        return None
    
    def _extract_bw(self, ds):
        # Similar extraction for birth weight
        description = str(getattr(ds, 'StudyDescription', ''))
        bw_match = re.search(r'(\d+)g', description, re.IGNORECASE)
        if bw_match:
            return int(bw_match.group(1))
        return None

class IndexerService:
    def __init__(self):
        self.observer = Observer()
        self.handler = DicomHandler()
        self.process_thread = None
        
    def start(self):
        inbox_path = settings.DATA_INBOX
        if not os.path.exists(inbox_path):
            os.makedirs(inbox_path, exist_ok=True)
        
        self.observer.schedule(self.handler, inbox_path, recursive=True)
        self.observer.start()
        
        # Start processing thread
        self.process_thread = threading.Thread(target=self.handler.process_queue, daemon=True)
        self.process_thread.start()
        
        print(f"Indexer watching: {inbox_path}")
    
    def stop(self):
        self.observer.stop()
        self.observer.join()