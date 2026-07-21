from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Resource
from auth import get_current_user
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/provisioning", tags=["provisioning"])

class PlanRequest(BaseModel):
    requirement: str

class ExecuteRequest(BaseModel):
    requirement: str
    nodes: List[Dict[str, Any]]

@router.post("/plan")
async def generate_provisioning_plan(
    req: PlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a dynamic provisioning node graph from natural language."""
    req_text = req.requirement.lower()
    
    # Baseline nodes
    nodes = [
        {"id": "vpc", "name": "VPC Network", "type": "vpc", "dependencies": [], "state": "planned", "cost": 0.0},
        {"id": "iam", "name": "IAM Scoped Role", "type": "iam", "dependencies": [], "state": "planned", "cost": 0.0}
    ]
    
    # Optional nodes based on keywords
    if "s3" in req_text or "storage" in req_text or "bucket" in req_text:
        nodes.append({"id": "s3", "name": "S3 Assets Bucket", "type": "s3", "dependencies": ["vpc"], "state": "planned", "cost": 12.50})
        
    if "rds" in req_text or "db" in req_text or "database" in req_text or "postgres" in req_text or "mysql" in req_text:
        nodes.append({"id": "rds", "name": "RDS DB Instance", "type": "rds", "dependencies": ["vpc", "iam"], "state": "planned", "cost": 48.00})
        
    if "alb" in req_text or "load balancer" in req_text or "balancer" in req_text:
        nodes.append({"id": "alb", "name": "Application Load Balancer", "type": "alb", "dependencies": ["vpc"], "state": "planned", "cost": 22.50})
        
    if "ecs" in req_text or "container" in req_text or "containers" in req_text:
        # ECS depends on VPC and ALB (if present)
        deps = ["vpc", "iam"]
        if any(n["id"] == "alb" for n in nodes):
            deps.append("alb")
        nodes.append({"id": "ecs", "name": "ECS Fargate Cluster", "type": "ecs", "dependencies": deps, "state": "planned", "cost": 34.00})
        
    if "lambda" in req_text or "serverless" in req_text or "function" in req_text:
        nodes.append({"id": "lambda", "name": "Lambda API Function", "type": "lambda", "dependencies": ["vpc", "iam"], "state": "planned", "cost": 5.00})

    # Fallback to general EC2 if no ECS/Lambda specified
    if not any(n["type"] in ["ecs", "lambda"] for n in nodes) or "ec2" in req_text or "server" in req_text or "web" in req_text:
        deps = ["vpc"]
        if any(n["id"] == "alb" for n in nodes):
            deps.append("alb")
        nodes.append({"id": "ec2", "name": "EC2 Autoscale Group", "type": "ec2", "dependencies": deps, "state": "planned", "cost": 15.20})

    return {
        "status": "success",
        "plan_id": f"plan-{int(datetime.utcnow().timestamp())}",
        "nodes": nodes
    }

@router.post("/execute")
async def execute_provisioning_plan(
    req: ExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seed the database with the planned resources in 'provisioning' state."""
    # Delete old resources of similar types for this organization to ensure clean canvas
    db.query(Resource).filter(
        Resource.organization_id == current_user.organization_id
    ).delete()
    
    created = []
    for node in req.nodes:
        # Create resource in DB
        res = Resource(
            organization_id=current_user.organization_id,
            resource_id=f"res-{node['type']}-{int(datetime.utcnow().timestamp()) % 100000}",
            resource_type=node["type"],
            name=node["name"],
            region="ap-south-1",
            state="provisioning", # Starts in provisioning state
            monthly_cost=node["cost"],
            cpu_utilization=0.0,
            tags='{"ProvisionedBy": "CloudPulseAI", "Environment": "Production"}',
            last_scanned_at=datetime.utcnow()
        )
        db.add(res)
        created.append(res)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Successfully launched provisioning for {len(created)} resources."
    }
