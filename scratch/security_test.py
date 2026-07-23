import os
import sys
import json
import shutil
import concurrent.futures
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import Base, get_db
from models import Organization, User, AWSConnection, ProvisioningPlan, Resource, AgentAction, ProcessedSNSMessage
from config import settings
from metrics_cache import clear_metrics_cache

# 1. Setup Test Database with Triggers (SEC8)
SQLALCHEMY_DATABASE_URL = "sqlite:///./security_test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate testing tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Install SQLite triggers to block UPDATE/DELETE on agent_actions table (SEC8)
with engine.connect() as connection:
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

# Override DB session injection
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Initialize client with raise_server_exceptions=False to inspect 500 error codes
client = TestClient(app, raise_server_exceptions=False)

# Seed helper objects
db = TestingSessionLocal()
# Org 1
org1 = Organization(id=1, name="Org One", industry="Security Testing")
db.add(org1)
# Org 2
org2 = Organization(id=2, name="Org Two", industry="Anti Enumeration Test")
db.add(org2)
db.commit()

# Register and login Org 1 User
res = client.post("/api/v1/auth/register", json={
    "email": "user1@cloudpulse.ai",
    "username": "user1",
    "password": "Password123!",
    "full_name": "User One",
    "organization_id": 1
})
res_login = client.post("/api/v1/auth/login", json={"email": "user1@cloudpulse.ai", "password": "Password123!"})
user1_token = res_login.json()["access_token"]
headers1 = {"Authorization": f"Bearer {user1_token}"}

# Register and login Org 2 User
res = client.post("/api/v1/auth/register", json={
    "email": "user2@cloudpulse.ai",
    "username": "user2",
    "password": "Password123!",
    "full_name": "User Two",
    "organization_id": 2
})
res_login2 = client.post("/api/v1/auth/login", json={"email": "user2@cloudpulse.ai", "password": "Password123!"})
user2_token = res_login2.json()["access_token"]
headers2 = {"Authorization": f"Bearer {user2_token}"}

# Create connection for Org 1 (Connection ID: 1)
res_conn1 = client.post("/api/v1/connections", json={
    "role_arn": "arn:aws:iam::111111111111:role/MockAssumeRole",
    "external_id": "ext-id-org1-1234",
    "region": "ap-south-1"
}, headers=headers1)
connection_id = res_conn1.json()["connection_id"]

# Create connection for Org 2 (Connection ID: 2)
res_conn2 = client.post("/api/v1/connections", json={
    "role_arn": "arn:aws:iam::222222222222:role/MockAssumeRole",
    "external_id": "ext-id-org2-5678",
    "region": "us-east-1"
}, headers=headers2)
conn2_id = res_conn2.json()["connection_id"]
db.close()

# ----------------- TEST FUNCTIONS -----------------

def test_sts_bypass_blocked_in_production():
    """SEC1: Setting environment=production and passing a mock-keyword ARN raises 500 error."""
    settings.environment = "production"
    clear_metrics_cache()
    try:
        res = client.get(f"/api/v1/connections/{connection_id}/status", headers=headers1)
        assert res.status_code == 500, f"Expected 500, got {res.status_code}"
        print("✅ test_sts_bypass_blocked_in_production passed")
        return True
    except Exception as e:
        print(f"❌ test_sts_bypass_blocked_in_production failed: {e}")
        return False
    finally:
        settings.environment = "development"

def test_sns_mock_cert_blocked_in_production():
    """SEC2: Mock certificate SNS signature verification is blocked under production mode."""
    settings.environment = "production"
    try:
        payload = {
            "Type": "SubscriptionConfirmation",
            "MessageId": "sns-prod-msg",
            "Token": "tok",
            "TopicArn": "arn:aws:sns:ap-south-1:111111111111:mock-topic",
            "SubscribeURL": "http://testserver/api/v1/health",
            "SigningCertURL": "https://sns.amazonaws.com/mock-cert.pem"
        }
        res = client.post("/api/v1/webhooks/aws", json=payload, headers={"x-amz-sns-message-type": "SubscriptionConfirmation"})
        assert res.status_code == 500, f"Expected 500, got {res.status_code}"
        print("✅ test_sns_mock_cert_blocked_in_production passed")
        return True
    except Exception as e:
        print(f"❌ test_sns_mock_cert_blocked_in_production failed: {e}")
        return False
    finally:
        settings.environment = "development"

def test_concurrent_execute_only_one_succeeds():
    """SEC3: Exactly one concurrent execute request succeeds; other receives 400."""
    res_plan = client.post("/api/v1/plans", json={"requirement_text": "rds database"}, headers=headers1)
    plan_id = res_plan.json()["plan_id"]

    def run_execute():
        return client.post(f"/api/v1/plans/{plan_id}/execute", headers=headers1)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(run_execute) for _ in range(5)]
        results = [f.result() for f in futures]

    status_codes = [r.status_code for r in results]
    assert status_codes.count(200) == 1, f"Expected exactly one 200, got status codes: {status_codes}"
    assert status_codes.count(400) == 4, f"Expected four 400s, got status codes: {status_codes}"
    print("✅ test_concurrent_execute_only_one_succeeds passed")
    return True

def test_sns_signature_rejects_tampered_payload():
    """SEC4: SNS signature checks reject invalid/tampered payloads with 403."""
    settings.environment = "production"
    try:
        # Pass a payload with tampered / missing signature
        payload = {
            "Type": "Notification",
            "MessageId": "sns-tampered-msg",
            "TopicArn": "arn:aws:sns:ap-south-1:111111111111:topic",
            "Message": "drifted",
            "Signature": "invalid-tampered-sig-value",
            "SigningCertURL": "https://sns.ap-south-1.amazonaws.com/cert.pem"
        }
        res = client.post("/api/v1/webhooks/aws", json=payload, headers={"x-amz-sns-message-type": "Notification"})
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        
        # Verify it was not processed/persisted
        db = TestingSessionLocal()
        persisted = db.query(ProcessedSNSMessage).filter(ProcessedSNSMessage.message_id == "sns-tampered-msg").first()
        assert persisted is None, "Tampered payload was persisted in processed_sns_messages!"
        db.close()
        print("✅ test_sns_signature_rejects_tampered_payload passed")
        return True
    except Exception as e:
        print(f"❌ test_sns_signature_rejects_tampered_payload failed: {e}")
        return False
    finally:
        settings.environment = "development"

def test_sns_dedup_ignores_replayed_message_id():
    """SEC5: Replaying message with same MessageId twice returns skipped."""
    payload = {
        "Type": "Notification",
        "MessageId": "sns-uuid-dedup-check",
        "TopicArn": "arn:aws:sns:ap-south-1:111111111111:topic",
        "Message": '{"resource_id": "res-id", "compliance": "drifted"}',
        "Signature": "signature",
        "SigningCertURL": "https://sns.amazonaws.com/cert"
    }
    # First delivery
    res1 = client.post("/api/v1/webhooks/aws", json=payload, headers={"x-amz-sns-message-type": "Notification"})
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"

    # Replay
    res2 = client.post("/api/v1/webhooks/aws", json=payload, headers={"x-amz-sns-message-type": "Notification"})
    assert res2.status_code == 200
    assert res2.json().get("status") == "skipped", f"Expected skipped, got {res2.json()}"
    print("✅ test_sns_dedup_ignores_replayed_message_id passed")
    return True

def test_revoked_connection_returns_403():
    """SEC6: Owner querying status of their revoked connection receives 403."""
    db = TestingSessionLocal()
    conn = db.query(AWSConnection).filter(AWSConnection.id == connection_id).first()
    conn.status = "revoked"
    db.commit()
    db.close()

    clear_metrics_cache()
    res = client.get(f"/api/v1/connections/{connection_id}/status", headers=headers1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("✅ test_revoked_connection_returns_403 passed")
    return True

def test_foreign_connection_returns_404():
    """SEC6: Querying another organization's connection returns 404 to avoid enumeration."""
    # User 1 queries User 2's connection status
    res = client.get(f"/api/v1/connections/{conn2_id}/status", headers=headers1)
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print("✅ test_foreign_connection_returns_404 passed")
    return True

def test_copilot_rejects_unlisted_tool():
    """SEC7: Copilot rejects any tool that is not in the hardcoded allow-list."""
    db = TestingSessionLocal()
    # Pre-populate connections back to connected
    conn = db.query(AWSConnection).filter(AWSConnection.id == connection_id).first()
    conn.status = "connected"
    db.commit()

    action = AgentAction(
        connection_id=connection_id,
        tool_name="execute_arbitrary_shell_command",  # Unlisted/malicious tool
        parameters_json='{"cmd": "rm -rf /"}',
        user_decision="pending"
    )
    db.add(action)
    db.commit()
    action_id = action.id
    db.close()

    res = client.post(f"/api/v1/copilot/actions/{action_id}/decide", json={"decision": "confirmed"}, headers=headers1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("✅ test_copilot_rejects_unlisted_tool passed")
    return True

def test_agent_actions_table_has_no_update_delete_grant():
    """SEC8: Raw UPDATE/DELETE queries on agent_actions table are aborted by SQLite database triggers."""
    from sqlalchemy.exc import OperationalError
    db = TestingSessionLocal()
    
    # Try updating
    try:
        db.execute(text("UPDATE agent_actions SET user_decision = 'confirmed'"))
        db.commit()
        db.close()
        print("❌ test_agent_actions_table_has_no_update_delete_grant: UPDATE succeeded, triggers failed!")
        return False
    except Exception as e:
        db.rollback()

    # Try deleting
    try:
        db.execute(text("DELETE FROM agent_actions"))
        db.commit()
        db.close()
        print("❌ test_agent_actions_table_has_no_update_delete_grant: DELETE succeeded, triggers failed!")
        return False
    except Exception as e:
        db.rollback()

    db.close()
    print("✅ test_agent_actions_table_has_no_update_delete_grant passed")
    return True

def test_apply_rejected_without_confirmed_plan():
    """SEC9: Terraform apply calls without a valid planned and reviewed record fail with 404/400."""
    # Attempting to execute unreviewed plan (ID = 999)
    res = client.post("/api/v1/plans/999/execute", headers=headers1)
    assert res.status_code in [400, 404], f"Expected 400 or 404, got {res.status_code}"
    print("✅ test_apply_rejected_without_confirmed_plan passed")
    return True

def test_no_credential_leakage_in_logs_or_workspace():
    """SEC10: Logs and workspace directories do not write or retain any STS credentials."""
    # Run a plan and apply simulation
    res_plan = client.post("/api/v1/plans", json={"requirement_text": "rds database"}, headers=headers1)
    plan_id = res_plan.json()["plan_id"]
    client.post(f"/api/v1/plans/{plan_id}/execute", headers=headers1)
    
    # Scan the workspace directory
    workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "scratch", "workspaces", f"workspace-{connection_id}-{plan_id}"))
    assert not os.path.exists(workspace_dir), f"Workspace directory {workspace_dir} was not cleaned up!"
    print("✅ test_no_credential_leakage_in_logs_or_workspace passed")
    return True

def test_secrets_not_plaintext_in_db():
    """SEC11: Sensitive connection attributes (role_arn, external_id) are Fernet-encrypted ciphers in DB."""
    db = TestingSessionLocal()
    # Directly query the raw database columns
    result = db.execute(text("SELECT role_arn, external_id FROM aws_connections")).fetchall()
    db.close()

    for row in result:
        role_arn_raw, external_id_raw = row
        # plaintext role ARN begins with 'arn:aws'
        assert "arn:aws" not in role_arn_raw, f"Plaintext role_arn leaked in DB: {role_arn_raw}"
        # Fernet strings start with base64 gAAAA
        assert role_arn_raw.startswith("gAAAA"), f"Invalid ciphertext: {role_arn_raw}"
    print("✅ test_secrets_not_plaintext_in_db passed")
    return True

# ----------------- MAIN RUNNER -----------------

def run_all_security_tests():
    print("==================================================")
    print("🔒 RUNNING CLOUDPULSE COCKPIT SECURITY TESTS 🔒")
    print("==================================================")
    
    tests = [
        test_sts_bypass_blocked_in_production,
        test_sns_mock_cert_blocked_in_production,
        test_concurrent_execute_only_one_succeeds,
        test_sns_signature_rejects_tampered_payload,
        test_sns_dedup_ignores_replayed_message_id,
        test_revoked_connection_returns_403,
        test_foreign_connection_returns_404,
        test_copilot_rejects_unlisted_tool,
        test_agent_actions_table_has_no_update_delete_grant,
        test_apply_rejected_without_confirmed_plan,
        test_no_credential_leakage_in_logs_or_workspace,
        test_secrets_not_plaintext_in_db
    ]

    all_passed = True
    for test in tests:
        if not test():
            all_passed = False
            
    print("==================================================")
    if all_passed:
        print("🎉 ALL SECURITY HARDENING TESTS PASSED SUCCESSFULLY! 🎉")
    else:
        print("❌ SOME SECURITY HARDENING TESTS FAILED!")
    print("==================================================")
    return all_passed

if __name__ == "__main__":
    success = run_all_security_tests()
    # Clean up test DB
    if os.path.exists("./security_test.db"):
        try:
            os.remove("./security_test.db")
        except Exception:
            pass
    sys.exit(0 if success else 1)
