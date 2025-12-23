/**
 * DQ Galaxy Visualization Module
 * 
 * Consolidated from:
 * - chatgpt-5.2-colored-dashed-overlays-ALL-flagged-links.js
 * - chatgpt-5.2-loud-mode-patch.js
 * 
 * Renders visual feedback for data quality issues in the Knowledge Galaxy:
 * - Colored dashed overlays for all 5 issue types
 * - "Loud mode" broken star visualization for missing topics
 * - Pulsing animation with strobe beacon
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

const DQ_DASH = { dashSize: 10, gapSize: 7 };

// ============================================
// Apply DQ Visualization to Galaxy
// ============================================

/**
 * Apply colored dashed overlays to flagged links
 * @param {ForceGraph3D} graph - The 3D force graph instance
 * @param {Array} dqLinks - Normalized links with __dqPrimary metadata
 */
function applyDQVisualization(graph, dqLinks) {
    // Material cache (avoid allocating new materials per link)
    const dqMatCache = new Map();

    function getDashedMat(hex) {
        const key = `${hex}|${DQ_DASH.dashSize}|${DQ_DASH.gapSize}`;
        if (dqMatCache.has(key)) return dqMatCache.get(key);

        const mat = new THREE.LineDashedMaterial({
            color: new THREE.Color(hex),
            dashSize: DQ_DASH.dashSize,
            gapSize: DQ_DASH.gapSize,
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

            // 🩷 Self-loop: draw a visible circle around the node
            if (link.__dqPrimary === "selfLoop") {
                const pos = obj.geometry.attributes.position.array;
                const segments = (pos.length / 3) - 1;

                const r = 14; // loop radius
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
}

// ============================================
// Missing Node Visualization ("Loud Mode")
// ============================================

/**
 * Create "broken star" visualization for missing topic placeholder nodes
 * @param {Object} node - Node with __missing = true
 * @returns {THREE.Group} 3D group with rings, cracks, label, flare, beacon
 */
function makeBrokenMissingStar(node) {
    const purple = new THREE.Color(node.color_hex || "#aa66ff"); // 🟣
    const baseSize = Number.isFinite(node.node_size) ? node.node_size : 28;

    const g = new THREE.Group();

    // --- Core "dead star"
    const coreGeo = new THREE.SphereGeometry(Math.max(3, baseSize * 0.18), 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x12001f, transparent: true, opacity: 0.9 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    g.add(core);

    // --- Hollow ring + halo (always visible)
    const ringOuterR = Math.max(14, baseSize * 0.65);
    const ringInnerR = ringOuterR * 0.78;

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(ringInnerR, ringOuterR, 64),
        new THREE.MeshBasicMaterial({
            color: purple,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false
        })
    );
    ring.renderOrder = 999;
    g.add(ring);

    const halo = new THREE.Mesh(
        new THREE.RingGeometry(ringOuterR * 1.08, ringOuterR * 1.26, 64),
        new THREE.MeshBasicMaterial({
            color: purple,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false
        })
    );
    halo.renderOrder = 998;
    g.add(halo);

    // --- "Broken" cracks
    const crackMat = new THREE.LineBasicMaterial({ color: purple, transparent: true, opacity: 0.95, depthTest: false });
    const crackLen = ringOuterR * 0.95;
    const crack1 = makeLine([-crackLen, 0, 0, crackLen, 0, 0], crackMat);
    const crack2 = makeLine([0, -crackLen, 0, 0, crackLen, 0], crackMat);
    crack1.renderOrder = 1000;
    crack2.renderOrder = 1000;
    g.add(crack1, crack2);

    // --- Big billboard label: include missing ID (unmissable)
    const labelText = `MISSING: ${String(node.id)}`;
    const label = makeBillboardTextSprite(labelText, {
        color: "#e9d7ff",
        fontSize: 62,
        padding: 18,
        bg: "rgba(20,0,35,0.70)",
        border: "rgba(170,102,255,1.00)"
    });
    const labelBaseY = ringOuterR * 1.65;
    label.position.set(0, labelBaseY, 0);
    label.renderOrder = 1001;
    g.add(label);

    // --- Purple flare sprite (visual "beacon bloom")
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeRadialGradientTexture(),
        color: purple,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
    }));
    flare.scale.set(ringOuterR * 6.5, ringOuterR * 6.5, 1);
    flare.renderOrder = 997;
    g.add(flare);

    // --- Strobe beacon (PointLight): loud, but distance-limited
    const beacon = new THREE.PointLight(purple, 0, ringOuterR * 60, 2);
    beacon.position.set(0, 0, 0);
    g.add(beacon);

    node.__missingParts = {
        ring,
        halo,
        label,
        flare,
        beacon,
        ringOuterR,
        labelBaseY,
        seed: (hash01(String(node.id)) * Math.PI * 2)
    };

    return g;
}

/**
 * Attach pulsing animation for missing nodes
 * @param {ForceGraph3D} graph - The 3D force graph instance
 * @returns {Object} Controller with stop() method
 */
function attachMissingNodePulse(graph) {
    let stopped = false;
    const clock = new THREE.Clock();

    (function tick() {
        if (stopped) return;
        const t = clock.getElapsedTime();

        const nodes = graph.graphData()?.nodes || [];
        for (const n of nodes) {
            if (!n.__missing || !n.__missingParts) continue;

            const { ring, halo, label, flare, beacon, ringOuterR, labelBaseY, seed } = n.__missingParts;

            // Smooth pulse (breathing)
            const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + seed);

            // Sharp strobe (beacon flash): "peaky" waveform
            const strobeRaw = 0.5 + 0.5 * Math.sin(t * 12.0 + seed * 3.1);
            const strobe = Math.pow(strobeRaw, 8); // sharper peaks
            const jitter = 0.85 + 0.15 * Math.sin(t * 95.0 + seed * 11.0);

            // Rings pulse + slight spin
            const scale = 1.0 + pulse * 0.45;
            ring.scale.setScalar(scale);
            halo.scale.setScalar(1.0 + pulse * 0.70);
            ring.rotation.z += 0.01 + strobe * 0.05;

            ring.material.opacity = 0.35 + pulse * 0.65;
            halo.material.opacity = 0.12 + pulse * 0.55;

            // Label bob + flash
            label.position.y = labelBaseY + pulse * (ringOuterR * 0.15);
            label.material.opacity = 0.55 + 0.45 * strobe;

            // Flare "blast" on strobe peaks
            const flareScale = 1.0 + pulse * 0.55 + strobe * 1.65;
            flare.scale.set(ringOuterR * 6.5 * flareScale, ringOuterR * 6.5 * flareScale, 1);
            flare.material.opacity = (0.25 + pulse * 0.55 + strobe * 0.95) * jitter;

            // Beacon light strobe (distance-limited)
            beacon.intensity = (0.2 + pulse * 0.6 + strobe * 4.0) * jitter;
        }

        requestAnimationFrame(tick);
    })();

    return { stop: () => { stopped = true; } };
}

// ============================================
// Helper Functions
// ============================================

function makeLine(positionsArr, material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positionsArr, 3));
    return new THREE.Line(geo, material);
}

function makeBillboardTextSprite(text, opts = {}) {
    const {
        color = "#ffffff",
        bg = "rgba(0,0,0,0.5)",
        border = "rgba(255,255,255,0.35)",
        fontSize = 64,
        padding = 16
    } = opts;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width + padding * 2);
    const h = Math.ceil(fontSize + padding * 2);

    canvas.width = w;
    canvas.height = h;

    // background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // border
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    // text
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, padding, h / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;

    const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(w * 0.18, h * 0.18, 1);
    return sprite;
}

let _radialTex = null;
function makeRadialGradientTexture() {
    if (_radialTex) return _radialTex;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0.0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.85)");
    g.addColorStop(0.6, "rgba(255,255,255,0.25)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    _radialTex = new THREE.CanvasTexture(canvas);
    return _radialTex;
}

function hash01(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = (h ^ str.charCodeAt(i)) * 16777619;
    return ((h >>> 0) % 100000) / 100000;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyDQVisualization,
        makeBrokenMissingStar,
        attachMissingNodePulse,
        DQ_COLORS
    };
}
