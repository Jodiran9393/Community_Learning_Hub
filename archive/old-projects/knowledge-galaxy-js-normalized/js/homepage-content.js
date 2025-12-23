// js/homepage-content.js
// Homepage data loader for:
// - Featured Learning Paths
// - Topic Categories
// - Platform Statistics
//
// Must work in two modes:
// - DEMO (logged out): reads demo tables only
// - AUTH (logged in): reads published production tables + user-specific tables when needed
//
// REQUIREMENT: This file must never create a Supabase client. It must use window.sb.

(() => {
  const sb = window.sb;
  if (!sb) {
    console.error("[CLH] window.sb missing. Ensure /js/supabase-client.js loads before homepage-content.js");
    return;
  }

  const elPaths = document.getElementById("learning-paths-container");
  const elCats = document.getElementById("topic-categories-container");
  const elStats = document.getElementById("stats-container");

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function getMode() {
    const { data: { session } } = await sb.auth.getSession();
    const isAuthed = !!session?.user;
    return { isAuthed, user: session?.user ?? null };
  }

  async function fetchTopicsAndRels(isAuthed) {
    const TOPICS_TABLE = isAuthed ? "learning_topics" : "demo_learning_topics";
    const RELS_TABLE = isAuthed ? "topic_relationships" : "demo_topic_relationships";

    // Topics
    let tq = sb.from(TOPICS_TABLE).select("*").order("display_order", { ascending: true });
    if (isAuthed) tq = tq.eq("is_published", true);

    const { data: topics, error: tErr } = await tq;
    if (tErr) throw tErr;

    // Relationships (pull enough fields to render “meaningful” paths)
    const { data: rels, error: rErr } = await sb
      .from(RELS_TABLE)
      .select("from_topic,to_topic,relationship_type,strength");

    if (rErr) throw rErr;

    return { TOPICS_TABLE, RELS_TABLE, topics: topics ?? [], rels: rels ?? [] };
  }

  function groupByCategory(topics) {
    const map = new Map();
    for (const t of topics) {
      const cat = t.category || "uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(t);
    }
    // sort each category by display_order when present
    for (const [cat, arr] of map.entries()) {
      arr.sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999));
      map.set(cat, arr);
    }
    return map;
  }

  function buildSuggestedPaths(topics, rels) {
    // Use prerequisite edges when possible; otherwise fall back to any edges.
    const nodeById = new Map(topics.map(t => [t.id, t]));
    const edges = rels
      .filter(r => r?.from_topic && r?.to_topic && nodeById.has(r.from_topic) && nodeById.has(r.to_topic))
      .filter(r => !r.relationship_type || r.relationship_type === "prerequisite" || r.relationship_type === "related");

    // indegree + adjacency
    const indeg = new Map();
    const adj = new Map();
    for (const t of topics) {
      indeg.set(t.id, 0);
      adj.set(t.id, []);
    }
    for (const e of edges) {
      indeg.set(e.to_topic, (indeg.get(e.to_topic) || 0) + 1);
      adj.get(e.from_topic).push(e);
    }

    // Candidate roots: low indegree
    const roots = topics
      .slice()
      .sort((a, b) => (indeg.get(a.id) || 0) - (indeg.get(b.id) || 0))
      .slice(0, 12);

    // Build up to 3 linear “paths” by following highest-strength outgoing edges
    const paths = [];
    const used = new Set();

    for (const r of roots) {
      if (paths.length >= 3) break;
      if (used.has(r.id)) continue;

      const path = [r.id];
      used.add(r.id);

      let current = r.id;
      for (let step = 0; step < 8; step++) {
        const outs = (adj.get(current) || [])
          .slice()
          .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));

        const next = outs.find(o => !used.has(o.to_topic));
        if (!next) break;

        path.push(next.to_topic);
        used.add(next.to_topic);
        current = next.to_topic;
      }

      if (path.length >= 3) paths.push(path);
    }

    return paths.map(ids => ids.map(id => nodeById.get(id)).filter(Boolean));
  }

  function renderPaths(paths, modeLabel) {
    if (!elPaths) return;

    if (!paths.length) {
      elPaths.innerHTML = `<div class="path-loading">No paths available in ${escapeHtml(modeLabel)} mode.</div>`;
      return;
    }

    elPaths.innerHTML = paths
      .map((p, i) => {
        const title = `Path ${i + 1}`;
        const items = p.map(t => `<li>${escapeHtml(t.icon_emoji || "⭐")} ${escapeHtml(t.name || t.id)}</li>`).join("");
        return `
          <div class="path-card">
            <div class="path-title">${escapeHtml(title)}</div>
            <div class="path-meta">${escapeHtml(modeLabel)} preview</div>
            <ul class="path-list">${items}</ul>
          </div>
        `;
      })
      .join("");
  }

  function renderCategories(catMap, isAuthed) {
    if (!elCats) return;

    const entries = Array.from(catMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) {
      elCats.innerHTML = `<div class="categories-loading">No topics available.</div>`;
      return;
    }

    elCats.innerHTML = entries
      .map(([cat, arr]) => {
        const top = arr.slice(0, 6);
        const pills = top
          .map(t => `<span class="topic-pill">${escapeHtml(t.icon_emoji || "•")} ${escapeHtml(t.name || t.id)}</span>`)
          .join("");

        const cta = isAuthed
          ? `<a class="category-cta" href="#galaxy-hero">Explore ${escapeHtml(cat)} →</a>`
          : `<a class="category-cta" href="/auth.html">Sign in to personalize →</a>`;

        return `
          <div class="category-card">
            <div class="category-title">${escapeHtml(cat)}</div>
            <div class="category-count">${arr.length} topics</div>
            <div class="category-pills">${pills}</div>
            ${cta}
          </div>
        `;
      })
      .join("");
  }

  function renderStats({ topicCount, relCount, catCount, modeLabel }) {
    if (!elStats) return;

    elStats.innerHTML = `
      <div class="stat-card">
        <div class="stat-number">${topicCount}</div>
        <div class="stat-name">Topics (${escapeHtml(modeLabel)})</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${relCount}</div>
        <div class="stat-name">Connections</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${catCount}</div>
        <div class="stat-name">Categories</div>
      </div>
    `;
  }

  async function init() {
    try {
      const { isAuthed } = await getMode();
      const modeLabel = isAuthed ? "AUTH" : "DEMO";

      const { topics, rels } = await fetchTopicsAndRels(isAuthed);
      const catMap = groupByCategory(topics);
      const paths = buildSuggestedPaths(topics, rels);

      renderPaths(paths, modeLabel);
      renderCategories(catMap, isAuthed);
      renderStats({
        topicCount: topics.length,
        relCount: rels.length,
        catCount: catMap.size,
        modeLabel,
      });
    } catch (err) {
      console.error("[CLH] homepage-content init failed:", err);
      if (elPaths) elPaths.innerHTML = `<div class="path-loading">Could not load content.</div>`;
      if (elCats) elCats.innerHTML = `<div class="categories-loading">Could not load topics.</div>`;
      if (elStats) elStats.innerHTML = `<div class="stats-loading">Could not load stats.</div>`;
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
