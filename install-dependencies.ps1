# Binary Rookies - Install all dependencies and set up database
# Run from project root. Requires Node.js and npm in PATH.

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "--- Backend ---" -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
npm install
npx prisma generate
npx prisma db push
npm run db:seed

Write-Host "`n--- Frontend ---" -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm install

Set-Location $ProjectRoot
Write-Host "`nDone. To run: open two terminals." -ForegroundColor Green
Write-Host "  Terminal 1: cd backend; npm run dev" -ForegroundColor Cyan
Write-Host "  Terminal 2: cd frontend; npm run dev" -ForegroundColor Cyan
