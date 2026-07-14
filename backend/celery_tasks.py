"""Celery task definitions for async operations."""
import logging
from celery import Celery
from config import settings

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "cloudpulse",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task
def scan_aws_resources(organization_id: int, aws_credential_id: int):
    """Scan AWS resources for an organization."""
    logger.info(f"Scanning AWS resources for org {organization_id}")
    from database import SessionLocal
    from models import AWSCredential
    from aws_integration import get_aws_client, sync_resources_to_db, generate_recommendations_for_org

    db = SessionLocal()
    try:
        creds = db.query(AWSCredential).filter(AWSCredential.id == aws_credential_id).first()
        access_key = creds.access_key_id if creds else None
        secret_key = creds.secret_access_key if creds else None

        client = get_aws_client(access_key_id=access_key, secret_access_key=secret_key)
        sync_resources_to_db(db, organization_id, client)
        generate_recommendations_for_org(db, organization_id)
        logger.info(f"Successfully completed resource scan and recommendations for org {organization_id}")
    except Exception as e:
        logger.error(f"Failed scanning resources in background task: {str(e)}")
    finally:
        db.close()


@celery_app.task
def generate_recommendations(organization_id: int):
    """Generate AI recommendations for an organization."""
    logger.info(f"Generating recommendations for org {organization_id}")
    from database import SessionLocal
    from aws_integration import generate_recommendations_for_org

    db = SessionLocal()
    try:
        generate_recommendations_for_org(db, organization_id)
    except Exception as e:
        logger.error(f"Failed generating recommendations in background task: {str(e)}")
    finally:
        db.close()


@celery_app.task
def analyze_costs(organization_id: int, days: int = 30):
    """Analyze costs for an organization."""
    logger.info(f"Analyzing costs for org {organization_id}")
    pass


@celery_app.task
def check_security_compliance(organization_id: int):
    """Check security compliance for an organization."""
    logger.info(f"Checking security compliance for org {organization_id}")
    pass


@celery_app.task
def send_notification(user_id: int, message: str):
    """Send notification to a user."""
    logger.info(f"Sending notification to user {user_id}")
    # TODO: Implement notification sending
    pass
