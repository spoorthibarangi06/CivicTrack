import httpx
from backend.app.config import settings

api_key = settings.DATA_GOV_IN_API_KEY
datasets = {
    "basava_housing": "724b3435-b96e-4449-a8e5-31e45c32fc54",
    "pmay_grameen": "9fed1fd9-f22f-4eed-976a-ba4b8bec6d6a",
    "bmtc_yearly": "78abe18e-e988-46a7-86ad-0808c88b86e3",
    "bmtc_2024_25": "87645f94-6fe3-4e28-bbbc-9c37291c35b3"
}

print(f"Inspecting 4 data.gov.in datasets with key...")
with httpx.Client(timeout=10.0, verify=False) as client:
    for name, res_id in datasets.items():
        url = f"https://api.data.gov.in/resource/{res_id}"
        try:
            resp = client.get(url, params={"api-key": api_key, "format": "json", "limit": 2})
            print(f"\n=== {name} ({res_id}) ===")
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print("Total records:", data.get("total"))
                print("Fields:", [f.get("id") or f.get("name") for f in data.get("field", [])])
                records = data.get("records", [])
                if records:
                    print("Sample record 0:", records[0])
            else:
                print("Error body:", resp.text[:200])
        except Exception as e:
            print(f"Failed to query {name}: {e}")
