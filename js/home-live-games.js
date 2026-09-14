(() => {
  const root = document.getElementById("home-live-games");
  if (!root) return;

  const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  const dateText = iso => {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
    }).format(d);
  };

  const renderGame = (label, g, type) => {
    if (!g) return `
      <article class="home-game-card ${type}">
        <span class="home-game-label">${label}</span>
        <h3>Noch kein Spiel eingetragen</h3>
      </article>`;

    const center = g.score
      ? `<span class="home-game-score">${esc(g.score)}</span>`
      : `<span class="home-game-score">VS</span>`;

    return `
      <article class="home-game-card ${type}">
        <div class="home-game-meta">
          <span class="home-game-label">${label}</span>
          <span>${esc(dateText(g.date))} · ${esc(g.time)} Uhr</span>
        </div>
        <div class="home-game-teams">
          <strong>${esc(g.home)}</strong>
          ${center}
          <strong>${esc(g.away)}</strong>
        </div>
        ${g.venue ? `<div class="home-game-venue">${esc(g.venue)}</div>` : ""}
      </article>`;
  };

  async function load() {
    try {
      const r = await fetch(`data/herren-spiele.json?v=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();

      root.innerHTML = `
        ${renderGame("Nächstes Spiel", d.nextGame, "next")}
        ${renderGame("Letztes Spiel", d.lastGame, "last")}
        <div class="home-game-updated">Automatisch aktualisiert · ${new Date(d.updatedAt).toLocaleString("de-DE")}</div>
      `;
    } catch (e) {
      root.innerHTML = `<div class="home-live-loading">Spieldaten konnten gerade nicht geladen werden.</div>`;
    }
  }

  load();
  setInterval(load, 300000);
})();