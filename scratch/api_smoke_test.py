import os
import sys
import concurrent.futures
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path so we can import from there
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import Base, get_db
from models import Organization, User

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./smoke_test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate testing DB tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Seed organization and initial user
db = TestingSessionLocal()
test_org = Organization(id=1, name="Smoke Test Org", industry="Testing", subscription_tier="pro")
db.add(test_org)
db.commit()
db.close()

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def run_smoke_test():
    print("==================================================")
    print("🚨 RUNNING CLOUDPULSE COCKPIT API SMOKE TESTS 🚨")
    print("==================================================")

    # 1. Register User
    print("\n[1/9] Registering test user...")
    register_payload = {
        "email": "smoke_tester@cloudpulse.ai",
        "username": "smoketester",
        "password": "testpassword123",
        "full_name": "Smoke Tester",
        "organization_id": 1
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    if res.status_code != 200:
        print(f"❌ User registration failed: {res.text}")
        return False
    print("✅ User registered successfully!")

    # 2. Login User
    print("\n[2/9] Logging in to retrieve JWT access token...")
    login_payload = {
        "email": "smoke_tester@cloudpulse.ai",
        "password": "testpassword123"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    if res.status_code != 200:
        print(f"❌ Login failed: {res.text}")
        return False
    
    token_data = res.json()
    token = token_data.get("access_token")
    if not token:
        print("❌ Login response did not contain an access_token.")
        return False
    print("✅ Login successful! Token retrieved.")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Connection Role Trust
    print("\n[3/9] Creating AWS cross-account trust role connection...")
    connection_payload = {
        "role_arn": "arn:aws:iam::999999999999:role/MockAssumeRole",
        "external_id": "smoke-test-external-id-12345",
        "region": "ap-south-1"
    }
    res = client.post("/api/v1/connections", json=connection_payload, headers=headers)
    if res.status_code != 200:
        print(f"❌ POST /connections failed: {res.text}")
        return False
    
    conn_data = res.json()
    connection_id = conn_data.get("connection_id")
    print(f"✅ Connection role created! Connection ID: {connection_id}")

    # 4. Verify AssumeRole connection status
    print("\n[4/9] Verifying STS connectivity on connection ID...")
    res = client.get(f"/api/v1/connections/{connection_id}/status", headers=headers)
    if res.status_code != 200:
        print(f"❌ GET /connections/status failed: {res.text}")
        return False
    print(f"✅ Verification check: {res.json()}")

    # 5. Create Provisioning Plan
    print("\n[5/9] Creating Natural Language Provisioning Plan...")
    plan_payload = {
        "requirement_text": "3-tier container app with RDS database, ALB load balancer, and S3 storage"
    }
    res = client.post("/api/v1/plans", json=plan_payload, headers=headers)
    if res.status_code != 200:
        print(f"❌ POST /plans failed: {res.text}")
        return False
    
    plan_data = res.json()
    plan_id = plan_data.get("plan_id")
    print(f"✅ Provisioning plan generated! Plan ID: {plan_id}")

    # 6. Execute Provisioning Plan
    print("\n[6/9] Executing Provisioning Plan parallel deployment...")
    res = client.post(f"/api/v1/plans/{plan_id}/execute", headers=headers)
    if res.status_code != 200:
        print(f"❌ POST /plans/execute failed: {res.text}")
        return False
    print("✅ Provisioning execution triggered successfully!")

    # 7. Concurrent double execution testing (Atomic Lock Check)
    print("\n[7/9] Testing concurrent double execution (Atomic Race condition lock)...")
    res_con_plan = client.post("/api/v1/plans", json={"requirement_text": "rds database"}, headers=headers)
    if res_con_plan.status_code != 200:
        print(f"❌ Concurrency plan creation failed: {res_con_plan.text}")
        return False
    new_plan_id = res_con_plan.json().get("plan_id")
    
    def fire_execute_request():
        # Uses a separate client or session context if threading requires it, otherwise client is thread-safe
        return client.post(f"/api/v1/plans/{new_plan_id}/execute", headers=headers)
        
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(fire_execute_request) for _ in range(5)]
        results = [f.result() for f in futures]
        
    status_codes = [r.status_code for r in results]
    success_count = status_codes.count(200)
    conflict_count = status_codes.count(400)
    
    print(f"-> Concurrency results status codes: {status_codes}")
    print(f"-> Success runs (200): {success_count}, Rejected runs (400): {conflict_count}")
    
    if success_count != 1:
        print("❌ Concurrency test failed: Exactly one thread must succeed!")
        return False
    print("✅ Atomic DB-level lock prevented TOCTOU double execution successfully!")

    # 8. Test cross-organization connection/resource ID enumeration leaks (404 check)
    print("\n[8/9] Testing resource/connection ID enumeration blocks (404 checks)...")
    # Seed second organization
    db = TestingSessionLocal()
    org_2 = Organization(id=2, name="Hacker Org", industry="Malicious", subscription_tier="free")
    db.add(org_2)
    db.commit()
    db.close()
    
    # Register and login second user
    client.post("/api/v1/auth/register", json={
        "email": "hacker@hacker.org",
        "username": "hacker",
        "password": "hackerpassword123",
        "full_name": "Hacker Tester",
        "organization_id": 2
    })
    log_res = client.post("/api/v1/auth/login", json={"email": "hacker@hacker.org", "password": "hackerpassword123"})
    hacker_token = log_res.json()["access_token"]
    hacker_headers = {"Authorization": f"Bearer {hacker_token}"}
    
    # Query connection 1 status (connection 1 belongs to organization 1)
    res_hack = client.get(f"/api/v1/connections/{connection_id}/status", headers=hacker_headers)
    if res_hack.status_code != 404:
        print(f"❌ Security violation: Hacker got {res_hack.status_code} instead of 404 on connection ID {connection_id}!")
        return False
    print("✅ Connection ID enumeration blocked with 404 Not Found successfully!")

    # 9. Test invalid/expired JWT bearer tokens on protected routes (401 check)
    print("\n[9/9] Testing unauthorized request handling (401 checks)...")
    bad_headers = {"Authorization": "Bearer invalid_expired_jwt_token_401"}
    res_bad = client.get("/api/v1/resources/", headers=bad_headers)
    if res_bad.status_code != 401:
        print(f"❌ Invalid token check failed: Expected 401, got {res_bad.status_code}")
        return False
    print("✅ Invalid token rejected with 401 Unauthorized successfully!")

    print("\n==================================================")
    print("🎉 ALL API ENDPOINTS PASSED SMOKE TESTS SUCCESSFULLY! 🎉")
    print("==================================================")
    return True

if __name__ == "__main__":
    success = run_smoke_test()
    # Clean up test database file
    if os.path.exists("./smoke_test.db"):
        try:
            os.remove("./smoke_test.db")
        except Exception:
            pass
    sys.exit(0 if success else 1)
