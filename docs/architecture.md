# CivicTrack Karnataka – System Architecture

## 1. System Overview

**CivicTrack Karnataka** is an AI-powered civic technology platform designed to bring transparency, public accountability, and intelligent risk detection to publicly funded government development projects across Karnataka, India.

The architecture emphasizes:
- **Strict Data Integrity**: Grounded records with source URLs, publication timestamps, and clear demarcation of missing data (displaying "Not available in source" rather than assuming zeroes).
- **Multi-Role Access**: Frictionless, unauthenticated public citizen portal alongside a secure, role-based administrative dashboard.
- **Explainable AI**: Transparent, rule-grounded risk indicators paired with scikit-learn models (Delay Prediction via Random Forest / Gradient Boosting, Financial Anomaly Detection via Isolation Forest & deterministic bounds, and Computer Vision change analysis via OpenCV).
- **Geographic Precision**: Strict coordinate mapping; district-level centroids are explicitly labeled as approximate rather than exact project coordinates.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------------------------+
|                                    CITIZEN & ADMIN CLIENTS                                      |
|                                                                                                 |
|   +--------------------------+  +--------------------------+  +-------------------------------+ |
|   | Public Landing Page      |  | Citizen KPI Dashboard    |  | Interactive Karnataka Map     | |
|   +--------------------------+  +--------------------------+  +-------------------------------+ |
|   | Project Explorer & Filter|  | Financial Analytics      |  | AI Risk Assessment & Anomaly  | |
|   +--------------------------+  +--------------------------+  +-------------------------------+ |
|   | Admin Ingestion & Review |  | Source Registry & Health |  | Progress Image Change Studio  | |
|   +--------------------------+  +--------------------------+  +-------------------------------+ |
|                                   React 18 + Tailwind CSS + Leaflet                             |
+-------------------------------------------------+-----------------------------------------------+
                                                  | REST API (HTTP/JSON)
                                                  v
+-------------------------------------------------------------------------------------------------+
|                                      FASTAPI BACKEND SERVICE                                    |
|                                                                                                 |
|   +-------------------+  +-----------------------+  +---------------------+  +----------------+ |
|   | Public Routes     |  | Analytics Engine      |  | Admin Ingestion API |  | Auth & RBAC    | |
|   | (/api/projects)   |  | (/api/analytics)      |  | (/api/admin/import) |  | (JWT Tokens)   | |
|   +-------------------+  +-----------------------+  +---------------------+  +----------------+ |
|                                                                                                 |
|   +-------------------------------------------------------------------------------------------+ |
|   | AI & Machine Learning Services:                                                           | |
|   | - DelayRiskEngine (Rule-based heuristics + Random Forest Classifier)                      | |
|   | - AnomalyDetector (Z-score, Progress-Expenditure Divergence, Isolation Forest)             | |
|   | - VisionEngine (OpenCV feature matching, pixel diffing, structural change estimation)     | |
|   +-------------------------------------------------------------------------------------------+ |
|                                                                                                 |
|   +-------------------------------------------------------------------------------------------+ |
|   | Ingestion & Connector Subsystem:                                                          | |
|   | - eGramSwaraj Connector      - Karnataka Procurement (KPPP) Connector                     | |
|   | - Karnataka Open Data (KODP) - National Open Data (data.gov.in)   - Public PFMS Connector | |
|   | - CSV / Excel Parser with Header Mapping, Row Validation, and Duplicate Detection         | |
|   +-------------------------------------------------------------------------------------------+ |
+-------------------------------------------------+-----------------------------------------------+
                                                  | SQLAlchemy 2.0 ORM
                                                  v
+-------------------------------------------------------------------------------------------------+
|                                      PERSISTENCE LAYER                                          |
|                                                                                                 |
|   Tables:                                                                                       |
|   - projects              - financial_records     - progress_updates                           |
|   - project_documents     - data_sources          - import_logs                                 |
|   - predictions           - audit_logs            - users                                       |
|                                                                                                 |
|   PostgreSQL / High-Performance SQLite engine with Decimal precision & Foreign Key constraints |
+-------------------------------------------------------------------------------------------------+
```

---

## 3. Database Schema Design

The persistence tier adheres to the schema specified in Section 8 of `spec.md`:

1. **`data_sources`**:
   - `id` (UUID PK), `source_name`, `source_url`, `source_type` (API, CSV, EXCEL, MANUAL), `access_method`, `update_frequency`, `last_successful_sync`, `source_status`.
2. **`projects`**:
   - `id` (UUID PK), `source_id` (FK), `source_record_id`, `project_name`, `department`, `district`, `taluk`, `gram_panchayat`, `village`, `category`, `approved_budget` (Decimal), `start_date`, `expected_end_date`, `actual_end_date`, `latitude`, `longitude`, `location_precision` (`EXACT`, `APPROXIMATE_DISTRICT`, `NOT_AVAILABLE`), `project_status` (`PLANNED`, `ONGOING`, `COMPLETED`, `DELAYED`, `SUSPENDED`), `created_at`, `updated_at`.
3. **`financial_records`**:
   - `id` (UUID PK), `project_id` (FK nullable for unlinked scheme funds), `source_id` (FK), `financial_year`, `approved_amount`, `released_amount`, `expenditure_amount`, `awarded_contract_value`, `reporting_date`, `source_record_id`, `source_url`.
4. **`progress_updates`**:
   - `id` (UUID PK), `project_id` (FK), `progress_percentage` (Float), `progress_description`, `reported_status`, `reporting_date`, `source_id`, `source_record_id`, `source_url`.
5. **`project_documents`**:
   - `id` (UUID PK), `project_id` (FK), `document_type`, `document_url`, `document_title`, `publication_date`, `source_id`.
6. **`predictions`**:
   - `id` (UUID PK), `project_id` (FK), `prediction_type` (`DELAY_RISK`, `FINANCIAL_ANOMALY`), `risk_score` (Float 0-1), `risk_level` (`LOW`, `MEDIUM`, `HIGH`), `explanation` (Text), `model_version`, `prediction_date`.
7. **`import_logs`**:
   - `id` (UUID PK), `source_id` (FK), `file_name`, `imported_at`, `records_processed`, `records_accepted`, `records_rejected`, `error_summary`.
8. **`audit_logs`**:
   - `id` (UUID PK), `user_id`, `action`, `record_type`, `record_id`, `action_timestamp`, `change_summary`.
9. **`users`**:
   - `id` (UUID PK), `username`, `email`, `hashed_password`, `role` (`admin`, `reviewer`, `viewer`), `is_active`.

---

## 4. Security & Compliance

- **Authentication**: JWT token bearer flow (HMAC-SHA256) with salted bcrypt password hashing for admin operations.
- **Public Endpoints**: Completely unauthenticated for citizens reading project summaries, budgets, maps, and AI insights.
- **Data Safeguards**: SQL injection prevention through parameterized SQLAlchemy ORM queries; strict Pydantic model validation on inputs; neutral non-accusatory terminology ("requires review", "unusual spending pattern detected").
- **File Upload Limits**: Restricted MIME types (CSV, XLSX) and max size boundaries (15MB).
