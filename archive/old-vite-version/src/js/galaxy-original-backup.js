import ForceGraph3D from '3d-force-graph';
// import { UnrealBloomPass } from 'https://esm.sh/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';

// --- DATA ---
const GROUPS = {
    WEB: { id: 1, color: '#4c8bf5' },  // Title Blue
    AI: { id: 2, color: '#d367c1' },   // Title Pink
    DESIGN: { id: 3, color: '#a060ff' }, // Purple/Violet blend
    COMMUNITY: { id: 4, color: '#ffffff' } // Bright White Core
};

const gData = {
    nodes: [
        { id: 'CLH', group: 4, val: 100, name: 'CLH HUB', desc: 'The heart of our community. Connect, share, and grow.' },
        { id: 'React', group: 1, val: 30, name: 'React.js', desc: 'Modern UI library for building interactive interfaces.' },
        { id: 'HTML', group: 1, val: 20, name: 'HTML5', desc: 'The structural foundation of the web.' },
        { id: 'CSS', group: 1, val: 20, name: 'CSS3', desc: 'Styling and layout mastery.' },
        { id: 'JS', group: 1, val: 30, name: 'JavaScript', desc: 'The language that powers the web.' },
        { id: 'NextJS', group: 1, val: 20, name: 'Next.js', desc: 'The React Framework for production.' },
        { id: 'TS', group: 1, val: 20, name: 'TypeScript', desc: 'JavaScript with syntax for types.' },
        { id: 'LLM', group: 2, val: 30, name: 'LLMs', desc: 'Large Language Models redefining intelligence.' },
        { id: 'Prompting', group: 2, val: 20, name: 'Prompting', desc: 'The art of communicating with AI.' },
        { id: 'Agents', group: 2, val: 25, name: 'AI Agents', desc: 'Autonomous systems that take action.' },
        { id: 'Python', group: 2, val: 20, name: 'Python', desc: 'Versatile language for AI and backend.' },
        { id: 'Figma', group: 3, val: 20, name: 'Figma', desc: 'Collaborative interface design tool.' },
        { id: 'UI', group: 3, val: 20, name: 'UI / UX', desc: 'User Interface and Experience Design.' },
        { id: 'A11y', group: 3, val: 15, name: 'Accessibility', desc: 'Building for everyone, everywhere.' }
    ],
    links: [
        { source: 'CLH', target: 'React' }, { source: 'CLH', target: 'LLM' }, { source: 'CLH', target: 'UI' },
        { source: 'React', target: 'JS' }, { source: 'React', target: 'NextJS' }, { source: 'JS', target: 'TS' },
        { source: 'HTML', target: 'CSS' }, { source: 'CSS', target: 'UI' },
        { source: 'LLM', target: 'Agents' }, { source: 'LLM', target: 'Prompting' }, { source: 'LLM', target: 'Python' },
        { source: 'Python', target: 'JS' }, { source: 'UI', target: 'Figma' }, { source: 'UI', target: 'A11y' }
    ]
};

export function initGalaxy() {
    const elem = document.getElementById('galaxy-hero');
    if (!elem) return;

    const Graph = ForceGraph3D()(elem)
        .graphData(gData)
        .nodeLabel('name')
        .nodeVal('val')
        .backgroundColor('#000005') // Deepest black
        .showNavInfo(false)
        .width(elem.clientWidth)
        .height(elem.clientHeight)

        // -- CUSTOM NODES (GLOWING SPHERES + TEXT) --
        .nodeThreeObject(node => {
            const group = new THREE.Group();

            // 1. The Glowing Sphere
            const color = NODE_COLOR(node);
            const sphereGeo = new THREE.SphereGeometry(Math.cbrt(node.val) * 1.5, 32, 32);
            const sphereMat = new THREE.MeshLambertMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.9
            });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            group.add(sphere);

            // 2. The Text Label (Always Visible)
            const sprite = new SpriteText(node.name);
            sprite.color = 'rgba(255, 255, 255, 0.9)';
            sprite.textHeight = 4 + (node.val / 10);
            sprite.position.y = Math.cbrt(node.val) * 1.5 + 4;
            sprite.fontFace = 'Poppins';
            sprite.fontWeight = 'bold';
            sprite.textShadow = '0 0 5px #000';
            group.add(sprite);

            return group;
        })

        // -- CUSTOM LINKS --
        .linkWidth(0.5)
        .linkColor(() => '#334466')
        .linkDirectionalParticles(2)
        .linkDirectionalParticleWidth(2)
        .linkDirectionalParticleColor(() => '#ffffff')
        .linkDirectionalParticleSpeed(0.005)

        // -- PHYSICS --
        .d3Force('charge', null);

    // Custom Physics Tweak
    Graph.d3Force('charge').strength(-200);
    Graph.d3Force('link').distance(70);

    // -- POST PROCESSING (BLOOM) --
    // const bloomPass = new UnrealBloomPass();
    // bloomPass.strength = 2.5;
    // bloomPass.radius = 0.8;
    // bloomPass.threshold = 0.1;
    // Graph.postProcessingComposer().addPass(bloomPass);

    // -- STARFIELD BACKGROUND --
    const scene = Graph.scene();
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 4000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({
        size: 2,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // -- CAMERA CONTROL --
    let angle = 0;
    const orbitDist = 350;
    let autoRotate = true;

    setInterval(() => {
        if (autoRotate) {
            Graph.cameraPosition({
                x: orbitDist * Math.sin(angle),
                z: orbitDist * Math.cos(angle)
            });
            angle += 0.0005;
        }
    }, 16);

    Graph.controls().addEventListener('start', () => autoRotate = false);

    // -- INTERACTIVITY --
    Graph.onNodeClick(node => {
        // Focus Camera
        const dist = 70;
        const distRatio = 1 + dist / Math.hypot(node.x, node.y, node.z);
        Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            2000
        );

        // Open Side Panel
        openPanel(node);
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        Graph.width(elem.clientWidth);
        Graph.height(elem.clientHeight);
    });
}

function NODE_COLOR(node) {
    if (node.group === 1) return GROUPS.WEB.color;
    if (node.group === 2) return GROUPS.AI.color;
    if (node.group === 3) return GROUPS.DESIGN.color;
    if (node.group === 4) return GROUPS.COMMUNITY.color;
    return '#fff';
}

function openPanel(node) {
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('panel-title');
    const desc = document.getElementById('panel-desc');

    if (panel && title && desc) {
        title.innerText = node.name;
        title.style.color = NODE_COLOR(node);
        desc.innerText = node.desc || "Explore this topic in the Community Learning Hub.";

        panel.classList.add('open');
    }
}
