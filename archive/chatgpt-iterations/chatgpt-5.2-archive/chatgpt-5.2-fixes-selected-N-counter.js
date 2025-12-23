// 👴: Yep — here are the minimal, “surgical” changes to (1) auto-select only the risk-free fixes and (2) add a Fixes selected: N counter above the SQL preview.

// 🌌: Paste these patches inside createDQDebugPanelV2(...).

// Patch A — Auto-select recommended fixes (risk-free only)

// Add these helpers inside createDQDebugPanelV2(...) (near your other helpers like toggleFix, setFix, etc.):
function fixKey(prefix, r) {
    return `${prefix}:${r.id ?? `${r.from_topic}->${r.to_topic}#${r.relationship_type}`}`;
}

function upsertFixNoRender(key, title, sql) {
    const idx = fixes.findIndex(f => f.key === key);
    const obj = { key, title, sql };
    if (idx >= 0) fixes[idx] = obj;
    else fixes.push(obj);
}

// Auto-select only when it's genuinely low-risk:
// ✅ 🔴 Backwards prereq: only if NOT also a conflict/duplicate/missing/self-loop
// ✅ 🟡 Bad strength: only if NOT missing/self-loop
function autoSelectRecommendedFixes(refs) {
    for (const r of refs) {
        const { issues, primary } = classifyRow(r);

        // Preselect flip only when it's cleanly backwards (not conflicted)
        if (
            primary === "backwardsPrereq" &&
            !issues.includes("duplicateConflict") &&
            !issues.includes("missingTopic") &&
            !issues.includes("selfLoop")
        ) {
            upsertFixNoRender(
                fixKey("flip", r),
                "Flip backwards prerequisite",
                sqlFlipDirection(r)
            );
        }

        // Preselect clamp only when it’s purely a strength hygiene issue
        if (
            issues.includes("invalidStrength") &&
            !issues.includes("missingTopic") &&
            !issues.includes("selfLoop")
        ) {
            upsertFixNoRender(
                fixKey("clamp", r),
                "Clamp invalid strength",
                sqlClampStrength(r)
            );
        }
    }
}
// Now modify openMissing(missingId) to run auto-select once before rendering:
function openMissing(missingId) {
    currentMissingId = missingId;
    fixes = [];

    currentRefs = links
        .filter(r => r.from_topic === missingId || r.to_topic === missingId)
        .sort((a, b) => (a.relationship_type || "").localeCompare(b.relationship_type || ""));

    // ✅ NEW: auto-select risk-free recommended fixes
    autoSelectRecommendedFixes(currentRefs);

    // (keep your console warning block as-is)
    // ...

    render();
    root.style.display = "block";
}

// Patch B — Add “Fixes selected: N” counter (clean + visible)

// In your render() HTML, find the block that starts the SQL preview:
<div style="margin-top:12px; white-space:pre; font-size:12px; line-height:1.35;">
Live SQL Preview:
...
</div>

// Replace that header line with this (just adds a counter, doesn’t change your SQL):

<div style="margin-top:12px; white-space:pre; font-size:12px; line-height:1.35;">
Live SQL Preview:  (Fixes selected: ${fixes.length})
...
</div>


// That’s it: open a missing node → the panel preloads the safest fixes, and you can immediately hit 📋 Copy SQL.</div>