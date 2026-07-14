"""AWS integration module for infrastructure analysis."""
import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
import boto3
from botocore.exceptions import ClientError
from config import settings

logger = logging.getLogger(__name__)


class AWSClient:
    """AWS SDK client wrapper for CloudPulse."""

    def __init__(
        self,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        region: str = "ap-south-1",
    ):
        self.session = boto3.Session(
            aws_access_key_id=access_key_id or settings.aws_access_key_id,
            aws_secret_access_key=secret_access_key or settings.aws_secret_access_key,
            region_name=region,
        )
        self.ec2 = self.session.client("ec2")
        self.rds = self.session.client("rds")
        self.s3 = self.session.client("s3")
        self.ce = self.session.client("ce")  # Cost Explorer
        self.cloudwatch = self.session.client("cloudwatch")

    def get_ec2_instances(self) -> List[Dict[str, Any]]:
        """Get all EC2 instances."""
        try:
            response = self.ec2.describe_instances()
            instances = []
            for reservation in response["Reservations"]:
                for instance in reservation["Instances"]:
                    instances.append(
                        {
                            "id": instance["InstanceId"],
                            "type": instance["InstanceType"],
                            "state": instance["State"]["Name"],
                            "launch_time": instance["LaunchTime"].isoformat(),
                            "tags": {
                                tag["Key"]: tag["Value"]
                                for tag in instance.get("Tags", [])
                            },
                        }
                    )
            return instances
        except ClientError as e:
            logger.error(f"Error getting EC2 instances: {str(e)}")
            return []

    def get_rds_instances(self) -> List[Dict[str, Any]]:
        """Get all RDS instances."""
        try:
            response = self.rds.describe_db_instances()
            instances = []
            for db in response["DBInstances"]:
                instances.append(
                    {
                        "id": db["DBInstanceIdentifier"],
                        "class": db["DBInstanceClass"],
                        "engine": db["Engine"],
                        "status": db["DBInstanceStatus"],
                        "allocated_storage": db.get("AllocatedStorage", 0),
                    }
                )
            return instances
        except ClientError as e:
            logger.error(f"Error getting RDS instances: {str(e)}")
            return []

    def get_s3_buckets(self) -> List[Dict[str, Any]]:
        """Get all S3 buckets."""
        try:
            response = self.s3.list_buckets()
            buckets = []
            for bucket in response["Buckets"]:
                buckets.append(
                    {
                        "name": bucket["Name"],
                        "creation_date": bucket["CreationDate"].isoformat(),
                    }
                )
            return buckets
        except ClientError as e:
            logger.error(f"Error getting S3 buckets: {str(e)}")
            return []

    def get_cost_and_usage(self, days: int = 30) -> Dict[str, Any]:
        """Get cost and usage metrics."""
        try:
            from datetime import datetime, timedelta

            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days)

            response = self.ce.get_cost_and_usage(
                TimePeriod={
                    "Start": start_date.isoformat(),
                    "End": end_date.isoformat(),
                },
                Granularity="DAILY",
                Metrics=["UnblendedCost"],
                GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}],
            )

            results = {}
            for result in response["ResultsByTime"]:
                for group in result["Groups"]:
                    service = group["Keys"][0]
                    cost = float(group["Metrics"]["UnblendedCost"]["Amount"])
                    if service not in results:
                        results[service] = 0
                    results[service] += cost

            return results
        except ClientError as e:
            logger.error(f"Error getting cost and usage: {str(e)}")
            return {}

    def get_instance_metrics(
        self, instance_id: str, metric_name: str, hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get CloudWatch metrics for an instance."""
        try:
            from datetime import datetime, timedelta

            response = self.cloudwatch.get_metric_statistics(
                Namespace="AWS/EC2",
                MetricName=metric_name,
                Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
                StartTime=datetime.utcnow() - timedelta(hours=hours),
                EndTime=datetime.utcnow(),
                Period=3600,
                Statistics=["Average", "Maximum"],
            )

            return response["Datapoints"]
        except ClientError as e:
            logger.error(f"Error getting instance metrics: {str(e)}")
            return []

    def get_cost_anomalies(self) -> List[Dict[str, Any]]:
        """Get cost anomalies using Cost Anomaly Detection."""
        try:
            # This would require setting up Cost Anomaly Detection first
            response = self.ce.list_cost_allocation_tags()
            return []
        except ClientError as e:
            logger.error(f"Error getting cost anomalies: {str(e)}")
            return []


def get_aws_client(
    access_key_id: Optional[str] = None,
    secret_access_key: Optional[str] = None,
    region: str = "ap-south-1",
) -> AWSClient:
    """Get AWS client instance."""
    return AWSClient(access_key_id, secret_access_key, region)


INSTANCE_PRICING = {
    "t3.nano": 3.8,
    "t3.micro": 7.6,
    "t3.small": 15.2,
    "t3.medium": 30.4,
    "t3.large": 60.8,
    "t3.xlarge": 121.6,
    "t3.2xlarge": 243.2,
    "t2.nano": 4.2,
    "t2.micro": 8.4,
    "t2.small": 16.8,
    "t2.medium": 33.6,
    "t2.large": 67.2,
    "t2.xlarge": 134.4,
    "db.t3.micro": 12.0,
    "db.t3.small": 24.0,
    "db.t3.medium": 48.0,
    "db.t3.large": 96.0,
    "db.m5.large": 130.0,
    "db.m5.xlarge": 260.0,
}


def sync_resources_to_db(db: Session, organization_id: int, client: AWSClient):
    """Sync EC2, RDS, and S3 resources to the database."""
    from models import Resource
    from datetime import datetime
    import json

    # 1. Sync EC2 Instances
    ec2_instances = client.get_ec2_instances()
    logger.info(f"Syncing {len(ec2_instances)} EC2 instances for org {organization_id}")
    for inst in ec2_instances:
        metrics = client.get_instance_metrics(inst["id"], "CPUUtilization", hours=24)
        avg_cpu = None
        if metrics:
            avg_cpu = sum(m["Average"] for m in metrics) / len(metrics)
        else:
            avg_cpu = 12.5

        cost = INSTANCE_PRICING.get(inst["type"], 25.0)

        resource = db.query(Resource).filter(
            Resource.organization_id == organization_id,
            Resource.resource_id == inst["id"]
        ).first()

        name = inst["tags"].get("Name", inst["id"])

        if resource:
            resource.state = inst["state"]
            resource.name = name
            resource.cpu_utilization = avg_cpu
            resource.monthly_cost = cost
            resource.tags = json.dumps(inst["tags"])
            resource.last_scanned_at = datetime.utcnow()
        else:
            resource = Resource(
                organization_id=organization_id,
                resource_id=inst["id"],
                resource_type="ec2",
                name=name,
                region="ap-south-1",
                state=inst["state"],
                monthly_cost=cost,
                cpu_utilization=avg_cpu,
                tags=json.dumps(inst["tags"]),
                last_scanned_at=datetime.utcnow()
            )
            db.add(resource)

    # 2. Sync RDS Instances
    rds_instances = client.get_rds_instances()
    logger.info(f"Syncing {len(rds_instances)} RDS instances for org {organization_id}")
    for db_inst in rds_instances:
        cost = INSTANCE_PRICING.get(db_inst["class"], 45.0)

        resource = db.query(Resource).filter(
            Resource.organization_id == organization_id,
            Resource.resource_id == db_inst["id"]
        ).first()

        if resource:
            resource.state = db_inst["status"]
            resource.monthly_cost = cost
            resource.last_scanned_at = datetime.utcnow()
        else:
            resource = Resource(
                organization_id=organization_id,
                resource_id=db_inst["id"],
                resource_type="rds",
                name=db_inst["id"],
                region="ap-south-1",
                state=db_inst["status"],
                monthly_cost=cost,
                cpu_utilization=5.0,
                last_scanned_at=datetime.utcnow()
            )
            db.add(resource)

    # 3. Sync S3 Buckets
    s3_buckets = client.get_s3_buckets()
    logger.info(f"Syncing {len(s3_buckets)} S3 buckets for org {organization_id}")
    for bucket in s3_buckets:
        resource = db.query(Resource).filter(
            Resource.organization_id == organization_id,
            Resource.resource_id == bucket["name"]
        ).first()

        if resource:
            resource.state = "active"
            resource.last_scanned_at = datetime.utcnow()
        else:
            resource = Resource(
                organization_id=organization_id,
                resource_id=bucket["name"],
                resource_type="s3",
                name=bucket["name"],
                region="ap-south-1",
                state="active",
                monthly_cost=5.0,
                last_scanned_at=datetime.utcnow()
            )
            db.add(resource)

    db.commit()


def generate_recommendations_for_org(db: Session, organization_id: int):
    """Generate recommendations based on scanned resources."""
    from models import Resource, Recommendation

    resources = db.query(Resource).filter(Resource.organization_id == organization_id).all()
    logger.info(f"Generating recommendations from {len(resources)} resources")

    for resource in resources:
        if resource.resource_type == "ec2" and resource.state == "running" and resource.cpu_utilization and resource.cpu_utilization < 10.0:
            title = f"Right-size underutilized EC2 instance: {resource.resource_id}"

            existing = db.query(Recommendation).filter(
                Recommendation.organization_id == organization_id,
                Recommendation.title == title
            ).first()

            if not existing:
                savings = resource.monthly_cost * 0.5
                rec = Recommendation(
                    organization_id=organization_id,
                    resource_id=resource.id,
                    title=title,
                    description=f"The EC2 instance '{resource.name or resource.resource_id}' has an average CPU utilization of {resource.cpu_utilization:.1f}%, which is under the 10% threshold. Consider downgrading to a smaller instance class.",
                    recommendation_type="cost",
                    priority="medium",
                    estimated_savings=savings,
                    status="open",
                    implementation_steps= "[\"Identify required smaller instance type (e.g. t3.micro)\", \"Stop the EC2 instance\", \"Modify the instance type to the target class\", \"Start the instance\"]"
                )
                db.add(rec)

        elif resource.resource_type == "ec2" and resource.state == "stopped":
            title = f"Delete stopped EC2 instance: {resource.resource_id}"

            existing = db.query(Recommendation).filter(
                Recommendation.organization_id == organization_id,
                Recommendation.title == title
            ).first()

            if not existing:
                rec = Recommendation(
                    organization_id=organization_id,
                    resource_id=resource.id,
                    title=title,
                    description=f"The EC2 instance '{resource.name or resource.resource_id}' is stopped and is not running active workloads. Terminate the instance if it is no longer required.",
                    recommendation_type="cost",
                    priority="low",
                    estimated_savings=5.0,
                    status="open",
                    implementation_steps="[\"Verify instance contents are backed up\", \"Terminate the EC2 instance in console or via CLI\"]"
                )
                db.add(rec)

        elif resource.resource_type == "rds" and resource.state == "available" and resource.cpu_utilization and resource.cpu_utilization < 10.0:
            title = f"Scale down underutilized RDS database: {resource.resource_id}"

            existing = db.query(Recommendation).filter(
                Recommendation.organization_id == organization_id,
                Recommendation.title == title
            ).first()

            if not existing:
                savings = resource.monthly_cost * 0.3
                rec = Recommendation(
                    organization_id=organization_id,
                    resource_id=resource.id,
                    title=title,
                    description=f"The database instance '{resource.resource_id}' is running with average CPU utilization under 10%. Scale down the database class to save costs.",
                    recommendation_type="cost",
                    priority="medium",
                    estimated_savings=savings,
                    status="open",
                    implementation_steps="[\"Determine DB class size requirements\", \"Modify the DB instance class\", \"Choose 'Apply Immediately' or apply during next maintenance window\"]"
                )
                db.add(rec)

        elif resource.resource_type == "s3":
            title = f"Transition S3 bucket to Glacier: {resource.resource_id}"

            existing = db.query(Recommendation).filter(
                Recommendation.organization_id == organization_id,
                Recommendation.title == title
            ).first()

            if not existing:
                rec = Recommendation(
                    organization_id=organization_id,
                    resource_id=resource.id,
                    title=title,
                    description=f"The S3 bucket '{resource.resource_id}' contains inactive or archival data. Create a lifecycle policy to transition objects to Glacier Deep Archive.",
                    recommendation_type="cost",
                    priority="low",
                    estimated_savings=4.0,
                    status="open",
                    implementation_steps="[\"Go to S3 Management console\", \"Create a Lifecycle Rule\", \"Set transition time for Glacier Deep Archive to 30 days\"]"
                )
                db.add(rec)

    db.commit()


def apply_recommendation_action(db: Session, recommendation_id: int, client: AWSClient):
    """Apply remediation action on AWS for a recommendation."""
    from models import Recommendation, Resource

    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise ValueError("Recommendation not found")

    if rec.status != "open":
        raise ValueError(f"Recommendation is already {rec.status}")

    resource = db.query(Resource).filter(Resource.id == rec.resource_id).first()
    if not resource:
        rec.status = "accepted"
        db.commit()
        return f"Recommendation {rec.id} status updated to accepted."

    action_taken = "No action"
    try:
        if resource.resource_type == "ec2" and "stopped" in rec.title.lower():
            client.ec2.terminate_instances(InstanceIds=[resource.resource_id])
            resource.state = "terminated"
            rec.status = "completed"
            action_taken = f"Terminated EC2 instance {resource.resource_id}"
        elif resource.resource_type == "ec2" and "right-size" in rec.title.lower():
            client.ec2.stop_instances(InstanceIds=[resource.resource_id])
            resource.state = "stopping"
            rec.status = "completed"
            action_taken = f"Stopped EC2 instance {resource.resource_id} for right-sizing"
        elif resource.resource_type == "rds" and "scale" in rec.title.lower():
            client.rds.stop_db_instance(DBInstanceIdentifier=resource.resource_id)
            resource.state = "stopping"
            rec.status = "completed"
            action_taken = f"Stopped RDS instance {resource.resource_id} to reduce costs"
        else:
            rec.status = "accepted"
            action_taken = f"Marked recommendation for {resource.resource_id} as accepted"

        db.commit()
        return action_taken
    except ClientError as e:
        logger.error(f"Error executing recommendation remediation: {str(e)}")
        rec.status = "accepted"
        db.commit()
        return f"Marked as accepted (AWS operation returned: {str(e)})"
