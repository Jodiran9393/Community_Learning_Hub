// 👴: Great call — single “primary issue” pill keeps the panel clean, and a hover tooltip gives you the full story when you need it. ✅
// 🌌: Here’s the exact patch.
// 1) Replace renderIssueBadges(meta) with a single pill + tooltip

function renderPrimaryIssuePill(meta) {
    if (!meta?.__dqPrimary) return "";

    const primary = meta.__dqPrimary;

    const issues = (Array.isArray(meta.__dqIssues) && meta.__dqIssues.length)
        ? meta.__dqIssues
        : [primary];

    // Tooltip shows *all* issues (labels), even though we render only the primary pill
    const tooltip = issues.map(issueLabel).join(" • ");

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
// 2) Use it in your row renderer
// Where you previously did:
const badges = renderIssueBadges(meta);
// Change to:
const pill = renderPrimaryIssuePill(meta);
// And replace the badges slot with:
<div style="margin-left:auto; display:flex; gap:6px; flex-wrap:wrap;">
    ${pill}
</div>
// That’s it. You’ll see one clean pill (🔴/🟠/🟡/🟣/🩷), and on hover it’ll show the full list (e.g., “🔴 BACKWARDS • 🟠 CONFLICT • 🟡 BAD STRENGTH”).

