#!/bin/bash

echo "🚀 Starting DevLink Load Balanced System..."
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start the system
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "✅ System started successfully!"
echo ""
echo "🔗 Access Points:"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost/api"
echo "   - Health Check: http://localhost/api/health"
echo ""
echo "📋 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop system: docker-compose down"
echo "   - Restart: docker-compose restart"
