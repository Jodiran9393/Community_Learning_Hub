# Deploy resource pages with Mark Complete buttons to VPS
# Run this from the CLH directory

$VPS_IP = "147.93.119.3"
$VPS_PATH = "/var/www/community-learning-hub/pages"

Write-Host "`n🚀 Deploying Resource Pages..." -ForegroundColor Cyan

# All 13 resource pages
$pages = @(
    "react.html",
    "html.html",
    "css.html",
    "js.html",
    "ts.html",
    "nextjs.html",
    "llm.html",
    "prompting.html",
    "agents.html",
    "python.html",
    "figma.html",
    "ui.html",
    "a11y.html"
)

Write-Host "`n📦 Files to upload:" -ForegroundColor Yellow
foreach ($page in $pages) {
    Write-Host "   - $page" -ForegroundColor Gray
}

Write-Host "`n⚠️  About to upload to: root@$VPS_IP`:$VPS_PATH" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne 'yes') {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit
}

Write-Host "`n📤 Uploading files..." -ForegroundColor Cyan

# Also need to upload mark-complete.js
Write-Host "Uploading mark-complete.js..." -ForegroundColor Gray
scp "src\js\mark-complete.js" "root@$($VPS_IP):/var/www/community-learning-hub/js/"

foreach ($page in $pages) {
    $localFile = "src\pages\$page"
    
    if (Test-Path $localFile) {
        Write-Host "Uploading: $page" -ForegroundColor Gray
        scp $localFile "root@$($VPS_IP):$VPS_PATH/"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Uploaded" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  File not found: $localFile" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Visit a resource page: https://infolearninghub.com/pages/react.html" -ForegroundColor White
Write-Host "   2. Scroll to bottom and click 'Mark as Complete'" -ForegroundColor White
Write-Host "   3. Go to homepage - React node should glow GREEN! 🌟`n" -ForegroundColor White
