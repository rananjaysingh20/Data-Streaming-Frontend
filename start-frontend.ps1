# MT5 Tick Stream Frontend Start Script
Write-Host "🚀 Starting MT5 Tick Stream Frontend..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    $pythonAvailable = $true
} catch {
    Write-Host "⚠️ Python not found - will use direct file opening" -ForegroundColor Yellow
    $pythonAvailable = $false
}

Write-Host ""
Write-Host "Choose how to run the frontend:" -ForegroundColor Cyan
Write-Host "1. HTTP Server (Recommended - avoids CORS issues)" -ForegroundColor White
Write-Host "2. Direct file opening (may have CORS issues)" -ForegroundColor White
Write-Host ""

if ($pythonAvailable) {
    $choice = Read-Host "Enter your choice (1 or 2, default: 1)"
    if ($choice -eq "" -or $choice -eq "1") {
        Write-Host ""
        Write-Host "🌐 Starting HTTP server..." -ForegroundColor Green
        Write-Host "📡 Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "📋 Make sure your backend is running at: http://127.0.0.1:8000" -ForegroundColor Cyan
        Write-Host "⏹️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        python serve.py
    } else {
        Write-Host ""
        Write-Host "📂 Opening frontend directly in browser..." -ForegroundColor Yellow
        Start-Process "index.html"
        Write-Host ""
        Write-Host "✅ Frontend opened!" -ForegroundColor Green
        Write-Host "⚠️  If you see CORS errors, restart and choose option 1" -ForegroundColor Yellow
        Write-Host "📋 Make sure your backend is running at: http://127.0.0.1:8000" -ForegroundColor Cyan
        pause
    }
} else {
    Write-Host "📂 Opening frontend directly in browser..." -ForegroundColor Yellow
    Start-Process "index.html"
    Write-Host ""
    Write-Host "✅ Frontend opened!" -ForegroundColor Green
    Write-Host "⚠️  If you see CORS errors, install Python and use the HTTP server option" -ForegroundColor Yellow
    Write-Host "📋 Make sure your backend is running at: http://127.0.0.1:8000" -ForegroundColor Cyan
    pause
}
