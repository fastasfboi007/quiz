import os
import time
from collections import Counter

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

COMPANIES = ["ANZ", "Star", "Santos", "RioTinto", "WiseTech"]


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Root / health ----------------
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200
        assert "message" in r.json()


# ---------------- GET /api/questions ----------------
class TestQuestions:
    def test_questions_shape(self, api):
        r = api.get(f"{BASE_URL}/api/questions", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 40, f"expected 40 got {len(data)}"
        counts = Counter(q["company"] for q in data)
        for c in COMPANIES:
            assert counts[c] == 8, f"{c} has {counts[c]} questions"
        ids = [q["id"] for q in data]
        assert len(set(ids)) == 40, "duplicate question ids"
        for q in data:
            assert len(q["options"]) == 4, f"{q['id']} options != 4"
            assert len(set(q["options"])) == 4, f"{q['id']} duplicate options"
            assert 0 <= q["correctIndex"] <= 3
            assert isinstance(q["category"], str) and q["category"].strip()
            assert isinstance(q["explanation"], str) and q["explanation"].strip()
            assert isinstance(q["question"], str) and q["question"].strip()

    def test_shuffle_between_calls(self, api):
        r1 = api.get(f"{BASE_URL}/api/questions", timeout=30).json()
        r2 = api.get(f"{BASE_URL}/api/questions", timeout=30).json()
        assert [q["id"] for q in r1] != [q["id"] for q in r2], "question order not shuffled"
        m1 = {q["id"]: q["options"] for q in r1}
        m2 = {q["id"]: q["options"] for q in r2}
        diff = sum(1 for k in m1 if m1[k] != m2[k])
        assert diff > 0, "option positions identical across calls"

    def test_correct_answer_consistent_across_shuffle(self, api):
        r1 = api.get(f"{BASE_URL}/api/questions", timeout=30).json()
        r2 = api.get(f"{BASE_URL}/api/questions", timeout=30).json()
        m2 = {q["id"]: q for q in r2}
        for q in r1:
            other = m2[q["id"]]
            assert q["options"][q["correctIndex"]] == other["options"][other["correctIndex"]], \
                f"correct answer text changed for {q['id']}"


# ---------------- Leaderboard ----------------
class TestLeaderboard:
    created = []

    def test_create_and_persist(self, api):
        payload = {
            "name": "TEST_qa_user",
            "score": 33,
            "total": 40,
            "timeSeconds": 120,
            "accuracy": 82.5,
            "breakdown": [{"company": "ANZ", "correct": 7, "total": 8}],
        }
        r = api.post(f"{BASE_URL}/api/leaderboard", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "_id" in d or "id" in d
        assert d["name"] == payload["name"]
        assert d["score"] == 33
        assert d["accuracy"] == 82.5
        assert d["breakdown"][0]["company"] == "ANZ"
        assert "createdAt" in d
        assert "_id" not in str(d) or isinstance(d.get("_id", ""), str)

        g = api.get(f"{BASE_URL}/api/leaderboard", timeout=30)
        assert g.status_code == 200
        names = [e["name"] for e in g.json()]
        assert "TEST_qa_user" in names, "created attempt not persisted"

    def test_sorting(self, api):
        entries = [
            {"name": "TEST_sort_lo", "score": 5, "total": 40, "timeSeconds": 10, "accuracy": 12.5},
            {"name": "TEST_sort_hi_slow", "score": 39, "total": 40, "timeSeconds": 999, "accuracy": 97.5},
            {"name": "TEST_sort_hi_fast", "score": 39, "total": 40, "timeSeconds": 11, "accuracy": 97.5},
        ]
        for e in entries:
            assert api.post(f"{BASE_URL}/api/leaderboard", json=e, timeout=30).status_code == 200
        data = api.get(f"{BASE_URL}/api/leaderboard", timeout=30).json()
        keys = [(-e["score"], e["timeSeconds"]) for e in data]
        assert keys == sorted(keys), "leaderboard not sorted by score desc, time asc"
        names = [e["name"] for e in data]
        assert names.index("TEST_sort_hi_fast") < names.index("TEST_sort_hi_slow")

    def test_validation_errors(self, api):
        r = api.post(f"{BASE_URL}/api/leaderboard", json={"name": "", "score": 1, "total": 40,
                                                          "timeSeconds": 1, "accuracy": 1}, timeout=30)
        assert r.status_code == 422, f"empty name accepted: {r.status_code}"
        r2 = api.post(f"{BASE_URL}/api/leaderboard", json={"name": "TEST_x"}, timeout=30)
        assert r2.status_code == 422


# ---------------- AI regeneration (real integration) ----------------
class TestRegenerate:
    def test_regenerate(self, api):
        t0 = time.time()
        r = api.post(f"{BASE_URL}/api/regenerate-questions", timeout=180)
        elapsed = time.time() - t0
        print(f"regenerate latency: {elapsed:.1f}s status={r.status_code}")
        assert r.status_code == 200, f"status {r.status_code} after {elapsed:.1f}s: {r.text[:400]}"
        data = r.json()
        assert isinstance(data, list)
        counts = Counter(q["company"] for q in data)
        print(f"regenerate returned {len(data)} questions; counts={counts}")
        for q in data:
            assert len(q["options"]) == 4, f"{q['id']} options != 4"
            assert 0 <= q["correctIndex"] <= 3
            assert q["company"] in COMPANIES
            assert q["question"].strip()
            assert q["explanation"] is not None
        ids = [q["id"] for q in data]
        assert len(set(ids)) == len(ids), "duplicate ids in regenerated set"
        # must be balanced: exactly 8 per company => 40 total
        assert len(data) == 40, f"expected 40 questions, got {len(data)} (counts={dict(counts)})"
        for c in COMPANIES:
            assert counts[c] == 8, f"{c} has {counts[c]} questions, expected 8"
        # must fit within ingress timeout budget
        assert elapsed < 55, f"regenerate took {elapsed:.1f}s (>55s ingress budget)"


@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    try:
        from pymongo import MongoClient
        from dotenv import dotenv_values as dv
        be = dv("/app/backend/.env")
        c = MongoClient(be["MONGO_URL"])
        c[be["DB_NAME"]].attempts.delete_many({"name": {"$regex": "^TEST_"}})
        c.close()
    except Exception as e:
        print(f"cleanup skipped: {e}")
