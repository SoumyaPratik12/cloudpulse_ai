import os
import sys
import shutil
import subprocess
import logging
import uuid
import json
import boto3
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from config import settings
from models import ProvisioningPlan, TerraformStateLock, Resource, AWSConnection
from websocket_manager import manager

logger = logging.getLogger(__name__)

def acquire_lock(db: Session, connection_id: int, worker_id: str, ttl_seconds: int = 3600) -> bool:
    """Acquire concurrency-safe lock for Terraform connection state execution."""
    now = datetime.utcnow()
    # Check if a lock exists and is still valid
    lock = db.query(TerraformStateLock).filter(TerraformStateLock.connection_id == connection_id).first()
    if lock:
        if lock.expires_at > now:
            logger.warning(f"Connection {connection_id} state is currently locked by worker {lock.locked_by_worker_id}")
            return False
        else:
            # Expired lock, delete it
            db.delete(lock)
            db.commit()

    # Create new lock entry
    new_lock = TerraformStateLock(
        connection_id=connection_id,
        locked_by_worker_id=worker_id,
        expires_at=now + timedelta(seconds=ttl_seconds)
    )
    try:
        db.add(new_lock)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to acquire database lock atomically: {str(e)}")
        return False

def release_lock(db: Session, connection_id: int, worker_id: str):
    """Release state lock if held by this worker."""
    lock = db.query(TerraformStateLock).filter(
        TerraformStateLock.connection_id == connection_id,
        TerraformStateLock.locked_by_worker_id == worker_id
    ).first()
    if lock:
        db.delete(lock)
        db.commit()
        logger.info(f"Released lock for connection {connection_id}")

def generate_terraform_hcl(requirement: str, connection_id: int) -> str:
    """Generate syntactically correct HCL code based on user prompt requirements."""
    req = requirement.lower()

    # Define backend block
    if settings.environment == "development":
        backend_block = """
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
"""
    else:
        backend_block = f"""
terraform {{
  backend "s3" {{
    bucket         = "cloudpulse-terraform-states"
    key            = "states/connection-{connection_id}/terraform.tfstate"
    region         = "{settings.aws_region}"
    encrypt        = true
    dynamodb_table = "cloudpulse-terraform-locks"
  }}
}}
"""

    # Generate variables & resources configurations based on requirements
    hcl = f"""{backend_block}

provider "aws" {{
  region = "{settings.aws_region}"
}}

variable "unique_suffix" {{
  type    = string
  default = "cp-deploy"
}}

resource "aws_vpc" "main" {{
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {{
    Name = "cloudpulse-vpc"
    ManagedBy = "CloudPulseAI"
  }}
}}

resource "aws_subnet" "subnet_a" {{
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "{settings.aws_region}a"
  tags = {{
    Name = "cloudpulse-subnet-a"
  }}
}}

resource "aws_security_group" "allow_tls" {{
  name        = "cloudpulse-allow-tls"
  description = "Allow TLS inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {{
    description = "TLS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }}

  egress {{
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }}
}}
"""

    if "s3" in req or "storage" in req or "bucket" in req:
        hcl += """
resource "aws_s3_bucket" "assets_bucket" {
  bucket        = "cloudpulse-assets-${var.unique_suffix}"
  force_destroy = true
  tags = {
    Name = "cloudpulse-assets"
  }
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.assets_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}
"""

    if "rds" in req or "database" in req or "postgres" in req or "mysql" in req:
        hcl += """
resource "aws_db_instance" "rds_db" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "14.2"
  instance_class       = "db.t3.micro"
  db_name              = "cloudpulsedb"
  username             = "dbuser"
  password             = "dbpassword123"
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.allow_tls.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "cloudpulse-db-subnets"
  subnet_ids = [aws_subnet.subnet_a.id, aws_subnet.subnet_b.id]
}

resource "aws_subnet" "subnet_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${aws_vpc.main.tags.ManagedBy != "" ? "ap-south-1b" : "ap-south-1b"}"
}
"""

    if "ecs" in req or "container" in req:
        hcl += """
resource "aws_ecs_cluster" "cluster" {
  name = "cloudpulse-fargate-cluster"
}
"""
    elif "lambda" in req or "serverless" in req:
        hcl += """
resource "aws_iam_role" "lambda_role" {
  name = "cloudpulse-lambda-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}
"""
    return hcl

def safe_rmtree(path: str):
    """Safely remove directory tree, handling Windows read-only or lock issues."""
    if not os.path.exists(path):
        return
    import time
    import stat
    for _ in range(5):
        try:
            def onerror(func, p, exc_info):
                try:
                    os.chmod(p, stat.S_IWRITE)
                    func(p)
                except Exception:
                    pass
            shutil.rmtree(path, onerror=onerror)
            return
        except Exception:
            time.sleep(0.2)

def get_workspace_dir(connection_id: int, plan_id: int) -> str:
    """Get absolute path to ephemeral plan workspace."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "scratch", "workspaces"))
    return os.path.join(base_dir, f"workspace-{connection_id}-{plan_id}")

def execute_terraform_plan(connection_id: int, plan_id: int, hcl_code: str, conn_role_arn: str, conn_external_id: str) -> str:
    """Execute terraform dry-run plan in isolated directory and return HCL diff output."""
    if conn_role_arn and "mock" in conn_role_arn.lower():
        return f"""
Terraform will perform the following actions:

  # aws_vpc.main will be created
  + resource "aws_vpc" "main" {{
      + arn                                  = (known after apply)
      + cidr_block                           = "10.0.0.0/16"
      + enable_dns_hostnames                 = true
      + id                                   = (known after apply)
      + tags                                 = {{
          + "ManagedBy" = "CloudPulseAI"
          + "Name"      = "cloudpulse-vpc"
        }}
    }}

Plan: 1 to add, 0 to change, 0 to destroy.
"""

    workspace = get_workspace_dir(connection_id, plan_id)
    safe_rmtree(workspace)
    os.makedirs(workspace, exist_ok=True)

    try:
        # Write config file
        with open(os.path.join(workspace, "main.tf"), "w") as f:
            f.write(hcl_code)

        # Scoped process credentials
        env = os.environ.copy()
        # Scoped process credentials
        env = os.environ.copy()
        if conn_role_arn and "mock" not in conn_role_arn.lower():
            try:
                sts = boto3.client("sts")
                assumed = sts.assume_role(
                    RoleArn=conn_role_arn,
                    RoleSessionName="CloudPulsePlanVerify",
                    ExternalId=conn_external_id
                )
                creds = assumed["Credentials"]
                env["AWS_ACCESS_KEY_ID"] = creds["AccessKeyId"]
                env["AWS_SECRET_ACCESS_KEY"] = creds["SecretAccessKey"]
                env["AWS_SESSION_TOKEN"] = creds["SessionToken"]
            except Exception as e:
                logger.error(f"Failed to assume role for plan verify: {str(e)}")

        # Init
        init_res = subprocess.run(
            ["terraform", "init"],
            cwd=workspace,
            capture_output=True,
            text=True,
            env=env
        )
        if init_res.returncode != 0:
            return f"Terraform Init Error:\n{init_res.stderr}\nStdout:\n{init_res.stdout}"

        # Plan
        plan_res = subprocess.run(
            ["terraform", "plan", "-no-color"],
            cwd=workspace,
            capture_output=True,
            text=True,
            env=env
        )
        return plan_res.stdout if plan_res.returncode == 0 else f"Terraform Plan Error:\n{plan_res.stderr}\nStdout:\n{plan_res.stdout}"

    finally:
        # Ephemeral cleanup of configuration manifests
        safe_rmtree(workspace)

async def execute_terraform_apply_async(
    db_session_factory, 
    connection_id: int, 
    plan_id: int, 
    hcl_code: str, 
    worker_id: str, 
    conn_role_arn: str, 
    conn_external_id: str,
    organization_id: int
):
    """Asynchronous background worker execution task for Terraform apply."""
    workspace = get_workspace_dir(connection_id, plan_id)
    # Verify active connection lock
    db = db_session_factory()
    try:
        locked = acquire_lock(db, connection_id, worker_id)
        if not locked:
            await manager.broadcast({
                "event": "TERRAFORM_LOG",
                "line": "❌ [Error] State Lock Acquisition Failed. Another execution is actively running against this connection."
            })
            # Rollback plan status
            plan = db.query(ProvisioningPlan).filter(ProvisioningPlan.id == plan_id).first()
            if plan:
                plan.status = "reviewed"
                plan.execution_status = "failed"
                db.commit()
            return

        # Update execution state
        plan = db.query(ProvisioningPlan).filter(ProvisioningPlan.id == plan_id).first()
        if plan:
            plan.execution_status = "applying"
            db.commit()

        if conn_role_arn and "mock" in conn_role_arn.lower():
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "🚀 Initiating Mock Terraform Ephemeral Workspace Apply Workflow..."})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "$ terraform init"})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "Initializing modules..."})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "Initializing the backend..."})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "Terraform has been successfully initialized!"})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "$ terraform apply -auto-approve"})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "aws_vpc.main: Creating..."})
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "aws_vpc.main: Creation complete after 1s"})
            
            # Sync simulated resources
            db.query(Resource).filter(Resource.organization_id == organization_id).delete()
            nodes = json.loads(plan.generated_plan_json)
            for node in nodes:
                res = Resource(
                    organization_id=organization_id,
                    plan_id=plan_id,
                    aws_resource_arn=f"arn:aws:{node['type']}:{settings.aws_region}:123456789012:resource/{node['id']}-{plan_id}",
                    resource_id=f"res-{node['type']}-{plan_id}",
                    resource_type=node["type"],
                    name=node["name"],
                    region=settings.aws_region,
                    state="running" if node["type"] in ["ec2", "ecs", "lambda"] else "available",
                    monthly_cost=node["cost"],
                    cpu_utilization=10.5 if node["type"] in ["ec2", "ecs"] else None,
                    last_scanned_at=datetime.utcnow()
                )
                db.add(res)
            plan.execution_status = "applied"
            plan.status = "executed"
            db.commit()
            
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": "🎉 Terraform Apply Completed Successfully! Operational Cockpit synchronizing resources."})
            return

        safe_rmtree(workspace)
        os.makedirs(workspace, exist_ok=True)

        await manager.broadcast({
            "event": "TERRAFORM_LOG",
            "line": "🚀 Initiating Terraform Ephemeral Workspace Apply Workflow..."
        })

        # Write code
        with open(os.path.join(workspace, "main.tf"), "w") as f:
            f.write(hcl_code)

        # Scoped process credentials
        env = os.environ.copy()
        if conn_role_arn and "mock" not in conn_role_arn:
            try:
                sts = boto3.client("sts")
                assumed = sts.assume_role(
                    RoleArn=conn_role_arn,
                    RoleSessionName="CloudPulseApply",
                    ExternalId=conn_external_id
                )
                creds = assumed["Credentials"]
                env["AWS_ACCESS_KEY_ID"] = creds["AccessKeyId"]
                env["AWS_SECRET_ACCESS_KEY"] = creds["SecretAccessKey"]
                env["AWS_SESSION_TOKEN"] = creds["SessionToken"]
            except Exception as e:
                logger.error(f"Failed to assume role for apply: {str(e)}")

        # Init
        await manager.broadcast({"event": "TERRAFORM_LOG", "line": "$ terraform init"})
        init_process = subprocess.Popen(
            ["terraform", "init", "-no-color"],
            cwd=workspace,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env
        )
        
        while True:
            line = init_process.stdout.readline()
            if not line:
                break
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": line.strip()})
        init_process.wait()

        if init_process.returncode != 0:
            raise Exception("Terraform init process exited with errors.")

        # Apply
        await manager.broadcast({"event": "TERRAFORM_LOG", "line": "$ terraform apply -auto-approve"})
        apply_process = subprocess.Popen(
            ["terraform", "apply", "-auto-approve", "-no-color"],
            cwd=workspace,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env
        )

        while True:
            line = apply_process.stdout.readline()
            if not line:
                break
            await manager.broadcast({"event": "TERRAFORM_LOG", "line": line.strip()})
        apply_process.wait()

        if apply_process.returncode != 0:
            raise Exception("Terraform apply process exited with errors.")

        # Update database inventory sync simulation after successful apply
        # Clear database and seed real/successful mappings
        db.query(Resource).filter(Resource.organization_id == organization_id).delete()
        
        # Load planned node array from requirement text
        nodes = json.loads(plan.generated_plan_json)
        for node in nodes:
            res = Resource(
                organization_id=organization_id,
                plan_id=plan_id,
                aws_resource_arn=f"arn:aws:{node['type']}:{settings.aws_region}:123456789012:resource/{node['id']}-{plan_id}",
                resource_id=f"res-{node['type']}-{plan_id}",
                resource_type=node["type"],
                name=node["name"],
                region=settings.aws_region,
                state="running" if node["type"] in ["ec2", "ecs", "lambda"] else "available",
                monthly_cost=node["cost"],
                cpu_utilization=10.5 if node["type"] in ["ec2", "ecs"] else None,
                last_scanned_at=datetime.utcnow()
            )
            db.add(res)

        plan.execution_status = "applied"
        plan.status = "executed"
        db.commit()

        await manager.broadcast({
            "event": "TERRAFORM_LOG",
            "line": "🎉 Terraform Apply Completed Successfully! Operational Cockpit synchronizing resources."
        })

    except Exception as e:
        logger.error(f"Terraform execution task failed: {str(e)}")
        # Reset execution state on failure
        plan = db.query(ProvisioningPlan).filter(ProvisioningPlan.id == plan_id).first()
        if plan:
            plan.status = "reviewed"
            plan.execution_status = "failed"
            db.commit()
        await manager.broadcast({
            "event": "TERRAFORM_LOG",
            "line": f"❌ [Error] Terraform Execution Failed: {str(e)}"
        })

    finally:
        # Release concurrency lock
        release_lock(db, connection_id, worker_id)
        # Purge temporary local workspace manifests
        safe_rmtree(workspace)
        db.close()
