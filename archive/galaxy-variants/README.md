# Galaxy Variants Archive

This directory contains archived versions of the Knowledge Galaxy visualization.

## Production Version
**Current**: `galaxy-dynamic.html` (in parent directory)
- Latest iteration with proper Supabase architecture
- Demo/auth mode switching
- Database-driven topics
- Fixed for production use

## Development Tool
**Current**: `galaxy-dq.html` (in parent directory)
- Data Quality debugging tool
- Shows broken relationships
- SQL fix generation
- NOT for production deployment

## Archived Variants (This Directory)
The following files are historical iterations kept for reference:

### galaxy-live.html
- Original hardcoded 14-topic version
- No database integration
- Template for early development

### galaxy-v2.html
- Second iteration
- Experimental features

### galaxy-embed.html
- Iframe embedding version
- Had postMessage security issue (fixed before archiving)

### galaxy-constellation.html
- Constellation pattern experiment

### galaxy-debug.html
- Early debugging version

### demo-constellation.html
- Demo/testing variant

### test-constellation.html
- Testing environment version

---

**Note**: These files are preserved for reference and backwards compatibility research. 
Do not use for new development. Use `galaxy-dynamic.html` instead.
