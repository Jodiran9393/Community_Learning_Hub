/**
 * Make prerequisite arrows resilient to data-entry errors by validating against:
 * learning_topics.prerequisites (array of topic IDs that the topic DEPENDS ON).
 *
 * Rule (source of truth):
 * If topic B lists A in B.prerequisites, then the arrow MUST be A -> B.
 *
 * Returns:
 *  - normalizedLinks: links safe to visualize
 *  - report: counts + diagnostics you can log or surface in dev UI
 */
function normalizePrerequisiteDirections(topics = [], links = [], opts = {}) {
    const {
        // If neither direction matches prerequisites arrays, keep original but flag it.
        keepUnknown = true,
        // If both directions match (cycle/inconsistent prerequisites arrays), keep original but flag it.
        keepAmbiguous = true,
        // Merge duplicates created by flipping (choose max strength by default).
        mergeStrategy = "maxStrength",
        // Optional logger hook (console.warn by default)
        log = (msg, meta) => console.warn(msg, meta)
    } = opts;

    // Build dependent -> prereqs set map from learning_topics.prerequisites
    const prereqMap = new Map();
    for (const t of topics) {
        prereqMap.set(t.id, new Set(coercePrereqArray(t.prerequisites)));
    }

    // Helpers to read link fields robustly
    const getType = (l) => l.relationship_type ?? l.type ?? l.relationshipType ?? "related";
    const getStrength = (l) => Number.isFinite(l.strength) ? l.strength : (Number.isFinite(l.value) ? l.value : 1);
    const getSource = (l) => (typeof l.source === "object" ? l.source.id : l.source);
    const getTarget = (l) => (typeof l.target === "object" ? l.target.id : l.target);

    const report = {
        total: links.length,
        prerequisiteTotal: 0,
        flipped: 0,
        ok: 0,
        ambiguous: 0,
        unknown: 0,
        dropped: 0,
        examples: { flipped: [], ambiguous: [], unknown: [] }
    };

    // Normalize + maybe flip
    const normalized = [];
    for (const l of links) {
        const type = getType(l);
        const source = getSource(l);
        const target = getTarget(l);

        if (!source || !target) continue;

        if (type !== "prerequisite") {
            normalized.push({ ...l, source, target });
            continue;
        }

        report.prerequisiteTotal++;

        // Meaning of prerequisites array:
        // prereqMap.get(DEPENDENT) contains all PREREQS required first.
        const targetPrereqs = prereqMap.get(target) || new Set();
        const sourcePrereqs = prereqMap.get(source) || new Set();

        const sourceIsPrereqOfTarget = targetPrereqs.has(source); // correct orientation: source -> target
        const targetIsPrereqOfSource = sourcePrereqs.has(target); // reversed orientation: should be target -> source

        if (sourceIsPrereqOfTarget && !targetIsPrereqOfSource) {
            // OK as-is
            report.ok++;
            normalized.push({ ...l, source, target });
            continue;
        }

        if (targetIsPrereqOfSource && !sourceIsPrereqOfTarget) {
            // Backwards: flip for visualization
            report.flipped++;
            if (report.examples.flipped.length < 8) report.examples.flipped.push({ from: source, to: target });
            normalized.push({ ...l, source: target, target: source, __flipped: true });
            continue;
        }

        if (sourceIsPrereqOfTarget && targetIsPrereqOfSource) {
            // Ambiguous: both claim each other as prereq (cycle or bad prerequisites arrays)
            report.ambiguous++;
            if (report.examples.ambiguous.length < 8) report.examples.ambiguous.push({ a: source, b: target });
            if (keepAmbiguous) normalized.push({ ...l, source, target, __ambiguous: true });
            else report.dropped++;
            continue;
        }

        // Unknown: prerequisites arrays don’t confirm either direction.
        // Could be: prerequisites not filled, or relationship is informative but not in prerequisites array.
        report.unknown++;
        if (report.examples.unknown.length < 8) report.examples.unknown.push({ from: source, to: target });
        if (keepUnknown) normalized.push({ ...l, source, target, __unknown: true });
        else report.dropped++;
    }

    // De-duplicate links (flipping can create duplicates)
    const deduped = dedupeLinks(normalized, { mergeStrategy, getType, getStrength });

    // Optional: log a concise diagnostic (useful during rollout)
    if (report.flipped || report.ambiguous || report.unknown) {
        log("Prerequisite direction validator report", report);
    }

    return { normalizedLinks: deduped, report };
}

function coercePrereqArray(x) {
    // Handles: ['JS','React'] OR Postgres text[] string like '{JS,React}'
    if (Array.isArray(x)) return x.map(s => String(s).trim()).filter(Boolean);
    if (typeof x === "string") {
        const raw = x.trim().replace(/^\{|\}$/g, "");
        if (!raw) return [];
        return raw.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
}

function dedupeLinks(links, { mergeStrategy, getType, getStrength }) {
    const keyOf = (l) => `${l.source}→${l.target}#${getType(l)}`;
    const map = new Map();

    for (const l of links) {
        const k = keyOf(l);
        if (!map.has(k)) {
            map.set(k, l);
            continue;
        }
        const prev = map.get(k);
        if (mergeStrategy === "maxStrength") {
            map.set(k, getStrength(l) >= getStrength(prev) ? l : prev);
        } else if (mergeStrategy === "minStrength") {
            map.set(k, getStrength(l) <= getStrength(prev) ? l : prev);
        } else {
            // default: keep first
            map.set(k, prev);
        }
    }
    return [...map.values()];
}
