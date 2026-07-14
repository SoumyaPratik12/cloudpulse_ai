"""Database configuration and session management."""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from config import settings

# Create engine
engine = create_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=10,
    max_overflow=20,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Session:
    """Get database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables and seed default admin user."""
    Base.metadata.create_all(bind=engine)

    # Seed default user and organization if empty
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        from models import User, Organization
        from auth import get_password_hash

        # Create default organization if none exists
        org = db.query(Organization).first()
        if not org:
            org = Organization(
                name="CloudPulse AI",
                industry="Technology",
                website="https://cloudpulse.ai",
                default_aws_region="ap-south-1",
                subscription_tier="enterprise",
                is_active=True
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print("Database Seed: Created default organization 'CloudPulse AI'")

        # Create default admin user if none exists
        user = db.query(User).first()
        if not user:
            user = User(
                email="admin@cloudpulse.ai",
                username="admin",
                full_name="CloudPulse Admin",
                hashed_password=get_password_hash("Password123!"),
                is_active=True,
                is_admin=True,
                organization_id=org.id
            )
            db.add(user)
            db.commit()
            print("Database Seed: Created default admin user 'admin@cloudpulse.ai' with password 'Password123!'")

        # Log all users currently in the database
        all_users = db.query(User).all()
        print(f"Database Seed Verify: Total users in DB: {len(all_users)}")
        for u in all_users:
            print(f"  User: email={u.email}, username={u.username}, hashed={u.hashed_password}, is_active={u.is_active}")
    except Exception as e:
        print(f"Database Seed Error: {e}")
        db.rollback()
    finally:
        db.close()
