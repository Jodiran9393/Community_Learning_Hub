# Deploy Skill Constellation System to VPS
# Run this from the CLH directory

$VPS_IP = "147.93.119.3"
$VPS_PATH = "/var/www/community-learning-hub"

Write-Host "`n🚀 Deploying Skill Constellation System..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Files to deploy
$files = @(
    # New constellation files
    "Community Learning Hub Blog Layout\galaxy-live.html",
    "Community Learning Hub Blog Layout\demo-constellation.html",
    "Community Learning Hub Blog Layout\test-constellation.html",
    "Community Learning Hub Blog Layout\skill-constellation-schema.sql",
    "Community Learning Hub Blog Layout\CONSTELLATION_SETUP.md",
    "Community Learning Hub Blog Layout\INTEGRATION_GUIDE.md",
    
    # Updated main files
    "Community Learning Hub Blog Layout\index.html",
    
    # New JS for mark complete
    "src\js\mark-complete.js",
    
    # All updated resource pages
    "src\pages\react.html",
    "src\pages\html.html",
    "src\pages\css.html",
    "src\pages\js.html",
    "src\pages\ts.html",
    "src\pages\nextjs.html",
    "src\pages\llm.html",
    "src\pages\prompting.html",
    "src\pages\agents.html",
    "src\pages\python.html",
    "src\pages\figma.html",
    "src\pages\ui.html",
    "src\pages\a11y.html"
)

Write-Host "`n📦 Files to upload:" -ForegroundColor Yellow
foreach ($file in $files) {
    Write-Host "   - $file" -ForegroundColor Gray
}

Write-Host "`n⚠️  About to upload to: root@$VPS_IP`:$VPS_PATH" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit
}

Write-Host "`n📤 Uploading files..." -ForegroundColor Cyan

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Uploading: $file" -ForegroundColor Gray
        
        # Determine remote path
        $remotePath = $VPS_PATH
        if ($file -like "src\*") {
            $remotePath = "$VPS_PATH"
        }
        
        # Use SCP to upload
        scp "$file" "root@$($VPS_IP):$remotePath/" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Uploaded" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Deployment complete! ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "   1. Run the SQL schema in Supabase (if not done)" -ForegroundColor White
Write-Host "   2. Visit your site and test the galaxy" -ForegroundColor White
Write-Host "   3. Sign in and click a 'Mark Complete' button" -ForegroundColor White
Write-Host "   4. Watch your constellation light up!`n" -ForegroundColor White
