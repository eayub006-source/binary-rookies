# Binary Rookies - Start app and make it accessible to other users on your Wi-Fi
# Run this script from the project root (folder containing backend + frontend).
# For firewall: Right-click PowerShell -> Run as Administrator, then run this script once.

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

# 1. Allow port 5173 through Windows Firewall (so others can connect)
Write-Host "Checking firewall for port 5173..." -ForegroundColor Cyan
$rule = Get-NetFirewallRule -DisplayName "Binary Rookies Vite 5173" -ErrorAction SilentlyContinue
if (-not $rule) {
  try {
    New-NetFirewallRule -DisplayName "Binary Rookies Vite 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private -ErrorAction Stop | Out-Null
    Write-Host "Firewall: Rule added (port 5173 allowed on private networks)." -ForegroundColor Green
  } catch {
    Write-Host "Firewall: Could not add rule. Run PowerShell as Administrator, then run this script again." -ForegroundColor Yellow
    Write-Host "  Or run: New-NetFirewallRule -DisplayName 'Binary Rookies Vite 5173' -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private" -ForegroundColor Gray
  }
} else {
  Write-Host "Firewall: Rule already exists." -ForegroundColor Green
}

# 2. Get this PC's IP for the shareable link
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress
$shareLink = "http://${ip}:5173/"

# 3. Stop any existing Node (optional)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 4. Start backend in a new window
Write-Host "`nStarting backend in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; `$env:Path = 'C:\Program Files\nodejs;' + [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User'); npm run dev"

Start-Sleep -Seconds 3

# 5. Start frontend in a new window
Write-Host "Starting frontend in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; `$env:Path = 'C:\Program Files\nodejs;' + [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User'); npm run dev"

Start-Sleep -Seconds 2

# 6. Output the link
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Share this link with other users (same Wi-Fi):" -ForegroundColor Green
Write-Host "  $shareLink" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "Two PowerShell windows are open (backend + frontend). Keep them open." -ForegroundColor Gray
Write-Host "To stop: close both windows.`n" -ForegroundColor Gray
