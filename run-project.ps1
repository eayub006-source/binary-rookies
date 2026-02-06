# Binary Rookies - Install dependencies and run full project
# Run this in PowerShell from the project root (folder containing backend + frontend).
# Requires: Node.js and npm installed and in PATH.

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

# Check Node/npm
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org and ensure 'node' and 'npm' are in PATH." -ForegroundColor Red
    exit 1
}
Write-Host "Node: $(node -v)  npm: $(npm -v)" -ForegroundColor Cyan

# --- Backend ---
Write-Host "`n--- Backend: install ---" -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n--- Backend: Prisma generate ---" -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n--- Backend: Prisma db push ---" -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n--- Backend: Seed database ---" -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- Frontend ---
Write-Host "`n--- Frontend: install ---" -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location $ProjectRoot

# --- Start servers ---
Write-Host "`n--- Starting backend (port 3001) and frontend (Vite)... ---" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173 (or the URL Vite prints)" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both.`n" -ForegroundColor Gray

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:ProjectRoot\backend
    npm run dev
}
Start-Sleep -Seconds 2
Set-Location "$ProjectRoot\frontend"
npm run dev

# When frontend exits, stop backend
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue
