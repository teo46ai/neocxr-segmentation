# apps/api/app/services/export.py
import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import numpy as np
from PIL import Image
from sqlalchemy.orm import Session

from app.models.models import Task, Annotation, Study, Instance
from app.core.config import settings

class ExportService:
    def __init__(self, db: Session):
        self.db = db
        self.export_dir = Path(settings.EXPORT_DIR)
        self.export_dir.mkdir(exist_ok=True)
    
    def create_export(
        self,
        task_ids: Optional[List[int]] = None,
        format: str = 'json',
        split_ratio: Dict[str, float] = {'train': 0.7, 'val': 0.15, 'test': 0.15}
    ) -> str:
        """Create export artifact"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        export_name = f"neocxr_export_{timestamp}"
        export_path = self.export_dir / export_name
        export_path.mkdir()
        
        # Get tasks to export
        query = self.db.query(Task).filter(Task.status == 'completed')
        if task_ids:
# apps/api/app/services/export.py (devam)
            query = query.filter(Task.id.in_(task_ids))
        
        tasks = query.all()
        
        if not tasks:
            raise ValueError("No completed tasks found for export")
        
        # Create splits
        np.random.shuffle(tasks)
        total = len(tasks)
        train_end = int(total * split_ratio['train'])
        val_end = train_end + int(total * split_ratio['val'])
        
        splits = {
            'train': tasks[:train_end],
            'val': tasks[train_end:val_end],
            'test': tasks[val_end:]
        }
        
        # Export based on format
        if format == 'json':
            self._export_json(export_path, splits)
        elif format == 'png':
            self._export_png(export_path, splits)
        elif format == 'dicom-seg':
            self._export_dicom_seg(export_path, splits)
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        # Create manifest
        manifest = {
            'export_name': export_name,
            'timestamp': timestamp,
            'format': format,
            'total_tasks': total,
            'splits': {k: len(v) for k, v in splits.items()},
            'split_ratio': split_ratio
        }
        
        with open(export_path / 'manifest.json', 'w') as f:
            json.dump(manifest, f, indent=2)
        
        # Create zip archive
        zip_path = self.export_dir / f"{export_name}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_path in export_path.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(export_path)
                    zf.write(file_path, arcname)
        
        # Clean up directory
        import shutil
        shutil.rmtree(export_path)
        
        return str(zip_path)
    
    def _export_json(self, export_path: Path, splits: Dict[str, List[Task]]):
        """Export annotations in JSON format"""
        for split_name, tasks in splits.items():
            split_dir = export_path / split_name
            split_dir.mkdir()
            
            annotations_list = []
            
            for task in tasks:
                study = task.study
                annotations = self.db.query(Annotation).filter(
                    Annotation.task_id == task.id
                ).all()
                
                # Build annotation document
                doc = {
                    'study_uid': study.study_uid,
                    'task_id': task.id,
                    'metadata': {
                        'patient_id': study.patient_id,
                        'study_date': study.study_date.isoformat() if study.study_date else None,
                        **study.meta_json
                    },
                    'instances': [],
                    'annotations': []
                }
                
                # Add instance info
                for instance in study.instances:
                    doc['instances'].append({
                        'sop_uid': instance.sop_uid,
                        'instance_number': instance.instance_number,
                        'meta': instance.meta_json
                    })
                
                # Add annotations
                for ann in annotations:
                    doc['annotations'].append({
                        'id': ann.id,
                        'type': ann.type,
                        'class_name': ann.ontology_class.name,
                        'class_id': ann.class_id,
                        'polarity': ann.polarity,
                        'payload': ann.payload_json,
                        'confidence': ann.confidence,
                        'notes': ann.notes
                    })
                
                annotations_list.append(doc)
            
            # Write split file
            with open(split_dir / f'{split_name}_annotations.json', 'w') as f:
                json.dump(annotations_list, f, indent=2)
    
    def _export_png(self, export_path: Path, splits: Dict[str, List[Task]]):
        """Export masks as PNG images"""
        for split_name, tasks in splits.items():
            split_dir = export_path / split_name
            images_dir = split_dir / 'images'
            masks_dir = split_dir / 'masks'
            images_dir.mkdir(parents=True)
            masks_dir.mkdir(parents=True)
            
            metadata = []
            
            for task in tasks:
                study = task.study
                instance = study.instances[0]  # Assume single instance per study
                
                # Copy original image
                import shutil
                image_name = f"{study.study_uid}.png"
                # Convert DICOM to PNG if needed
                # ... conversion logic ...
                
                # Generate mask from annotations
                annotations = self.db.query(Annotation).filter(
                    Annotation.task_id == task.id
                ).all()
                
                mask = self._create_mask_from_annotations(instance, annotations)
                mask_path = masks_dir / f"{study.study_uid}_mask.png"
                Image.fromarray(mask).save(mask_path)
                
                metadata.append({
                    'study_uid': study.study_uid,
                    'image': f"images/{image_name}",
                    'mask': f"masks/{study.study_uid}_mask.png",
                    'classes': list(set(ann.ontology_class.name for ann in annotations))
                })
            
            # Write metadata
            with open(split_dir / f'{split_name}_metadata.json', 'w') as f:
                json.dump(metadata, f, indent=2)
    
    def _create_mask_from_annotations(self, instance, annotations):
        """Create segmentation mask from annotations"""
        # Placeholder - implement actual mask generation
        # This would parse the annotation payloads and render them
        mask = np.zeros((512, 512), dtype=np.uint8)
        
        for ann in annotations:
            if ann.type == 'scribble':
                # Render scribble points
                points = ann.payload_json.get('points', [])
                # ... rendering logic ...
            elif ann.type == 'polyline':
                # Render polyline
                points = ann.payload_json.get('points', [])
                # ... rendering logic ...
        
        return mask