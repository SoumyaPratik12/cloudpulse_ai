# Getting Started: Building CloudPulse AI

This guide explains how to contribute to CloudPulse AI and move through the development phases.

---

## 🚀 Quick Start

### Option 1: GitHub Codespaces (Recommended - Cloud Development)

```bash
# 1. Go to GitHub repository
# 2. Click <> Code → Codespaces → Create codespace on main
# 3. Wait for environment to boot (2-3 minutes)
# 4. Services auto-start:
#    - Frontend: port 3000
#    - Backend: port 8000
#    - PostgreSQL: port 5432
#    - Redis: port 6379
```

**This requires NO local setup!** Everything is pre-configured.

### Option 2: Local Development with Docker

```bash
# Clone and enter directory
git clone https://github.com/SoumyaPratik12/cloudpulse_ai.git
cd cloudpulse_ai

# Start all services
docker-compose -f docker/docker-compose.yml up

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Option 3: Manual Local Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in new terminal)
cd frontend
npm install
npm run dev

# Database (in new terminal - if not using Docker)
# Ensure PostgreSQL is running
```

---

## 📋 Current Phase: What to Work On Next

### For Design/UX Engineers
**→ Phase 1: Figma Designs (Jul 9-12)**

See [DEVELOPMENT-ROADMAP.md](docs/DEVELOPMENT-ROADMAP.md#phase-1-uxui-design-) for:
- [ ] Create Figma project
- [ ] Design wireframes for all screens
- [ ] Create high-fidelity UI mockups
- [ ] Build design system (components, colors, typography)
- [ ] Share Figma link in `docs/design.md`

**Deliverable:** Figma project with all screens ready for implementation

### For Backend/Full-Stack Engineers
**→ Phase 2: System Architecture (Jul 12-15)**

See [DEVELOPMENT-ROADMAP.md](docs/DEVELOPMENT-ROADMAP.md#phase-2-system-architecture-) for:
- [ ] Create architecture diagrams (HLD/LLD)
- [ ] Design database schema (ER diagram)
- [ ] Write OpenAPI specification
- [ ] Create sequence diagrams
- [ ] Document in `docs/architecture.md`

**Then Phase 3: Backend Development (Jul 15-19)**
- [ ] FastAPI project structure
- [ ] Database models with SQLAlchemy
- [ ] Authentication (JWT + OAuth2)
- [ ] API endpoints scaffolding

### For Frontend Engineers
**→ Phase 4: Frontend Development (Jul 15-19, parallel with Phase 3)**

- [ ] Vite + React + TypeScript setup
- [ ] Component library from Figma designs
- [ ] Authentication UI
- [ ] Dashboard page structure
- [ ] API integration layer

### For DevOps/AWS Engineers
**→ Phase 5: AWS Integration (Jul 19-24)**

- [ ] EC2 discovery and metrics
- [ ] CloudWatch integration
- [ ] Cost Explorer integration
- [ ] Health scoring algorithm
- [ ] Recommendation engine

### For AI/ML Engineers
**→ Phase 6: AI Agents (Jul 24-29)**

- [ ] LangGraph multi-agent setup
- [ ] Infrastructure analysis agent
- [ ] Cost forecasting agent
- [ ] Recommendation generation agent
- [ ] Copilot chat interface

---

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
git push origin feature/your-feature-name
```

Use conventional commit style:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `chore:` for maintenance

### 2. Work on Your Feature

Use GitHub Codespaces or local development (see Quick Start above)

### 3. Run Tests Locally

```bash
# Backend tests
cd backend
pytest tests/ -v --cov

# Frontend tests
cd frontend
npm test

# Linting
cd backend && ruff check .
cd frontend && npm run lint
```

### 4. Push and Create PR

```bash
git add .
git commit -m "feat: description of changes"
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

**CI/CD will automatically:**
- Run all tests
- Check linting
- Build Docker images
- Generate coverage reports

### 5. Code Review & Merge

Once PR is approved and all checks pass, merge to `develop`.

Merging to `develop` will trigger:
- ✅ Deployment to development environment
- ✅ Automated testing

Merging to `main` will:
- ✅ Require approval (production environment)
- ✅ Deploy to production

---

## 📦 Project Structure Quick Reference

```
backend/          → FastAPI application code
frontend/         → React application code  
infrastructure/   → Terraform for AWS deployment
ai/               → LangGraph agents
docker/           → Dockerfiles & docker-compose
docs/             → Product & technical docs
.github/workflows/ → CI/CD pipelines
tests/            → Test suites
scripts/          → Utility scripts
```

---

## 🔐 GitHub Secrets Setup

If you're working on deployment features, set up secrets:

```bash
bash scripts/setup-github.sh
```

This will prompt for:
- AWS Access Key ID
- AWS Secret Access Key
- SonarCloud Token (optional)
- Docker credentials (optional)

---

## 🐛 Debugging

### Backend Issues

```bash
cd backend
python -m pdb -m main  # Debug with Python debugger
uvicorn main:app --reload --log-level debug  # Verbose logging
```

### Frontend Issues

```bash
cd frontend
npm run dev  # Dev server with HMR (hot reload)
# Check browser console for errors
```

### Docker Issues

```bash
docker-compose -f docker/docker-compose.yml logs -f  # View all logs
docker-compose -f docker/docker-compose.yml logs backend  # Backend logs only
docker-compose -f docker/docker-compose.yml down --volumes  # Reset everything
```

---

## 📊 Checking CI/CD Status

```bash
# View all recent workflow runs
gh run list -R SoumyaPratik12/cloudpulse_ai

# Watch a specific workflow
gh run watch <run-id>

# Get detailed logs
gh run view <run-id> --log
```

Or visit: https://github.com/SoumyaPratik12/cloudpulse_ai/actions

---

## 🤝 Contributing Guidelines

1. **Follow the roadmap** - Work on phases in order (Phases 1-8)
2. **Document your work** - Update docs/ as you build
3. **Write tests** - Aim for >80% code coverage
4. **Keep it production-ready** - Code should be deployable immediately
5. **Use conventional commits** - Helps with automation
6. **Review the PRD** - Understand requirements before coding

---

## 📚 Helpful Resources

- [DEVELOPMENT-ROADMAP.md](docs/DEVELOPMENT-ROADMAP.md) - Complete build plan
- [GitHub Setup Guide](README-GITHUB-SETUP.md) - CI/CD and Codespaces
- [Product Requirements](docs/prd.md) - What to build
- [Architecture (Phase 2)](docs/DEVELOPMENT-ROADMAP.md#phase-2-system-architecture-) - How to build it

---

## ❓ Questions?

1. Check the relevant phase in [DEVELOPMENT-ROADMAP.md](docs/DEVELOPMENT-ROADMAP.md)
2. Review existing documentation in `docs/`
3. Look at GitHub Issues and PRs
4. Ask in GitHub Discussions

---

## 🎯 Success Criteria for Each Phase

- **Phase 1 (Design)**: All screens in Figma, ready for dev handoff
- **Phase 2 (Architecture)**: All diagrams and specs documented
- **Phase 3-4 (Core)**: Backend and frontend running locally
- **Phase 5 (AWS)**: AWS integration working with real data
- **Phase 6 (AI)**: AI agents generating recommendations
- **Phase 7 (Dashboards)**: All dashboards functional
- **Phase 8 (Production)**: Live deployment with monitoring

---

## 🚀 You're Ready!

Pick your role and dive into the next phase in [DEVELOPMENT-ROADMAP.md](docs/DEVELOPMENT-ROADMAP.md).

Let's build something impressive! 🎉
