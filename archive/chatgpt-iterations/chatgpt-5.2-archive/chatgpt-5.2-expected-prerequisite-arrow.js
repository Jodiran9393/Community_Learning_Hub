// 👴: Yep — we can compute the expected prerequisite arrow straight from learning_topics.prerequisites and show it in the tooltip, so every 🔴 pill literally tells you the “correct” direction at a glance.
// 🌌: Drop this patch into createDQDebugPanelV2(...).
// 1) Add an “expected arrow” helper (prerequisites truth)
function expectedPrereqArrow(fromId, toId) {
    // prerequisites truth: dependent -> Set(prereqIds)
    const toPrereqs = prereqMap.get(toId) || new Set();
    const fromPrereqs = prereqMap.get(fromId) || new Set();

    // If B.prerequisites includes A => expected A→B
    if (toPrereqs.has(fromId)) {
        return { arrow: `${fromId}→${toId}`, reason: `${toId}.prerequisites contains ${fromId}` };
    }
    if (fromPrereqs.has(toId)) {
        return { arrow: `${toId}→${fromId}`, reason: `${fromId}.prerequisites contains ${toId}` };
    }
    return { arrow: "unknown", reason: "Not inferable from prerequisites arrays" };
}
// 2) Update the 🔴 backwards hint to include “Expected arrow”
// Replace your backwardsPrereq case in issueHint(issue, r) with:

case "backwardsPrereq": {
    const exp = expectedPrereqArrow(r.from_topic, r.to_topic);
    // In a backwards case, exp.arrow should typically be to→from, but we compute to be safe.
    return `Expected arrow: ${exp.arrow}. Fix: flip to ${r.to_topic}→${r.from_topic}. (${exp.reason})`;
}

// 3) (Optional but nice) Add expected arrow for any prerequisite conflict too
// Inside duplicateConflict, if it’s a prerequisite edge, append:

if (r.relationship_type === "prerequisite") {
  const exp = expectedPrereqArrow(r.from_topic, r.to_topic);
  return `Conflict detected. Expected arrow: ${exp.arrow}. (${exp.reason})`;
}
//4) Your pill tooltip already shows “labels + hints”
// 🔴 BACKWARDS — Expected arrow: JS→React. Fix: flip to JS→React. (React.prerequisites contains JS)
// That’s the “what’s broken AND why” accelerator you’re aiming for.
