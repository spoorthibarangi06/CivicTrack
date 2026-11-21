import httpx
import json

endpoints = [
    "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/services/search-eproc-tenders"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://kppp.karnataka.gov.in",
    "Referer": "https://kppp.karnataka.gov.in/portal/portal-search/tenders/all-tenders/works"
}

with httpx.Client(timeout=10.0, verify=False) as client:
    for ep in endpoints:
        resp = client.post(ep, headers=headers, json={"category": "WORKS"})
        print(f"{ep} -> Status: {resp.status_code}, Body: {resp.text[:300]}")
