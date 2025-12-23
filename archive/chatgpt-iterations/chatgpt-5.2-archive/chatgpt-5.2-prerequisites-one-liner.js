//Wherever you currently do validLinks = ..., insert this step just before rendering:
const { normalizedLinks, report } = normalizePrerequisiteDirections(topics, rawLinks, {
    log: (msg, meta) => console.info(msg, meta) // or console.warn
});

graph.graphData({ nodes, links: normalizedLinks });
