// ============================================
// 3D KNOWLEDGE GALAXY - v2 (More realistic + meaningful)
// Requires globals: THREE, ForceGraph3D (3d-force-graph)
// ============================================

function initKnowledgeGalaxy(elem, initialData, api = {}) {
    const CFG = {
        graph: {
            background: 0x000000,
            linkOpacity: 0.18,
            linkWidth: 1.5,
            nodeBaseRadius: 2.2,
            nodeGlow: true,
            autoRotateWhenIdle: true
        },
        galaxy: {
            starCount: 12000,           // more stars, but still a single draw call
            radius: 5000,
            diskFraction: 0.78,         // most stars in a disk plane (Milky-Way-like)
            diskScale: 1400,            // radial exponential scale
            diskThickness: 140,         // gaussian thickness
            bulgeFraction: 0.18,
            bulgeScale: 420,
            haloFraction: 0.04,
            haloRadius: 4200
        },
        comets: {
            count: 4,
            spawnRadius: 2200,
            tailPoints: 12,
            tailLength: 90,
            speedMin: 900,              // units/second (frame-rate independent)
            speedMax: 1400,
            minLife: 1.6,               // seconds
            maxLife: 2.7
        }
    };

    // ----------------------------
    // ForceGraph3D init
    // ----------------------------
    const graph = ForceGraph3D({ controlType: 'orbit' })(elem)
        .graphData(sanitizeGraphData(initialData))
        .nodeId('id')
        .nodeLabel(n => {
            // Meaningful hover label (safe defaults)
            const mastery = n.mastery != null ? `${Math.round(n.mastery * 100)}%` : '—';
            const difficulty = n.difficulty != null ? `${Math.round(n.difficulty * 100)}%` : '—';
            const next = n.nextReviewAt ? new Date(n.nextReviewAt).toLocaleString() : '—';
            return [
                `<b>${escapeHtml(n.name ?? n.id)}</b>`,
                `Domain: ${escapeHtml(n.domain ?? 'General')}`,
                `Status: ${escapeHtml(n.status ?? 'new')}`,
                `Mastery: ${mastery} • Difficulty: ${difficulty}`,
                `Next review: ${escapeHtml(next)}`
            ].join('<br/>');
        })
        .nodeVal(n => Number.isFinite(n.importance) ? n.importance : (Number.isFinite(n.val) ? n.val : 1))
        .linkOpacity(CFG.graph.linkOpacity)
        .linkWidth(CFG.graph.linkWidth)
        .linkColor(l => (l.type === 'prereq')
            ? 'rgba(255,180,80,0.22)'
            : 'rgba(200,220,255,0.16)'
        )
        .linkDirectionalParticles(l => (l.type === 'prereq' ? 2 : 0))
        .linkDirectionalParticleWidth(1.5)
        .linkDirectionalParticleSpeed(0.006)
        .backgroundColor(CFG.graph.background)
        .onNodeHover(node => { elem.style.cursor = node ? 'pointer' : 'default'; })
        .onNodeClick(async node => {
            if (!node) return;

            // 1) Focus camera (feels like “traveling” to a star)
            focusOnNode(graph, node);

            // 2) Incremental expansion hook for "infinite topics"
            // Provide api.fetchNeighbors(node) => { nodes:[], links:[] }
            if (api.fetchNeighbors && !node.__expanded) {
                node.__expanded = true;
                const delta = await api.fetchNeighbors(node).catch(() => null);
                if (delta) mergeGraphData(graph, delta);
            }

            // 3) Optional navigation (only if node.url exists)
            if (node.url) window.location.href = node.url;
        });

    // Make nodes look more “celestial” and encode learning signals
    graph.nodeThreeObject(node => makeTopicNode(node, CFG))
        .nodeThreeObjectExtend(true);

    const scene = graph.scene();

    // Light + fog for depth
    scene.fog = new THREE.FogExp2(0x000000, 0.00023);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.PointLight(0xffffff, 0.9, 0, 2);
    key.position.set(400, 800, 600);
    scene.add(key);

    // Smooth controls + optional idle autorotate (instead of forcing camera every frame)
    const controls = graph.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    let userInteracting = false;
    elem.addEventListener('pointerdown', () => userInteracting = true, { passive: true });
    elem.addEventListener('pointerup', () => userInteracting = false, { passive: true });

    // ----------------------------
    // Background Galaxy (single Points + shader)
    // ----------------------------
    const galaxy = buildMilkyWayStarfield(scene, CFG.galaxy);

    // ----------------------------
    // Comets (frame-rate independent, no per-frame .clone())
    // ----------------------------
    const comets = [];
    for (let i = 0; i < CFG.comets.count; i++) comets.push(createComet(scene, CFG.comets));

    // ----------------------------
    // Animation loop
    // ----------------------------
    const clock = new THREE.Clock();

    (function animate() {
        const dt = Math.min(clock.getDelta(), 0.05); // clamp delta for stability
        const t = clock.elapsedTime;

        // Shader-based twinkle (no heavy buffer edits)
        galaxy.uniforms.uTime.value = t;
        galaxy.points.rotation.y += dt * 0.01;

        // Idle autorotate via controls (doesn't fight user interaction)
        if (CFG.graph.autoRotateWhenIdle && !userInteracting) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
        } else {
            controls.autoRotate = false;
        }

        // Update comets
        for (let i = 0; i < comets.length; i++) updateComet(scene, comets, i, dt, CFG.comets);

        requestAnimationFrame(animate);
    })();

    // Expose a cleanup method (good hygiene if you ever destroy/recreate views)
    return {
        graph,
        dispose() {
            galaxy.points.geometry.dispose();
            galaxy.points.material.dispose();
            scene.remove(galaxy.points);
            comets.forEach(c => {
                c.line.geometry.dispose();
                c.line.material.dispose();
                scene.remove(c.line);
            });
        }
    };
}

// ============================================
// Helpers
// ============================================

function sanitizeGraphData({ nodes = [], links = [] } = {}) {
    // Ensure link endpoints are ids (ForceGraph accepts objects too, but ids are safer)
    const nodeIds = new Set(nodes.map(n => n.id));
    const cleanLinks = links
        .map(l => ({
            ...l,
            source: typeof l.source === 'object' ? l.source.id : l.source,
            target: typeof l.target === 'object' ? l.target.id : l.target
        }))
        .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
    return { nodes, links: cleanLinks };
}

function mergeGraphData(graph, delta) {
    const cur = graph.graphData();
    const byId = new Map(cur.nodes.map(n => [n.id, n]));
    (delta.nodes || []).forEach(n => { if (!byId.has(n.id)) byId.set(n.id, n); });

    const linkKey = l => `${l.source}→${l.target}#${l.type || 'rel'}`;
    const links = [...cur.links];
    const seen = new Set(links.map(linkKey));
    (delta.links || []).forEach(l => {
        const source = typeof l.source === 'object' ? l.source.id : l.source;
        const target = typeof l.target === 'object' ? l.target.id : l.target;
        const nl = { ...l, source, target };
        const k = linkKey(nl);
        if (!seen.has(k)) { seen.add(k); links.push(nl); }
    });

    graph.graphData({ nodes: [...byId.values()], links });
}

function focusOnNode(graph, node) {
    const distance = 140;
    const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
    graph.cameraPosition(
        {
            x: (node.x || 0) * distRatio,
            y: (node.y || 0) * distRatio,
            z: (node.z || 0) * distRatio
        },
        node,
        900
    );
}

function makeTopicNode(node, CFG) {
    const mastery = clamp01(node.mastery ?? (node.status === 'completed' ? 1 : node.status === 'in_progress' ? 0.55 : 0.15));
    const difficulty = clamp01(node.difficulty ?? 0.4);

    // Color encodes mastery (brighter) + difficulty (slight hue shift)
    const hue = (hash01(node.domain ?? 'general') * 0.12 + 0.56) % 1; // keep in a pleasant range
    const sat = 0.55 + difficulty * 0.25;
    const light = 0.30 + mastery * 0.45;

    const color = new THREE.Color().setHSL(hue, sat, light);

    const radius = CFG.graph.nodeBaseRadius * (0.85 + (node.importance ?? node.val ?? 1) * 0.12);
    const geo = new THREE.SphereGeometry(radius, 14, 14);
    const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.7 + mastery * 0.8),
        emissiveIntensity: 0.6 + mastery * 0.8,
        metalness: 0.1,
        roughness: 0.55
    });

    const mesh = new THREE.Mesh(geo, mat);

    if (CFG.graph.nodeGlow) {
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeRadialGradientTexture(),
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        glow.scale.set(radius * 8, radius * 8, 1);
        mesh.add(glow);
    }

    return mesh;
}

let _glowTex = null;
function makeRadialGradientTexture() {
    if (_glowTex) return _glowTex;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
    g.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    _glowTex = new THREE.CanvasTexture(canvas);
    return _glowTex;
}

function buildMilkyWayStarfield(scene, cfg) {
    const N = cfg.starCount;

    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const seeds = new Float32Array(N);

    for (let i = 0; i < N; i++) {
        const p = sampleGalaxyPoint(cfg);
        positions[i * 3 + 0] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;

        const c = sampleStarColor();
        colors[i * 3 + 0] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        // magnitude-ish distribution: most tiny, few bright
        const r = Math.random();
        sizes[i] = (r < 0.86) ? (1.2 + Math.random() * 1.4)
            : (r < 0.985) ? (2.6 + Math.random() * 2.2)
                : (5.2 + Math.random() * 4.0);

        seeds[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
        uTime: { value: 0 }
    };

    const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aSeed;
      uniform float uTime;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = aColor;

        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // Twinkle: per-star speed + phase derived from seed
        float speed = 0.6 + aSeed * 1.8;
        float tw = 0.78 + 0.22 * sin(uTime * speed + aSeed * 6.2831853);

        // perspective-correct point size
        float px = (260.0 / max(1.0, -mv.z));
        gl_PointSize = aSize * tw * px;

        // mild distance fade for depth
        vAlpha = clamp(px * 0.9, 0.08, 1.0);

        gl_Position = projectionMatrix * mv;
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // soft circular sprite
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float core = smoothstep(0.5, 0.0, d);
        float glow = smoothstep(0.5, 0.12, d) * 0.45;
        float a = (core + glow) * vAlpha;

        gl_FragColor = vec4(vColor, a);
      }
    `
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    return { points, uniforms };
}

function sampleGalaxyPoint(cfg) {
    const pick = Math.random();
    if (pick < cfg.diskFraction) {
        // Exponential disk: dense near center + thin in Y
        const r = -cfg.diskScale * Math.log(1 - Math.random());
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = gaussian(0, cfg.diskThickness);
        return clampRadius({ x, y, z }, cfg.radius);
    }

    if (pick < cfg.diskFraction + cfg.bulgeFraction) {
        // Bulge: tighter spherical density
        const r = -cfg.bulgeScale * Math.log(1 - Math.random());
        const dir = randomUnitVector();
        return clampRadius({
            x: dir.x * r,
            y: dir.y * r,
            z: dir.z * r
        }, cfg.radius);
    }

    // Halo: sparse outer sphere
    const rr = cfg.haloRadius * Math.cbrt(Math.random());
    const d = randomUnitVector();
    return clampRadius({ x: d.x * rr, y: d.y * rr, z: d.z * rr }, cfg.radius);
}

function clampRadius(p, maxR) {
    const len = Math.hypot(p.x, p.y, p.z);
    if (len <= maxR) return p;
    const s = maxR / len;
    return { x: p.x * s, y: p.y * s, z: p.z * s };
}

function sampleStarColor() {
    // Approximate temperature variety without expensive color science
    const r = Math.random();
    if (r < 0.62) return { r: 1.0, g: 1.0, b: 1.0 };         // white
    if (r < 0.80) return { r: 0.78, g: 0.88, b: 1.0 };       // blue-white
    if (r < 0.93) return { r: 1.0, g: 0.93, b: 0.78 };       // warm
    return { r: 1.0, g: 0.78, b: 0.72 };                     // reddish
}

function createComet(scene, cfg) {
    const start = randomPointOnSphere(cfg.spawnRadius);
    const target = {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        z: (Math.random() - 0.5) * 500
    };

    const dir = new THREE.Vector3(target.x - start.x, target.y - start.y, target.z - start.z).normalize();

    const positions = new Float32Array(cfg.tailPoints * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
        color: 0x66ddff,
        transparent: true,
        opacity: 0.85
    });

    const line = new THREE.Line(geo, mat);
    scene.add(line);

    const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
    const maxLife = cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife);

    return {
        line,
        pos: new THREE.Vector3(start.x, start.y, start.z),
        dir,
        speed,
        life: 0,
        maxLife
    };
}

function updateComet(scene, comets, i, dt, cfg) {
    const c = comets[i];
    c.life += dt;

    // Move (no .clone() per frame)
    c.pos.x += c.dir.x * c.speed * dt;
    c.pos.y += c.dir.y * c.speed * dt;
    c.pos.z += c.dir.z * c.speed * dt;

    // Update tail
    const arr = c.line.geometry.attributes.position.array;
    for (let k = 0; k < cfg.tailPoints; k++) {
        const t = k / (cfg.tailPoints - 1);
        const back = t * cfg.tailLength;
        arr[k * 3 + 0] = c.pos.x - c.dir.x * back;
        arr[k * 3 + 1] = c.pos.y - c.dir.y * back;
        arr[k * 3 + 2] = c.pos.z - c.dir.z * back;
    }
    c.line.geometry.attributes.position.needsUpdate = true;

    // Fade near end
    const fadeStart = c.maxLife * 0.65;
    if (c.life > fadeStart) {
        const f = (c.life - fadeStart) / (c.maxLife - fadeStart);
        c.line.material.opacity = 0.85 * (1 - f);
    }

    // Respawn
    if (c.life >= c.maxLife || c.pos.length() < 120) {
        scene.remove(c.line);
        c.line.geometry.dispose();
        c.line.material.dispose();
        comets[i] = createComet(scene, cfg);
    }
}

function randomPointOnSphere(r) {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return { x: r * s * Math.cos(t), y: r * u, z: r * s * Math.sin(t) };
}

function randomUnitVector() {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return { x: s * Math.cos(t), y: u, z: s * Math.sin(t) };
}

function gaussian(mean, std) {
    // Box–Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function hash01(str) {
    // tiny stable hash -> [0,1)
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = (h ^ str.charCodeAt(i)) * 16777619;
    return ((h >>> 0) % 100000) / 100000;
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
