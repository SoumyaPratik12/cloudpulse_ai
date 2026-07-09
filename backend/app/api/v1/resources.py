from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, AWSAccount, ResourceInventory, MetricHistory, Alert
from app.schemas.schemas import AWSAccountCreate, AWSAccountOut, ResourceInventoryOut, ResourceMetricsOut, MetricDataPoint
from app.services.aws_service import AWSService

router = APIRouter()
aws_svc = AWSService()


@router.post("/accounts", response_model=AWSAccountOut, status_code=status.HTTP_201_CREATED)
async def create_aws_account(
    account_in: AWSAccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify AWS connection details
    is_valid = await aws_svc.verify_connection(
        role_arn=account_in.role_arn, external_id=account_in.external_id
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AWS credentials verification failed. Please check Role ARN / Permissions."
        )

    # Save to db
    db_account = AWSAccount(
        user_id=current_user.id,
        account_name=account_in.account_name,
        aws_account_id=account_in.aws_account_id,
        role_arn=account_in.role_arn,
        external_id=account_in.external_id,
        status="active"
    )
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account


@router.get("/accounts", response_model=List[AWSAccountOut])
async def read_aws_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AWSAccount).where(AWSAccount.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/inventory", response_model=List[ResourceInventoryOut])
async def read_resource_inventory(
    account_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Select accounts owned by current user
    account_query = select(AWSAccount.id).where(AWSAccount.user_id == current_user.id)
    if account_id:
        account_query = account_query.where(AWSAccount.id == account_id)
    
    account_ids_result = await db.execute(account_query)
    user_account_ids = account_ids_result.scalars().all()

    if not user_account_ids:
        return []

    # Query resources
    query = select(ResourceInventory).where(ResourceInventory.account_id.in_(user_account_ids))
    if resource_type:
        query = query.where(ResourceInventory.resource_type == resource_type.lower())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/scan/{account_id}", status_code=status.HTTP_202_ACCEPTED)
async def trigger_resource_scan(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify account ownership
    account_result = await db.execute(
        select(AWSAccount).where(
            AWSAccount.id == account_id, AWSAccount.user_id == current_user.id
        )
    )
    account = account_result.scalars().first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AWS account not found or access denied."
        )

    # Update account status to scanning
    account.status = "scanning"
    await db.commit()

    try:
        # Collect resource data
        raw_resources = await aws_svc.collect_resources(
            account_id=account.id,
            role_arn=account.role_arn,
            external_id=account.external_id
        )

        # Clear existing resources & alerts for this account
        await db.execute(
            delete(ResourceInventory).where(ResourceInventory.account_id == account.id)
        )
        await db.execute(
            delete(Alert).where(Alert.account_id == account.id)
        )

        for res in raw_resources:
            # Create Resource Inventory entry
            db_res = ResourceInventory(
                account_id=account.id,
                resource_id=res["resource_id"],
                resource_name=res.get("resource_name"),
                resource_type=res["resource_type"],
                region=res["region"],
                state=res["state"],
                configuration=res.get("configuration", {}),
                health_score=res.get("health_score", 100.0),
                efficiency_score=res.get("efficiency_score", 100.0)
            )
            db.add(db_res)
            await db.commit()  # commit to get db_res.id for metric inserts
            await db.refresh(db_res)

            # Ingest historical metrics for this resource (e.g. CPU or Cost)
            metrics_to_collect = ["Cost"]
            if res["resource_type"] in ["ec2", "rds"]:
                metrics_to_collect.append("CPUUtilization")

            for metric in metrics_to_collect:
                history = await aws_svc.collect_metrics(
                    resource_id=res["resource_id"],
                    resource_type=res["resource_type"],
                    region=res["region"],
                    metric_name=metric
                )
                for pt in history:
                    db_metric = MetricHistory(
                        resource_id=db_res.id,
                        metric_name=metric,
                        value=pt["value"],
                        timestamp=pt["timestamp"]
                    )
                    db.add(db_metric)

            # Create Active Alerts if score is low
            if db_res.health_score < 70.0:
                alert_msg = f"Resource {db_res.resource_name} ({db_res.resource_id}) exhibits low performance. Current health score: {db_res.health_score}%"
                if db_res.resource_id == "cloudpulse-test-assets-temp":
                    alert_msg = "Security Alert: S3 bucket has public read/write permissions enabled."
                
                db_alert = Alert(
                    account_id=account.id,
                    resource_id_str=db_res.resource_id,
                    severity="critical" if db_res.health_score < 50 else "warning",
                    message=alert_msg,
                    status="active"
                )
                db.add(db_alert)

        # Update account status to active
        account.status = "active"
        await db.commit()
        return {"status": "success", "message": f"Successfully scanned account {account_id}."}

    except Exception as e:
        account.status = "error"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scanning failed: {str(e)}"
        )


@router.get("/metrics/{resource_id}", response_model=ResourceMetricsOut)
async def read_resource_metrics(
    resource_id: str,
    metric_name: str = Query("CPUUtilization", description="Metric to retrieve"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify resource ownership via account query
    res_query = (
        select(ResourceInventory)
        .join(AWSAccount)
        .where(
            ResourceInventory.resource_id == resource_id,
            AWSAccount.user_id == current_user.id
        )
    )
    res_result = await db.execute(res_query)
    resource = res_result.scalars().first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found or access denied."
        )

    # Fetch metric points
    metrics_query = (
        select(MetricHistory)
        .where(
            MetricHistory.resource_id == resource.id,
            MetricHistory.metric_name == metric_name
        )
        .order_by(MetricHistory.timestamp.asc())
    )
    metrics_result = await db.execute(metrics_query)
    metrics = metrics_result.scalars().all()

    data_points = [
        MetricDataPoint(timestamp=m.timestamp, value=m.value) for m in metrics
    ]
    return ResourceMetricsOut(
        resource_id=resource_id,
        metric_name=metric_name,
        data=data_points
    )
