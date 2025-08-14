#!/bin/bash
# scripts/create_test_data.sh

echo "Creating test ontology..."
docker-compose exec api python -c "
from app.services.ontology import OntologyService, DEFAULT_ONTOLOGY
from app.core.database import SessionLocal
import tempfile

db = SessionLocal()
try:
    service = OntologyService(db)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(DEFAULT_ONTOLOGY)
        temp_path = f.name
    service.load_from_file(temp_path)
    print('Ontology loaded successfully!')
finally:
    db.close()
"

echo "Creating test user..."
docker-compose exec api python -c "
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import User

db = SessionLocal()
try:
    user = User(
        email='demo@neocxr.local',
        password_hash=get_password_hash('demo123'),
        full_name='Demo Annotator',
        role='annotator',
        is_active=True
    )
    db.add(user)
    db.commit()
    print('Demo user created: demo@neocxr.local / demo123')
except Exception as e:
    print(f'Error: {e}')
finally:
    db.close()
"

echo "Test data setup complete!"