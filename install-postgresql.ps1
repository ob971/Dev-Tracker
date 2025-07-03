# PostgreSQL Installation Script for Windows
Write-Host "PostgreSQL Installation Script" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check if winget is available
try {
    $wingetVersion = winget --version
    Write-Host "✓ winget is available: $wingetVersion" -ForegroundColor Green
    
    Write-Host "Installing PostgreSQL using winget..." -ForegroundColor Yellow
    winget install PostgreSQL.PostgreSQL
    
    Write-Host "✓ PostgreSQL installation completed!" -ForegroundColor Green
    Write-Host "Please restart your terminal and run the Go backend again." -ForegroundColor Yellow
    
} catch {
    Write-Host "✗ winget not available or failed" -ForegroundColor Red
    Write-Host "Alternative installation methods:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "2. Use Chocolatey: choco install postgresql" -ForegroundColor Cyan
    Write-Host "3. Use Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres" -ForegroundColor Cyan
}

Write-Host "`nAfter installation, update config.env with your credentials:" -ForegroundColor Yellow
Write-Host "DB_USER=postgres" -ForegroundColor Cyan
Write-Host "DB_PASSWORD=your_password" -ForegroundColor Cyan
Write-Host "DB_HOST=localhost" -ForegroundColor Cyan
Write-Host "DB_PORT=5432" -ForegroundColor Cyan 