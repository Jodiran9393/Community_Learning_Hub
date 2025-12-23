// Yes — that’s a big upgrade. The debug panel should reflect the same flags/colors you see in the galaxy, so you instantly know not just what’s referenced, but why it’s broken (and which fix button to click).
// 🌌: Here’s the clean way to do it: pass the normalized/flagged links (the output of auditAndNormalizeGraphData) into the panel, build a fast lookup (by id first, then __dqRaw + relationship_type fallback), and render issue badges per row.
// 1) Wire the panel with normalizedLinks
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
    // to:
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
