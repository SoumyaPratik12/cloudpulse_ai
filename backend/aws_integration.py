"""AWS integration module for infrastructure analysis."""
import logging
from typing import Dict, List, Any, Optional
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
        region: str = "us-east-1",
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
    region: str = "us-east-1",
) -> AWSClient:
    """Get AWS client instance."""
    return AWSClient(access_key_id, secret_access_key, region)
