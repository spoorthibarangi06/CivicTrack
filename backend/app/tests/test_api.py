import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ml.delay_risk import delay_engine
from backend.app.ml.anomaly_detector import anomaly_detector

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    """Verify system health endpoint returns 200 and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["database"] == "connected"
    assert data["projects_loaded"] > 0

def test_projects_listing_and_pagination(client):
    """Verify project listing, count, and structure."""
    response = client.get("/api/projects?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "projects" in data
    assert len(data["projects"]) <= 5
    assert data["total"] >= 10

def test_project_filter_by_district(client):
    """Verify filtering by specific Karnataka district."""
    response = client.get("/api/projects?district=Bengaluru Urban")
    assert response.status_code == 200
    data = response.json()
    for p in data["projects"]:
        assert p["district"] == "Bengaluru Urban"

def test_project_detail_and_sources(client):
    """Verify project details include source URL, financial history, and coordinates."""
    list_resp = client.get("/api/projects?limit=1")
    project_id = list_resp.json()["projects"][0]["id"]

    detail_resp = client.get(f"/api/projects/{project_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == project_id
    assert "financial_records" in detail
    assert "progress_updates" in detail
    assert "source_url" in detail
    assert detail["location_precision"] in ["EXACT", "APPROXIMATE_DISTRICT"]

def test_analytics_kpi_cards(client):
    """Verify overview analytics KPIs are populated from real database records."""
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects_tracked"] > 0
    assert float(data["total_approved_budget"]) > 0
    assert float(data["total_reported_expenditure"]) > 0

def test_analytics_districts_and_departments(client):
    """Verify district and department breakdowns."""
    dist_resp = client.get("/api/analytics/districts")
    assert dist_resp.status_code == 200
    assert len(dist_resp.json()) > 0

    dept_resp = client.get("/api/analytics/departments")
    assert dept_resp.status_code == 200
    assert len(dept_resp.json()) > 0

def test_map_projects_contain_coordinates(client):
    """Verify map items only contain grounded coordinates."""
    response = client.get("/api/map/projects")
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    for item in items:
        assert item["latitude"] is not None
        assert item["longitude"] is not None
        assert item["location_precision"] in ["EXACT", "APPROXIMATE_DISTRICT"]

def test_ai_delay_risk_engine():
    """Verify delay risk engine returns grounded explanations."""
    result = delay_engine.evaluate_project(
        start_date=None,
        expected_end_date=None,
        actual_end_date=None,
        progress_percentage=20.0,
        approved_budget=10000000.0,
        project_status="ONGOING"
    )
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert len(result["factors"]) > 0
    assert "data_limitations" in result

def test_financial_anomaly_detection():
    """Verify anomaly detection catches extreme divergence."""
    anomaly = anomaly_detector.analyze_finances(
        approved_budget=Decimal("10000000.00"),
        reported_expenditure=Decimal("9500000.00"),
        reported_progress=20.0, # 95% spend with 20% progress
        released_funds=Decimal("10000000.00")
    )
    assert anomaly is not None
    assert anomaly["severity"] == "HIGH"
    assert "EXPENDITURE_PROGRESS_DIVERGENCE" in anomaly["flag_type"]
    assert "Requires review" in anomaly["reason"] or "review" in anomaly["review_status"].lower()

def test_admin_auth_protection(client):
    """Verify administrative import endpoints reject unauthenticated access."""
    resp = client.post("/api/admin/import/csv")
    assert resp.status_code in [401, 422]

def test_admin_login(client):
    """Verify admin login produces valid JWT token."""
    resp = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "CivicTrackAdmin2026!"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_admin_csv_import_workflow(client):
    """Verify authenticated CSV upload with column normalization and duplicate detection."""
    # 1. Login
    login_resp = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "CivicTrackAdmin2026!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Read sample CSV
    with open("c:/AI_GOV/data/sample/karnataka_projects_sample.csv", "rb") as f:
        file_bytes = f.read()

    # Dry-run test first
    dry_resp = client.post(
        "/api/admin/import/csv",
        files={"file": ("test_karnataka.csv", file_bytes, "text/csv")},
        data={"dry_run": "true"},
        headers=headers
    )
    assert dry_resp.status_code == 200
    dry_data = dry_resp.json()
    assert dry_data["success"] is True
    assert dry_data["dry_run"] is True
    assert dry_data["valid_records"] > 0

    # Live import test
    live_resp = client.post(
        "/api/admin/import/csv",
        files={"file": ("test_karnataka.csv", file_bytes, "text/csv")},
        data={"dry_run": "false"},
        headers=headers
    )
    assert live_resp.status_code == 200
    live_data = live_resp.json()
    assert live_data["success"] is True
    assert live_data["records_accepted"] > 0
