import httpx
import json

base_urls = [
    "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/works/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/portal-service/services/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/portal-service/works/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/portal-service/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/portal-service/services/search-eproc-tenders",
    "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api/tenders/search",
    "https://kppp.karnataka.gov.in/api/tenders"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json"
}

payload = {
    "page": 0,
    "size": 10
}

print("Probing KPPP endpoints...")
for url in base_urls:
    for method in ["GET", "POST"]:
        try:
            with httpx.Client(timeout=8.0, verify=False, follow_redirects=True) as client:
                if method == "GET":
                    resp = client.get(url, headers=headers)
                else:
                    resp = client.post(url, headers=headers, json=payload)
                print(f"{method} {url} -> {resp.status_code} ({resp.headers.get('content-type', 'no-content-type')[:30]})")
                if resp.status_code == 200:
                    text_snip = resp.text[:200]
                    print(f"   Response snippet: {text_snip}")
        except Exception as e:
            print(f"{method} {url} -> EXCEPTION: {type(e).__name__}: {str(e)[:60]}")
