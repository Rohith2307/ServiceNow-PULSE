from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_students_endpoint():
    response = client.get("/api/students")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_early_warning_endpoint():
    response = client.get("/api/students/Aisha-202/early-warning")
    assert response.status_code == 200
    assert response.json()["student_id"] == "Aisha-202"


def test_dashboard_cohorts_endpoint():
    response = client.get("/api/dashboard/cohorts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
