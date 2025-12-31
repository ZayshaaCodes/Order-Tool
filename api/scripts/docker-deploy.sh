#!/bin/bash
set -e

echo "Deploying Order Tool API with Docker Compose..."

# Stop any existing containers
docker-compose down

# Pull latest changes and rebuild
docker-compose build --no-cache

# Start the services
docker-compose up -d

# Show status
docker-compose ps

echo "API should be running on http://localhost:3001"
echo "Test with: curl http://localhost:3001/health"
echo ""
echo "Logs: docker-compose logs -f"
echo "Stop: docker-compose down"