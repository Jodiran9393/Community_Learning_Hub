// Paste this in as a drop-in “cleanup-mode layer.” It:

// auto-flips backwards prerequisites for correct arrows (flipAndFlag),

// flags all issues with colored dashed overlays,

// prints your requested console summary format,

// optionally creates placeholder nodes for missing-topic links so you can actually see purple issues.
// 1) Data Quality Audit + Normalize (flipAndFlag → flipOnly later)

const DQ = {
    colors: {
        backwardsPrereq: "#ff3333", // 🔴
        duplicateConflict: "#ff9933", // 🟠
        invalidStrength: "#ffee33", // 🟡
        missingTopic: "#aa66ff", // 🟣
        selfLoop: "#ff77cc" // 🩷
    },
    dash: { dashSize: 10, gapSize: 7 },
    maxExamples: 8
};

/**
 * Cleanup-mode link audit + normalization.
 *
 * Uses learning_topics.prerequisites (dependent -> prereqs) as truth for prerequisite direction.
 * Strength validity is checked against 1–10. :contentReference[oaicite:2]{index=2}
 *
 * mode:
 *  - "flipAndFlag" (cleanup): flip backwards prerequisites for correct viz + show flags
 *  - "flipOnly" (post-clean): flip quietly, no flags
 *  - "hideInvalid" (post-clean strict): drop invalid links
 */
function auditAndNormalizeGraphData(topics = [], rawLinks = [], opts = {}) {
    const {
        mode = "flipAndFlag",
        createMissingPlaceholders = true,
        warnToConsole = true
    } = opts;

    const topicsById = new Map(topics.map(t => [t.id, t]));
    const topicIds = new Set(topicsById.keys());

    // prereq truth map: dependent -> Set(prereqIds) :contentReference[oaicite:3]{index=3}
    const prereqMap = new Map();
    for (const t of topics) prereqMap.set(t.id, new Set(coercePrereqArray(t.prerequisites)));

    const links = rawLinks.map(l => ({
        ...l,
        source: (typeof l.source === "object" ? l.source.id : l.source ?? l.from_topic),
        target: (typeof l.target === "object" ? l.target.id : l.target ?? l.to_topic),
        relationship_type: l.relationship_type ?? l.type ?? "related"
    }));

    // ---- Duplicate detection helpers
    const exactKey = (l) => `${l.source}→${l.target}#${l.relationship_type}`;
    const exactCounts = new Map();
    for (const l of links) exactCounts.set(exactKey(l), (exactCounts.get(exactKey(l)) || 0) + 1);

    // Reverse-pair conflict for prerequisite: A→B and B→A both exist
    const prereqPairKey = (a, b) => {
        const lo = a < b ? a : b;
        const hi = a < b ? b : a;
        return `${lo}↔${hi}#prerequisite`;
    };
    const prereqPairs = new Map(); // key -> { hasAB, hasBA }
    for (const l of links) {
        if (l.relationship_type !== "prerequisite") continue;
        const k = prereqPairKey(l.source, l.target);
        const rec = prereqPairs.get(k) || { a: null, b: null, hasAB: false, hasBA: false };
        // store canonical ordering for checking
        const lo = l.source < l.target ? l.source : l.target;
        const hi = l.source < l.target ? l.target : l.source;
        rec.a = lo; rec.b = hi;
        if (l.source === lo && l.target === hi) rec.hasAB = true;
        if (l.source === hi && l.target === lo) rec.hasBA = true;
        prereqPairs.set(k, rec);
    }

    const report = {
        red: 0, orange: 0, yellow: 0, purple: 0, pink: 0,
        examples: { red: [], orange: [], yellow: [], purple: [], pink: [] }
    };

    // Missing topic placeholders (so purple dashed links can be visible)
    const placeholderNodes = new Map();
    const ensurePlaceholder = (id) => {
        if (!createMissingPlaceholders || topicIds.has(id)) return;
        if (placeholderNodes.has(id)) return;
        placeholderNodes.set(id, {
            id,
            name: `MISSING: ${id}`,
            category: "missing",
            status: "missing",
            color_hex: DQ.colors.missingTopic,
            node_size: 28,
            __missing: true
        });
    };

    // Track “first seen” to flag only duplicates beyond the first instance
    const seenExact = new Set();

    // ---- Audit + normalize
    const normalizedLinks = [];

    for (const l of links) {
        if (!l.source || !l.target) continue;

        const issues = [];

        // 🟣 Missing topics
        const missingSource = !topicIds.has(l.source);
        const missingTarget = !topicIds.has(l.target);
        if (missingSource || missingTarget) {
            issues.push("missingTopic");
            ensurePlaceholder(l.source);
            ensurePlaceholder(l.target);
        }

        // 🩷 Self-loop
        if (l.source === l.target) issues.push("selfLoop");

        // 🟡 Strength out-of-range (1–10 expected) :contentReference[oaicite:4]{index=4}
        const strength = Number.isFinite(l.strength) ? l.strength : Number.isFinite(l.value) ? l.value : null;
        if (strength != null && (!Number.isFinite(strength) || strength < 1 || strength > 10)) {
            issues.push("invalidStrength");
        }

        // 🔴 Backwards prerequisite (based on prerequisites arrays)
        let vizSource = l.source;
        let vizTarget = l.target;

        if (l.relationship_type === "prerequisite") {
            const targetPrereqs = prereqMap.get(l.target) || new Set();
            const sourcePrereqs = prereqMap.get(l.source) || new Set();

            const sourceIsPrereqOfTarget = targetPrereqs.has(l.source); // correct: source -> target
            const targetIsPrereqOfSource = sourcePrereqs.has(l.target); // reversed: should be target -> source

            if (targetIsPrereqOfSource && !sourceIsPrereqOfTarget) {
                issues.push("backwardsPrereq");
                if (mode === "flipAndFlag" || mode === "flipOnly") {
                    vizSource = l.target;
                    vizTarget = l.source;
                }
            } else if (!sourceIsPrereqOfTarget && !targetIsPrereqOfSource) {
                // Not confirmable from prerequisites arrays → treat as 🟠 conflict during cleanup
                issues.push("duplicateConflict");
            }
        }

        // 🟠 Duplicate/conflicting relationships
        const k = exactKey(l);
        if (exactCounts.get(k) > 1) {
            if (seenExact.has(k)) issues.push("duplicateConflict"); // only flag duplicates beyond first
            else seenExact.add(k);
        }

        if (l.relationship_type === "prerequisite") {
            const pk = prereqPairKey(l.source, l.target);
            const rec = prereqPairs.get(pk);
            if (rec?.hasAB && rec?.hasBA) {
                issues.push("duplicateConflict"); // reverse-pair conflict
            }
        }

        // Optionally drop invalid links after cleanup
        if (mode === "hideInvalid" && issues.length) continue;

        // Choose ONE primary flag color (deterministic precedence)
        const primary = pickPrimaryIssue(issues);
        if (primary) tallyIssue(primary, l, vizSource, vizTarget, prereqMap, report);

        normalizedLinks.push({
            ...l,
            source: vizSource,
            target: vizTarget,
            __dqIssues: issues,
            __dqPrimary: primary,                // one of keys above
            __dqColor: primary ? DQ.colors[primary] : null,
            __dqRaw: { source: l.source, target: l.target } // for logging/debug
        });
    }

    const mergedNodes = createMissingPlaceholders
        ? [...topics, ...placeholderNodes.values()]
        : topics;

    if (warnToConsole && (report.red + report.orange + report.yellow + report.purple + report.pink) > 0) {
        console.warn(formatDQSummary(report));
    }

    return { nodes: mergedNodes, links: normalizedLinks, report };
}

function pickPrimaryIssue(issues) {
    if (!issues || !issues.length) return null;
    // precedence (so it’s visually consistent):
    // 🟣 missing > 🩷 self-loop > 🔴 backwards prereq > 🟠 conflict/duplicate > 🟡 strength
    if (issues.includes("missingTopic")) return "missingTopic";
    if (issues.includes("selfLoop")) return "selfLoop";
    if (issues.includes("backwardsPrereq")) return "backwardsPrereq";
    if (issues.includes("duplicateConflict")) return "duplicateConflict";
    if (issues.includes("invalidStrength")) return "invalidStrength";
    return issues[0];
}

function tallyIssue(primary, link, vizSource, vizTarget, prereqMap, report) {
    const rawS = link.source, rawT = link.target;

    const pushEx = (arr, obj) => { if (arr.length < DQ.maxExamples) arr.push(obj); };

    if (primary === "backwardsPrereq") {
        report.red++;
        const expected = inferExpectedArrow(rawS, rawT, prereqMap);
        pushEx(report.examples.red, { got: `${rawS}→${rawT}`, expected });
    } else if (primary === "duplicateConflict") {
        report.orange++;
        pushEx(report.examples.orange, { edge: `${rawS}→${rawT}`, type: link.relationship_type });
    } else if (primary === "invalidStrength") {
        report.yellow++;
        pushEx(report.examples.yellow, { edge: `${rawS}→${rawT}`, strength: link.strength });
    } else if (primary === "missingTopic") {
        report.purple++;
        pushEx(report.examples.purple, { edge: `${rawS}→${rawT}` });
    } else if (primary === "selfLoop") {
        report.pink++;
        pushEx(report.examples.pink, { edge: `${rawS}→${rawT}` });
    }
}

function inferExpectedArrow(source, target, prereqMap) {
    const tP = prereqMap.get(target) || new Set();
    const sP = prereqMap.get(source) || new Set();
    if (tP.has(source)) return `${source}→${target}`;
    if (sP.has(target)) return `${target}→${source}`;
    return "unknown";
}

function formatDQSummary(report) {
    // Match your requested console format exactly (with a helpful example if we have one)
    const redEx = report.examples.red[0];
    const orangeEx = report.examples.orange[0];
    const yellowEx = report.examples.yellow[0];
    const purpleEx = report.examples.purple[0];
    const pinkEx = report.examples.pink[0];

    const redLine = redEx
        ? `  🔴 ${report.red} backwards prerequisite: ${redEx.got} (should be ${redEx.expected})`
        : `  🔴 ${report.red} backwards prerequisite${report.red === 1 ? "" : "s"}`;

    const orangeLine = orangeEx
        ? `  🟠 ${report.orange} duplicates/conflicts: ${orangeEx.edge} (${orangeEx.type})`
        : `  🟠 ${report.orange} duplicates/conflicts`;

    const yellowLine = yellowEx
        ? `  🟡 ${report.yellow} invalid strengths: ${yellowEx.edge} (strength=${yellowEx.strength})`
        : `  🟡 ${report.yellow} invalid strengths`;

    const purpleLine = purpleEx
        ? `  🟣 ${report.purple} missing topics: ${purpleEx.edge}`
        : `  🟣 ${report.purple} missing topics`;

    const pinkLine = pinkEx
        ? `  🩷 ${report.pink} self-loops: ${pinkEx.edge}`
        : `  🩷 ${report.pink} self-loops`;

    return [
        "⚠️ Data Quality Issues Found:",
        redLine,
        orangeLine,
        yellowLine,
        purpleLine,
        pinkLine
    ].join("\n");
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
