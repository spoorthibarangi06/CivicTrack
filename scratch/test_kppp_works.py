import httpx
import json
import time

url = "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/works/search-eproc-tenders"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://kppp.karnataka.gov.in",
    "Referer": "https://kppp.karnataka.gov.in/portal/portal-search/tenders/all-tenders/works"
}

payload = {"category": "WORKS"}

for attempt in range(3):
    try:
        with httpx.Client(timeout=15.0, verify=False) as client:
            resp = client.post(url, headers=headers, json=payload)
            print(f"Attempt {attempt+1} -> Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
            break
    except Exception as e:
        print(f"Attempt {attempt+1} failed: {e}")
        time.sleep(2)
