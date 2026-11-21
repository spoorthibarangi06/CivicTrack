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

# Let's inspect the 400 response with empty or different payloads
test_payloads = [
    {},
    {"page": 0, "size": 10},
    {"pageNumber": 0, "pageSize": 10},
    {"searchString": "", "page": 0, "size": 10},
    {"status": "OPEN", "page": 0, "size": 10}
]

with httpx.Client(timeout=10.0, verify=False) as client:
    for idx, p in enumerate(test_payloads):
        resp = client.post(url, headers=headers, json=p)
        print(f"Payload {idx} -> Status: {resp.status_code}")
        print(f"Headers: {resp.headers}")
        print(f"Body: {resp.text}\n")
