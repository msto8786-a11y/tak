"""Backend tests for Sessions CRUD + Wi-Fi relay forward proxy.

Covers:
- POST/GET/DELETE /api/sessions (with Arabic roundtrip)
- POST /api/wifi-relay/forward (unreachable host must NOT 500)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://control-sys-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def cleanup_ids():
    ids = []
    yield ids
    # best-effort cleanup
    for sid in ids:
        try:
            requests.delete(f"{API}/sessions/{sid}", timeout=5)
        except Exception:
            pass


# ===== Root sanity =====
def test_root(client):
    r = client.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert "message" in r.json()


# ===== Sessions CRUD =====
def test_create_session_arabic_roundtrip(client, cleanup_ids):
    payload = {
        "name": "اختبار",
        "student_name": "أحمد",
        "components": [{"id": "c1", "type": "contactor", "x": 100, "y": 200}],
        "wires": [{"id": "w1", "from": {"compId": "c1", "termId": "A1"}, "to": {"compId": "c1", "termId": "A2"}}],
    }
    r = client.post(f"{API}/sessions", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data and isinstance(data["id"], str)
    assert data["name"] == "اختبار"
    assert data["student_name"] == "أحمد"
    assert len(data["components"]) == 1
    assert len(data["wires"]) == 1
    assert "created_at" in data and "updated_at" in data
    cleanup_ids.append(data["id"])

    # GET single - verify persistence + Arabic
    r2 = client.get(f"{API}/sessions/{data['id']}", timeout=10)
    assert r2.status_code == 200
    full = r2.json()
    assert full["name"] == "اختبار"
    assert full["student_name"] == "أحمد"
    assert full["components"][0]["type"] == "contactor"


def test_list_sessions_contains_created(client, cleanup_ids):
    # Create one for the list
    payload = {"name": "TEST_list_session", "student_name": "طالب", "components": [], "wires": []}
    r = client.post(f"{API}/sessions", json=payload, timeout=10)
    assert r.status_code == 200
    sid = r.json()["id"]
    cleanup_ids.append(sid)

    r2 = client.get(f"{API}/sessions", timeout=10)
    assert r2.status_code == 200
    arr = r2.json()
    assert isinstance(arr, list)
    found = next((x for x in arr if x["id"] == sid), None)
    assert found is not None, "created session missing from list"
    # Required summary fields
    for k in ("id", "name", "student_name", "updated_at", "component_count", "wire_count"):
        assert k in found, f"missing key {k} in summary"
    assert found["component_count"] == 0
    assert found["wire_count"] == 0
    assert found["name"] == "TEST_list_session"


def test_delete_session_and_verify_removal(client, cleanup_ids):
    r = client.post(f"{API}/sessions", json={"name": "TEST_del", "components": [], "wires": []}, timeout=10)
    assert r.status_code == 200
    sid = r.json()["id"]

    rd = client.delete(f"{API}/sessions/{sid}", timeout=10)
    assert rd.status_code == 200
    assert rd.json().get("ok") is True

    rg = client.get(f"{API}/sessions/{sid}", timeout=10)
    assert rg.status_code == 404


def test_get_nonexistent_session_404(client):
    r = client.get(f"{API}/sessions/does-not-exist-xyz", timeout=10)
    assert r.status_code == 404


# ===== Wi-Fi Relay forward proxy =====
def test_wifi_relay_forward_unreachable_returns_200_with_error_status(client):
    payload = {"base_url": "http://invalid.local", "path": "/relay/on/1"}
    r = client.post(f"{API}/wifi-relay/forward", json=payload, timeout=15)
    # Must NOT 500
    assert r.status_code == 200, f"expected 200 with error body, got {r.status_code}: {r.text}"
    data = r.json()
    assert data.get("status") == "error"
    assert "message" in data
