@echo off
echo PostgreSQL Installation Script
echo =============================

echo Checking if winget is available...
winget --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Installing PostgreSQL using winget...
    winget install PostgreSQL.PostgreSQL
    echo PostgreSQL installation completed!
    echo Please restart your terminal and run the Go backend again.
) else (
    echo winget not available. Please install PostgreSQL manually:
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Or use Chocolatey: choco install postgresql
    echo 3. Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
)

echo.
echo After installation, update config.env with your credentials:
echo DB_USER=postgres
echo DB_PASSWORD=your_password
echo DB_HOST=localhost
echo DB_PORT=5432

pause 