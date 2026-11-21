import urllib.request
import json

base = "http://127.0.0.1:8000/api"

def get(path):
    req = urllib.request.Request(f"{base}{path}", headers={"User-Agent": "TestClient"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print("=== 1. HEALTH CHECK ===")
h = get("/health")
print(f"Status: {h['status']} | Total Projects: {h['projects_loaded']}")
assert h["status"] == "HEALTHY"
assert h["projects_loaded"] == 149

print("\n=== 2. ANALYTICS OVERVIEW ===")
ov = get("/analytics/overview")
print(f"Total Tracked: {ov['total_projects_tracked']} | Completed: {ov['completed_projects_count']} | Ongoing: {ov['ongoing_projects_count']}")

print("\n=== 3. DATASETS TRANSPARENCY DOSSIER ===")
tp = get("/datasets/transparency")
print(f"Datasets returned: {len(tp)}")
for d in tp:
    print(f"  * {d['dataset_name']}: {d['records_imported']} records, Status: {d['status']}, Last Sync: {d['last_successful_import']}")

print("\n=== 4. HOUSING DISTRICT SUMMARY (31 DISTRICTS) ===")
hs = get("/datasets/housing/district-summary")
print(f"Total districts covered: {hs['total_districts']}")
print(f"State Totals: Targets = {hs['state_totals']['total_housing_targets']:,} | Completed = {hs['state_totals']['total_houses_completed']:,} | Progress = {hs['state_totals']['overall_completion_percentage']}%")
sample_dist = hs["districts"][0]
print(f"Sample [{sample_dist['district']}]: Basava = {sample_dist['basava']['completed']:,}/{sample_dist['basava']['targets']:,} ({sample_dist['basava']['completion_percentage']}%), PMAYG = {sample_dist['pmayg']['completed']:,}/{sample_dist['pmayg']['targets']:,} ({sample_dist['pmayg']['completion_percentage']}%)")

print("\n=== 5. BMTC TRANSPORT SUMMARY ===")
ts = get("/datasets/transport/bmtc-summary")
print(f"Historical Factors: {ts['total_historical_factors']} | FY25 Factors: {ts['total_fy25_factors']}")
for kfi in ts["key_farebox_indicators"]:
    print(f"  * {kfi['title']}: FY24-25 = Rs. {kfi['fy24_25_amount']/1e7:.2f} Cr, FY23-24 = Rs. {kfi['fy23_24_amount']/1e7:.2f} Cr")

print("\n=== 6. FILTERING LIVE API DATA ===")
live_projs = get("/projects?origin=LIVE_API&limit=5")
print(f"Live API Projects count: {live_projs['total']}")
assert live_projs["total"] == 102

housing_projs = get("/projects?department=Housing+Department&limit=5")
print(f"Housing Department count: {housing_projs['total']}")
assert housing_projs["total"] == 31

bmtc_projs = get("/projects?department=Transport+Department&limit=5")
print(f"Transport Department count: {bmtc_projs['total']}")
assert bmtc_projs["total"] == 40

bagalkot_projs = get("/projects?district=Bagalkot&limit=5")
print(f"Bagalkot district count: {bagalkot_projs['total']}")
assert bagalkot_projs["total"] >= 2

print("\n=== 7. PROJECT DETAILS VERIFICATION ===")
detail_id = live_projs["projects"][0]["id"]
detail = get(f"/projects/{detail_id}")
print(f"Project: {detail['project_name']}")
print(f"District: {detail['district']} | Status: {detail['project_status']} | Origin: {detail['data_origin']}")
print(f"Source URL: {detail['source_url']}")
print(f"Retrieval Timestamp: {detail['retrieval_timestamp']}")
print(f"Financial Records count: {len(detail['financial_records'])}")
print(f"Progress Updates count: {len(detail['progress_updates'])}")
print("\n>>> ALL VERIFICATION ASSERTIONS PASSED! <<<")
