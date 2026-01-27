
Write-Host "Starting Next.js Dev Server for Silk Heritage..." -ForegroundColor Magenta
Write-Host "Note: Using node executable directly to bypass folder naming issue." -ForegroundColor Yellow
$env:PORT = 3000
node "node_modules/next/dist/bin/next" dev
