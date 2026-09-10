# restart-server.ps1
# Luxe Groom Backend - Kill port 5000 and restart the Node server cleanly

Write-Host ""
Write-Host "================================================" -ForegroundColor DarkYellow
Write-Host "  Luxe Groom Backend - Restart Script" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor DarkYellow
Write-Host ""

# Step 1: Find and kill any process on port 5000
Write-Host "[1/3] Checking for process on port 5000..." -ForegroundColor Cyan
$netstatOutput = netstat -ano | Select-String ":5000\s+LISTENING"
if ($netstatOutput) {
    $parts = ($netstatOutput | Select-Object -First 1) -split "\s+"
    $pid5000 = $parts | Where-Object { $_ -match "^\d+$" } | Select-Object -Last 1
    if ($pid5000) {
        Write-Host "      Found PID: $pid5000 - terminating..." -ForegroundColor Yellow
        taskkill /PID $pid5000 /F | Out-Null
        Write-Host "      Process terminated." -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
} else {
    Write-Host "      Port 5000 is already free." -ForegroundColor Green
}

# Step 2: Verify port is free
Write-Host ""
Write-Host "[2/3] Verifying port 5000 is free..." -ForegroundColor Cyan
$stillInUse = netstat -ano | Select-String ":5000\s+LISTENING"
if ($stillInUse) {
    Write-Host "      ERROR: Port 5000 is still in use. Close it manually." -ForegroundColor Red
    exit 1
} else {
    Write-Host "      Port 5000 is clear." -ForegroundColor Green
}

# Step 3: Start the server
Write-Host ""
Write-Host "[3/3] Starting Luxe Groom backend server..." -ForegroundColor Cyan
Write-Host "      Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""
node server/server.js
