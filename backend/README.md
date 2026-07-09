"""Backend API README."""

# CloudPulse AI Backend

Production-ready FastAPI backend for CloudPulse AI infrastructure monitoring platform.

## Quick Start

### 1. Setup Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Initialize Database

```bash
# Create PostgreSQL database
createdb cloudpulse

# Create tables
python
>>> from database import init_db
>>> init_db()
```

### 4. Run Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at `http://localhost:8000/docs`

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration & settings
├── database.py            # Database setup
├── models.py              # SQLAlchemy models
├── schemas.py             # Pydantic schemas
├── auth.py                # JWT authentication
├── agents.py              # AI agents (LangGraph)
├── aws_integration.py     # AWS SDK wrapper
├── celery_tasks.py        # Async tasks
├── routes/                # API route handlers
│   ├── __init__.py
│   ├── health.py         # Health check
│   ├── auth.py           # Authentication
│   ├── users.py          # User management
│   ├── organizations.py  # Organization management
│   ├── resources.py      # Resource listing
│   ├── recommendations.py # Recommendations
│   └── dashboard.py      # Dashboard data
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/` - List organization users
- `GET /api/v1/users/{user_id}` - Get user details

### Organizations
- `GET /api/v1/organizations/me` - Get current organization
- `POST /api/v1/organizations/` - Create organization
- `GET /api/v1/organizations/{org_id}` - Get organization

### Resources
- `GET /api/v1/resources/` - List resources
- `GET /api/v1/resources/{resource_id}` - Get resource details

### Recommendations
- `GET /api/v1/recommendations/` - List recommendations
- `GET /api/v1/recommendations/{recommendation_id}` - Get recommendation

### Dashboard
- `GET /api/v1/dashboard/executive` - Executive dashboard
- `GET /api/v1/dashboard/devops` - DevOps dashboard
- `GET /api/v1/dashboard/finance` - Finance dashboard

### Health
- `GET /api/v1/health` - Health check

## Technologies

- **Framework**: FastAPI
- **Server**: Uvicorn
- **Database**: PostgreSQL + SQLAlchemy
- **Cache**: Redis
- **Task Queue**: Celery
- **Auth**: JWT + bcrypt
- **AI**: LangGraph + OpenAI/Anthropic
- **Cloud**: AWS (boto3)

## Development

### Code Style
```bash
# Format code
black .

# Lint
flake8 .

# Type checking
mypy .
```

### Testing
```bash
pytest
pytest --cov=.  # With coverage
```

## Docker

```bash
# Build
docker build -f ../docker/Dockerfile.backend -t cloudpulse-backend:latest .

# Run
docker run -p 8000:8000 cloudpulse-backend:latest
```

## Database Migrations

Using Alembic for schema versioning:

```bash
# Create migration
alembic revision --autogenerate -m "Add new field"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Variables

See `.env.example` for complete list. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `OPENAI_API_KEY` - OpenAI API key
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `REDIS_URL` - Redis connection string

## Deployment

See main README for deployment instructions using:
- Docker Compose (local dev)
- AWS ECS/Fargate (production)
- GitHub Actions CI/CD

## Security Notes

- All passwords hashed with bcrypt
- JWT tokens for stateless auth
- CORS configured for frontend domains
- AWS credentials encrypted in database
- SQL injection protection via SQLAlchemy ORM
- HTTPS enforced in production

## Support

For issues or questions, check:
1. FastAPI docs: http://localhost:8000/docs
2. SQLAlchemy docs: https://docs.sqlalchemy.org/
3. Celery docs: https://docs.celeryproject.io/
4. AWS boto3: https://boto3.amazonaws.com/v1/documentation/api/latest/index.html
