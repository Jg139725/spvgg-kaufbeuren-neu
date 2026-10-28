(() => {
  const root = document.querySelector('[data-frauen-live]');
  if (!root) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const date = value => new Intl.DateTimeFormat('de-DE', {weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value + 'T12:00:00'));
  const meta = g => `${esc(date(g.date))}${g.time ? ` · ${esc(g.time)} Uhr` : ''}`;
  const upcoming = g => {
    // Compare wall-clock values in Germany, independently of the visitor's timezone.
    const parts = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p => [p.type,p.value]));
    const now = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    return !g.score && !g.cancelled && `${g.date}T${g.time || '00:00'}` > now;
  };
  const card = (title, game, kind) => {
    if (!game) return `<article class="live-game-card ${kind}"><span class="live-game-label">${title}</span><p>Aktuell kein Spiel verfügbar.</p></article>`;
    const result = game.score || (kind === 'last' ? 'Ergebnis ausstehend' : 'VS');
    return `<article class="live-game-card ${kind}"><div class="live-game-top"><span class="live-game-label">${title}</span><time>${meta(game)}</time></div><div class="live-game-match"><strong>${esc(game.home)}</strong><strong class="live-score">${esc(result)}</strong><strong>${esc(game.away)}</strong></div>${game.venue ? `<p>${esc(game.venue)}</p>` : ''}</article>`;
  };
  async function load() {
    try {
      const response = await fetch(`../data/frauen-spiele.json?v=${Date.now()}`, {cache:'no-store'});
      if (!response.ok) throw new Error(response.status);
      const data = await response.json();
      const fixtures = (data.fixtures || []).filter(upcoming);
      const rows = (data.table || []).map(r => `<tr class="${r.team === 'SpVgg Kaufbeuren' ? 'svk' : ''}">${['pos','team','played','won','drawn','lost','goals','diff','points'].map(k => `<td>${esc(r[k])}</td>`).join('')}</tr>`).join('');
      root.innerHTML = `<div class="live-games-grid">${card('Nächstes Spiel', fixtures[0], 'next')}${card('Letztes Spiel', data.lastGame, 'last')}</div>
        <h3>Kommende Spiele</h3><div class="match-list">${fixtures.map(g => `<article class="match-row"><div class="match-date">${meta(g)}</div><div class="match-teams"><strong>${esc(g.home)}</strong><span>–</span><strong>${esc(g.away)}</strong></div><div class="match-place">${esc(g.venue)}</div></article>`).join('') || '<p>Aktuell sind keine kommenden Spiele gemeldet.</p>'}</div>
        <h3>Tabelle · ${esc(data.competition)}</h3><div class="frauen-table-scroll" role="region" aria-label="Tabelle Frauen BOL" tabindex="0"><table class="frauen-table"><thead><tr>${['Pl.','Verein','Sp.','S','U','N','Tore','Diff.','Pkt.'].map(t => `<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${rows || '<tr><td colspan="9">Keine Tabellendaten verfügbar.</td></tr>'}</tbody></table></div>
        <p class="live-updated">Stand: ${esc(new Date(data.updatedAt).toLocaleString('de-DE', {timeZone:'Europe/Berlin'}))} · Stündlicher BFV-Abgleich · <a href="https://www.bfv.de/mannschaften/-/016PA7VSOC000000VV0AG80NVV8OQVTB" target="_blank" rel="noopener">Zum BFV</a></p>`;
    } catch (error) {
      root.innerHTML = '<p class="live-error">Spielplan und Tabelle konnten gerade nicht geladen werden. <a href="https://www.bfv.de/mannschaften/-/016PA7VSOC000000VV0AG80NVV8OQVTB">Aktuelle Daten beim BFV ansehen</a></p>';
    }
  }
  load();
  setInterval(load, 300000);
})();
