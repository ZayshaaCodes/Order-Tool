@echo off
echo Deploying Order Tool API with Docker Compose...

echo Stopping existing containers...
docker-compose down

echo Building fresh image...
docker-compose build --no-cache

echo Starting services...
docker-compose up -d

if %ERRORLEVEL% neq 0 (
    echo Deployment failed!
    exit /b 1
)

echo.
echo Checking container status...
docker-compose ps

echo.
echo API should be running on http://localhost:3001
echo Test with: curl http://localhost:3001/health
echo.
echo Useful commands:
echo   Logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart