# CivicTrack Karnataka – API Reference

The backend exposes an interactive OpenAPI Swagger UI at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

## 1. Public Endpoints (No Authentication Required)

### Health Check
- `GET /api/health`
  - Returns backend system status, database connectivity, and timestamp.

### Projects
- `GET /api/projects`
  - Query parameters:
    - `page` (default 1), `limit` (default 20, max 100)
    - `search` (text search in project name, department, taluk)
    - `district` (e.g. "Bengaluru Urban", "Mysuru", "Belagavi")
    - `department` (e.g. "Public Works Department", "RDPR")
    - `category` (e.g. "Roads & Bridges", "Rural Water Supply", "Healthcare")
    - `status` ("PLANNED", "ONGOING", "COMPLETED", "DELAYED", "SUSPENDED")
    - `financial_year` (e.g. "2023-24", "2024-25")
    - `min_budget`, `max_budget`
    - `sort_by` ("budget_desc", "budget_asc", "progress_desc", "recent")
  - Returns: Paginated project array with metadata. Missing attributes output as `null` or explicit `"Not available in source"`.

- `GET /api/projects/{project_id}`
  - Returns: Complete project detail including location coordinates/precision, dates, active risk score, source URL, and audit trail.

- `GET /api/projects/{project_id}/finance`
  - Returns: Financial breakdown across financial years: approved amount, released funds, reported expenditure, awarded contract value, and source references.

- `GET /api/projects/{project_id}/progress`
  - Returns: Historical progress updates, percentage progression, milestone notes, and reporting dates.

### Analytics
- `GET /api/analytics/overview`
  - Returns: High-level KPI summary cards:
    - `total_projects_tracked`
    - `total_approved_budget`
    - `total_reported_expenditure`
    - `completed_count`
    - `ongoing_count`
    - `delay_risk_count`
    - `financial_review_count`
    - `recent_projects`
    - `flagged_projects`

- `GET /api/analytics/districts`
  - Returns: Project counts, total approved budget, and reported expenditure aggregated by district across Karnataka.

- `GET /api/analytics/departments`
  - Returns: Department-level project counts, budget allocations, and completion ratios.

### Map
- `GET /api/map/projects`
  - Query parameters: `district`, `category`, `status`
  - Returns: GeoJSON / Coordinate list of projects with `location_precision` (`EXACT` or `APPROXIMATE_DISTRICT`).

### AI & Risk Intelligence
- `GET /api/predictions/{project_id}`
  - Returns: Detailed delay risk evaluation:
    - `risk_level` (`LOW`, `MEDIUM`, `HIGH`)
    - `risk_score` (0.0 to 1.0)
    - `factors`: List of concrete drivers (e.g., "Elapsed duration > 80% while physical progress < 30%")
    - `model_version`, `prediction_date`, `data_limitations`

- `GET /api/anomalies`
  - Query parameters: `district`, `severity`
  - Returns: List of flagged projects with clear neutral explanations (e.g., "Reported expenditure is 92% of budget while reported physical progress is 25%").

- `POST /api/ai/image-analysis`
  - Upload two project images (baseline vs. latest) or a single image for OpenCV feature and change detection.

### Data Sources
- `GET /api/sources`
  - Returns: Registered official portals, sync status, last retrieval timestamp, and record count.

---

## 2. Protected Admin Endpoints (Requires Bearer JWT Token)

- `POST /api/auth/token`: Login with username/password to receive access token.
- `POST /api/admin/import/csv`: Multipart upload of Karnataka government project CSV. Includes column mapping, validation, and dry-run preview.
- `POST /api/admin/import/excel`: Multipart upload of official `.xlsx` files.
- `POST /api/admin/sync`: Trigger synthetic sync check with registered public endpoints.
- `POST /api/admin/projects/{project_id}/review`: Approve, flag, or resolve anomalies with reviewer notes.
- `GET /api/admin/logs`: Access system import history and administrative audit trail.
