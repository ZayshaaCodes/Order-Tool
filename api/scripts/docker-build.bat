@echo off
echo Building Order Tool API Docker image...

docker build -t order-tool-api:latest .

if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b 1
)

echo Build complete! You can now run:
echo   docker run -p 3001:3001 order-tool-api:latest
echo Or use docker-compose:
echo   docker-compose up -d