// 2) ForceGraph3D: Colored dashed overlays for ALL flagged links
// CLEANUP MODE (later switch to "flipOnly")
const { nodes: dqNodes, links: dqLinks } = auditAndNormalizeGraphData(topics, rawLinks, {
    mode: "flipAndFlag",
    createMissingPlaceholders: true,
    warnToConsole: true
});

graph.graphData({ nodes: dqNodes, links: dqLinks });

// Material cache (so we don’t allocate new materials per link)
const dqMatCache = new Map();
function getDashedMat(hex) {
    const key = `${hex}|${DQ.dash.dashSize}|${DQ.dash.gapSize}`;
    if (dqMatCache.has(key)) return dqMatCache.get(key);
    const mat = new THREE.LineDashedMaterial({
        color: new THREE.Color(hex),
        dashSize: DQ.dash.dashSize,
        gapSize: DQ.dash.gapSize,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
    });
    dqMatCache.set(key, mat);
    return mat;
}

function makeTwoPointLine(hex) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    const line = new THREE.Line(geom, getDashedMat(hex));
    line.computeLineDistances();
    line.renderOrder = 10;
    return line;
}

function makeSelfLoopCircle(hex, segments = 24) {
    const geom = new THREE.BufferGeometry();
    const arr = new Float32Array((segments + 1) * 3); // closed loop
    geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const line = new THREE.Line(geom, getDashedMat(hex));
    line.computeLineDistances();
    line.renderOrder = 10;
    return line;
}

graph
    // Hide normal solid link when flagged (we overlay dashed)
    .linkOpacity(l => (l.__dqPrimary ? 0 : 0.25))

    // Arrow coloring + presence (keep prereq arrows even when dashed, except self-loops/missing)
    .linkDirectionalArrowLength(l => {
        if (l.__dqPrimary === "selfLoop" || l.__dqPrimary === "missingTopic") return 0;
        return (l.relationship_type === "prerequisite" ? 6 : 0);
    })
    .linkDirectionalArrowColor(l => (l.__dqPrimary ? l.__dqColor : "rgba(255,180,80,0.22)"))

    // Strength → width, but clamp for sanity during cleanup
    .linkWidth(l => {
        const s = Number.isFinite(l.strength) ? l.strength : 3;
        const clamped = Math.max(1, Math.min(10, s));
        // If the strength was invalid, we’ll still draw width based on clamped value
        return l.__dqPrimary ? 2.8 : 0.8 + clamped * 0.12;
    })

    // Create dashed overlays for any flagged link
    .linkThreeObject(l => {
        if (!l.__dqPrimary) return null;
        const hex = l.__dqColor;

        if (l.__dqPrimary === "selfLoop") {
            return makeSelfLoopCircle(hex);
        }
        return makeTwoPointLine(hex);
    })

    // Update dashed geometry positions every tick
    .linkPositionUpdate((obj, { start, end }, link) => {
        if (!obj || !link.__dqPrimary) return;

        // 🩷 Self-loop: draw a visible circle around the node (since start=end is zero-length)
        if (link.__dqPrimary === "selfLoop") {
            const pos = obj.geometry.attributes.position.array;
            const segments = (pos.length / 3) - 1;

            const r = 14; // loop radius (tweak)
            for (let i = 0; i <= segments; i++) {
                const a = (i / segments) * Math.PI * 2;
                pos[i * 3 + 0] = start.x + Math.cos(a) * r;
                pos[i * 3 + 1] = start.y + Math.sin(a) * r;
                pos[i * 3 + 2] = start.z;
            }

            obj.geometry.attributes.position.needsUpdate = true;
            obj.computeLineDistances();
            return;
        }

        // Normal dashed line
        const pos = obj.geometry.attributes.position.array;
        pos[0] = start.x; pos[1] = start.y; pos[2] = start.z;
        pos[3] = end.x; pos[4] = end.y; pos[5] = end.z;
        obj.geometry.attributes.position.needsUpdate = true;
        obj.computeLineDistances();
    });
