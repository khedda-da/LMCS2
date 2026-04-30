#!/bin/bash
# Initialize Docker Deployment
# Usage: ./scripts/init-docker.sh

set -e

echo "🐳 Initializing Docker Deployment..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "   Please edit .env.local with your configuration"
    echo ""
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

echo ""
echo "✅ Docker deployment started!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access Application:"
echo "   URL: http://localhost:3000"

echo ""
echo "🗄️  Database Access:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   User: postgres"
echo "   Password: postgres"
echo "   Database: lmcs_db"

echo ""
echo "📝 View Logs:"
echo "   docker-compose logs -f app"
echo "   docker-compose logs -f postgres"

echo ""
echo "🛑 Stop Services:"
echo "   docker-compose down"

echo ""
echo "✨ Setup complete!"
