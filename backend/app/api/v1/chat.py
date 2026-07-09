import json
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, ChatSession, ChatMessage, ResourceInventory, Alert
from app.schemas.schemas import ChatSessionCreate, ChatSessionOut, ChatMessageCreate, ChatMessageOut

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    session_in: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_session = ChatSession(
        user_id=current_user.id,
        title=session_in.title
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session


@router.get("/sessions", response_model=List[ChatSessionOut])
async def read_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=ChatSessionOut)
async def read_chat_session_details(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == current_user.id
        )
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    
    # Fetch messages
    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
    )
    session.messages = msg_result.scalars().all()
    return session


@router.post("/sessions/{session_id}/message")
async def send_chat_message(
    session_id: int,
    message_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify session ownership
    sess_result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == current_user.id
        )
    )
    session = sess_result.scalars().first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )

    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=message_in.content
    )
    db.add(user_msg)
    await db.commit()

    # Determine automated response based on database context
    async def response_generator():
        # Fetch active resources and alerts to feed context
        res_query = select(ResourceInventory).join(AWSAccount).where(AWSAccount.user_id == current_user.id)
        res_data = await db.execute(res_query)
        resources = res_data.scalars().all()

        alert_query = select(Alert).join(AWSAccount).where(AWSAccount.user_id == current_user.id)
        alert_data = await db.execute(alert_query)
        alerts = alert_data.scalars().all()

        prompt = message_in.content.lower()
        response_text = ""

        # SRE AI agent response routing
        if "resource" in prompt or "inventory" in prompt:
            response_text = "### 📂 Active Infrastructure Inventory\nHere is a list of your registered AWS resources retrieved from the database:\n\n"
            response_text += "| Resource ID | Name | Type | Region | State | Health | Efficiency |\n"
            response_text += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
            for r in resources:
                response_text += f"| `{r.resource_id}` | {r.resource_name or '-'} | **{r.resource_type.upper()}** | {r.region} | `{r.state}` | {r.health_score}% | {r.efficiency_score}% |\n"
            response_text += "\nIs there a specific resource you want me to inspect?"
            
        elif "alert" in prompt or "critical" in prompt or "warnings" in prompt:
            active_alerts = [a for a in alerts if a.status == "active"]
            if not active_alerts:
                response_text = "✅ **System Health is Stable.** There are currently no active alerts in the database."
            else:
                response_text = f"### ⚠️ Active Alerts ({len(active_alerts)})\nI found the following active issues requiring SRE attention:\n\n"
                for a in active_alerts:
                    severity_badge = "🔴 CRITICAL" if a.severity == "critical" else "🟡 WARNING"
                    response_text += f"* **{severity_badge}**: {a.message} (Resource: `{a.resource_id_str}`)\n"
                response_text += "\nWould you like me to generate a mitigation Terraform script for any of these?"

        elif "optimize" in prompt or "cost" in prompt or "save" in prompt or "waste" in prompt:
            response_text = "### 💰 FinOps Cost Optimization Proposals\nAnalyzing resource metrics and idle configurations...\n\n"
            wastes = []
            for r in resources:
                if r.resource_type == "ebs" and r.state == "available":
                    wastes.append(f"* **EBS Volume `{r.resource_id}`** is unattached. Delete this volume to save **${r.configuration.get('Size', 0) * 0.10}/mo**.")
                elif r.efficiency_score < 20.0:
                    inst_type = r.configuration.get("InstanceType", r.configuration.get("DBInstanceClass", "large"))
                    wastes.append(f"* **{r.resource_type.upper()} `{r.resource_name}`** is idle (CPU < 2%). Downsize from `{inst_type}` to `t3.micro` to save **$30.00/mo**.")
            
            if not wastes:
                response_text += "Great job! No underutilized or idle resources detected."
            else:
                response_text += "\n".join(wastes)
                response_text += "\n\nTo view complete Terraform migration scripts, request: *'Give me the Terraform code to optimize my stack.'*"

        elif "terraform" in prompt or "code" in prompt or "script" in prompt:
            response_text = "### 🛠️ Terraform Remediation Script\nHere is the generated configuration to optimize your AWS resources:\n\n"
            response_text += "```hcl\n# CloudPulse AI Generated Terraform Plan\n# Target: Clean up unused volumes and downsize idle servers\n\n"
            for r in resources:
                if r.resource_type == "ebs" and r.state == "available":
                    response_text += f"# Resource ID: {r.resource_id} (Orphaned Volume)\n# Action: Terminate\n"
                elif r.efficiency_score < 20.0:
                    inst_type = r.configuration.get("InstanceType", r.configuration.get("DBInstanceClass", "large"))
                    response_text += f"# Resource ID: {r.resource_id} ({inst_type})\n# Action: Downsize to t3.micro\n"
            response_text += "\n# Run 'terraform plan' to verify these changes locally before applying.\n```\n\nWould you like me to walk you through running this script?"

        else:
            response_text = (
                "Hello! I am your **CloudPulse AI SRE Copilot**. I can help you monitor, secure, and optimize your AWS architecture.\n\n"
                "Here are some examples of what you can ask me:\n"
                "* *'List my active resources'* to see EC2/RDS instances.\n"
                "* *'Do I have any active alerts?'* to view downtime risks.\n"
                "* *'How can I save costs?'* to scan for idle resources.\n"
                "* *'Generate Terraform code to fix optimizations'*."
            )

        # Split response into small chunks to simulate streaming output
        words = response_text.split(" ")
        chunk_size = 3
        assistant_content = ""
        
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i+chunk_size]) + " "
            assistant_content += chunk
            yield f"data: {json.dumps({'text': chunk})}\n\n"
            await asyncio.sleep(0.08)

        # Save assistant message to database once stream finishes
        async with get_db() as local_db:
            ast_msg = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=assistant_content
            )
            local_db.add(ast_msg)
            await local_db.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")
