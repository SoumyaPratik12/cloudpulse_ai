from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, AWSAccount, ResourceInventory, MetricHistory, Alert
from app.schemas.schemas import DashboardOverviewOut, AlertOut

router = APIRouter()


@router.get("/dashboard-overview", response_model=DashboardOverviewOut)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch accounts owned by user
    accounts_result = await db.execute(
        select(AWSAccount.id).where(AWSAccount.user_id == current_user.id)
    )
    user_account_ids = accounts_result.scalars().all()
    if not user_account_ids:
        return DashboardOverviewOut(
            global_health_score=100.0,
            global_cost_efficiency_score=100.0,
            active_resource_count=0,
            active_critical_alerts=0,
            potential_monthly_savings=0.0,
            monthly_cost_trend=[]
        )

    # Ingest resources
    resources_result = await db.execute(
        select(ResourceInventory).where(ResourceInventory.account_id.in_(user_account_ids))
    )
    resources = resources_result.scalars().all()
    
    if not resources:
        return DashboardOverviewOut(
            global_health_score=100.0,
            global_cost_efficiency_score=100.0,
            active_resource_count=0,
            active_critical_alerts=0,
            potential_monthly_savings=0.0,
            monthly_cost_trend=[]
        )

    # Compute scores
    active_resource_count = len(resources)
    global_health_score = sum(r.health_score for r in resources) / active_resource_count
    global_cost_efficiency_score = sum(r.efficiency_score for r in resources) / active_resource_count

    # Fetch alerts
    alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.account_id.in_(user_account_ids),
            Alert.status == "active",
            Alert.severity == "critical"
        )
    )
    active_critical_alerts = alerts_result.scalar() or 0

    # Calculate savings
    potential_monthly_savings = 0.0
    for r in resources:
        cost_config = r.configuration
        # Detached EBS volume savings (100% savings)
        if r.resource_type == "ebs" and r.state == "available":
            gb_size = cost_config.get("Size", 0)
            vol_type = cost_config.get("VolumeType", "gp2")
            rate = 0.10 if vol_type == "gp2" else 0.08
            potential_monthly_savings += gb_size * rate
        # Idle EC2 or RDS savings (rightsising to smaller instance or deleting - estimate 75% savings)
        elif r.efficiency_score < 20.0:
            if r.resource_type == "ec2" and r.state == "running":
                # Rough monthly m5.large cost ~$70, t3.medium ~$30
                inst_type = cost_config.get("InstanceType", "")
                if "large" in inst_type:
                    potential_monthly_savings += 50.0  # save $50/mo by rightsizing
                else:
                    potential_monthly_savings += 15.0  # save $15/mo
            elif r.resource_type == "rds" and r.state == "available":
                db_class = cost_config.get("DBInstanceClass", "")
                if "xlarge" in db_class:
                    potential_monthly_savings += 150.0  # save $150/mo by downscaling
                else:
                    potential_monthly_savings += 30.0

    # Calculate Monthly Cost Trend (last 7 days aggregate daily cost)
    # We sum Cost metric values from MetricHistory for user resources
    resource_ids = [r.id for r in resources]
    
    # Simple mock cost trends grouping
    cost_trend = []
    now = datetime.now(timezone.utc)
    for day_offset in range(7):
        date_label = (now - timedelta(days=day_offset)).strftime("%Y-%m-%d")
        # Mocking daily aggregation for demo
        daily_cost = 0.0
        for r in resources:
            if r.resource_type == "ec2":
                daily_cost += 2.40 if "large" in r.configuration.get("InstanceType", "") else 0.80
            elif r.resource_type == "rds":
                daily_cost += 15.0 if "xlarge" in r.configuration.get("DBInstanceClass", "") else 3.0
            elif r.resource_type == "ebs":
                daily_cost += 0.30 if r.state == "in-use" else 0.10
        cost_trend.append({
            "date": date_label,
            "cost": round(daily_cost, 2)
        })
    cost_trend.reverse()

    return DashboardOverviewOut(
        global_health_score=round(global_health_score, 1),
        global_cost_efficiency_score=round(global_cost_efficiency_score, 1),
        active_resource_count=active_resource_count,
        active_critical_alerts=active_critical_alerts,
        potential_monthly_savings=round(potential_monthly_savings, 2),
        monthly_cost_trend=cost_trend
    )


@router.get("/alerts", response_model=List[AlertOut])
async def read_active_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    accounts_result = await db.execute(
        select(AWSAccount.id).where(AWSAccount.user_id == current_user.id)
    )
    user_account_ids = accounts_result.scalars().all()
    if not user_account_ids:
        return []

    alerts_result = await db.execute(
        select(Alert)
        .where(Alert.account_id.in_(user_account_ids))
        .order_by(Alert.created_at.desc())
    )
    return alerts_result.scalars().all()


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    accounts_result = await db.execute(
        select(AWSAccount.id).where(AWSAccount.user_id == current_user.id)
    )
    user_account_ids = accounts_result.scalars().all()
    if not user_account_ids:
        return []

    resources_result = await db.execute(
        select(ResourceInventory).where(
            ResourceInventory.account_id.in_(user_account_ids)
        )
    )
    resources = resources_result.scalars().all()

    recommendations = []
    for r in resources:
        # EBS waste
        if r.resource_type == "ebs" and r.state == "available":
            gb_size = r.configuration.get("Size", 0)
            savings = round(gb_size * 0.10, 2)
            recommendations.append({
                "resource_id": r.resource_id,
                "resource_name": r.resource_name or r.resource_id,
                "resource_type": "ebs",
                "category": "Cost Optimization",
                "title": "Delete Orphaned EBS Volume",
                "description": f"Volume {r.resource_id} has been detached and is idle. Deleting it saves resources.",
                "potential_savings": savings,
                "action_type": "delete",
                "terraform_code": f"""# Remove unused volume
resource "aws_ebs_volume" "unused" {{
  # ID: {r.resource_id}
  # Size: {gb_size} GB
  # To delete: run 'terraform destroy' or remove this block and apply
}}"""
            })

        # EC2 waste / rightsizing
        elif r.resource_type == "ec2" and r.efficiency_score < 20.0:
            inst_type = r.configuration.get("InstanceType", "")
            recommendations.append({
                "resource_id": r.resource_id,
                "resource_name": r.resource_name or r.resource_id,
                "resource_type": "ec2",
                "category": "Rightsizing",
                "title": f"Downscale Idle EC2 Instance ({inst_type})",
                "description": f"Instance {r.resource_name} averages < 2% CPU. Downscaling from {inst_type} to t3.micro reduces cost.",
                "potential_savings": 45.0 if "large" in inst_type else 15.0,
                "action_type": "modify",
                "terraform_code": f"""# Modify instance size
resource "aws_instance" "app" {{
  ami           = "{r.configuration.get('ImageId', 'ami-xxxxxx')}"
  instance_type = "t3.micro" # Rightsized from {inst_type}
  
  tags = {{
    Name = "{r.resource_name}"
  }}
}}"""
            })

        # RDS idle database
        elif r.resource_type == "rds" and r.efficiency_score < 20.0:
            db_class = r.configuration.get("DBInstanceClass", "")
            recommendations.append({
                "resource_id": r.resource_id,
                "resource_name": r.resource_name or r.resource_id,
                "resource_type": "rds",
                "category": "Rightsizing",
                "title": f"Downscale Idle RDS Database ({db_class})",
                "description": f"Database {r.resource_name} has zero active connections. Downscaling to db.t3.micro yields savings.",
                "potential_savings": 140.0 if "xlarge" in db_class else 30.0,
                "action_type": "modify",
                "terraform_code": f"""# Modify RDS instance size
resource "aws_db_instance" "database" {{
  allocated_storage    = {r.configuration.get('AllocatedStorage', 20)}
  db_name              = "customerdb"
  engine               = "{r.configuration.get('Engine', 'postgres')}"
  instance_class       = "db.t3.micro" # Rightsized from {db_class}
  username             = "postgres"
  password             = "securepassword"
  skip_final_snapshot  = true
}}"""
            })

        # S3 Security issue
        elif r.resource_type == "s3" and r.health_score < 50.0:
            recommendations.append({
                "resource_id": r.resource_id,
                "resource_name": r.resource_name,
                "resource_type": "s3",
                "category": "Security",
                "title": "Enable Block Public Access for S3 Bucket",
                "description": f"Bucket '{r.resource_id}' is configured with public write/read permissions, exposing files.",
                "potential_savings": 0.0,
                "action_type": "secure",
                "terraform_code": f"""# Restrict public access
resource "aws_s3_bucket_public_access_block" "block_public" {{
  bucket = "{r.resource_id}"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}}"""
            })

    return recommendations
