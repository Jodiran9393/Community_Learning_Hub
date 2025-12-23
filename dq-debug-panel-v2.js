/**
 * DQ Debug Panel V2
 * 
 * Consolidated from:
 * - chatgpt-5.2-debug panel builder.js (base)
 * + chatgpt-5.2-normalized-flagged-links.js (patch 1: normalizedLinks integration)
 * + chatgpt-5.2-single-pill-tooltip.js (patch 2: single primary pill)
 * + chatgpt-5.2-add-hint-generator.js (patch 3: plain-English hints)
 * + chatgpt-5.2-expected-prerequisite-arrow.js (patch 4: expected arrow for 🔴)
 * + chatgpt-5.2-smart-autoselect-counter.js (patch 5: auto-select + counter)
 * 
 * Interactive debug panel for data quality issues. Click missing topic placeholders
 * to open panel showing referenced relationships + SQL fix generation.
 */

// ============================================
// Constants
// ============================================

const DQ_COLORS = {
    backwardsPrereq: "#ff3333",     // 🔴
    duplicateConflict: "#ff9933",   // 🟠
    invalidStrength: "#ffee33",     // 🟡
    missingTopic: "#aa66ff",        // 🟣
    selfLoop: "#ff77cc"             // 🩷
};

function issueLabel(issue) {
    return ({
        backwardsPrereq: "🔴 BACKWARDS",
        duplicateConflict: "🟠 CONFLICT",
        invalidStrength: "🟡 BAD STRENGTH",
        missingTopic: "🟣 MISSING",
        selfLoop: "🩷 SELF-LOOP"
    })[issue] || "⚠️ ISSUE";
}

// ============================================
// Create Debug Panel V2
// ===========================================

/**
 * Create the DQ debug panel with all enhancements
 * @param {Object} params
 * @param {Array} params.topics - All learning topics
 * @param {Array} params.rawLinks - Raw relationships from DB
 * @param {Map} params.prereqMap - dependent → Set(prereqIds) map
 * @param {Array} params.normalizedLinks - Flagged links from auditAndNormalizeGraphData
 * @returns {Object} Panel controller with openMissing() method
 */
function createDQDebugPanelV2({ topics = [], rawLinks = [], prereqMap = new Map(), normalizedLinks = [] }) {
    // Build quick indexes
    const topicsById = new Map(topics.map(t => [t.id, t]));
    const topicIds = new Set(topicsById.keys());

    const links = rawLinks.map(l => ({
        id: l.id ?? null,
        from_topic: l.from_topic ?? (typeof l.source === "object" ? l.source.id : l.source),
        to_topic: l.to_topic ?? (typeof l.target === "object" ? l.target.id : l.target),
        relationship_type: l.relationship_type ?? l.type ?? "related",
        strength: (Number.isFinite(l.strength) ? l.strength : (Number.isFinite(l.value) ? l.value : null))
    })).filter(l => l.from_topic && l.to_topic);

    // PATCH 1: Build normalized link lookup for badge metadata
    const dqById = new Map();
    const dqByRawKey = new Map();

    for (const nl of normalizedLinks) {
        const rawS = nl.__dqRaw?.source ?? nl.source;
        const rawT = nl.__dqRaw?.target ?? nl.target;
        const type = nl.relationship_type ?? nl.type ?? "related";
        const key = `${rawS}→${rawT}#${type}`;

        if (nl.id) dqById.set(nl.id, nl);
        const prev = dqByRawKey.get(key);
        if (!prev || (!prev.__dqPrimary && nl.__dqPrimary)) dqByRawKey.set(key, nl);
    }

    function getDQMetaForRow(r) {
        if (r.id && dqById.has(r.id)) return dqById.get(r.id);
        const key = `${r.from_topic}→${r.to_topic}#${r.relationship_type}`;
        return dqByRawKey.get(key) || null;
    }

    // PATCH 3: Plain-English hint generator
    function clampStrengthVal(x) {
        const v = Number.isFinite(x) ? x : 1;
        return Math.max(1, Math.min(10, v));
    }

    // PATCH 4: Expected arrow computation
    function expectedPrereqArrow(fromId, toId) {
        const toPrereqs = prereqMap.get(toId) || new Set();
        const fromPrereqs = prereqMap.get(fromId) || new Set();

        if (toPrereqs.has(fromId)) {
            return { arrow: `${fromId}→${toId}`, reason: `${toId}.prerequisites contains ${fromId}` };
        }
        if (fromPrereqs.has(toId)) {
            return { arrow: `${toId}→${fromId}`, reason: `${fromId}.prerequisites contains ${toId}` };
        }
        return { arrow: "unknown", reason: "Not inferable from prerequisites arrays" };
    }

    function issueHint(issue, r) {
        switch (issue) {
            case "backwardsPrereq": {
                // PATCH 4: Include expected arrow
                const exp = expectedPrereqArrow(r.from_topic, r.to_topic);
                return `Expected arrow: ${exp.arrow}. Fix: flip to ${r.to_topic}→${r.from_topic}. (${exp.reason})`;
            }

            case "duplicateConflict": {
                if (r.relationship_type === "prerequisite") {
                    // PATCH 4: Show expected arrow for prerequisite conflicts
                    const exp = expectedPrereqArrow(r.from_topic, r.to_topic);
                    return `Conflict detected. Expected arrow: ${exp.arrow}. (${exp.reason})`;
                }
                return `Conflicting/uncertain mapping; verify intended direction/type.`;
            }

            case "invalidStrength":
                return `Clamp strength to 1–10 (suggest: ${clampStrengthVal(r.strength)}).`;

            case "missingTopic": {
                const missFrom = !topicIds.has(r.from_topic);
                const missTo = !topicIds.has(r.to_topic);
                if (missFrom && missTo) return `Both endpoints missing. Create topics or delete row.`;
                if (missFrom) return `Missing from_topic: '${r.from_topic}'. Create it or replace with correct ID.`;
                if (missTo) return `Missing to_topic: '${r.to_topic}'. Create it or replace with correct ID.`;
                return `Missing topic reference detected.`;
            }

            case "selfLoop":
                return `from_topic === to_topic. Replace with correct target or delete row.`;

            default:
                return `Review and fix this row.`;
        }
    }

    // PATCH 2 + 3: Single pill with enhanced tooltips
    function renderPrimaryIssuePill(meta, r) {
        if (!meta?.__dqPrimary) return "";

        const primary = meta.__dqPrimary;
        const issues = (Array.isArray(meta.__dqIssues) && meta.__dqIssues.length)
            ? meta.__dqIssues
            : [primary];

        // Tooltip shows labels + hints for ALL issues
        const tooltip = issues
            .map(issue => `${issueLabel(issue)} — ${issueHint(issue, r)}`)
            .join(" • ");

        const bg = DQ_COLORS[primary] || meta.__dqColor || "rgba(255,255,255,0.18)";

        return `
            <span
                title="${escapeHtml(tooltip)}"
                style="
                    background:${bg};
                    color:#14001f;
                    padding:3px 10px;
                    border-radius:999px;
                    font-size:10px;
                    font-weight:900;
                    letter-spacing:.04em;
                    border:1px solid rgba(0,0,0,0.25);
                    cursor: help;
                    user-select:none;
                "
            >${issueLabel(primary)}</span>
        `;
    }

    // Create DOM panel
    const root = document.createElement("div");
    root.id = "dq-panel";
    root.style.cssText = `
        position: fixed; top: 16px; right: 16px; z-index: 99999;
        width: min(560px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        overflow: auto;
        background: rgba(10, 0, 20, 0.88);
        border: 2px solid rgba(170,102,255,0.85);
        border-radius: 12px;
        padding: 14px;
        box-shadow: 0 10px 35px rgba(0,0,0,0.55);
        color: #efe7ff;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        display: none;
    `;

    root.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-weight:800;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#d8c2ff;">
                ⚠️ Data Quality Debug
            </div>
            <div style="margin-left:auto;display:flex;gap:8px;">
                <button data-act="copy" style="${btnCss()}">Copy SQL</button>
                <button data-act="close" style="${btnCss('rgba(255,255,255,0.10)')}">Close</button>
            </div>
        </div>
        <div data-slot="body" style="margin-top:12px;"></div>
    `;

    document.body.appendChild(root);

    const body = root.querySelector('[data-slot="body"]');
    const btnClose = root.querySelector('[data-act="close"]');
    const btnCopy = root.querySelector('[data-act="copy"]');

    let currentSql = "";

    btnClose.addEventListener("click", () => { root.style.display = "none"; });
    btnCopy.addEventListener("click", async () => {
        if (!currentSql) return;
        try {
            await navigator.clipboard.writeText(currentSql);
            btnCopy.textContent = "Copied ✅";
            setTimeout(() => btnCopy.textContent = "Copy SQL", 1200);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = currentSql;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
            btnCopy.textContent = "Copied ✅";
            setTimeout(() => btnCopy.textContent = "Copy SQL", 1200);
        }
    });

    function openMissing(missingId) {
        // Find every relationship that references this missing topic id
        const refs = links.filter(l => l.from_topic === missingId || l.to_topic === missingId);

        const sql = buildSqlFixBundleForMissing({
            missingId,
            refs,
            topicIds,
            prereqMap
        });

        currentSql = sql;

        body.innerHTML = `
            <div style="font-size:13px;line-height:1.35;">
                <div style="font-weight:800;font-size:16px;color:#ffffff;">
                    🟣 MISSING: <span style="color:#c9a7ff;">${escapeHtml(missingId)}</span>
                </div>
                <div style="opacity:.9;margin-top:6px;">
                    Referenced by <b>${refs.length}</b> relationship(s). Click "Copy SQL" to grab the fix bundle.
                </div>
                
                <div style="margin-top:10px;padding:10px;border:1px solid rgba(170,102,255,0.35);border-radius:10px;background:rgba(0,0,0,0.22);">
                    <div style="font-weight:700;margin-bottom:6px;">Referenced relationships</div>
                    ${refs.length ? refs.map(renderRelRow).join("") : `<div style="opacity:.8;">No referencing rows found.</div>`}
                </div>
                
                <div style="margin-top:10px;font-weight:700;">Generated SQL fixes</div>
                <pre style="
                    white-space: pre-wrap;
                    margin-top:6px;
                    padding:10px;
                    border-radius:10px;
                    background: rgba(0,0,0,0.35);
                    border: 1px solid rgba(255,255,255,0.16);
                    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                    font-size: 12px;
                    line-height: 1.35;
                    color: #f4ecff;
                ">${escapeHtml(sql)}</pre>
            </div>
        `;

        root.style.display = "block";
    }

    function renderRelRow(r) {
        const meta = getDQMetaForRow(r);
        const pill = renderPrimaryIssuePill(meta, r);
        const type = r.relationship_type;
        const strength = (r.strength == null ? "—" : r.strength);

        return `
            <div style="margin-top:10px; padding:10px; border:1px solid rgba(255,255,255,0.12); border-radius:10px; background: rgba(0,0,0,0.22);">
                <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
                    <div style="white-space:pre; font-size:12px; line-height:1.35; color:#fff;">
                        ${escapeHtml(r.from_topic)} → ${escapeHtml(r.to_topic)}
                        (${escapeHtml(type)}, strength: ${escapeHtml(strength)})
                    </div>
                    <div style="margin-left:auto; display:flex; gap:6px; flex-wrap:wrap;">
                        ${pill}
                    </div>
                </div>
            </div>
        `;
    }

    return { openMissing, close: () => (root.style.display = "none") };
}

// ============================================
// SQL Fix Bundle Generator
// ============================================

function buildSqlFixBundleForMissing({ missingId, refs, topicIds, prereqMap }) {
    const lines = [];

    lines.push(`-- =========================================`);
    lines.push(`-- DATA QUALITY FIX BUNDLE`);
    lines.push(`-- Missing topic id: '${missingId}'`);
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push(`-- =========================================`);
    lines.push("");

    // A) Create stub topic
    lines.push(`-- OPTION A: Create a stub learning_topics row (quickest if this id is legit)`);
    lines.push(`-- NOTE: Replace name/category/slug/description later.`);
    lines.push(`INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, description, icon_emoji, color_hex, node_size, resource_page_url, external_url, is_published, created_at, updated_at)`);
    lines.push(`VALUES (`);
    lines.push(`  '${missingId}',`);
    lines.push(`  'TODO: ${missingId}',`);
    lines.push(`  '${slugify(missingId)}',`);
    lines.push(`  'misc',`);
    lines.push(`  1,`);
    lines.push(`  0.00,`);
    lines.push(`  '{}',`);
    lines.push(`  'AUTO-STUB: created during DQ cleanup.',`);
    lines.push(`  '🟣',`);
    lines.push(`  '#aa66ff',`);
    lines.push(`  40,`);
    lines.push(`  NULL,`);
    lines.push(`  NULL,`);
    lines.push(`  false,`);
    lines.push(`  NOW(),`);
    lines.push(`  NOW()`);
    lines.push(`)`);
    lines.push(`ON CONFLICT (id) DO NOTHING;`);
    lines.push("");

    // B) Delete all relationships
    lines.push(`-- OPTION B: If '${missingId}' is a typo / should not exist, delete all referencing relationships`);
    lines.push(`DELETE FROM topic_relationships`);
    lines.push(`WHERE from_topic = '${missingId}' OR to_topic = '${missingId}';`);
    lines.push("");

    // C) Surgical fix
    lines.push(`-- OPTION C: Surgical fix (if '${missingId}' should be some other ID like 'JS' vs 'JSS')`);
    lines.push(`-- Replace <CORRECT_ID> with the right learning_topics.id.`);
    lines.push(`-- (1) Fix outgoing references`);
    lines.push(`UPDATE topic_relationships SET from_topic = '<CORRECT_ID>' WHERE from_topic = '${missingId}';`);
    lines.push(`-- (2) Fix incoming references`);
    lines.push(`UPDATE topic_relationships SET to_topic   = '<CORRECT_ID>' WHERE to_topic   = '${missingId}';`);
    lines.push("");

    // D) Prerequisite warning
    const prereqRefs = refs.filter(r => r.relationship_type === "prerequisite");
    if (prereqRefs.length) {
        lines.push(`-- NOTE: Some references are 'prerequisite'. Your intended arrow is prereq → dependent.`);
        lines.push(`-- Once the missing topic is fixed, re-run DQ cleanup to auto-flip any backwards prerequisite rows.`);
        lines.push("");
    }

    // E) List referenced rows
    lines.push(`-- REFERENCED ROWS (for matching)`);
    for (const r of refs) {
        const strength = (r.strength == null ? "NULL" : Number(r.strength));
        lines.push(`-- (${r.from_topic} → ${r.to_topic}, type=${r.relationship_type}, strength=${strength})`);
    }

    return lines.join("\n");
}

// ============================================
// Helper Functions
// ============================================

function slugify(id) {
    return String(id)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64) || "missing-topic";
}

function btnCss(bg = "rgba(170,102,255,0.25)") {
    return `
        cursor:pointer;
        border: 1px solid rgba(255,255,255,0.22);
        background: ${bg};
        color: #fff;
        padding: 8px 10px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 12px;
    `;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createDQDebugPanelV2,
        DQ_COLORS,
        issueLabel
    };
}
