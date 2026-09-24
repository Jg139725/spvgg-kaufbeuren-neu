(() => {
  "use strict";

  const SUPABASE_URL = "https://tjfnjdzqlrblvwfmswvp.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9hRarZ9dtcz6swzErkdaQQ_7o0FK_5R";
  const cacheBust = () => `v=${Date.now()}`;

  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  const fmtDate = iso => {
    if (!iso) return "";
    const [y,m,d] = iso.slice(0,10).split("-");
    return `${d}.${m}.${y}`;
  };

  async function loadNews() {
    const grid = document.querySelector("#aktuelles .news-grid");
    if (!grid) return;

    const url = `${SUPABASE_URL}/rest/v1/news?select=id,category,date,title,teaser,content,image_url,published_at,status&status=eq.published&order=published_at.desc.nullslast,date.desc&limit=3`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: "no-store"
    });
    if (!r.ok) throw new Error(`News HTTP ${r.status}`);
    const news = await r.json();
    if (!Array.isArray(news) || !news.length) return; // alte Karten bleiben als Fallback

    grid.innerHTML = news.map((n,i) => {
      const img = n.image_url || "assets/images/logo-top.png";
      const href = `news.html?id=${encodeURIComponent(n.id)}`;
      return `<article class="news-card${i===0 ? " news-card--large" : ""}">
        <a class="news-card__image" href="${href}">
          <img src="${esc(img)}" alt="${esc(n.title)}" loading="lazy">
          <span class="category">${esc(n.category || "SVK")}</span>
        </a>
        <div class="news-card__body">
          <time datetime="${esc(n.date || "")}">${esc(fmtDate(n.date))}</time>
          <h3>${esc(n.title)}</h3>
          <p>${esc(n.teaser || "")}</p>
          <a href="${href}">Weiterlesen →</a>
        </div>
      </article>`;
    }).join("");
  }

  async function loadNextMatch() {
    const section = document.querySelector("#spiele");
    if (!section) return;
    const r = await fetch(`data/herren-spielplan.json?${cacheBust()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`Spielplan HTTP ${r.status}`);
    const data = await r.json();
    const games = Array.isArray(data.fixtures) ? data.fixtures : [];
    if (!games.length) return;

    const now = new Date();
    const game = games
      .map(g => ({...g, _dt:new Date(`${g.date}T${g.time || "00:00"}:00`)}))
      .filter(g => !Number.isNaN(g._dt.getTime()) && g._dt >= now)
      .sort((a,b) => a._dt-b._dt)[0] || games[0];

    const dateEl = section.querySelector(".match-date");
    if (dateEl) {
      const d = new Date(`${game.date}T12:00:00`);
      dateEl.textContent = `${d.toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})} · ${game.time} Uhr`;
    }

    const teams = section.querySelectorAll(".match-team strong");
    if (teams[0]) teams[0].textContent = game.home;
    if (teams[1]) teams[1].textContent = game.away;

    const logos = section.querySelectorAll(".match-team .team-logo");
    if (logos[0]) logos[0].textContent = initials(game.home);
    if (logos[1]) logos[1].textContent = initials(game.away);

    const center = section.querySelector(".match-center");
    if (center) {
      const label = center.querySelector("span");
      const vs = center.querySelector("b");
      const venue = center.querySelector("small");
      if (label) label.textContent = data.competition || "BZL Schwaben Süd";
      if (vs) vs.textContent = "VS";
      if (venue) venue.textContent = game.venue || (game.home === "SpVgg Kaufbeuren" ? "Parkstadion Kaufbeuren" : "Auswärtsspiel");
    }

    const btn = section.querySelector(".match-card > a.button");
    if (btn) {
      btn.href = "herren/spielplan.html";
      btn.textContent = "Zum Spielplan";
    }
  }

  function initials(name) {
    if (name === "SpVgg Kaufbeuren") return "SVK";
    const words = name.replace(/\d+/g,"").trim().split(/\s+/);
    return words.slice(0,3).map(w => w[0]).join("").toUpperCase();
  }

  async function refresh() {
    await Promise.allSettled([loadNews(), loadNextMatch()]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, {once:true});
  } else {
    refresh();
  }
  setInterval(refresh, 5 * 60 * 1000);
})();
