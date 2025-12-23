// 👴: Perfect — we’ll keep the UI clean with one “primary issue” pill, but the hover tooltip will now show labels + quick hints (what to do / what’s expected).
// 🌌: Apply this patch inside createDQDebugPanelV2(...).
// 1) Add a hint generator (uses prereqMap, topicIds, and reversePairs already in scope)
function clampStrengthVal(x) {
  const v = Number.isFinite(x) ? x : 1;
  return Math.max(1, Math.min(10, v));
}

function issueHint(issue, r) {
  switch (issue) {
    case "backwardsPrereq":
      // If it’s backwards, the “fix” is to flip
      return `Flip direction to: ${r.to_topic}→${r.from_topic}`;

    case "duplicateConflict": {
      // Try to detect reverse-pair conflict for same type
      const pk = pairKey(r.from_topic, r.to_topic, r.relationship_type);
      const rec = reversePairs.get(pk);
      if (rec?.hasAB && rec?.hasBA) {
        return `Conflicts with reverse edge: ${r.to_topic}→${r.from_topic}`;
      }
      // Otherwise it’s likely an exact duplicate
      const count = exactCounts.get(exactKey(r)) || 1;
      return count > 1 ? `Duplicate rows found (${count}). Consider deleting extras.` : `Conflicting/uncertain mapping; verify intended direction/type.`;
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
// 2) Replace your pill renderer with “labels + hints” tooltip
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
// 3) Update the call site in your row renderer
const meta = getDQMetaForRow(r);
const pill = renderPrimaryIssuePill(meta, r);
// …and keep your pill slot as:
<div style="margin-left:auto; display:flex; gap:6px; flex-wrap:wrap;">
  ${pill}
</div>
