#!/bin/bash

# CloudPulse AI GitHub Setup Script
# This script sets up the necessary GitHub secrets and environment for CI/CD

set -e

echo "🚀 CloudPulse AI GitHub Setup"
echo "=============================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q)
echo "📦 Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    if [ -z "$secret_value" ]; then
        echo "⏭️  Skipping $secret_name (empty value)"
        return
    fi

    echo "Setting secret: $secret_name"
    echo "$secret_value" | gh secret set "$secret_name" -R "$REPO"
    echo "✅ $secret_name set"
}

echo "🔐 Setting up GitHub Secrets..."
echo "================================"
echo ""

# AWS Credentials
read -p "AWS Access Key ID (leave empty to skip): " AWS_ACCESS_KEY_ID
set_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "AWS Access Key ID for Terraform"

read -sp "AWS Secret Access Key (leave empty to skip): " AWS_SECRET_ACCESS_KEY
echo ""
set_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "AWS Secret Access Key for Terraform"

# SonarCloud
read -p "SonarCloud Token (leave empty to skip): " SONAR_TOKEN
set_secret "SONAR_TOKEN" "$SONAR_TOKEN" "SonarCloud quality gate token"

# Docker Hub (optional)
read -p "Docker Hub Username (leave empty to skip): " DOCKER_USERNAME
set_secret "DOCKER_USERNAME" "$DOCKER_USERNAME" "Docker Hub username"

read -sp "Docker Hub Access Token (leave empty to skip): " DOCKER_TOKEN
echo ""
set_secret "DOCKER_TOKEN" "$DOCKER_TOKEN" "Docker Hub personal access token"

echo ""
echo "✅ GitHub secrets configured!"
echo ""

# Enable GitHub Pages (if needed for documentation)
read -p "Enable GitHub Pages for documentation? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📚 Setting up GitHub Pages..."
    gh repo edit -R "$REPO" --enable-pages
    echo "✅ GitHub Pages enabled"
fi

echo ""
echo "🎉 GitHub setup complete!"
echo ""
echo "Next steps:"
echo "1. Create backend and frontend code in their respective directories"
echo "2. Push to a develop or main branch to trigger CI/CD"
echo "3. Monitor workflow runs at: https://github.com/$REPO/actions"
echo ""
