import httpx

urls = [
    "https://karnataka.data.gov.in/api/3/action/package_list",
    "https://karnataka.data.gov.in/api/3/action/package_search?q=pwd",
    "https://karnataka.data.gov.in/api/3/action/package_search?q=infrastructure",
    "https://karnataka.data.gov.in/api/action/package_search",
    "https://karnataka.data.gov.in/ogd_api/package_search"
]

headers = {
    "User-Agent": "CivicTrackKarnataka/1.0",
    "Accept": "application/json"
}

print("Probing Karnataka Open Data Portal CKAN APIs...")
with httpx.Client(timeout=8.0, verify=False, follow_redirects=True) as client:
    for u in urls:
        try:
            resp = client.get(u, headers=headers)
            print(f"{u} -> {resp.status_code} ({resp.headers.get('content-type', '')[:30]})")
            if "json" in resp.headers.get('content-type', ''):
                print(f"   JSON snippet: {resp.text[:200]}")
        except Exception as e:
            print(f"{u} -> {e}")
