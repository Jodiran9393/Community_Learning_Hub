import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { graphData as gData, getNodeColor } from '../data/knowledge-graph.js';

// Helper function to create text sprites using canvas
function createTextSprite(text, color = '#ffffff', size = 5) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Fixed size canvas
    canvas.width = 512;
    canvas.height = 128;
    
    // Draw background for visibility
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'Bold 48px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        sizeAttenuation: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Fixed large scale
    sprite.scale.set(100, 25, 1);
    
    return sprite;
}

export function initGalaxy() {
    const elem = document.getElementById('galaxy-hero');
    if (!elem) return;

    const Graph = ForceGraph3D()(elem)
        .graphData(gData)
        .nodeVal('val')
        .backgroundColor('#000005')
        .showNavInfo(false)
        .width(elem.clientWidth)
        .height(elem.clientHeight)
        
        // Simple colored spheres
        .nodeColor(node => getNodeColor(node))
        .nodeOpacity(0.9)

        // -- CUSTOM LINKS --
        .linkWidth(0.5)
        .linkColor(() => '#334466')
        .linkDirectionalParticles(2)
        .linkDirectionalParticleWidth(2)
        .linkDirectionalParticleColor(() => '#ffffff')
        .linkDirectionalParticleSpeed(0.005)

        // -- PHYSICS --
        .d3Force('charge').strength(-200)
        .d3Force('link').distance(70);

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

    // Add HTML overlay labels
    const labelsContainer = document.createElement('div');
    labelsContainer.style.position = 'absolute';
    labelsContainer.style.top = '0';
    labelsContainer.style.left = '0';
    labelsContainer.style.width = '100%';
    labelsContainer.style.height = '100%';
    labelsContainer.style.pointerEvents = 'none';
    labelsContainer.style.zIndex = '10';
    elem.appendChild(labelsContainer);

    // Create HTML labels for each node
    const labels = {};
    gData.nodes.forEach(node => {
        const label = document.createElement('div');
        label.textContent = node.name;
        label.style.position = 'absolute';
        label.style.color = '#ffffff';
        label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        label.style.padding = '4px 8px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.whiteSpace = 'nowrap';
        labelsContainer.appendChild(label);
        labels[node.id] = label;
    });

    // Update label positions on each frame
    function updateLabels() {
        gData.nodes.forEach(node => {
            const label = labels[node.id];
            if (!label) return;
            
            // Get screen coordinates using camera projection
            const vector = new THREE.Vector3(node.x, node.y, node.z);
            vector.project(Graph.camera());
            
            // Convert to screen coordinates
            const width = elem.clientWidth;
            const height = elem.clientHeight;
            const x = (vector.x * 0.5 + 0.5) * width;
            const y = (-vector.y * 0.5 + 0.5) * height;
            
            // Only show if in front of camera
            if (vector.z < 1) {
                label.style.left = x + 'px';
                label.style.top = y + 'px';
                label.style.display = 'block';
            } else {
                label.style.display = 'none';
            }
        });
    }

    // Update labels continuously
    setInterval(updateLabels, 50);
}

function openPanel(node) {
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('panel-title');
    const desc = document.getElementById('panel-desc');

    if (panel && title && desc) {
        title.innerText = node.name;
        title.style.color = getNodeColor(node);
        desc.innerText = node.desc || "Explore this topic in the Community Learning Hub.";

        panel.classList.add('open');
    }
}
