# Docker Deployment Setup

This directory contains everything needed to deploy the Order Tool API using Docker.

## Quick Start

### Windows (PowerShell/Command Prompt)
```cmd
cd api
scripts\docker-deploy.bat
```

### Linux/macOS
```bash
cd api
chmod +x scripts/*.sh
./scripts/docker-deploy.sh
```

## What's Included

- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-container orchestration
- `.dockerignore` - Files to exclude from Docker build
- `scripts/` - Deployment automation scripts

## Configuration for Cloudflare Tunnel

The docker-compose.yml is pre-configured to:
- Bind to `127.0.0.1:3001` (localhost only)
- Perfect for Cloudflare tunnel setup
- Persistent data storage with Docker volumes

When you set up your Cloudflare tunnel, point it to `http://localhost:3001`

## Manual Commands

```bash
# Build image
docker build -t order-tool-api .

# Run with compose (recommended)
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down

# View running containers
docker-compose ps
```

## Data Persistence

Menu data is stored in a Docker volume named `menu-data`. This persists between container restarts and updates.

## Health Check

The container includes a built-in health check. Visit `http://localhost:3001/health` to verify the API is running.

## Updating

To update after code changes:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```