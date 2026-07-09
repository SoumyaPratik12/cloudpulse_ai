# CloudPulse AI - GitHub-Native Development Setup

This document explains how to use GitHub for all development, building, and deployment.

## 🎯 Overview

CloudPulse AI is set up for **100% GitHub-native development**:
- 🖥️ **Codespaces** for cloud-based development
- 🔄 **GitHub Actions** for CI/CD pipelines
- 📦 **GitHub Container Registry** for Docker images
- 🏗️ **GitHub Environments** for staging/production deployments

**No local setup required!**

---

## 🚀 Getting Started with GitHub Codespaces

### Option 1: Quick Start (Recommended)

1. Go to your GitHub repository
2. Click the **<> Code** button
3. Select **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for the environment to be ready (~2-3 minutes)
6. The dev environment is automatically configured!

### Option 2: Manual Launch

```bash
# From your repository
gh codespace create --repo owner/cloudpulse_ai
```

### Accessing Services in Codespaces

Once the Codespace is running:

| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://<codespace>-3000.preview.app.github.dev` | 3000 |
| Backend API | `https://<codespace>-8000.preview.app.github.dev` | 8000 |
| API Docs | `https://<codespace>-8000.preview.app.github.dev/docs` | 8000 |

---

## 🔄 CI/CD Workflows

### Automated Workflows

The repository includes two main workflows:

#### 1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)

Triggered on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Steps:
- ✅ Backend tests (pytest, linting, type checking)
- ✅ Frontend tests (ESLint, TypeScript, builds)
- ✅ Docker image builds → GitHub Container Registry
- ✅ Terraform validation
- ✅ Security scanning

#### 2. **Security & Code Quality** (`.github/workflows/security.yml`)

Triggered:
- Daily (2 AM UTC)
- On push/PR
- Manual workflow dispatch

Checks:
- 🔐 Dependency vulnerabilities
- 📊 Code quality (Pylint, SonarCloud)
- 🕵️ Secret scanning

### View Workflow Status

```bash
# List recent workflow runs
gh run list -R owner/cloudpulse_ai

# View details of a specific run
gh run view <run-id> -R owner/cloudpulse_ai

# Watch workflow in real-time
gh run watch <run-id> -R owner/cloudpulse_ai
```

---

## 📦 Docker Images

Docker images are automatically built and pushed to **GitHub Container Registry**:

### Image Names
```
ghcr.io/SoumyaPratik12/cloudpulse_ai-backend:<tag>
ghcr.io/SoumyaPratik12/cloudpulse_ai-frontend:<tag>
```

### Tags
- `main` - Latest production build
- `develop` - Latest development build
- `sha-<commit>` - Specific commit hash
- `latest` - Most recent build

### Pull Images

```bash
# Authenticate with GitHub Container Registry
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# Pull backend image
docker pull ghcr.io/SoumyaPratik12/cloudpulse_ai-backend:main

# Pull frontend image
docker pull ghcr.io/SoumyaPratik12/cloudpulse_ai-frontend:main
```

---

## 🔐 GitHub Secrets Configuration

Required secrets for CI/CD:

1. **AWS Credentials** (for Terraform)
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. **SonarCloud** (for code quality)
   - `SONAR_TOKEN`

3. **Docker Hub** (optional)
   - `DOCKER_USERNAME`
   - `DOCKER_TOKEN`

### Setup Script

Run the automated setup script:

```bash
bash scripts/setup-github.sh
```

Or manually set secrets:

```bash
# Set a secret
gh secret set SECRET_NAME --body "secret_value" -R owner/cloudpulse_ai

# View all secrets
gh secret list -R owner/cloudpulse_ai

# Delete a secret
gh secret delete SECRET_NAME -R owner/cloudpulse_ai
```

---

## 🛠️ Development Workflow

### Using GitHub Codespaces

```bash
# 1. Create and launch Codespace
gh codespace create --repo owner/cloudpulse_ai
gh codespace code --repo owner/cloudpulse_ai

# 2. Inside Codespace - Backend development
cd backend
pip install -r requirements.txt -r requirements-dev.txt
uvicorn main:app --reload

# 3. Inside Codespace - Frontend development
cd frontend
npm install
npm run dev

# 4. Run tests
cd backend && pytest tests/ -v
cd frontend && npm run test

# 5. Run linting
cd backend && ruff check .
cd frontend && npm run lint
```

### Using Docker Compose (Local or Codespaces)

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up

# Run specific service
docker-compose -f docker/docker-compose.yml up backend

# View logs
docker-compose -f docker/docker-compose.yml logs -f backend

# Stop services
docker-compose -f docker/docker-compose.yml down
```

---

## 📊 Deployments

### Automatic Deployments

- **Develop branch** → Development environment (after passing tests)
- **Main branch** → Production environment (requires approval)

### Manual Deployment

```bash
# Trigger a workflow manually
gh workflow run ci-cd.yml -R owner/cloudpulse_ai

# Deploy specific branch
gh workflow run ci-cd.yml --ref develop -R owner/cloudpulse_ai
```

### Environment Approvals

Production deployments require manual approval. When a workflow reaches the production deployment step:

1. Go to repository Actions tab
2. Find the pending deployment
3. Click "Review deployments"
4. Approve or reject

---

## 📝 Commit Strategy for CI/CD

Use conventional commits to trigger specific behaviors:

```bash
# Feature - runs all tests and builds
git commit -m "feat: add new feature"

# Bug fix - runs all tests and builds
git commit -m "fix: resolve issue"

# Documentation - skips most tests
git commit -m "docs: update README"

# Skip CI entirely (not recommended)
git commit -m "chore: update dependencies [skip ci]"
```

---

## 🔍 Monitoring & Debugging

### View Workflow Logs

```bash
# Watch workflow in real-time
gh run watch <run-id>

# View detailed logs
gh run view <run-id> --log

# Download logs
gh run download <run-id>
```

### GitHub Actions Status Page

Monitor all workflows: https://github.com/SoumyaPratik12/cloudpulse_ai/actions

---

## 🎯 Best Practices

1. **Create Feature Branches**
   ```bash
   git checkout -b feature/my-feature
   git push origin feature/my-feature
   ```

2. **Use Pull Requests**
   - All code goes through PR review
   - Workflows run automatically
   - Checks must pass before merging

3. **Test Locally First**
   - Use Codespaces or Docker Compose for local testing
   - Run `pytest` for backend tests
   - Run `npm test` for frontend tests

4. **Keep Dependencies Updated**
   - Regular Dependabot checks
   - Review security advisories in Actions tab

5. **Monitor Deployments**
   - Check Actions tab after pushing to main/develop
   - Review environment status
   - Check CloudWatch logs for production issues

---

## 📚 Additional Resources

- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Terraform + GitHub Actions](https://learn.hashicorp.com/tutorials/terraform/github-actions)

---

## ❓ Troubleshooting

### Workflow Fails on Dependencies

**Solution**: Ensure `requirements.txt` and `package.json` are correctly formatted

### Docker Build Fails

**Solution**: Check Dockerfile syntax and ensure all dependencies are listed

### Deployment Fails

**Solution**: 
1. Check AWS credentials in GitHub Secrets
2. Verify Terraform configuration syntax
3. Review error logs in Actions tab

### Codespaces Timeout

**Solution**: Use `gh codespace create --idle-timeout 90` to extend timeout

---

## 🚀 Ready to Build!

You now have a complete GitHub-native development setup. Start coding and let GitHub handle the rest! 🎉
