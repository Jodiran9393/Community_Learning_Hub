/**
 * Complete DQ System Integration Example
 * 
 * This example shows how to integrate all 5 DQ system files into your
 * Knowledge Galaxy to enable cleanup-mode data quality detection and fixing.
 * 
 * Per Knowledge_Galaxy_DQ_Design_Spec.md guidelines.
 */

// ============================================
// Required Files
// ============================================

// Core (use as-is):
// 1. chatgpt-5.2-data-quality-audit-normalize.js
// 2. chatgpt-5.2-mapping-layer.js
// 3. chatgpt-5.2-fix1.js (your galaxy renderer)

// Production modules (consolidated):
// 4. dq-galaxy-visualization.js
// 5. dq-debug-panel-v2.js

// ============================================
// Complete Integration
// ============================================

async function initKnowledgeGalaxyWithDQ() {
    // 1. Fetch data from Supabase
    const topics = await fetchTopicsFromSupabase();
    const rawLinks = await fetchRelationshipsFromSupabase();

    // 2. Build prerequisite map (ground truth for validation)
    const prereqMap = new Map(
        topics.map(t => [t.id, new Set(coercePrereqArray(t.prerequisites || []))])
    );

    // 3. Audit & normalize with auditAndNormalizeGraphData()
    const { nodes: dqNodes, links: dqLinks } = auditAndNormalizeGraphData(topics, rawLinks, {
        mode: "flipAndFlag",              // Cleanup mode: flip + flag issues
        createMissingPlaceholders: true,  // Create 🟣 broken stars for missing topics
        warnToConsole: true               // Print console summary
    });

    console.log("✅ DQ Audit complete. Nodes:", dqNodes.length, "Links:", dqLinks.length);

    // 4. Initialize 3D galaxy (from fix1.js or your galaxy renderer)
    const galaxyContainer = document.getElementById('knowledge-galaxy');
    const galaxy = initKnowledgeGalaxy(galaxyContainer, { nodes: dqNodes, links: dqLinks });

    // 5. Apply DQ visualization (dashed overlays + missing nodes)

    // 5a. Apply colored dashed overlays for all issue types
    applyDQVisualization(galaxy.graph, dqLinks);

    // 5b. Attach pulsing animation for missing nodes
    const pulseController = attachMissingNodePulse(galaxy.graph);

    // 5c. Override node renderer to use broken star for missing topics
    const originalNodeThreeObject = galaxy.graph.nodeThreeObject();
    galaxy.graph.nodeThreeObject(node => {
        if (node.__missing) {
            return makeBrokenMissingStar(node);
        }
        // Use your original node renderer for normal topics
        return originalNodeThreeObject ? originalNodeThreeObject(node) : undefined;
    });

    // 6. Create debug panel
    const dqPanel = createDQDebugPanelV2({
        topics,
        rawLinks,
        prereqMap,
        normalizedLinks: dqLinks  // Pass flagged links for meta lookup
    });

    // 7. Wire click handler: missing nodes → open panel
    galaxy.graph.onNodeClick(node => {
        if (!node) return;

        // 🟣 Missing placeholder nodes open the debug panel
        if (node.__missing) {
            dqPanel.openMissing(node.id);
            return;
        }

        // Normal navigation for valid topics
        if (node.id === 'CLH') return;
        const url = `/pages/${node.id.toLowerCase()}.html`;
        if (window.parent !== window) window.parent.location.href = url;
        else window.location.href = url;
    });

    console.log("🌌 Knowledge Galaxy with DQ System initialized!");

    return { galaxy, dqPanel, pulseController };
}

// ============================================
// Supabase Fetch Functions (Example)
// ============================================

async function fetchTopicsFromSupabase() {
    const { data, error } = await supabase
        .from('learning_topics')
        .select('*');

    if (error) throw error;
    return data;
}

async function fetchRelationshipsFromSupabase() {
    const { data, error } = await supabase
        .from('topic_relationships')
        .select('*');

    if (error) throw error;
    return data;
}

// Coerce prerequisites array (handles Postgres text[] format)
function coercePrereqArray(x) {
    if (Array.isArray(x)) return x.map(String).map(s => s.trim()).filter(Boolean);
    if (typeof x === "string") {
        const raw = x.trim().replace(/^\{|\}$/g, "");
        if (!raw) return [];
        return raw.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
}

// ============================================
// Workflow Summary
// ============================================

/*
OPERATOR CLEANUP WORKFLOW:

1. Open Knowledge Galaxy → See colored dashed overlays for issues:
   - 🔴 Red dashed = Backwards prerequisite (auto-flipped for correct viz)
   - 🟠 Orange dashed = Duplicate/conflict
   - 🟡 Yellow dashed = Invalid strength (not 1-10)
   - 🟣 Purple dashed = Missing topic reference
   - 🩷 Pink dashed = Self-loop

2. Missing topics appear as loud "broken stars":
   - Purple hollow rings + cracks + beacon strobe
   - Label: "MISSING: <topic_id>"
   - Impossible to miss

3. Click missing topic → Debug panel opens:
   - Shows all relationships referencing that topic
   - Each row shows issue pill with tooltip
     (hover to see plain-English hints + expected arrow for 🔴)
   - SQL fix bundle auto-generated

4. Click "Copy SQL" → Paste into Supabase SQL editor → Execute

5. Refresh galaxy → Repeat until clean

6. Once clean, switch mode from "flipAndFlag" → "flipOnly" or "hideInvalid"

*/

// ============================================
// Post-Cleanup Modes
// ============================================

/*
After cleanup is complete and data is trustworthy:

mode: "flipOnly"
- Still auto-flips backwards prerequisites for correct visualization
- No colored overlays or console warnings
- Production-ready mode

mode: "hideInvalid"
- Drops invalid links entirely from visualization
- Strictest mode, requires perfect data

mode: "flagOnly"
- Shows colored overlays but doesn't flip arrows
- Useful for final verification pass

*/

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKnowledgeGalaxyWithDQ);
} else {
    initKnowledgeGalaxyWithDQ();
}
