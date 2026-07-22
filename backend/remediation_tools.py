import boto3
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from config import settings
from models import AWSConnection, Resource
from websocket_manager import manager

logger = logging.getLogger(__name__)

def get_session_credentials(connection: AWSConnection):
    """Assume AWS Cross-Account Trust Role to retrieve temporary credentials."""
    role_arn = connection.role_arn
    external_id = connection.external_id

    # If mock/development connection, bypass actual STS assume
    if not role_arn or "mock" in role_arn.lower():
        logger.info(f"Using mock connection session credentials for role: {role_arn}")
        return None

    try:
        sts = boto3.client("sts")
        assumed = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="CloudPulseRemediationCopilot",
            ExternalId=external_id,
            DurationSeconds=900
        )
        credentials = assumed["Credentials"]
        return {
            "aws_access_key_id": credentials["AccessKeyId"],
            "aws_secret_access_key": credentials["SecretAccessKey"],
            "aws_session_token": credentials["SessionToken"],
            "region_name": settings.aws_region
        }
    except Exception as e:
        logger.error(f"Failed to assume role {role_arn} for remediation: {str(e)}")
        raise RuntimeError(f"AWS STS AssumeRole authority authorization failed: {str(e)}")

async def enable_s3_versioning(connection: AWSConnection, bucket_name: str, db: Session) -> str:
    """Restricted tool: Enable versioning state on targeted S3 bucket."""
    logger.info(f"Remediation: Enabling versioning on S3 bucket '{bucket_name}' for connection {connection.id}")
    
    # 1. Load credentials
    creds = get_session_credentials(connection)
    
    if not creds:
        # Mock execution path
        result_msg = f"Mock success: Versioning enabled on bucket '{bucket_name}'."
    else:
        try:
            s3 = boto3.client("s3", **creds)
            s3.put_bucket_versioning(
                Bucket=bucket_name,
                VersioningConfiguration={"Status": "Enabled"}
            )
            result_msg = f"AWS success: Versioning successfully enabled on bucket '{bucket_name}'."
        except Exception as e:
            logger.error(f"S3 put_bucket_versioning failed: {str(e)}")
            raise RuntimeError(f"AWS API execution error: {str(e)}")

    # Update database record if exists
    resource = db.query(Resource).filter(
        Resource.resource_type == "s3",
        Resource.aws_resource_arn.like(f"%{bucket_name}%")
    ).first()
    if resource:
        resource.drifted = False
        db.commit()
        # Broadcast changes over websocket
        db.refresh(resource)
        await manager.broadcast({
            "event": "AWS_CONFIG_RESOURCE_CHANGE",
            "resources": [{
                "resource_id": resource.resource_id,
                "resource_type": resource.resource_type,
                "name": resource.name,
                "state": resource.state,
                "drifted": resource.drifted,
                "cpu": resource.cpu_utilization,
                "cost": resource.monthly_cost
            }]
        })
        
    return result_msg

async def modify_security_group_ingress(connection: AWSConnection, group_id: str, port: int, cidr: str, action_type: str, db: Session) -> str:
    """Restricted tool: Revoke exposed ingress ports from security groups."""
    logger.info(f"Remediation: Modifying security group ingress on '{group_id}' (port={port}, cidr={cidr}, action={action_type})")
    
    creds = get_session_credentials(connection)
    
    if not creds:
        # Mock path
        result_msg = f"Mock success: Ingress port {port} for CIDR {cidr} revoked successfully."
    else:
        try:
            ec2 = boto3.client("ec2", **creds)
            if action_type == "revoke":
                ec2.revoke_security_group_ingress(
                    GroupId=group_id,
                    IpPermissions=[{
                        "IpProtocol": "tcp",
                        "FromPort": port,
                        "ToPort": port,
                        "IpRanges": [{"CidrIp": cidr}]
                    }]
                )
                result_msg = f"AWS success: Revoked ingress port {port} for CIDR {cidr} on {group_id}."
            else:
                raise ValueError("Ingress mutation only permits 'revoke' for secure drift resolution.")
        except Exception as e:
            logger.error(f"EC2 revoke_security_group_ingress failed: {str(e)}")
            raise RuntimeError(f"AWS API execution error: {str(e)}")

    # Find matching resource node and reset drift state
    resource = db.query(Resource).filter(
        Resource.resource_type == "ec2",
        Resource.aws_resource_arn.like(f"%{group_id}%")
    ).first()
    if resource:
        resource.drifted = False
        db.commit()
        db.refresh(resource)
        await manager.broadcast({
            "event": "AWS_CONFIG_RESOURCE_CHANGE",
            "resources": [{
                "resource_id": resource.resource_id,
                "resource_type": resource.resource_type,
                "name": resource.name,
                "state": resource.state,
                "drifted": resource.drifted,
                "cpu": resource.cpu_utilization,
                "cost": resource.monthly_cost
            }]
        })
        
    return result_msg

async def resize_db_instance(connection: AWSConnection, db_instance_id: str, new_class: str, db: Session) -> str:
    """Restricted tool: Resize RDS instance node tier."""
    logger.info(f"Remediation: Resizing RDS instance '{db_instance_id}' to new tier class '{new_class}'")
    
    creds = get_session_credentials(connection)
    
    if not creds:
        # Mock path
        result_msg = f"Mock success: RDS instance {db_instance_id} scaled to {new_class}."
    else:
        try:
            rds = boto3.client("rds", **creds)
            rds.modify_db_instance(
                DBInstanceIdentifier=db_instance_id,
                DBInstanceClass=new_class,
                ApplyImmediately=True
            )
            result_msg = f"AWS success: Modifying database instance {db_instance_id} tier to {new_class} triggered."
        except Exception as e:
            logger.error(f"RDS modify_db_instance failed: {str(e)}")
            raise RuntimeError(f"AWS API execution error: {str(e)}")

    # Update matching resource class if exists
    resource = db.query(Resource).filter(
        Resource.resource_type == "rds",
        Resource.aws_resource_arn.like(f"%{db_instance_id}%")
    ).first()
    if resource:
        resource.drifted = False
        db.commit()
        db.refresh(resource)
        await manager.broadcast({
            "event": "AWS_CONFIG_RESOURCE_CHANGE",
            "resources": [{
                "resource_id": resource.resource_id,
                "resource_type": resource.resource_type,
                "name": resource.name,
                "state": resource.state,
                "drifted": resource.drifted,
                "cpu": resource.cpu_utilization,
                "cost": resource.monthly_cost
            }]
        })
        
    return result_msg

# Hardcoded allowed list of callable tools (FR3.2)
ALLOWED_TOOLS = {
    "enable_s3_versioning": enable_s3_versioning,
    "modify_security_group_ingress": modify_security_group_ingress,
    "resize_db_instance": resize_db_instance
}
