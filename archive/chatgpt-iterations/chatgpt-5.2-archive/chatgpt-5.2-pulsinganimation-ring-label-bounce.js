// 2) Pulsing animation (ring + label bounce)

function attachMissingNodePulse(graph) {
    let stopped = false;
    const clock = new THREE.Clock();

    (function tick() {
        if (stopped) return;
        const t = clock.getElapsedTime();

        const data = graph.graphData();
        const nodes = data?.nodes || [];

        for (const n of nodes) {
            if (!n.__missing || !n.__missingParts) continue;

            const { ring, halo, label, seed } = n.__missingParts;

            // Aggressive, obvious pulse
            const pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + seed);
            const scale = 1.0 + pulse * 0.38;

            ring.scale.setScalar(scale);
            halo.scale.setScalar(1.0 + pulse * 0.55);

            ring.material.opacity = 0.35 + pulse * 0.65;
            halo.material.opacity = 0.15 + pulse * 0.55;

            // Label bobbing
            label.position.y = (label.position.y * 0.0) + (22 + pulse * 10); // keep it stable + bob
            label.material.opacity = 0.65 + pulse * 0.35;
        }

        requestAnimationFrame(tick);
    })();

    return { stop: () => { stopped = true; } };
}
