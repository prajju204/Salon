# start.ps1
# Luxe Groom - Auto-clear ports and start Backend (5000) + Frontend (5173)

$BACKEND_PORT = 5000
$USER_PORT = 5173
$ADMIN_PORT = 5174

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkMagenta
Write-Host "  Luxe Groom - Full Stack Startup (Isolated Port Architecture)" -ForegroundColor Magenta
Write-Host "  Backend :$BACKEND_PORT | User Portal :$USER_PORT | Admin Portal :$ADMIN_PORT" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor DarkMagenta
Write-Host ""

# ── Helper: kill whatever is sitting on a port ──────────────────────────────
function Clear-Port($port) {
    $hits = netstat -ano | Select-String ":$port\s"
    if ($hits) {
        $pids = @()
        foreach ($line in $hits) {
            $parts = ($line -split "\s+") | Where-Object { $_ -match "^\d+$" }
            if ($parts) { $pids += $parts | Select-Object -Last 1 }
        }
        $pids = $pids | Sort-Object -Unique
        foreach ($p in $pids) {
            if ($p -and $p -ne "0") {
                Write-Host "  Killing PID $p on port $port ..." -ForegroundColor Yellow
                taskkill /PID $p /F 2>$null | Out-Null
            }
        }
        Start-Sleep -Milliseconds 800
        Write-Host "  Port $port cleared." -ForegroundColor Green
    } else {
        Write-Host "  Port $port is already free." -ForegroundColor Green
    }
}

# ── Step 1: Free all ports ──────────────────────────────────────────────────
Write-Host "[1/4] Clearing port $BACKEND_PORT (backend)..." -ForegroundColor Cyan
Clear-Port $BACKEND_PORT

Write-Host ""
Write-Host "[2/4] Clearing port $USER_PORT (user portal)..." -ForegroundColor Cyan
Clear-Port $USER_PORT

Write-Host ""
Write-Host "[3/4] Clearing port $ADMIN_PORT (admin portal)..." -ForegroundColor Cyan
Clear-Port $ADMIN_PORT

Write-Host ""

# ── Step 2: Launch all servers via concurrently ────────────────────────────
Write-Host "[4/4] Starting servers..." -ForegroundColor Cyan
Write-Host "  Backend      -> http://localhost:$BACKEND_PORT" -ForegroundColor DarkCyan
Write-Host "  User Portal  -> http://localhost:$USER_PORT" -ForegroundColor DarkMagenta
Write-Host "  Admin Portal -> http://localhost:$ADMIN_PORT" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  Press Ctrl+C to stop all servers." -ForegroundColor Gray
Write-Host ""

# Run concurrently
npx concurrently `
    --prefix "[{name}]" `
    --names "BACKEND,USER,ADMIN" `
    --prefix-colors "cyan,magenta,green" `
    "npx --prefix server nodemon server/server.js" `
    "npx vite --port 5173" `
    "npx vite --config vite.admin.config.js --port 5174"

