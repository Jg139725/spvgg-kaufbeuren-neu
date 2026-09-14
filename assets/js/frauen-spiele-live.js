(() => {
  const root = document.querySelector("[data-frauen-live]");
  if (!root) return;

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  const fmtDate = iso => {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return new Intl.DateTimeFormat("de-DE", {
      weekday:"short", day:"2-digit", month:"2-digit", year:"numeric"
    }).format(d);
  };

  const gameCard = (title, game, kind) => {
    if (!game) {
      return `<article class="live-game-card ${kind}">
        <span class="live-game-label">${esc(title)}</span>
        <h3>Noch kein Spiel verfügbar</h3>
      </article>`;
    }
    const score = game.score ? `<strong class="live-score">${esc(game.score)}</strong>` : `<strong class="live-vs">VS</strong>`;
    return `<article class="live-game-card ${kind}">
      <div class="live-game-top">
        <span class="live-game-label">${esc(title)}</span>
        <time>${esc(fmtDate(game.date))} · ${esc(game.time)} Uhr</time>
      </div>
      <div class="live-game-match">
        <strong>${esc(game.home)}</strong>
        ${score}
        <strong>${esc(game.away)}</strong>
      </div>
      ${game.venue ? `<p class="live-venue">${esc(game.venue)}</p>` : ""}
    </article>`;
  };

  async function load(){
    try{
      const res = await fetch(`../data/frauen-spiele.json?v=${Date.now()}`, {cache:"no-store"});
      if(!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      root.innerHTML = `
        <div class="live-games-grid">
          ${gameCard("Nächstes Spiel", data.nextGame, "next")}
          ${gameCard("Letztes Spiel", data.lastGame, "last")}
        </div>
        <div class="live-updated">Automatisch aktualisiert · Stand ${new Date(data.updatedAt).toLocaleString("de-DE")}</div>
      `;
    }catch(e){
      root.innerHTML = `<div class="live-error">Spielinformationen konnten gerade nicht geladen werden.</div>`;
    }
  }

  load();
  setInterval(load, 300000);
})();