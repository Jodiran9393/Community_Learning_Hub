// 🌌: Drop this in. It plugs into what you already built: your auditAndNormalizeGraphData(...) creates missing placeholders (node.__missing = true), and now clicking them opens a loud “Data Quality” panel.
// 1) Add the debug panel builder (DOM overlay + SQL generator)

function createDQDebugPanel({ topics, rawLinks, prereqMap }) {
    // Build quick indexes
    const topicsById = new Map((topics || []).map(t => [t.id, t]));
    const topicIds = new Set(topicsById.keys());

    const links = (rawLinks || []).map(l => ({
        id: l.id ?? null,
        from_topic: l.from_topic ?? (typeof l.source === "object" ? l.source.id : l.source),
        to_topic: l.to_topic ?? (typeof l.target === "object" ? l.target.id : l.target),
        relationship_type: l.relationship_type ?? l.type ?? "related",
        strength: (Number.isFinite(l.strength) ? l.strength : (Number.isFinite(l.value) ? l.value : null))
    })).filter(l => l.from_topic && l.to_topic);

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
            // fallback
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
          Referenced by <b>${refs.length}</b> relationship(s). Click “Copy SQL” to grab the fix bundle.
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
        const type = r.relationship_type;
        const strength = (r.strength == null ? "—" : r.strength);
        return `
      <div style="display:flex;gap:8px;align-items:center;margin:6px 0;">
        <span style="font-family:ui-monospace,Menlo,Consolas,monospace;color:#fff;">
          ${escapeHtml(r.from_topic)} → ${escapeHtml(r.to_topic)}
        </span>
        <span style="opacity:.85;">(${escapeHtml(type)}, strength=${escapeHtml(strength)})</span>
      </div>
    `;
    }

    return { openMissing, close: () => (root.style.display = "none") };
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


// 2) SQL fix bundle generator (missing topic focused, plus prereq helpers)
function buildSqlFixBundleForMissing({ missingId, refs, topicIds, prereqMap }) {
    const lines = [];

    lines.push(`-- =========================================`);
    lines.push(`-- DATA QUALITY FIX BUNDLE`);
    lines.push(`-- Missing topic id: '${missingId}'`);
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push(`-- =========================================`);
    lines.push("");

    // A) Option to create a stub topic so relationships stop being broken
    // learning_topics.name and category are NOT NULL :contentReference[oaicite:2]{index=2}
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

    // B) Delete all relationships referencing missing id
    // topic_relationships columns: from_topic, to_topic, relationship_type, strength :contentReference[oaicite:3]{index=3}
    lines.push(`-- OPTION B: If '${missingId}' is a typo / should not exist, delete all referencing relationships`);
    lines.push(`DELETE FROM topic_relationships`);
    lines.push(`WHERE from_topic = '${missingId}' OR to_topic = '${missingId}';`);
    lines.push("");

    // C) Per-row “surgical” templates (update to a corrected id)
    lines.push(`-- OPTION C: Surgical fix (if '${missingId}' should be some other ID like 'JS' vs 'JSS')`);
    lines.push(`-- Replace <CORRECT_ID> with the right learning_topics.id.`);
    lines.push(`-- (1) Fix outgoing references`);
    lines.push(`UPDATE topic_relationships SET from_topic = '<CORRECT_ID>' WHERE from_topic = '${missingId}';`);
    lines.push(`-- (2) Fix incoming references`);
    lines.push(`UPDATE topic_relationships SET to_topic   = '<CORRECT_ID>' WHERE to_topic   = '${missingId}';`);
    lines.push("");

    // D) If any referencing relationship is prerequisite, show a reminder about direction truth
    // prereq direction intended: prereq → dependent :contentReference[oaicite:4]{index=4}
    const prereqRefs = refs.filter(r => r.relationship_type === "prerequisite");
    if (prereqRefs.length) {
        lines.push(`-- NOTE: Some references are 'prerequisite'. Your intended arrow is prereq → dependent. :contentReference[oaicite:5]{index=5}`);
        lines.push(`-- Once the missing topic is fixed, re-run DQ cleanup to auto-flip any backwards prerequisite rows.`);
        lines.push("");
    }

    // E) List the exact rows observed (for quick visual matching)
    lines.push(`-- REFERENCED ROWS (for matching)`);
    for (const r of refs) {
        const strength = (r.strength == null ? "NULL" : Number(r.strength));
        lines.push(`-- (${r.from_topic} → ${r.to_topic}, type=${r.relationship_type}, strength=${strength})`);
    }

    return lines.join("\n");
}

function slugify(id) {
    return String(id)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64) || "missing-topic";
}

// 3) Wire it into your graph click handler (missing nodes open panel)

// Where you configure ForceGraph3D’s onNodeClick, do this:
// Build prereqMap from learning_topics.prerequisites (dependent -> prereqs) :contentReference[oaicite:6]{index=6}
const prereqMap = new Map(topics.map(t => [t.id, new Set((t.prerequisites || []))]));

// Create the panel once
const dqPanel = createDQDebugPanel({ topics, rawLinks, prereqMap });

// In your click handler:
graph.onNodeClick(node => {
    if (!node) return;

    // 🟣 Missing placeholder nodes open the debug panel instead of navigating
    if (node.__missing) {
        dqPanel.openMissing(node.id);
        return;
    }

    // Normal navigation behavior (your existing logic)
    if (node.id === 'CLH') return;
    const url = `/pages/${node.id.toLowerCase()}.html`;
    if (window.parent !== window) window.parent.location.href = url;
    else window.location.href = url;
});

// 1) Wire the panel with normalizedLinks
// Here’s the clean way to do it: pass the normalized/flagged links (the output of auditAndNormalizeGraphData) into the panel, build a fast lookup (by id first, then __dqRaw + relationship_type fallback), and render issue badges per row.
// When you build your graph in cleanup mode:
const { nodes: dqNodes, links: dqLinks } = auditAndNormalizeGraphData(topics, rawLinks, {
    mode: "flipAndFlag",
    createMissingPlaceholders: true,
    warnToConsole: true
});

graph.graphData({ nodes: dqNodes, links: dqLinks });

const dqPanel = createDQDebugPanelV2({
    topics,
    rawLinks,
    prereqMap,
    normalizedLinks: dqLinks   // ✅ add this
});

// 2) Update the panel signature + add a lookup index
// Change:
function createDQDebugPanelV2({ topics = [], rawLinks = [], prereqMap = new Map() }) {
    // To:
    function createDQDebugPanelV2({ topics = [], rawLinks = [], prereqMap = new Map(), normalizedLinks = [] }) {
        // Then add this near the top (after you build links):
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

        // Prefer exact match by PK, fallback to raw edge signature
        const dqById = new Map();
        const dqByRawKey = new Map(); // rawSource→rawTarget#type -> {__dqPrimary,__dqColor,__dqIssues,...}

        for (const nl of (normalizedLinks || [])) {
            const rawS = nl.__dqRaw?.source ?? nl.source;
            const rawT = nl.__dqRaw?.target ?? nl.target;
            const type = nl.relationship_type ?? nl.type ?? "related";
            const key = `${rawS}→${rawT}#${type}`;

            if (nl.id) dqById.set(nl.id, nl);
            // If duplicates exist, keep the “worst” one (has dqPrimary)
            const prev = dqByRawKey.get(key);
            if (!prev || (!prev.__dqPrimary && nl.__dqPrimary)) dqByRawKey.set(key, nl);
        }

        function getDQMetaForRow(r) {
            if (r.id && dqById.has(r.id)) return dqById.get(r.id);
            const key = `${r.from_topic}→${r.to_topic}#${r.relationship_type}`;
            return dqByRawKey.get(key) || null;
        }

        function renderIssueBadges(meta) {
            if (!meta?.__dqPrimary) return "";

            const issues = Array.isArray(meta.__dqIssues) && meta.__dqIssues.length
                ? meta.__dqIssues
                : [meta.__dqPrimary];

            return issues.map(issue => {
                const bg = DQ_COLORS[issue] || meta.__dqColor || "rgba(255,255,255,0.18)";
                return `
      <span style="
        background:${bg};
        color:#14001f;
        padding:3px 8px;
        border-radius:999px;
        font-size:10px;
        font-weight:900;
        letter-spacing:.04em;
        border:1px solid rgba(0,0,0,0.25);
      ">${issueLabel(issue)}</span>
    `;
            }).join(" ");
        }
        // 3) Inject badges into each referenced relationship row
        // In your render() function inside createDQDebugPanelV2, where you render each row, add:
        const meta = getDQMetaForRow(r);
        const badges = renderIssueBadges(meta);
        // Then include badges in the HTML (right under the relationship line or beside it). For example, modify your row header block to:
        const meta = getDQMetaForRow(r);
        const badges = renderIssueBadges(meta);

        return `
  <div style="margin-top:10px; padding:10px; border:1px solid rgba(255,255,255,0.12); border-radius:10px; background: rgba(0,0,0,0.22);">
    <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
      <div style="white-space:pre; font-size:12px; line-height:1.35; color:#fff;">
        ${escapeHtml(r.from_topic)} → ${escapeHtml(r.to_topic)}
        (${escapeHtml(r.relationship_type)}, strength: ${escapeHtml(r.strength ?? "—")})
      </div>
      <div style="margin-left:auto; display:flex; gap:6px; flex-wrap:wrap;">
        ${badges}
      </div>
    </div>

    <!-- buttons stay the same -->
    ...
  </div>
`;
// That’s it: the panel now shows exactly the same issue tags/colors as the graph’s dashed overlays, so cleanup becomes “see → click fix → copy SQL” without mental bookkeeping.
