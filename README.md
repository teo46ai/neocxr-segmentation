# NeoCXR Segmentation System

**Neonatal chest X-ray segmentation and annotation platform** for multi-user collaborative labeling.

---

## 🚀 Features

- 🏥 **DICOM ingestion** with automatic indexing  
- 🎨 **Interactive scribble-based segmentation**  
- 📍 **Device/line annotation** with polylines  
- 👥 **Multi-user support** with role-based access  
- 📊 **Real-time statistics dashboard**  
- 🌐 **Turkish/English interface**  
- 📦 **Export to multiple formats**: JSON, PNG, DICOM-SEG  

---

## 🛠 Quick Start

### Prerequisites
- Docker & Docker Compose
- 8GB RAM minimum
- 20GB disk space for data

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/neocxr-segmentation
cd neocxr-segmentation

# 2. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Update environment variables in .env files

# 4. Start the services
docker-compose up -d

# 5. Initialize the database
docker-compose exec api python -m app.scripts.init_db

# 6. Load default ontology
docker-compose exec api python -m app.scripts.load_ontology
```

**Access the application:** [http://localhost](http://localhost)  

**Default Credentials**  
```
Email: admin@neocxr.local
Password: admin123
```

---

## 📂 Usage

### Adding DICOM Files
```bash
cp your-dicom-files/*.dcm ./data/neocxr_inbox/
```
Files will be automatically processed and appear in the task queue.

### Annotation Workflow
1. Login and navigate to **Dashboard**  
2. Click **"Segmentlemeye Başla"** to get the next case  
3. Use annotation tools:
   - **P**: Positive brush (green)
   - **N**: Negative brush (red)
   - **E**: Eraser
   - **[ / ]**: Adjust brush size
   - **Space**: Preview segmentation
   - **Ctrl+S**: Save draft
4. Complete annotation and submit.

---

## ⌨ Keyboard Shortcuts

| Key        | Action                 |
|------------|------------------------|
| P          | Positive brush         |
| N          | Negative brush         |
| E          | Eraser                 |
| [ / ]      | Decrease/Increase size |
| Z / Y      | Undo/Redo              |
| Space      | Preview segmentation   |
| Ctrl+S     | Save draft              |
| Ctrl+Enter | Submit annotation      |

---

## 🏗 Architecture

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS  
- **Backend:** FastAPI, Python 3.11, PostgreSQL  
- **Medical Imaging:** Cornerstone.js, pydicom  
- **Infrastructure:** Docker, Nginx  

### Project Structure
```
neocxr-segmentation/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # FastAPI backend
├── packages/
│   ├── core/         # Shared contracts
│   ├── ui/           # UI components
│   └── viewer-tools/ # Annotation tools
├── data/             # Data volumes
└── infra/            # Infrastructure configs
```

---

## 📜 API Documentation

- **Swagger UI:** [http://localhost/api/docs](http://localhost/api/docs)  
- **ReDoc:** [http://localhost/api/redoc](http://localhost/api/redoc)  

**Key Endpoints**
- `POST /api/v1/auth/login` — User authentication  
- `GET /api/v1/stats/overview` — Dashboard statistics  
- `POST /api/v1/tasks/next` — Get next annotation task  
- `POST /api/v1/annotations` — Save annotations  
- `POST /api/v1/exports` — Create export artifact  

---

## ⚙ Configuration

### Feature Flags
```env
FEATURE_ADJUDICATION=true    # Enable adjudication workflow
FEATURE_SEG_PREVIEW=true     # Enable segmentation preview
FEATURE_EXPORT=true          # Enable data export
```

### Ontology Configuration
Edit `config/ontology.yaml`:
```yaml
pathologies:
  - name: Pneumothorax
    name_tr: Pnömotoraks
    color: '#ff0000'
    priority: 1
    
devices:
  - name: ETT
    name_tr: Endotrakeal Tüp
    color: '#0066ff'
    priority: 101
```

---

## 🧑‍💻 Development

### Local Development

**Backend:**
```bash
cd apps/api
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

---

## ✅ Testing

```bash
# Backend tests
cd apps/api
pytest

# Frontend tests
cd apps/web
npm test

# E2E tests
npm run test:e2e
```

---

## 📦 Building for Production
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🛠 Troubleshooting

- **DICOM files not appearing:** Check inbox permissions and logs  
- **Login fails:** Verify `JWT_SECRET` is set  
- **Viewer black screen:** Check CORS settings  

**View Logs**
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

---

## 🤝 Contributing
1. Fork the repository  
2. Create a feature branch:  
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:  
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push to branch:  
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request  

---

## 📄 License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 📬 Support
- GitHub Issues: [https://github.com/your-org/neocxr-segmentation/issues](https://github.com/your-org/neocxr-segmentation/issues)  
- Email: support@neocxr.local  
