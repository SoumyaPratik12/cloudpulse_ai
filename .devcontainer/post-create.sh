#!/bin/bash
set -e

echo "🚀 Setting up CloudPulse AI development environment..."

# Install Python dependencies (when backend exists)
if [ -f "backend/requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install --upgrade pip setuptools wheel
    pip install -r backend/requirements.txt
    pip install -r backend/requirements-dev.txt 2>/dev/null || true
fi

# Install Node dependencies (when frontend exists)
if [ -f "frontend/package.json" ]; then
    echo "📦 Installing Node dependencies..."
    cd frontend
    npm ci
    cd ..
fi

# Initialize PostgreSQL
echo "🗄️  Setting up PostgreSQL..."
sudo service postgresql start || true
sleep 2

# Initialize Redis
echo "⚡ Setting up Redis..."
sudo service redis-server start || true
sleep 2

# Print environment info
echo ""
echo "✅ CloudPulse AI Development Environment Ready!"
echo ""
echo "Available services:"
echo "  • Frontend:   http://localhost:3000"
echo "  • Backend:    http://localhost:8000"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis:      localhost:6379"
echo ""
echo "Next steps:"
echo "  1. cd backend && uvicorn main:app --reload"
echo "  2. cd frontend && npm run dev"
echo ""
