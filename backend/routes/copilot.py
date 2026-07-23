import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import AgentAction, AWSConnection, Resource, User
from auth import get_current_user
from remediation_tools import ALLOWED_TOOLS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["remediation-copilot"])

class ChatRequest(BaseModel):
    connection_id: int
    message: str

class DecisionRequest(BaseModel):
    decision: str  # confirmed or rejected

@router.post("/chat")
async def copilot_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Diagnose resource drift status and propose structured remediation tasks."""
    # Verify access to connection
    connection = db.query(AWSConnection).filter(
        AWSConnection.id == req.connection_id,
        AWSConnection.organization_id == current_user.organization_id
    ).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AWS Connection context not found."
        )

    if connection.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AWS Connection is not active or has been revoked."
        )

    msg = req.message.lower()
    proposed_action = None

    # Check database resource status for context
    resources = db.query(Resource).filter(Resource.organization_id == current_user.organization_id).all()
    drifted_resources = [r for r in resources if r.drifted]

    # Simple NLP rules diagnostic parsing (fallback)
    if "versioning" in msg or "s3" in msg:
        s3_drifts = [r for r in drifted_resources if r.resource_type == "s3"]
        if s3_drifts:
            bucket_name = s3_drifts[0].name
            params = {"bucket_name": bucket_name}
            
            # Record proposed action in database
            action = AgentAction(
                connection_id=connection.id,
                tool_name="enable_s3_versioning",
                parameters_json=json.dumps(params),
                user_decision="pending"
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            
            proposed_action = {
                "id": action.id,
                "tool_name": action.tool_name,
                "parameters": params,
                "description": f"Enable versioning on public-exposed S3 Bucket '{bucket_name}' to resolve drift compliance alerts."
            }
            ai_msg = f"I've analyzed your connection and detected S3 versioning drift on bucket '{bucket_name}'. Would you like me to resolve this?"
        else:
            ai_msg = "All S3 bucket resources appear fully version-compliant. No drift detected!"

    elif "ssh" in msg or "port 22" in msg or "security group" in msg or "firewall" in msg:
        sg_drifts = [r for r in drifted_resources if r.resource_type == "ec2"]
        if sg_drifts:
            sg_name = sg_drifts[0].name
            # Mock details search or use default
            params = {
                "group_id": sg_drifts[0].resource_id,
                "port": 22,
                "cidr": "0.0.0.0/0",
                "action_type": "revoke"
            }
            action = AgentAction(
                connection_id=connection.id,
                tool_name="modify_security_group_ingress",
                parameters_json=json.dumps(params),
                user_decision="pending"
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            
            proposed_action = {
                "id": action.id,
                "tool_name": action.tool_name,
                "parameters": params,
                "description": f"Revoke SSH Port 22 public ingress rule (0.0.0.0/0) on Security Group '{sg_name}'."
            }
            ai_msg = f"Security risk found! Security Group '{sg_name}' has Port 22 open to the public. I can revoke this rule to secure the host."
        else:
            ai_msg = "No open public port 22 vulnerabilities discovered on active Security Groups."

    elif "scale" in msg or "resize" in msg or "rds" in msg or "database" in msg:
        rds_resources = [r for r in resources if r.resource_type == "rds"]
        if rds_resources:
            db_instance_id = rds_resources[0].resource_id
            params = {
                "db_instance_id": db_instance_id,
                "new_class": "db.t3.medium"
            }
            action = AgentAction(
                connection_id=connection.id,
                tool_name="resize_db_instance",
                parameters_json=json.dumps(params),
                user_decision="pending"
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            
            proposed_action = {
                "id": action.id,
                "tool_name": action.tool_name,
                "parameters": params,
                "description": f"Scale database instance '{db_instance_id}' up to size 'db.t3.medium' to meet load performance limits."
            }
            ai_msg = f"I've scheduled a scaling operation to resize database '{db_instance_id}' to db.t3.medium. Please confirm below to trigger apply."
        else:
            ai_msg = "No active RDS instance nodes discovered in this connection workspace."
            
    else:
        # Standard diagnostic response
        ai_msg = f"Welcome to CloudPulse Copilot. I'm connected to AWS Connection {connection.id}. "
        if drifted_resources:
            ai_msg += f"I see {len(drifted_resources)} active resource(s) currently drifted. You can ask me to: 'fix s3 versioning' or 'close public port 22'."
        else:
            ai_msg += "Your infrastructure shows 0 drifts. All checked resources are healthy and compliant!"

    return {
        "message": ai_msg,
        "proposed_action": proposed_action
    }

@router.post("/actions/{action_id}/decide")
async def decide_copilot_action(
    action_id: int,
    req: DecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute or reject proposed remediation tool actions with strict human validation gates."""
    action = db.query(AgentAction).filter(AgentAction.id == action_id).first()
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remediation action plan not found."
        )

    # Verify user organization connection ownership (SEC6)
    connection = db.query(AWSConnection).filter(
        AWSConnection.id == action.connection_id
    ).first()
    
    # 404 if connection does not exist or belongs to different org (anti-enumeration)
    if not connection or connection.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remediation action plan not found."
        )

    # 403 if owned but revoked
    if connection.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AWS Connection is not active or has been revoked."
        )

    # Check if a decision row already exists for this action context (SEC5/SEC8 replay protection)
    already_decided = db.query(AgentAction).filter(
        AgentAction.connection_id == action.connection_id,
        AgentAction.tool_name == action.tool_name,
        AgentAction.parameters_json == action.parameters_json,
        AgentAction.user_decision.in_(["confirmed", "rejected"])
    ).first()
    if already_decided:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action already decided. Current state: {already_decided.user_decision}"
        )

    # Process Reject
    if req.decision == "rejected":
        # Immutable append-only write (SEC8): Insert new status row
        new_log = AgentAction(
            connection_id=action.connection_id,
            tool_name=action.tool_name,
            parameters_json=action.parameters_json,
            user_decision="rejected",
            decided_at=datetime.utcnow()
        )
        db.add(new_log)
        db.commit()
        return {"status": "rejected", "message": "Action successfully discarded."}

    # Process Approve/Execute (Human-in-the-loop gate validation)
    elif req.decision == "confirmed":
        tool_name = action.tool_name
        
        # Security: Strict code-level allowed tools validation (Defense-in-depth / FR3.2 / SEC7)
        if tool_name not in ALLOWED_TOOLS:
            logger.critical(f"SECURITY ALERT: Blocked unmapped tool execution attempt: '{tool_name}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Security Policy violation: tool '{tool_name}' is not in the allow-list."
            )

        tool_func = ALLOWED_TOOLS[tool_name]
        params = json.loads(action.parameters_json)

        try:
            # Execute targeted tool call logic
            result = await tool_func(connection=connection, db=db, **params)
            
            # Immutable append-only write (SEC8): Insert new status row
            new_log = AgentAction(
                connection_id=action.connection_id,
                tool_name=action.tool_name,
                parameters_json=action.parameters_json,
                user_decision="confirmed",
                decided_at=datetime.utcnow(),
                executed_result=result
            )
            db.add(new_log)
            db.commit()
            
            return {"status": "success", "result": result}
        except Exception as e:
            # Immutable append-only write (SEC8): Insert new status row even on error
            new_log = AgentAction(
                connection_id=action.connection_id,
                tool_name=action.tool_name,
                parameters_json=action.parameters_json,
                user_decision="confirmed",
                decided_at=datetime.utcnow(),
                executed_result=f"Error: {str(e)}"
            )
            db.add(new_log)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Remediation execution crashed: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be 'confirmed' or 'rejected'."
        )

@router.get("/audit-log")
async def get_copilot_audit_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve read-only append-only audit trail logs of proposed/executed changes."""
    actions = db.query(AgentAction).join(
        AWSConnection, AWSConnection.id == AgentAction.connection_id
    ).filter(
        AWSConnection.organization_id == current_user.organization_id
    ).order_by(AgentAction.proposed_at.desc()).all()

    return [{
        "id": a.id,
        "connection_id": a.connection_id,
        "tool_name": a.tool_name,
        "parameters": json.loads(a.parameters_json),
        "proposed_at": a.proposed_at,
        "user_decision": a.user_decision,
        "decided_at": a.decided_at,
        "executed_result": a.executed_result
    } for a in actions]
