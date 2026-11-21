# CivicTrack Karnataka – AI-Powered Government Project Transparency & Accountability System

CivicTrack Karnataka is a full-stack civic technology web application created to monitor, analyze, and visualize publicly funded government development projects across Karnataka, India.

---

## 🏛️ Key Features

- **Public Citizen Dashboard**: Real-time KPI metrics on total approved budget, reported expenditure, ongoing/completed initiatives, and delay/anomaly alerts.
- **Project Directory & Precision Filters**: Search projects by district, taluk, department, category, financial year, and status. Transparent handling of unrecorded data ("Not available in source" rather than artificial zeros).
- **Interactive Karnataka Geo-Map**: Leaflet-powered GIS mapping displaying projects with verified coordinates and distinctly labeled district-level centroids.
- **Financial Transparency Analytics**: Segregated accounting of Approved Budget, Released Funds, Awarded Contract Values, and Reported Actual Expenditure.
- **Dual AI Engine**:
  - **Project Delay Risk Prediction**: Explainable decision factors combining rule-based heuristics and a trained Scikit-Learn Classifier.
  - **Financial Anomaly Detection**: Isolation Forest and heuristic boundary analysis identifying unusual expenditure patterns with neutral, objective terminology.
  - **Construction Vision Studio**: OpenCV comparison and structural change detection between dated project site photographs.
- **Administrative Portal**: Protected role-based portal with CSV/Excel batch ingestion, header mapping, duplicate detection, and audit logs.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.11+) or `uv` package manager

### 1. Backend Setup
```bash
cd backend
# Create virtual environment and install dependencies via uv
uv venv
uv pip install -e .
# Alternatively using standard pip
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📚 Documentation
- [Architecture & Design Details](file:///c:/AI_GOV/docs/architecture.md)
- [Official Data Sources & Ethics Guide](file:///c:/AI_GOV/docs/data_sources.md)
- [REST API Specifications](file:///c:/AI_GOV/docs/api_documentation.md)
- [Testing & Quality Assurance Report](file:///c:/AI_GOV/docs/testing_report.md)
