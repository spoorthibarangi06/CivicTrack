import httpx
import os

api_key = os.getenv("DATA_GOV_IN_API_KEY", "")
# Example resource ID for PMGSY / Rural development on OGD India
resource_id = "9ef84268-d588-465a-a308-a864a43d0070" # Common OGD resource
url = f"https://api.data.gov.in/resource/{resource_id}"

params = {
    "api-key": api_key,
    "format": "json",
    "offset": 0,
    "limit": 5,
    "filters[state_name]": "KARNATAKA"
}

headers = {
    "User-Agent": "CivicTrackKarnataka/1.0",
    "Accept": "application/json"
}

print(f"Testing api.data.gov.in with key={'[REDACTED]' if api_key else '[NONE]'}...")
try:
    with httpx.Client(timeout=8.0, verify=False) as client:
        resp = client.get(url, params=params, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('content-type')}")
        print(f"Snippet: {resp.text[:300]}")
except Exception as e:
    print(f"Exception: {type(e).__name__}: {e}")
