// 1) Replace your makeBrokenMissingStar(node) with this version

function makeBrokenMissingStar(node) {
    const purple = new THREE.Color(node.color_hex || "#aa66ff"); // 🟣
    const baseSize = Number.isFinite(node.node_size) ? node.node_size : 28;

    const g = new THREE.Group();

    // --- Core “dead star”
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

    // --- “Broken” cracks
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

    // --- Purple flare sprite (visual “beacon bloom”)
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

// Helpers you likely already have (include if not)
function makeLine(positionsArr, material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positionsArr, 3));
    return new THREE.Line(geo, material);
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

// 2) Upgrade your pulse loop to include strobe intensity + flare blast

// Replace your attachMissingNodePulse(...) with:

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

            // Sharp strobe (beacon flash): “peaky” waveform
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

            // Flare “blast” on strobe peaks
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


// That’s the “can’t miss it” effect: the ring breathes, the label flashes, and the beacon strobes hard.
// If you end up with lots of missing nodes at once, many PointLights can get heavy. In that case, we can cap the number of active beacons (e.g., only the first 10 missing nodes get lights; the rest keep rings + labels).
