// 👴: Auto-select safe fixes + add "Fixes selected: N" counter for instant clarity.
// 🌌: Drop this into createDQDebugPanelV2(...) to add smart defaults + counter UI.

// 1) Auto-select logic: only preselect when fix is deterministic + low-risk
function shouldAutoSelect(issue) {
    return issue === "backwardsPrereq" || issue === "invalidStrength";
    // ✅ Auto: backwardsPrereq (flip is always correct based on prerequisites truth)
    // ✅ Auto: invalidStrength (clamping 1-10 is safe)
    // ❌ Manual: selfLoop, duplicateConflict, missingTopic (need judgment)
}

// 2) Add counter state + update function (place near top of createDQDebugPanelV2)
let selectedFixes = new Set(); // Set of row keys (e.g., "rowId" or "from→to#type")

function updateFixCounter() {
    const counter = document.getElementById("dq-fix-counter");
    if (!counter) return;

    const count = selectedFixes.size;
    counter.textContent = count > 0
        ? `Fixes selected: ${count}`
        : `No fixes selected`;
    counter.style.opacity = count > 0 ? "1" : "0.5";
}

// 3) Update panel HTML to include counter (add after header, before body)
// In your root.innerHTML, add this line after the header div:
`
<div id="dq-fix-counter" style="
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(170,102,255,0.15);
  border: 1px solid rgba(170,102,255,0.3);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  opacity: 0.5;
  transition: opacity 0.2s ease;
">No fixes selected</div>
`

// 4) Update your row renderer to auto-check safe fixes
// When rendering each row with fix buttons, add this logic:
function renderRowWithFixes(r, meta) {
    const primary = meta?.__dqPrimary;
    const rowKey = `${r.from_topic}→${r.to_topic}#${r.relationship_type}`;

    // Auto-select if it's a safe fix
    const isAutoSelected = primary && shouldAutoSelect(primary);
    if (isAutoSelected) {
        selectedFixes.add(rowKey);
    }

    const checked = selectedFixes.has(rowKey) ? "checked" : "";

    // Render checkbox for this fix
    return `
    <div style="display:flex; align-items:center; gap:8px;">
      <input 
        type="checkbox" 
        ${checked}
        data-row-key="${escapeHtml(rowKey)}"
        onchange="handleFixToggle('${escapeHtml(rowKey)}')"
      />
      <span>${issueLabel(primary)}</span>
      <!-- rest of your row content -->
    </div>
  `;
}

// 5) Add toggle handler (attach to window for onclick access)
window.handleFixToggle = function (rowKey) {
    if (selectedFixes.has(rowKey)) {
        selectedFixes.delete(rowKey);
    } else {
        selectedFixes.add(rowKey);
    }
    updateFixCounter();
    updateLiveSQLPreview(); // regenerate SQL based on selected fixes
};

// 6) Call updateFixCounter() after initial render
// At the end of openMissing() or wherever you populate the panel:
updateFixCounter();

// That's it! Now:
// - 🔴 BACKWARDS and 🟡 BAD STRENGTH auto-check on load
// - Counter shows "Fixes selected: 3" in real-time
// - User can still uncheck auto-selected fixes if needed
// - SQL preview only includes checked fixes
