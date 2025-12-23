// js/intelligence-cards.js
// Learning Intelligence cards / “Your Learning Context” section.
//
// DEMO mode: show helpful marketing + onboarding cards.
// AUTH mode: show user-specific progress insights (based on user_progress + profile tables if available).

(() => {
  const sb = window.sb;
  if (!sb) {
    console.error("[CLH] window.sb missing. Ensure /js/supabase-client.js loads before intelligence-cards.js");
    return;
  }

  const el = document.getElementById("learning-context-container");
  if (!el) return;

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function card({ title, body, ctaText, ctaHref }) {
    const cta = ctaText && ctaHref
      ? `<a class="context-cta" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaText)} →</a>`
      : "";
    return `
      <div class="context-card">
        <div class="context-title">${escapeHtml(title)}</div>
        <div class="context-body">${body}</div>
        ${cta}
      </div>
    `;
  }

  async function getSession() {
    const { data: { session } } = await sb.auth.getSession();
    return session ?? null;
  }

  async function renderDemo() {
    el.innerHTML = [
      card({
        title: "🌌 Public Preview Mode",
        body: "You’re exploring a safe demo slice of the Knowledge Galaxy. Sign in to unlock personalized progress tracking, recommendations, and advanced pathways.",
        ctaText: "Sign in",
        ctaHref: "/auth.html",
      }),
      card({
        title: "🧭 Start with one track",
        body: "Pick one outcome (AI/LLMs, Data Analytics, or Frontend) and we’ll place you in a starting constellation that matches your current level.",
        ctaText: "Get started",
        ctaHref: "/auth.html",
      }),
      card({
        title: "🧪 Evidence-first learning",
        body: "When we generate explanations, we’ll prefer grounded sources (citations) and clearly flag uncertainty—so you build reliable understanding, not vibes.",
      }),
    ].join("");
  }

  async function renderAuthed(user) {
    // Primary: summarize user_progress (safe and always relevant)
    const { data: progress, error } = await sb
      .from("user_progress")
      .select("status")
      .eq("user_id", user.id);

    if (error) {
      console.warn("[CLH] Could not read user_progress (RLS?):", error);
      // If RLS blocks, fall back to demo-like messaging but keep “signed in” tone
      el.innerHTML = card({
        title: "✅ Signed in",
        body: "You’re authenticated. If you don’t see insights yet, it may just mean you haven’t started a track—or RLS policies are still being refined.",
      });
      return;
    }

    const completed = (progress || []).filter(p => p.status === "completed").length;
    const inProgress = (progress || []).filter(p => p.status === "in_progress").length;
    const started = completed + inProgress;

    el.innerHTML = [
      card({
        title: "📈 Your Momentum",
        body: `You’ve started <b>${started}</b> topics — <b>${completed}</b> completed, <b>${inProgress}</b> in progress.`,
        ctaText: "View profile",
        ctaHref: "/profile.html",
      }),
      card({
        title: "🎯 Next best step",
        body: "Open the Galaxy and click a blue node that has prerequisites satisfied (or a root node with no prerequisites). We’ll refine the “next” recommendation engine next.",
        ctaText: "Explore Galaxy",
        ctaHref: "/#galaxy-hero",
      }),
      card({
        title: "🔒 Your data stays yours",
        body: "Your progress rows are protected by RLS so other users can’t read or modify them. Public visitors only see demo tables.",
      }),
    ].join("");
  }

  async function init() {
    const session = await getSession();
    if (!session?.user) {
      await renderDemo();
      return;
    }
    await renderAuthed(session.user);
  }

  window.addEventListener("DOMContentLoaded", init);
})();
