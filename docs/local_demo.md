# CivicTrack Karnataka – Hackathon Demonstration Guide

This guide walks judges and reviewers step-by-step through the 11-step demonstration flow specified in Section 14 of the Master Project Specification.

---

## 🏁 Starting the Services

### Terminal 1: Backend API (FastAPI)
```powershell
cd c:\AI_GOV\backend
# Run with python in .venv
.\.venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Docs will be live at `http://127.0.0.1:8000/docs`*

### Terminal 2: Frontend Web App (React + Vite)
```powershell
cd c:\AI_GOV\frontend
npm run dev
```
*Open `http://localhost:3000` in your web browser.*

---

## 🎯 Step-by-Step Demonstration Walkthrough

### Step 1: Open the Landing Page (`/`)
- Observe Karnataka civic branding, live audit record counter, and high-level platform statistics.
- Test the omnibar search (e.g. type `"Koramangala"` or `"Gokak"`).

### Step 2: Open the Citizen Dashboard (`/dashboard`)
- Review the 7 core KPI cards: Total Projects Tracked, Approved Budget, Reported Spend, Completed, Ongoing, Potential Delay, and Financial Review Flags.
- Inspect the **District Budget vs. Reported Spend** chart (Recharts) and **Status Distribution** pie chart.
- Note the **Recently Updated** and **Recently Flagged for Review** quick lists.

### Step 3: Filter Projects by District (`/projects`)
- Filter by district (e.g. select `"Belagavi"`, `"Bengaluru Urban"`, or `"Tumakuru"`).
- Switch between **Grid Card View** and **Detailed Table View**.
- Notice how missing values display clearly as `"Not available in source"` rather than artificial zeroes.

### Step 4 & 5: Open an Individual Project (`/projects/:id`)
- Click on `"Koramangala Storm Water Valley Remodelling"` or `"Jal Jeevan Mission Multi-Village Piped Drinking Water Scheme (Gokak Block)"`.
- Examine the distinct legal accounting categories: **Approved Budget**, **Reported Expenditure**, **Released Funds**, and **Contract Value**.
- Observe the physical progress bar and completion index.

### Step 6: View Original Government Source & Reporting Dates
- Scroll to the **Source Evidence & Audit Linkage** section.
- View the direct government portal URL (e.g., eGramSwaraj or Karnataka Open Data Portal), spatial coordinates, and verification timestamp.

### Step 7: Explore the Interactive Karnataka Geo-Map (`/map`)
- View markers color-coded by project status and AI risk level.
- Click on any marker to open the interactive popup with budget, progress, and a direct link to the project dossier.
- Note the dashed border for projects with **Approximate District Centroids** (such as PMGSY road clusters) vs solid borders for **Exact GPS coordinates**.

### Step 8 & 9: Open the AI Risk Assessment & Financial Anomalies (`/ai-insights`)
- Review the **Delay Risk Predictions** evaluated by the Random Forest classifier.
- Inspect an example **Financial Anomaly Flag** (e.g., *Jal Jeevan Mission Gokak* flagged for high expenditure 86% vs low physical progress 28%).
- Scroll to **Module 7C: Construction Progress Computer Vision Studio**. Upload a photo or pairwise photos to view OpenCV edge density estimation, stage indicator, and structural change heatmap.

### Step 10: Open Data Sources & Methodology Section (`/sources`)
- Review the registered public data connectors (eGramSwaraj, KPPP, KODP, data.gov.in, PFMS).
- Read the civic data governance principles: No Zero Assumption, Strict Spatial Grounding, and Distinct Financial Scopes.

### Step 11: Demonstrate Admin CSV/Excel Ingestion (`/admin` & `/admin/imports`)
- Login with demo credentials:
  - **Username:** `admin`
  - **Password:** `CivicTrackAdmin2026!`
- In the Admin Center, click **Trigger Source Sync** to probe government portal connectivity.
- Adjudicate a pending anomaly flag: enter reviewer notes and click **Save Review Decision**.
- Navigate to **Upload CSV / Excel** (`/admin/imports`).
- Upload `c:\AI_GOV\data\sample\karnataka_projects_sample.csv`.
- Click **Preview & Validate (Dry Run)** to observe automatic column mapping, duplicate detection, and schema validation.
- Click **Confirm & Ingest to Database** to commit the new projects live into PostgreSQL / SQLite!
