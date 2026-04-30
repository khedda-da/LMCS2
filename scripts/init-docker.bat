@echo off
REM Initialize Docker Deployment (Windows)
REM Usage: init-docker.bat

echo ================================
echo LMCS Docker Initialization
echo ================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed
    echo Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker Compose is not available
    pause
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo Creating .env.local from template...
    copy .env.example .env.local
    echo Please edit .env.local with your configuration
    echo.
)

echo Building Docker images...
docker-compose build

echo.
echo Starting services...
docker-compose up -d

echo.
echo Waiting for services to be ready (30 seconds)...
timeout /t 30

echo.
echo Docker deployment started!
echo.
echo Service Status:
docker-compose ps

echo.
echo Access Application at: http://localhost:3000
echo.
echo View Logs:
echo   docker-compose logs -f app
echo.
echo Stop Services:
echo   docker-compose down
echo.
pause
