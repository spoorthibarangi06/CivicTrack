import httpx
import json

base_url = "http://localhost:3000/api"

print("--- TESTING ALL 11 CITIZEN WORKFLOW ENDPOINTS VIA PROXY ---")

with httpx.Client(timeout=10.0, follow_redirects=True) as client:
    # 1. Health
    r1 = client.get(f"{base_url}/health")
    print(f"1. Health: Status {r1.status_code}, DB: {r1.json().get('database')}, Loaded: {r1.json().get('projects_loaded')}")

    # 2. Dashboard KPIs
    r2 = client.get(f"{base_url}/analytics/overview")
    print(f"2. Dashboard KPIs: Status {r2.status_code}, Tracked: {r2.json().get('total_projects_tracked')}, Budget: ₹{float(r2.json().get('total_approved_budget', 0)):,.2f}")

    # 3. Filter by district
    r3 = client.get(f"{base_url}/projects?district=Bengaluru+Urban&limit=2")
    print(f"3. Filter District (Bengaluru Urban): Status {r3.status_code}, Found: {r3.json().get('total')} projects")

    # 4. Project Detail
    first_id = r3.json()["projects"][0]["id"]
    r4 = client.get(f"{base_url}/projects/{first_id}")
    p4 = r4.json()
    print(f"4. Project Dossier: Status {r4.status_code}, Name: {p4['project_name'][:40]}..., Origin: {p4.get('data_origin')}")

    # 5. Financial Info & Distinction
    r5 = client.get(f"{base_url}/projects/{first_id}/finance")
    print(f"5. Finance Breakdown: Status {r5.status_code}, Records: {len(r5.json())}")

    # 6. Source & Reporting Dates
    print(f"6. Source & Dates: Source: {p4.get('source_name')}, Reporting Date: {p4.get('reporting_date')}, Retrieval: {p4.get('retrieval_timestamp')}")

    # 7. Map Data
    r7 = client.get(f"{base_url}/map/projects?district=Bengaluru+Urban")
    print(f"7. Map Data: Status {r7.status_code}, Geo items: {len(r7.json())}, Precision: {r7.json()[0].get('location_precision') if r7.json() else 'None'}")

    # 8. AI Risk Assessment
    r8 = client.get(f"{base_url}/predictions/{first_id}")
    print(f"8. AI Risk Engine: Status {r8.status_code}, Risk Level: {r8.json().get('risk_level')}, Type: {r8.json().get('prediction_type')}")

    # 9. Financial Anomalies Flag
    r9 = client.get(f"{base_url}/anomalies")
    print(f"9. Financial Anomalies: Status {r9.status_code}, Flags: {len(r9.json())}, Flag 1: {r9.json()[0]['flag_type'] if r9.json() else 'None'}")

    # 10. Data Sources Matrix
    r10 = client.get(f"{base_url}/sources")
    print(f"10. Sources Section: Status {r10.status_code}, Portals: {len(r10.json())}")

    # 11. Admin Login & Import dry-run
    r_auth = client.post(f"{base_url}/auth/token", data={"username": "admin", "password": "CivicTrackAdmin2026!"})
    token = r_auth.json().get("access_token")
    with open("c:/AI_GOV/data/imports/egramswaraj_karnataka_gpdp.csv", "rb") as f:
        file_bytes = f.read()
    r11 = client.post(
        f"{base_url}/admin/import/csv",
        files={"file": ("egramswaraj_test.csv", file_bytes, "text/csv")},
        data={"dry_run": "true"},
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"11. Admin Import Dry-Run: Status {r11.status_code}, Valid: {r11.json().get('valid_records')}, Total: {r11.json().get('total_rows')}")
