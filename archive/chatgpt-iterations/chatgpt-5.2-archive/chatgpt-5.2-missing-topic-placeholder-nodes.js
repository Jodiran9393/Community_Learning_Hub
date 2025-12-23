// 1) Make placeholder nodes “broken stars” (nodeThreeObject)

// Where you currently set .nodeThreeObject(...), branch on node.__missing === true (your audit already creates placeholders like this).

// Call this ONCE after graph is created:
const missingPulse = attachMissingNodePulse(graph);

// In your node object factory:
graph
    .nodeThreeObject(node => {
        if (node.__missing) return makeBrokenMissingStar(node);
        return makeTopicNode(node, CFG); // your normal node renderer
    })
    .nodeThreeObjectExtend(true);

// Now paste the missing-node renderer + helpers:

function makeBrokenMissingStar(node) {
    const purple = new THREE.Color(node.color_hex || "#aa66ff"); // 🟣
    const baseSize = Number.isFinite(node.node_size) ? node.node_size : 28;

    const g = new THREE.Group();

    // --- Core “dead star”
    const coreGeo = new THREE.SphereGeometry(Math.max(3, baseSize * 0.18), 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x12001f,
        transparent: true,
        opacity: 0.85
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    g.add(core);

    // --- Hollow ring(s): unmissable, always visible (depthTest off)
    const ringOuterR = Math.max(14, baseSize * 0.65);
    const ringInnerR = ringOuterR * 0.78;

    const ringGeo = new THREE.RingGeometry(ringInnerR, ringOuterR, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: purple,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.renderOrder = 999;
    g.add(ring);

    // --- Extra “warning halo” ring (slightly larger)
    const haloGeo = new THREE.RingGeometry(ringOuterR * 1.08, ringOuterR * 1.22, 64);
    const haloMat = new THREE.MeshBasicMaterial({
        color: purple,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.renderOrder = 998;
    g.add(halo);

    // --- “Broken” cracks (two crossed lines)
    const crackMat = new THREE.LineBasicMaterial({
        color: purple,
        transparent: true,
        opacity: 0.9,
        depthTest: false
    });

    const crackLen = ringOuterR * 0.95;
    const crack1 = makeLine([-crackLen, 0, 0, crackLen, 0, 0], crackMat);
    const crack2 = makeLine([0, -crackLen, 0, 0, crackLen, 0], crackMat);
    crack1.renderOrder = 1000;
    crack2.renderOrder = 1000;
    g.add(crack1, crack2);

    // --- Billboard label: “MISSING”
    const label = makeBillboardTextSprite("MISSING", {
        color: "#aa66ff",
        fontSize: 72,
        padding: 18,
        bg: "rgba(0,0,0,0.55)",
        border: "rgba(170,102,255,0.95)"
    });
    label.position.set(0, ringOuterR * 1.45, 0);
    label.renderOrder = 1001;
    g.add(label);

    // Store references for pulsing animation
    node.__missingParts = {
        ring,
        halo,
        label,
        seed: (hash01(String(node.id)) * Math.PI * 2)
    };

    // Optional: make missing nodes non-clickable in your click handler
    // node.__noNav = true;

    return g;
}

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
    sprite.scale.set(w * 0.18, h * 0.18, 1); // tweak if you want even bigger
    return sprite;
}

function hash01(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = (h ^ str.charCodeAt(i)) * 16777619;
    return ((h >>> 0) % 100000) / 100000;
}
