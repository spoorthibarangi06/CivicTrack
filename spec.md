# MASTER PROJECT SPECIFICATION
# AI-POWERED GOVERNMENT PROJECT TRANSPARENCY & ACCOUNTABILITY SYSTEM

## 1. PROJECT OVERVIEW

Build a full-stack web application named:

**CivicTrack Karnataka – AI-Powered Government Project Transparency & Accountability System**

The platform will help citizens understand and monitor publicly funded government development projects across Karnataka, India.

The system should make government project information easier to access, understand, compare and monitor.

It should combine publicly accessible government records, project-level financial information where available, reported physical progress, interactive maps, analytics and AI-assisted risk identification.

This is a hackathon prototype. Prioritize a functional, visually polished and technically credible MVP over unnecessary complexity.

## 2. PROJECT OBJECTIVES

The platform must:

1. Provide a searchable database of Karnataka government development projects.
2. Show project budgets and financial information wherever officially published.
3. Display reported project progress and status wherever available.
4. Show project locations on an interactive Karnataka map where coordinates or sufficiently precise locations exist.
5. Compare reported financial expenditure with reported physical progress when both are genuinely linked to the same project.
6. Identify projects that may be delayed.
7. Flag unusual financial or progress patterns for human review.
8. Provide understandable explanations of AI-generated risk indicators.
9. Display original government sources and the date of the information.
10. Improve public understanding of government development activities.

## 3. GEOGRAPHICAL SCOPE

The initial project scope is Karnataka, India only.

Support these geographical levels wherever available:

- State
- District
- Taluk / Block
- Gram Panchayat
- Village
- Project location

Allow users to filter projects by district, taluk, project category, department, financial year and status.

Do not invent geographical locations or coordinates.

## 4. TARGET USERS AND ACCESS ROLES

### A. Citizen

Citizens should be able to:

- View the public dashboard.
- Browse and search government projects.
- Filter projects by location and category.
- View project budgets and published expenditure.
- View reported physical progress.
- View project timelines.
- View source documents and official links.
- View AI-generated risk indicators and their explanations.
- View project locations on the map.

Citizen access should not require login for public information.

### B. Administrator

Administrators should be able to:

- Access a protected admin dashboard.
- Import CSV and Excel reports.
- Review imported records.
- Resolve duplicate records.
- Manage source configurations.
- Review data validation errors.
- View data synchronization history.
- Approve or reject imported records.
- Monitor system health.

Use secure authentication for administrative functions.

### C. Data reviewer

If practical for the MVP, introduce a reviewer role that can inspect records, source evidence and flagged anomalies before publication.

## 5. APPLICATION MODULES

Build the following modules.

### MODULE 1: PUBLIC LANDING PAGE

Create a professional landing page containing:

- Project name and logo.
- Short description of the platform.
- Karnataka-focused visual identity.
- Main statistics.
- Search bar.
- Explore projects button.
- Interactive map preview.
- How the platform works.
- Government data source information.
- Transparency and methodology section.

Use a clean, modern civic-technology design.

### MODULE 2: CITIZEN DASHBOARD

Create a dashboard with the following KPI cards:

- Total projects tracked.
- Total approved project value.
- Total reported expenditure.
- Projects marked completed in source records.
- Projects reported as ongoing.
- Projects flagged as potential delay risks.
- Projects requiring financial review.

Important: Calculate each KPI only from eligible records. Do not combine incompatible reporting periods or financial categories.

Include:

- Projects by district.
- Projects by department.
- Projects by category.
- Financial year-wise trends.
- Project status distribution.
- Budget versus expenditure charts where the data is comparable.
- Recently updated projects.
- Recently flagged projects.

Every statistic should be traceable to the underlying records.

### MODULE 3: GOVERNMENT PROJECT DIRECTORY

Create a project listing page.

Each project record should support:

- Project ID.
- Project name.
- Department.
- District.
- Taluk / Block.
- Gram Panchayat or village, if available.
- Project category.
- Approved project cost.
- Reported expenditure.
- Reported physical progress.
- Project start date.
- Expected completion date.
- Actual completion date, if published.
- Project status.
- Source portal.
- Original source URL.
- Source publication date.
- Data retrieval date.

Provide:

- Search.
- Sorting.
- Pagination.
- District filter.
- Department filter.
- Category filter.
- Financial year filter.
- Project status filter.
- Budget range filter.

Do not display missing values as zero. Display "Not available in source" instead.

### MODULE 4: PROJECT DETAILS PAGE

Each project should have a dedicated details page.

Sections:

1. Project overview.
2. Project location.
3. Project budget.
4. Reported expenditure.
5. Reported physical progress.
6. Timeline and milestones, if published.
7. Financial history.
8. Progress history.
9. AI risk assessment.
10. Source documents.
11. Last updated information.
12. Data quality notes.

Display the original source and source record identifier.

If two datasets cannot be reliably linked to the same project, display them separately and do not combine their figures.

### MODULE 5: INTERACTIVE KARNATAKA MAP

Use Leaflet and OpenStreetMap.

Requirements:

- Display projects with verified coordinates.
- Use district-level filtering.
- Allow users to click a project marker.
- Display project name, category, status and available budget.
- Link map markers to project details.
- Provide map/list view switching.
- Use marker clustering if there are many projects.
- Include a map legend.

Do not create fake project coordinates.

If only district-level location is known, display the district as an approximate location and clearly label it. Do not present a district centroid as an exact project location.

### MODULE 6: FINANCIAL TRANSPARENCY ANALYTICS

Build a financial analytics page.

Display the following separately:

- Approved budget.
- Funds released.
- Reported expenditure.
- Contract awarded value, if published.
- Financial year.
- Reporting date.

Do not treat approved budget, released funds, contract value and actual expenditure as interchangeable.

Provide:

- Budget versus expenditure comparisons.
- Department-wise financial analysis.
- District-wise financial analysis.
- Year-wise trends.
- Project-level financial history.
- Unusual spending-pattern flags.

Only calculate expenditure-to-budget ratios when the relevant values refer to the same project, scope and comparable reporting period.

### MODULE 7: AI INTELLIGENCE ENGINE

Implement three intelligence features.

#### A. Project Delay Risk Prediction

Purpose: Estimate whether a project may miss its expected completion date.

Potential inputs:

- Planned project duration.
- Elapsed project duration.
- Reported physical progress.
- Time remaining.
- Historical progress updates.
- Historical completion delays.
- Department.
- Project category.
- Time since last update.

Implementation:

- Start with transparent rule-based risk classification.
- Add a machine-learning model only when sufficient labelled historical project data is available.
- Use Scikit-learn.
- Consider Random Forest or Gradient Boosting.
- Use proper training and testing datasets.
- Avoid data leakage.
- Evaluate performance using suitable classification metrics.

Display:

- Low, medium or high risk.
- Risk score where justified.
- Main factors contributing to the risk.
- Prediction date.
- Model version.
- Data limitations.

Do not present a rule-based score as a trained ML prediction.

#### B. Financial Anomaly Detection

Purpose: Identify unusual patterns for further human investigation.

Possible checks:

- High reported expenditure compared with reported physical progress.
- Unusual changes in expenditure.
- Missing or inconsistent financial information.
- Unusual deviations from comparable projects, where comparison is valid.
- Inconsistent dates or values.

Start with transparent rules.

Use Isolation Forest only if enough appropriate data is available.

Display:

- Flag type.
- Reason for the flag.
- Relevant values.
- Source references.
- Review status.

IMPORTANT: An anomaly is not proof of corruption, fraud or wrongdoing. Use neutral terms such as "requires review" or "unusual pattern detected".

#### C. Construction Progress Image Analysis

Create an optional image-analysis module.

Features:

- Upload a construction photograph.
- Store the image and metadata securely.
- Compare photographs of the same project when available.
- Identify visible changes between images.
- Explore construction-stage classification if a suitable trained model is available.

Use OpenCV for basic image processing.

Do not claim that a photograph proves exact physical completion, expenditure or authenticity.

Clearly distinguish image-analysis results from officially reported project progress.

### MODULE 8: ADMINISTRATION AND DATA MANAGEMENT

Create a protected admin dashboard.

Features:

- CSV upload.
- Excel upload.
- Data preview before import.
- Column mapping.
- Required-field validation.
- Duplicate detection.
- Import error report.
- Source management.
- Data sync logs.
- Record approval workflow.
- Project record correction.
- AI flag review.

Maintain an audit log of administrative changes.

## 6. OFFICIAL DATA SOURCES

Use only publicly accessible government information for the initial data acquisition.

### SOURCE A: eGramSwaraj

Official website:
https://egramswaraj.gov.in/

Purpose:
Panchayat development activities, planning, reported progress, financial/accounting information and assets.

Investigate publicly accessible reports and downloadable records.

Potential fields, subject to actual availability:

- Panchayat identifier.
- Activity or project identifier.
- Project/activity name.
- State.
- District.
- Block.
- Gram Panchayat.
- Financial year.
- Approved amount.
- Reported expenditure.
- Activity status.
- Physical progress, if available.
- Asset/geolocation information, if available.
- Report date.

### SOURCE B: Karnataka Public Procurement Portal

Official website:
https://kppp.karnataka.gov.in/

Purpose:
Government procurement, works tenders and contract information.

Investigate publicly accessible tender and contract records.

Potential fields:

- Tender ID.
- Tender title.
- Department.
- Estimated tender value.
- Tender publication date.
- Closing date.
- Tender status.
- Awarded value, if published.
- Contractor information, if publicly disclosed.
- Contract date.
- Tender document URL.

IMPORTANT:
Tender and contract information is not the same as actual physical project progress or expenditure.

### SOURCE C: Karnataka Open Data Portal

Official website:
https://karnataka.data.gov.in/

Purpose:
Public datasets published by Karnataka government departments.

Search for:

- Infrastructure development.
- Public works.
- Rural development.
- Government expenditure.
- Roads and buildings.
- District-level development data.
- Local government development.
- Department-wise statistics.

Inspect dataset metadata and resource-specific API availability.

### SOURCE D: National Open Government Data Platform

Official website:
https://www.data.gov.in/

Use relevant publicly available Karnataka datasets where appropriate.

Use official API documentation and a valid API key if a selected dataset requires one.

### SOURCE E: Public PFMS Reports

Official website:
https://pfms.nic.in/

Investigate publicly available financial reports only.

Use scheme-level financial data as supporting context unless a reliable common identifier links it to an individual project.

A fund release must not be represented as project expenditure.

## 7. DATA ACQUISITION RULES

The system must support three acquisition methods:

1. Verified public API integration.
2. Official CSV/Excel report import.
3. Manual administrative import of publicly downloadable official reports.

For each source:

- Verify actual availability.
- Verify terms and permitted access.
- Identify update frequency.
- Record source URL.
- Record source record identifier.
- Record publication date where available.
- Record retrieval timestamp.
- Record import status.
- Log errors.

Never:

- Invent API endpoints.
- Bypass CAPTCHA or authentication.
- Scrape restricted information.
- Assume a portal has an API.
- Invent missing project fields.
- Merge unrelated project records.
- Claim data is real-time unless the source supports that claim.

If an API is unavailable, provide a working manual import process.

## 8. DATABASE DESIGN

Use PostgreSQL and SQLAlchemy.

Create the following tables.

### projects

- id: UUID primary key.
- source_id.
- source_record_id.
- project_name.
- department.
- district.
- taluk.
- gram_panchayat.
- village.
- category.
- approved_budget.
- start_date.
- expected_end_date.
- actual_end_date.
- latitude.
- longitude.
- location_precision.
- project_status.
- created_at.
- updated_at.

### financial_records

- id.
- project_id, nullable if project linkage is not reliable.
- source_id.
- financial_year.
- approved_amount.
- released_amount.
- expenditure_amount.
- awarded_contract_value.
- reporting_date.
- source_record_id.
- source_url.

### progress_updates

- id.
- project_id.
- progress_percentage.
- progress_description.
- reported_status.
- reporting_date.
- source_id.
- source_record_id.
- source_url.

### project_documents

- id.
- project_id.
- document_type.
- document_url.
- document_title.
- publication_date.
- source_id.

### data_sources

- id.
- source_name.
- source_url.
- source_type.
- access_method.
- update_frequency.
- last_successful_sync.
- source_status.

### import_logs

- id.
- source_id.
- file_name.
- imported_at.
- records_processed.
- records_accepted.
- records_rejected.
- error_summary.

### predictions

- id.
- project_id.
- prediction_type.
- risk_score.
- risk_level.
- explanation.
- model_version.
- prediction_date.

### audit_logs

- id.
- user_id.
- action.
- record_type.
- record_id.
- action_timestamp.
- change_summary.

Keep historical financial and progress snapshots. Do not overwrite the only copy of previous reports.

Use decimal data types for monetary values.

## 9. BACKEND REQUIREMENTS

Use Python FastAPI.

Create these endpoints:

GET /api/health

GET /api/projects

GET /api/projects/{project_id}

GET /api/projects/{project_id}/finance

GET /api/projects/{project_id}/progress

GET /api/analytics/overview

GET /api/analytics/districts

GET /api/analytics/departments

GET /api/map/projects

GET /api/predictions/{project_id}

GET /api/anomalies

GET /api/sources

POST /api/admin/import/csv

POST /api/admin/import/excel

POST /api/admin/sync

POST /api/admin/projects/{project_id}/review

Use:

- Pydantic validation.
- SQLAlchemy.
- Pagination.
- Filtering.
- Error handling.
- Secure admin authentication.
- Environment variables.
- API documentation through FastAPI Swagger.

## 10. FRONTEND REQUIREMENTS

Use:

- React.
- Vite.
- Tailwind CSS.
- Recharts.
- Leaflet.
- Axios or Fetch API.
- React Router.

Create reusable components.

Suggested pages:

- /
- /dashboard
- /projects
- /projects/:id
- /map
- /analytics
- /ai-insights
- /sources
- /admin
- /admin/imports

Use a responsive design for desktop, tablet and mobile.

Design style:

- Professional civic technology.
- Modern and trustworthy.
- Clear typography.
- Consistent spacing.
- Accessible contrast.
- Simple navigation.
- Clear status labels.
- Meaningful charts.
- No unnecessary animations.

## 11. RECOMMENDED PROJECT STRUCTURE

Create a clean modular structure:

civictrack-karnataka/
  frontend/
    src/
      components/
      pages/
      charts/
      maps/
      services/
      hooks/
      layouts/
      utils/
  backend/
    app/
      main.py
      database.py
      models/
      schemas/
      routes/
      connectors/
      importers/
      services/
      ml/
      jobs/
      security/
      tests/
  data/
    sample/
    imports/
  docs/
    architecture.md
    data_sources.md
    api_documentation.md
    testing_report.md
  .env.example
  .gitignore
  README.md

## 12. SECURITY AND RELIABILITY

Implement:

- Environment-based configuration.
- Secure password hashing.
- Admin authentication.
- Input validation.
- File upload restrictions.
- File size limits.
- SQL injection protection through ORM practices.
- Safe error messages.
- Audit logging.
- Secrets excluded from Git.
- Appropriate CORS configuration.
- Database backups guidance.

Never store government portal credentials unless they are explicitly required and authorized.

## 13. DATA QUALITY AND TRANSPARENCY

Every government record must preserve:

- Source portal.
- Source URL.
- Source record identifier.
- Publication date.
- Retrieval date.
- Import method.
- Verification status.

Distinguish:

A. Officially published information.

B. Imported but not yet reviewed information.

C. Demonstration/sample data.

D. AI-generated analysis.

Do not combine figures from incompatible financial years, projects, scopes or reporting periods.

Do not display missing values as zero.

Display a clear "Data not available" message.

Display last-updated information separately from the date on which the government source published the record.

## 14. HACKATHON DEMONSTRATION REQUIREMENTS

Prepare a demo using a small but meaningful set of genuine public Karnataka government records.

Target an initial dataset of 20–50 records if available.

Demonstration flow:

1. Open the landing page.
2. View the Karnataka dashboard.
3. Filter projects by district.
4. Open an individual project.
5. View available budget and expenditure information.
6. View source and reporting dates.
7. Explore the interactive map.
8. Open the AI risk assessment.
9. View an example financial anomaly flag.
10. Open the data-source and methodology section.
11. Demonstrate importing an official CSV/Excel report through the admin interface.

If a feature uses sample data, label it clearly.

## 15. TESTING AND ACCEPTANCE CRITERIA

The MVP is complete only when:

- The frontend runs successfully.
- The backend runs successfully.
- PostgreSQL connectivity works.
- Database migrations or setup instructions exist.
- Project records can be imported.
- Search and filters work.
- Project detail pages work.
- Source links are displayed.
- Charts use database records.
- The map displays only grounded locations.
- AI risk assessments return understandable explanations.
- Financial anomaly flags have traceable reasons.
- Missing data is handled correctly.
- Admin routes are protected.
- API errors are handled.
- Core tests pass.
- A working local demonstration is documented.

## 16. DEVELOPMENT APPROACH

Work in these phases:

PHASE 1: Requirements analysis, architecture and folder structure.

PHASE 2: Frontend design and navigation.

PHASE 3: Backend, database and API development.

PHASE 4: CSV/Excel import and data validation.

PHASE 5: Government data source integration.

PHASE 6: Interactive maps and analytics.

PHASE 7: AI intelligence modules.

PHASE 8: Integration, testing and security review.

PHASE 9: Deployment and hackathon demonstration.

Do not skip phases.

After every phase:

- Explain what was built.
- List the files created or modified.
- Run relevant tests.
- Report errors.
- Fix errors before moving forward.
- Identify anything that requires human configuration.

## 17. FINAL DELIVERABLES

Produce:

1. Complete source code.
2. Working React frontend.
3. Working FastAPI backend.
4. PostgreSQL schema and setup instructions.
5. Government data connectors that have been verified.
6. CSV/Excel import workflow.
7. Interactive map.
8. Financial analytics dashboard.
9. AI risk assessment module.
10. Financial anomaly detection module.
11. Optional image-analysis module.
12. Automated tests.
13. README with setup instructions.
14. .env.example.
15. API documentation.
16. Architecture documentation.
17. Data source documentation.
18. Final testing report.
19. Local demo instructions.
20. Deployment instructions.

## 18. IMPORTANT INSTRUCTIONS TO THE AI DEVELOPMENT AGENT

Act as a senior full-stack engineer, data engineer, machine-learning engineer and UI/UX designer.

Be practical and prioritize a working hackathon MVP.

Do not fabricate data, API availability, project progress, project locations or model accuracy.

Do not claim a feature works unless you have tested it.

Do not make unsupported claims about corruption or government misconduct.

If a government source is unavailable, document the limitation and implement a fallback import workflow.

Before making major architectural changes, explain the reason.

Start by analysing this complete specification. Then create an implementation plan, architecture document, database design and project folder structure.

Do not try to implement every module in a single uncontrolled operation.