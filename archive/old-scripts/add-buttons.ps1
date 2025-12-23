# PowerShell script to add Mark Complete buttons to all resource pages

$pages = @(
    @{File="css.html"; NodeId="CSS"; Title="CSS3"},
    @{File="js.html"; NodeId="JS"; Title="JavaScript"},
    @{File="ts.html"; NodeId="TS"; Title="TypeScript"},
    @{File="nextjs.html"; NodeId="NextJS"; Title="Next.js"},
    @{File="llm.html"; NodeId="LLM"; Title="LLMs"},
    @{File="prompting.html"; NodeId="Prompting"; Title="Prompting"},
    @{File="agents.html"; NodeId="Agents"; Title="AI Agents"},
    @{File="python.html"; NodeId="Python"; Title="Python"},
    @{File="figma.html"; NodeId="Figma"; Title="Figma"},
    @{File="ui.html"; NodeId="UI"; Title="UI/UX"},
    @{File="a11y.html"; NodeId="A11y"; Title="Accessibility"}
)

foreach ($page in $pages) {
    $file = "src\pages\$($page.File)"
    
    Write-Host "Processing $file..." -ForegroundColor Cyan
    
    $content = Get-Content $file -Raw
    
    # Add data-node-id to body tag
    $content = $content -replace '<body>', "<body data-node-id=`"$($page.NodeId)`">"
    
    # Add button before </body>
    $buttonHTML = @"

        <!-- Mark Complete Button -->
        <div style="text-align: center; margin: 60px 0 40px; padding: 40px 20px; background: rgba(76, 139, 245, 0.05); border-radius: 16px;">
            <h3 style="margin: 0 0 20px 0; color: #4c8bf5;">Finished learning $($page.Title)?</h3>
            <button id="mark-complete-btn" style="
                background: linear-gradient(90deg, #4c8bf5, #d367c1);
                color: white;
                border: none;
                padding: 16px 40px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(76, 139, 245, 0.3);
            " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 25px rgba(76, 139, 245, 0.5)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(76, 139, 245, 0.3)'">
                ✅ Mark as Complete
            </button>
            <p style="margin: 15px 0 0 0; color: #888; font-size: 14px;">This will light up $($page.Title) in your Knowledge Galaxy! 🌟</p>
        </div>
    </div>

    <!-- Load Supabase and completion tracking -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/js/supabase-client.js"></script>
    <script src="/js/mark-complete.js"></script>
</body>
"@
    
    $content = $content -replace '    </div>\s*</body>', $buttonHTML
    
    # Save
    Set-Content $file -Value $content -NoNewline
    
    Write-Host "  ✅ Done!" -ForegroundColor Green
}

Write-Host "`n✨ All pages updated with Mark Complete buttons!" -ForegroundColor Green
