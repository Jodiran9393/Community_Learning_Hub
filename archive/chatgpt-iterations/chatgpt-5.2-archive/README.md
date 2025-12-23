# ChatGPT 5.2 Archive

This directory contains the 13 superseded/historical files from the ChatGPT 5.2 Thinking conversation that were consolidated into production modules.

## Archive Date
December 13, 2025

## Archived Files

### Validation Experiments (Early versions - superseded by data-quality-audit-normalize.js)
- validation-prerequisites-drop-in.js
- validator-flip-flag-warn.js
- prerequisites-one-liner.js (usage example)

### Galaxy Visualization (Early versions - consolidated into dq-galaxy-visualization.js)
- flagged-prerequisite-links.js (basic red dashed, one issue type only)
- missing-topic-placeholder-nodes.js (basic broken star)
- pulsinganimation-ring-label-bounce.js (basic pulse)

### Debug Panel Enhancements (Patches - consolidated into dq-debug-panel-v2.js)
- normalized-flagged-links.js (patch 1: normalizedLinks integration)
- single-pill-tooltip.js (patch 2: single primary pill)
- add-hint-generator.js (patch 3: plain-English hints)
- expected-prerequisite-arrow.js (patch 4: expected arrow for 🔴)
- fixes-selected-N-counter.js (narrower version - missing topic only)
- smart-autoselect-counter.js (patch 5: generalized auto-select + counter)

## Production Files (Active)

These files replaced the archived versions:

**Core (use as-is):**
- chatgpt-5.2-data-quality-audit-normalize.js
- chatgpt-5.2-mapping-layer.js
- chatgpt-5.2-fix1.js

**Consolidated Modules:**
- dq-galaxy-visualization.js (NEW - replaces 3 archived viz files)
- dq-debug-panel-v2.js (NEW - base panel + 6 archived patches)
- dq-integration-example.js (NEW - complete usage guide)

## Notes

The 👴↔🌌 conversation evolved the DQ system through 9 refinement stages. These archived files document that evolution but are no longer needed for production use.

For the complete design spec, see: `Knowledge_Galaxy_DQ_Docs/dq/README.md`
