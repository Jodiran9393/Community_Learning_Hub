const { normalizedLinks } = normalizePrerequisiteDirections(topics, rawLinks, {
    mode: "flipAndFlag",     // best for “correct UX + visible data issues”
    warnLimit: 50
});

graph.graphData({ nodes, links: normalizedLinks })

    // Hide the default line for flagged prereq edges (we'll overlay a dashed one)
    .linkOpacity(l => (l.__prereqFlag ? 0 : 0.25))

    // Keep arrows for prerequisites (including flagged ones)
    .linkDirectionalArrowLength(l => (l.relationship_type === "prerequisite" ? 6 : 0))
    .linkDirectionalArrowRelPos(0.98)
    .linkDirectionalArrowColor(l => (l.__prereqFlag ? "#ff3333" : "rgba(255,180,80,0.22)"))

    // Optional: bump width a bit for clarity
    .linkWidth(l => (l.__prereqFlag ? 2.8 : 1.6))

    // Add dashed overlay lines only for flagged prereq edges
    .linkThreeObject(link => {
        if (!link.__prereqFlag) return null;

        const geom = new THREE.BufferGeometry();
        geom.setAttribute(
            "position",
            new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)
        );

        const mat = new THREE.LineDashedMaterial({
            color: 0xff3333,
            dashSize: 10,
            gapSize: 7,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });

        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        line.renderOrder = 10; // try to keep on top
        return line;
    })
    .linkPositionUpdate((obj, { start, end }, link) => {
        if (!obj || !link.__prereqFlag) return;

        const pos = obj.geometry.attributes.position.array;
        pos[0] = start.x; pos[1] = start.y; pos[2] = start.z;
        pos[3] = end.x; pos[4] = end.y; pos[5] = end.z;

        obj.geometry.attributes.position.needsUpdate = true;
        obj.computeLineDistances(); // required for dashed rendering
    });
