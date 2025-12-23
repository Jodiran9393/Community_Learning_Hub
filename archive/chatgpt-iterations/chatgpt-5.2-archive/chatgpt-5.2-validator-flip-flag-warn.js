function normalizePrerequisiteDirections(topics = [], links = [], opts = {}) {
  const {
    mode = "flipAndFlag", // "flipAndFlag" | "flagOnly" | "flipOnly" | "hideInvalid"
    warnLimit = 25,
    log = (msg, meta) => console.warn(msg, meta)
  } = opts;

  // dependent -> prereqs (ground truth)
  const prereqMap = new Map();
  for (const t of topics) prereqMap.set(t.id, new Set(coercePrereqArray(t.prerequisites)));

  const getType = (l) => l.relationship_type ?? l.type ?? "related";
  const getSource = (l) => (typeof l.source === "object" ? l.source.id : l.source);
  const getTarget = (l) => (typeof l.target === "object" ? l.target.id : l.target);

  const report = { flipped: 0, unknown: 0, ambiguous: 0, ok: 0, dropped: 0, warned: 0 };
  const out = [];

  for (const l of links) {
    const type = getType(l);
    const source = getSource(l);
    const target = getTarget(l);
    if (!source || !target) continue;

    if (type !== "prerequisite") {
      out.push({ ...l, source, target });
      continue;
    }

    // If B.prerequisites includes A => arrow must be A -> B
    const targetPrereqs = prereqMap.get(target) || new Set();
    const sourcePrereqs = prereqMap.get(source) || new Set();

    const sourceIsPrereqOfTarget = targetPrereqs.has(source); // correct: source -> target
    const targetIsPrereqOfSource = sourcePrereqs.has(target); // reversed: should be target -> source

    // classify
    let state = "unknown";
    if (sourceIsPrereqOfTarget && !targetIsPrereqOfSource) state = "ok";
    else if (targetIsPrereqOfSource && !sourceIsPrereqOfTarget) state = "flipped";
    else if (sourceIsPrereqOfTarget && targetIsPrereqOfSource) state = "ambiguous";

    // apply mode
    if (state === "ok") {
      report.ok++;
      out.push({ ...l, source, target, __prereqState: "ok", __prereqFlag: false });
      continue;
    }

    const shouldDrop =
      (mode === "hideInvalid") && (state === "unknown" || state === "ambiguous");

    if (shouldDrop) {
      report.dropped++;
      continue;
    }

    const shouldFlip = (state === "flipped") && (mode === "flipAndFlag" || mode === "flipOnly");
    const shouldFlag = (state !== "ok") && (mode === "flipAndFlag" || mode === "flagOnly" || mode === "hideInvalid");

    if (state === "flipped") report.flipped++;
    if (state === "unknown") report.unknown++;
    if (state === "ambiguous") report.ambiguous++;

    const normalized = shouldFlip
      ? { ...l, source: target, target: source, __flippedOriginal: { source, target } }
      : { ...l, source, target };

    out.push({
      ...normalized,
      __prereqState: state,
      __prereqFlag: !!shouldFlag
    });

    if (shouldFlag && report.warned < warnLimit) {
      report.warned++;
      const hint =
        state === "flipped" ? `Flipped for viz. Fix DB row to (${target} -> ${source}).`
        : state === "ambiguous" ? "Both directions appear in prerequisites arrays (cycle/inconsistency)."
        : "Neither direction confirmed by prerequisites arrays (missing prerequisites or wrong relationship row).";

      log(`[PrereqEdge:${state}] ${source} -> ${target}`, {
        relationship_type: "prerequisite",
        expectedArrow: inferExpectedArrow(source, target, prereqMap),
        hint
      });
    }
  }

  log("Prerequisite validation summary", report);
  return { normalizedLinks: out, report };
}

function inferExpectedArrow(source, target, prereqMap) {
  const tP = prereqMap.get(target) || new Set();
  const sP = prereqMap.get(source) || new Set();
  if (tP.has(source)) return `${source} → ${target}`;
  if (sP.has(target)) return `${target} → ${source}`;
  return "unknown";
}

function coercePrereqArray(x) {
  if (Array.isArray(x)) return x.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof x === "string") {
    const raw = x.trim().replace(/^\{|\}$/g, "");
    if (!raw) return [];
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}
