# apps/api/app/services/ontology.py
import json
import yaml
from pathlib import Path
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.models.models import OntologyClass
from app.core.config import settings

class OntologyService:
    def __init__(self, db: Session):
        self.db = db
        
    def load_from_file(self, file_path: str):
        """Load ontology from YAML or JSON file"""
        path = Path(file_path)
        
        if path.suffix in ['.yaml', '.yml']:
            with open(path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
        elif path.suffix == '.json':
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")
        
        self._import_ontology(data)
    
    def _import_ontology(self, data: Dict):
        """Import ontology data into database"""
        # Clear existing ontology
        self.db.query(OntologyClass).delete()
        
        # Import pathologies
        for idx, pathology in enumerate(data.get('pathologies', [])):
            onto_class = OntologyClass(
                name=pathology['name'],
                name_tr=pathology.get('name_tr', pathology['name']),
                kind='pathology',
                color=pathology.get('color', '#ff0000'),
                priority=pathology.get('priority', idx),
                is_active=pathology.get('active', True)
            )
            self.db.add(onto_class)
        
        # Import devices
        for idx, device in enumerate(data.get('devices', [])):
            onto_class = OntologyClass(
                name=device['name'],
                name_tr=device.get('name_tr', device['name']),
                kind='device',
                color=device.get('color', '#0000ff'),
                priority=device.get('priority', idx + 100),
                is_active=device.get('active', True)
            )
            self.db.add(onto_class)
        
        self.db.commit()
    
    def get_active_classes(self, kind: Optional[str] = None) -> List[OntologyClass]:
        """Get active ontology classes"""
        query = self.db.query(OntologyClass).filter(OntologyClass.is_active == True)
        
        if kind:
            query = query.filter(OntologyClass.kind == kind)
        
        return query.order_by(OntologyClass.priority).all()
    
    def export_ontology(self, format: str = 'yaml') -> str:
        """Export current ontology"""
        pathologies = []
        devices = []
        
        for onto_class in self.db.query(OntologyClass).order_by(OntologyClass.priority):
            item = {
                'name': onto_class.name,
                'name_tr': onto_class.name_tr,
                'color': onto_class.color,
                'priority': onto_class.priority,
                'active': onto_class.is_active
            }
            
            if onto_class.kind == 'pathology':
                pathologies.append(item)
            else:
                devices.append(item)
        
        data = {
            'version': '1.0',
            'pathologies': pathologies,
            'devices': devices
        }
        
        if format == 'yaml':
            return yaml.dump(data, allow_unicode=True, sort_keys=False)
        else:
            return json.dumps(data, ensure_ascii=False, indent=2)

# Default ontology file
DEFAULT_ONTOLOGY = """
version: '1.0'
pathologies:
  - name: Pneumothorax
    name_tr: Pnömotoraks
    color: '#ff0000'
    priority: 1
    active: true
  - name: Atelectasis
    name_tr: Atelektazi
    color: '#ff6600'
    priority: 2
    active: true
  - name: Ground Glass Opacity
    name_tr: Buzlu Cam Opasitesi
    color: '#ff9900'
    priority: 3
    active: true
  - name: Consolidation
    name_tr: Konsolidasyon
    color: '#ffcc00'
    priority: 4
    active: true
  - name: Pleural Effusion
    name_tr: Plevral Efüzyon
    color: '#9900ff'
    priority: 5
    active: true
devices:
  - name: ETT
    name_tr: Endotrakeal Tüp
    color: '#0066ff'
    priority: 101
    active: true
  - name: UVC
    name_tr: Umbilikal Ven Kateteri
    color: '#00ccff'
    priority: 102
    active: true
  - name: UAC
    name_tr: Umbilikal Arter Kateteri
    color: '#00ffcc'
    priority: 103
    active: true
  - name: NG Tube
    name_tr: Nazogastrik Sonda
    color: '#00ff66'
    priority: 104
    active: true
"""