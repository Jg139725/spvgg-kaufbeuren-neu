(() => {
  const fixturesRoot = document.getElementById("hs-fixtures");
  const tableRoot = document.getElementById("hs-table-body");
  const updatedRoot = document.getElementById("hs-updated");

  const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  const fmt = iso => {
    const d = new Date(iso + "T12:00:00");
    return new Intl.DateTimeFormat("de-DE", {weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
  };

  async function load(){
    try{
      const r = await fetch(`../data/herren-spielplan.json?v=${Date.now()}`, {cache:"no-store"});
      if(!r.ok) throw new Error("HTTP "+r.status);
      const d = await r.json();

      fixturesRoot.innerHTML = (d.fixtures || []).slice(0,10).map((g,i)=>`
        <article class="hs-game">
          <div class="hs-date">${esc(fmt(g.date))}<small>${esc(g.time)} Uhr</small></div>
          <div class="hs-teams"><strong>${esc(g.home)}</strong><span class="hs-vs">VS</span><strong>${esc(g.away)}</strong></div>
          <div class="hs-venue">${esc(g.venue || "")}</div>
        </article>`).join("") || `<div class="hs-loading">Aktuell sind keine kommenden Spiele hinterlegt.</div>`;

      tableRoot.innerHTML = (d.table || []).map(row=>`
        <tr class="${row.team === "SpVgg Kaufbeuren" ? "svk" : ""}">
          <td>${esc(row.pos)}</td><td>${esc(row.team)}</td><td>${esc(row.played)}</td>
          <td>${esc(row.won)}</td><td>${esc(row.drawn)}</td><td>${esc(row.lost)}</td>
          <td>${esc(row.goals)}</td><td>${esc(row.diff)}</td><td><strong>${esc(row.points)}</strong></td>
        </tr>`).join("");

      updatedRoot.textContent = d.updatedAt ? "Automatisch aktualisiert · " + new Date(d.updatedAt).toLocaleString("de-DE") : "";
    }catch(e){
      fixturesRoot.innerHTML = `<div class="hs-loading">Spielplan konnte gerade nicht geladen werden.</div>`;
      tableRoot.innerHTML = `<tr><td colspan="9">Tabelle konnte gerade nicht geladen werden.</td></tr>`;
    }
  }

  load();
  setInterval(load, 300000);
})();