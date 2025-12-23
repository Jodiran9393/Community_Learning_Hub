# Copy updated resource pages to Blog Layout folder for Git deployment

Write-Host "`n📋 Copying resource pages..." -ForegroundColor Cyan

# Create pages directory if it doesn't exist
$destDir = "Community Learning Hub Blog Layout\pages"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
    Write-Host "✅ Created pages directory" -ForegroundColor Green
}

# Copy all 13 pages
$pages = @(
    "react.html", "html.html", "css.html", "js.html", "ts.html",
    "nextjs.html", "llm.html", "prompting.html", "agents.html",
    "python.html", "figma.html", "ui.html", "a11y.html"
)

foreach ($page in $pages) {
    $source = "src\pages\$page"
    $dest = "$destDir\$page"
    
    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "✅ Copied $page" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $page" -ForegroundColor Yellow
    }
}

# Also copy mark-complete.js
Copy-Item "src\js\mark-complete.js" "Community Learning Hub Blog Layout\js\mark-complete.js" -Force
Write-Host "✅ Copied mark-complete.js" -ForegroundColor Green

Write-Host ""
Write-Host "=== Files copied! ===" -ForegroundColor Cyan
Write-Host "Now commit and push with Git" -ForegroundColor White
Write-Host ""
