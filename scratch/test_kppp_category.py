import httpx
import json

url = "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/works/search-eproc-tenders"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://kppp.karnataka.gov.in",
    "Referer": "https://kppp.karnataka.gov.in/portal/portal-search/tenders/all-tenders/works"
}

categories_to_test = [
    "WORKS", "Works", "works", "1", "W", "GOODS", "SERVICES", "ALL", "CONSTRUCTION"
]

with httpx.Client(timeout=10.0, verify=False) as client:
    for cat in categories_to_test:
        payload = {"category": cat}
        resp = client.post(url, headers=headers, json=payload)
        print(f"category: '{cat}' -> Status: {resp.status_code}")
        print(f"Body: {resp.text[:300]}\n")
