// -------------------------
// DB → Galaxy node mapping
// -------------------------
function topicRowToNode(t, progressRow) {
    return {
        id: t.id,
        name: t.name,
        category: t.category,
        status: progressRow?.status ?? 'not_started',
        completion_date: progressRow?.completion_date ?? null,

        // meaning signals
        difficulty_level: t.difficulty_level ?? null,     // 1–5
        estimated_hours: Number(t.estimated_hours ?? 0),  // decimal
        icon_emoji: t.icon_emoji ?? null,

        // visuals
        color_hex: t.color_hex ?? null,
        node_size: t.node_size ?? 20,

        // navigation
        url: t.resource_page_url ?? t.external_url ?? null
    };
}

// -------------------------
// DB → Galaxy link mapping
// Assumption: from_topic → to_topic means from is prerequisite of to
// -------------------------
function relationshipRowToLink(r) {
    return {
        source: r.from_topic,
        target: r.to_topic,
        relationship_type: r.relationship_type ?? 'related', // prerequisite | related | alternative
        strength: r.strength ?? 3
    };
}
