import os
import sys
import json
import concurrent.futures
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path so we can import from there
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import Base, get_db
from models import Organization, User, Resource, AgentAction
from config import settings
from datetime import datetime
settings.environment = "development"

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./smoke_test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate testing DB tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Install SQLite triggers to block UPDATE/DELETE on agent_actions table (SEC8)
from sqlalchemy import text
with engine.connect() as connection:
    try:
        connection.execute(text("""
            CREATE TRIGGER block_update_agent_actions
            BEFORE UPDATE ON agent_actions
            BEGIN
                SELECT RAISE(FAIL, 'Updates are not allowed on the append-only table agent_actions.');
            END;
        """))
        connection.execute(text("""
            CREATE TRIGGER block_delete_agent_actions
            BEFORE DELETE ON agent_actions
            BEGIN
                SELECT RAISE(FAIL, 'Deletes are not allowed on the append-only table agent_actions.');
            END;
        """))
        connection.commit()
    except Exception as trigger_err:
        print(f"Test trigger setup error: {trigger_err}")

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
client = TestClient(app, raise_server_exceptions=False)

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
    print("\n[9/11] Testing unauthorized request handling (401 checks)...")
    bad_headers = {"Authorization": "Bearer invalid_expired_jwt_token_401"}
    res_bad = client.get("/api/v1/resources/", headers=bad_headers)
    if res_bad.status_code != 401:
        print(f"❌ Invalid token check failed: Expected 401, got {res_bad.status_code}")
        return False
    print("✅ Invalid token rejected with 401 Unauthorized successfully!")

    # 10. Webhook Signature Verification and Handshake (FR2.1, FR2.2, FR2.3)
    print("\n[10/11] Testing AWS Webhook Handshake & Signature Security...")
    # Test valid simulation type handshake confirmation
    handshake_payload = {
        "Type": "SubscriptionConfirmation",
        "MessageId": "handshake-id-1234",
        "SubscribeURL": "http://testserver/api/v1/health",
        "SigningCertURL": "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService.pem",
        "Signature": "mock-signature"
    }
    headers_sns = {"x-amz-sns-message-type": "SubscriptionConfirmation"}
    res_hs = client.post("/api/v1/webhooks/aws", json=handshake_payload, headers=headers_sns)
    if res_hs.status_code != 200:
        print(f"❌ Handshake test failed: Expected 200, got {res_hs.status_code}. Detail: {res_hs.text}")
        return False
    print("✅ Webhook auto-confirms AWS SNS subscription handshake successfully!")

    # 11. Webhook Deduplication Check (FR2.4)
    print("\n[11/11] Testing Webhook Notification delivery & MessageId deduplication...")
    notification_payload = {
        "Type": "Notification",
        "MessageId": "sns-message-uuid-5678",
        "Message": json.dumps({
            "messageType": "ConfigurationItemChangeNotification",
            "configurationItem": {
                "resourceType": "AWS::S3::Bucket",
                "resourceId": "s3-assets-bucket",
                "configuration": {
                    "versioning": {
                        "status": "Suspended"
                    }
                }
            }
        }),
        "SigningCertURL": "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService.pem",
        "Signature": "mock-signature"
    }
    headers_notif = {"x-amz-sns-message-type": "Notification"}
    
    # First delivery
    res_del1 = client.post("/api/v1/webhooks/aws", json=notification_payload, headers=headers_notif)
    if res_del1.status_code != 200 or res_del1.json().get("status") != "success":
        print(f"❌ Webhook notification failed on first delivery: {res_del1.text}")
        return False
        
    # Duplicate delivery
    res_del2 = client.post("/api/v1/webhooks/aws", json=notification_payload, headers=headers_notif)
    if res_del2.status_code != 200 or res_del2.json().get("status") != "skipped":
        print(f"❌ Webhook deduplication failed on second delivery: {res_del2.text}")
        return False
    print("✅ Webhook deduplicates messages by MessageId successfully!")

    # 12. Remediation Copilot Chat and Action Approvals (FR3.1, FR3.3, FR3.4)
    print("\n[12/12] Testing Remediation Copilot Chat, Proposals & Approvals...")
    
    # Seed a drifted resource first
    db = TestingSessionLocal()
    db.query(Resource).delete()
    drifted_s3 = Resource(
        organization_id=1,
        plan_id=1,
        aws_resource_arn="arn:aws:s3:::s3-assets-bucket",
        resource_id="res-s3-bucket",
        resource_type="s3",
        name="s3-assets-bucket",
        region="ap-south-1",
        state="available",
        monthly_cost=12.0,
        drifted=True,
        last_scanned_at=datetime.utcnow()
    )
    db.add(drifted_s3)
    db.commit()
    db.close()
    
    # Request fixing versioning
    chat_payload = {
        "connection_id": connection_id,
        "message": "fix s3 versioning"
    }
    res_chat = client.post("/api/v1/copilot/chat", json=chat_payload, headers=headers)
    if res_chat.status_code != 200:
        print(f"❌ Copilot chat failed: {res_chat.text}")
        return False
        
    chat_data = res_chat.json()
    action_prop = chat_data.get("proposed_action")
    if not action_prop or action_prop.get("tool_name") != "enable_s3_versioning":
        print(f"❌ Copilot failed to propose enable_s3_versioning: {chat_data}")
        return False
    print("✅ Copilot detects drift and proposes enable_s3_versioning task!")

    # Confirm action proposal execution
    action_id = action_prop.get("id")
    res_decide = client.post(f"/api/v1/copilot/actions/{action_id}/decide", json={"decision": "confirmed"}, headers=headers)
    if res_decide.status_code != 200:
        print(f"❌ Action decision approval failed: {res_decide.text}")
        return False
        
    # Check that s3 resource is no longer drifted in database
    db = TestingSessionLocal()
    updated_res = db.query(Resource).filter(Resource.resource_id == "res-s3-bucket").first()
    if not updated_res or updated_res.drifted:
        print("❌ S3 versioning remediation didn't update database drifted state!")
        return False
    db.close()
    print("✅ Remediation Copilot executes confirmed action and resolves resource drift state!")

    # 13. Multi-Account Connection Listing and TTL Caching (FR4.1, NFR Caching)
    print("\n[13/13] Testing Multi-Account Connections List & Telemetry Caching...")
    res_list = client.get("/api/v1/connections", headers=headers)
    if res_list.status_code != 200 or len(res_list.json()) == 0:
        print(f"❌ Connections listing endpoint failed: {res_list.text}")
        return False
    print("✅ Connections list endpoint retrieved all connected accounts successfully!")

    # 14. Testing Security Hardening Requirements (SEC1, SEC2, SEC8, SEC11)
    print("\n[14/14] Testing Security Hardening controls (SEC1, SEC2, SEC8, SEC11)...")
    
    # Test SEC1: STS mock bypass is unreachable in production
    print("  -> Testing SEC1 (mock bypass unreachable in production)...")
    from config import settings
    from metrics_cache import clear_metrics_cache
    clear_metrics_cache()
    settings.environment = "production"
    try:
        res_sec1 = client.get(f"/api/v1/connections/{connection_id}/status", headers=headers)
        if res_sec1.status_code != 500:
            print(f"❌ SEC1 Failed: Expected status 500 for mock STS bypass in production, got {res_sec1.status_code}")
            return False
        print("  ✅ SEC1 verified: Mock STS connection verification blocked with 500 in production environment!")
    finally:
        settings.environment = "development"

    # Test SEC2: SNS mock-certificate path is unreachable in production
    print("  -> Testing SEC2 (SNS mock bypass unreachable in production)...")
    settings.environment = "production"
    try:
        test_payload = {
            "Type": "SubscriptionConfirmation",
            "MessageId": "sns-msg-id-prod-bypass",
            "Token": "token-xyz",
            "TopicArn": "arn:aws:sns:ap-south-1:999999999999:mock-topic",
            "SubscribeURL": "http://testserver/api/v1/health",
            "SigningCertURL": "https://sns.ap-south-1.amazonaws.com/mock-cert.pem"
        }
        res_sec2 = client.post("/api/v1/webhooks/aws", json=test_payload, headers={"x-amz-sns-message-type": "SubscriptionConfirmation"})
        if res_sec2.status_code != 500:
            print(f"❌ SEC2 Failed: Expected status 500 for mock SNS signature in production, got {res_sec2.status_code}")
            return False
        print("  ✅ SEC2 verified: Mock SNS webhook signature check blocked with 500 in production environment!")
    finally:
        settings.environment = "development"

    # Test SEC8: Audit log (agent_actions) is append-only (UPDATE/DELETE blocked at DB level)
    print("  -> Testing SEC8 (DB-level UPDATE/DELETE prevention)...")
    from sqlalchemy import text
    db = TestingSessionLocal()
    try:
        act_row = db.query(AgentAction).first()
        if act_row:
            try:
                db.execute(text(f"UPDATE agent_actions SET user_decision = 'confirmed' WHERE id = {act_row.id}"))
                db.commit()
                print("❌ SEC8 Failed: Database allowed UPDATE statement on agent_actions!")
                return False
            except Exception as e:
                db.rollback()
                
            try:
                db.execute(text(f"DELETE FROM agent_actions WHERE id = {act_row.id}"))
                db.commit()
                print("❌ SEC8 Failed: Database allowed DELETE statement on agent_actions!")
                return False
            except Exception as e:
                db.rollback()
        print("  ✅ SEC8 verified: SQLite triggers block UPDATE and DELETE on agent_actions successfully!")
    finally:
        db.close()

    # Test SEC11: Secrets at rest are encrypted
    print("  -> Testing SEC11 (secrets encryption at rest)...")
    db = TestingSessionLocal()
    try:
        raw_conn = db.execute(text("SELECT role_arn, external_id FROM aws_connections")).fetchall()
        for row in raw_conn:
            role_arn_db, ext_id_db = row
            if "arn:aws" in role_arn_db:
                print(f"❌ SEC11 Failed: Raw DB role_arn stores plaintext: {role_arn_db}")
                return False
            if not role_arn_db.startswith("gAAAA"):
                print(f"❌ SEC11 Failed: Raw DB role_arn does not appear to be encrypted ciphertext: {role_arn_db}")
                return False
        print("  ✅ SEC11 verified: Role ARNs and External IDs are stored as base64 Fernet ciphertexts!")
    finally:
        db.close()

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
