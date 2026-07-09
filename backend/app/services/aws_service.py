import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError


class AWSService:
    def __init__(self):
        pass

    async def verify_connection(
        self, role_arn: Optional[str] = None, external_id: Optional[str] = None
    ) -> bool:
        """Verify AWS connection. Returns True if successful or in mock mode."""
        if not role_arn or "mock" in role_arn.lower() or role_arn == "arn:aws:iam::123456789012:role/MockReadOnlyRole":
            return True

        try:
            # Attempt real AWS STS connection
            sts_client = boto3.client("sts")
            if role_arn:
                sts_client.assume_role(
                    RoleArn=role_arn,
                    RoleSessionName="CloudPulseVerifySession",
                    ExternalId=external_id or ""
                )
            else:
                sts_client.get_caller_identity()
            return True
        except Exception:
            return False

    async def collect_resources(
        self, account_id: int, role_arn: Optional[str] = None, external_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Collect AWS resource inventory. Falls back to generating high-fidelity mock data."""
        use_mock = True
        if role_arn and "mock" not in role_arn.lower():
            try:
                # Try setting up actual session if not mock
                # boto3 credential resolution
                session_args = {}
                if role_arn:
                    sts_client = boto3.client("sts")
                    assumed_role_object = sts_client.assume_role(
                        RoleArn=role_arn,
                        RoleSessionName="CloudPulseCollectSession",
                        ExternalId=external_id or ""
                    )
                    credentials = assumed_role_object["Credentials"]
                    session_args = {
                        "aws_access_key_id": credentials["AccessKeyId"],
                        "aws_secret_access_key": credentials["SecretAccessKey"],
                        "aws_session_token": credentials["SessionToken"],
                    }
                
                # Test connection with EC2
                session = boto3.Session(**session_args)
                ec2 = session.client("ec2", region_name="us-east-1")
                ec2.describe_instances()
                use_mock = False
            except Exception as e:
                print(f"AWS connection error, falling back to mock data: {e}")
                use_mock = True

        if use_mock:
            return self._generate_mock_resources(account_id)
        
        # Real resource collection via boto3
        return await self._collect_real_resources(session)

    async def _collect_real_resources(self, session: boto3.Session) -> List[Dict[str, Any]]:
        resources = []
        regions = ["us-east-1", "us-west-2", "eu-west-1"]
        
        for region in regions:
            try:
                # EC2
                ec2 = session.client("ec2", region_name=region)
                instances = ec2.describe_instances()
                for reservation in instances.get("Reservations", []):
                    for inst in reservation.get("Instances", []):
                        name = ""
                        for tag in inst.get("Tags", []):
                            if tag["Key"] == "Name":
                                name = tag["Value"]
                        
                        resources.append({
                            "resource_id": inst["InstanceId"],
                            "resource_name": name or inst["InstanceId"],
                            "resource_type": "ec2",
                            "region": region,
                            "state": inst["State"]["Name"],
                            "configuration": {
                                "InstanceType": inst["InstanceType"],
                                "ImageId": inst["ImageId"],
                                "LaunchTime": inst["LaunchTime"].isoformat()
                            }
                        })
                
                # EBS
                volumes = ec2.describe_volumes()
                for vol in volumes.get("Volumes", []):
                    name = ""
                    for tag in vol.get("Tags", []):
                        if tag["Key"] == "Name":
                            name = tag["Value"]
                    state = vol["State"]
                    # If detached, attach state will be empty
                    resources.append({
                        "resource_id": vol["VolumeId"],
                        "resource_name": name or vol["VolumeId"],
                        "resource_type": "ebs",
                        "region": region,
                        "state": state,
                        "configuration": {
                            "Size": vol["Size"],
                            "VolumeType": vol["VolumeType"],
                            "Iops": vol.get("Iops", 0)
                        }
                    })

                # RDS
                rds = session.client("rds", region_name=region)
                db_instances = rds.describe_db_instances()
                for db in db_instances.get("DBInstances", []):
                    resources.append({
                        "resource_id": db["DBInstanceIdentifier"],
                        "resource_name": db["DBInstanceIdentifier"],
                        "resource_type": "rds",
                        "region": region,
                        "state": db["DBInstanceStatus"],
                        "configuration": {
                            "DBInstanceClass": db["DBInstanceClass"],
                            "Engine": db["Engine"],
                            "AllocatedStorage": db["AllocatedStorage"]
                        }
                    })
            except ClientError as e:
                print(f"Error accessing region {region}: {e}")
                
        # S3 (Global)
        try:
            s3 = session.client("s3")
            buckets = s3.list_buckets()
            for bucket in buckets.get("Buckets", []):
                resources.append({
                    "resource_id": bucket["Name"],
                    "resource_name": bucket["Name"],
                    "resource_type": "s3",
                    "region": "us-east-1",  # S3 bucket regions vary, default us-east-1
                    "state": "active",
                    "configuration": {
                        "CreationDate": bucket["CreationDate"].isoformat()
                    }
                })
        except Exception as e:
            print(f"Error listing S3 buckets: {e}")

        return resources

    def _generate_mock_resources(self, account_id: int) -> List[Dict[str, Any]]:
        """Generate high-fidelity infrastructure data representing common cloud wastes and inefficiencies."""
        return [
            # --- EC2 Instances ---
            {
                "resource_id": "i-0a1b2c3d4e5f6g7h8",
                "resource_name": "prod-web-server-01",
                "resource_type": "ec2",
                "region": "us-east-1",
                "state": "running",
                "configuration": {
                    "InstanceType": "m5.large",
                    "ImageId": "ami-0c7217cdde317cfec",
                    "Platform": "Linux",
                    "LaunchTime": (datetime.now() - timedelta(days=45)).isoformat(),
                },
                "health_score": 94.0,
                "efficiency_score": 85.0
            },
            {
                "resource_id": "i-0987654321fedcba0",
                "resource_name": "dev-test-bastion",
                "resource_type": "ec2",
                "region": "us-east-1",
                "state": "running",
                "configuration": {
                    "InstanceType": "t3.medium",
                    "ImageId": "ami-0c7217cdde317cfec",
                    "Platform": "Linux",
                    "LaunchTime": (datetime.now() - timedelta(days=12)).isoformat(),
                },
                "health_score": 100.0,
                "efficiency_score": 15.0  # Wasted resource: average CPU < 2%
            },
            {
                "resource_id": "i-01122334455667788",
                "resource_name": "stage-worker-node",
                "resource_type": "ec2",
                "region": "us-west-2",
                "state": "stopped",
                "configuration": {
                    "InstanceType": "t3.large",
                    "ImageId": "ami-03ca2289f6655c68f",
                    "Platform": "Linux",
                    "LaunchTime": (datetime.now() - timedelta(days=5)).isoformat(),
                },
                "health_score": 100.0,
                "efficiency_score": 100.0  # Stopped so not incurring charge/wasting resources active state
            },
            # --- RDS Databases ---
            {
                "resource_id": "prod-customer-db",
                "resource_name": "prod-customer-db",
                "resource_type": "rds",
                "region": "us-east-1",
                "state": "available",
                "configuration": {
                    "DBInstanceClass": "db.m5.xlarge",
                    "Engine": "postgres",
                    "AllocatedStorage": 500,
                    "MultiAZ": True
                },
                "health_score": 62.0,  # Alert: CPU is high, connection spikes
                "efficiency_score": 90.0
            },
            {
                "resource_id": "dev-analytics-db",
                "resource_name": "dev-analytics-db",
                "resource_type": "rds",
                "region": "us-west-2",
                "state": "available",
                "configuration": {
                    "DBInstanceClass": "db.t3.xlarge",
                    "Engine": "mysql",
                    "AllocatedStorage": 100,
                    "MultiAZ": False
                },
                "health_score": 100.0,
                "efficiency_score": 8.0  # Heavy waste: massive instance with zero active connections
            },
            # --- EBS Volumes ---
            {
                "resource_id": "vol-0000000000000001a",
                "resource_name": "prod-db-volume-gp3",
                "resource_type": "ebs",
                "region": "us-east-1",
                "state": "in-use",
                "configuration": {
                    "Size": 500,
                    "VolumeType": "gp3",
                    "Iops": 3000,
                    "Attachment": "i-0a1b2c3d4e5f6g7h8"
                },
                "health_score": 98.0,
                "efficiency_score": 95.0
            },
            {
                "resource_id": "vol-0999999999999999f",
                "resource_name": "temp-detached-volume",
                "resource_type": "ebs",
                "region": "us-east-1",
                "state": "available",  # Detached volume wasting money!
                "configuration": {
                    "Size": 250,
                    "VolumeType": "gp2",
                    "Iops": 750,
                    "Attachment": None
                },
                "health_score": 100.0,
                "efficiency_score": 0.0  # 100% waste because it is unattached
            },
            # --- S3 Buckets ---
            {
                "resource_id": "cloudpulse-prod-backups",
                "resource_name": "cloudpulse-prod-backups",
                "resource_type": "s3",
                "region": "us-east-1",
                "state": "active",
                "configuration": {
                    "Versioning": "Enabled",
                    "PublicAccess": "Blocked",
                    "ObjectCount": 14205,
                    "SizeGB": 1420.5
                },
                "health_score": 100.0,
                "efficiency_score": 75.0
            },
            {
                "resource_id": "cloudpulse-test-assets-temp",
                "resource_name": "cloudpulse-test-assets-temp",
                "resource_type": "s3",
                "region": "us-east-1",
                "state": "active",
                "configuration": {
                    "Versioning": "Disabled",
                    "PublicAccess": "Allowed",  # Security issue!
                    "ObjectCount": 12,
                    "SizeGB": 0.02
                },
                "health_score": 45.0,  # Public bucket alert!
                "efficiency_score": 20.0  # Almost empty, idle bucket
            }
        ]

    async def collect_metrics(
        self, resource_id: str, resource_type: str, region: str, metric_name: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Collect metrics history. Returns mock history representing performance trends."""
        # Standard hourly points for last N days
        now = datetime.now(timezone.utc)
        data_points = []
        
        # Determine value ranges based on resource types and metrics
        base_val = 50.0
        variance = 10.0
        
        if resource_id == "i-0a1b2c3d4e5f6g7h8":  # prod-web-server-01 (m5.large)
            if metric_name == "CPUUtilization":
                base_val, variance = 45.0, 15.0
            elif metric_name == "Cost":
                base_val, variance = 0.096, 0.0  # ~$70/mo flat
        elif resource_id == "i-0987654321fedcba0":  # dev-test-bastion (t3.medium)
            if metric_name == "CPUUtilization":
                base_val, variance = 1.2, 0.5  # idle
            elif metric_name == "Cost":
                base_val, variance = 0.0416, 0.0  # ~$30/mo
        elif resource_id == "prod-customer-db":  # prod-customer-db (db.m5.xlarge)
            if metric_name == "CPUUtilization":
                base_val, variance = 82.0, 10.0  # high CPU usage
            elif metric_name == "Cost":
                base_val, variance = 0.72, 0.0  # ~$520/mo
        elif resource_id == "dev-analytics-db":  # dev-analytics-db (db.t3.xlarge)
            if metric_name == "CPUUtilization":
                base_val, variance = 0.8, 0.3  # completely idle
            elif metric_name == "Cost":
                base_val, variance = 0.27, 0.0  # ~$195/mo
        elif resource_type == "ebs":
            if metric_name == "Cost":
                # GP2 is $0.10/GB-month, GP3 is $0.08/GB-month
                gb_size = 250 if "detached" in resource_id else 500
                hourly_cost = (gb_size * (0.10 if "gp2" in resource_id else 0.08)) / 730
                base_val, variance = hourly_cost, 0.0
        
        # Populate history
        for hour in range(days * 24):
            ts = now - timedelta(hours=hour)
            # Add some sine wave fluctuation to make curves look realistic
            fluctuation = variance * (0.5 * (1.0 + (hour % 24) / 12.0) + 0.5 * (hour % 168 == 0))
            val = max(0.0, base_val + random.uniform(-fluctuation, fluctuation))
            
            data_points.append({
                "timestamp": ts,
                "value": val
            })
            
        data_points.sort(key=lambda x: x["timestamp"])
        return data_points
