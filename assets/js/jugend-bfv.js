/* Nächste 3 Spiele + aktuelle Tabelle auf den Jugendseiten.
   Daten: data/jugend-bfv.json (wird per GitHub Action aus den BFV-Daten erzeugt,
   siehe scripts/update_jugend_bfv.py). */
(function () {
  var box = document.querySelector('[data-jugend-bfv]');
  if (!box) return;
  var key = box.getAttribute('data-jugend-bfv');
  var TAGE = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function kickoff(m) {
    var p = m.date.split('-');
    var t = (m.time || '23:59').split(':');
    return new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]);
  }

  // Ein Spiel bleibt bis zwei Stunden nach Anpfiff stehen (ohne Uhrzeit: bis Tagesende)
  function upcoming(matches) {
    var now = Date.now();
    return (matches || []).filter(function (m) {
      return kickoff(m).getTime() + (m.time ? 2 * 3600e3 : 0) >= now;
    }).slice(0, 3);
  }

  function matchCard(m) {
    var d = kickoff(m);
    var datum = TAGE[d.getDay()] + ' ' + m.date.split('-').reverse().join('.');
    var art = m.typ === 'Meisterschaften' ? 'Punktspiel'
      : m.typ === 'Freundschaftsspiele' ? 'Freundschaftsspiel'
      : m.typ === 'Pokale' ? 'Pokal'
      : /Hallen/.test(m.typ) ? 'Hallenturnier'
      : m.typ === 'Turniere' ? 'Turnier' : m.typ;
    return '<article class="jbfv-match">' +
      '<div class="jbfv-match-top"><span class="jbfv-date">' + esc(datum) + '</span>' +
      '<span class="jbfv-badge' + (m.heim ? ' is-home' : '') + '">' + (m.heim ? 'Heim' : 'Auswärts') + '</span></div>' +
      '<p class="jbfv-time">' + (m.time ? esc(m.time) + ' Uhr' : 'Uhrzeit offen') + '</p>' +
      '<p class="jbfv-teams"><span' + (m.heim ? ' class="is-svk"' : '') + '>' + esc(m.home) + '</span>' +
      '<small>gegen</small>' +
      '<span' + (m.heim ? '' : ' class="is-svk"') + '>' + esc(m.away) + '</span></p>' +
      '<p class="jbfv-comp">' + esc(art) + '</p>' +
      '</article>';
  }

  function tableHtml(g) {
    var rows = g.table.map(function (r) {
      var diff = r.diff > 0 ? '+' + r.diff : r.diff;
      return '<tr' + (r.svk ? ' class="is-svk"' : '') + '>' +
        '<td class="jbfv-pos">' + esc(r.pos) + '</td>' +
        '<th scope="row">' + esc(r.name) + '</th>' +
        '<td>' + esc(r.sp) + '</td>' +
        '<td class="jbfv-opt">' + esc(r.s) + '</td>' +
        '<td class="jbfv-opt">' + esc(r.u) + '</td>' +
        '<td class="jbfv-opt">' + esc(r.n) + '</td>' +
        '<td>' + esc(diff) + '</td>' +
        '<td class="jbfv-pts">' + esc(r.pkt) + '</td></tr>';
    }).join('');
    return '<div class="jbfv-table-card">' +
      '<div class="jbfv-table-head"><h4>Tabelle</h4><span>' + esc(g.wettbewerb) + '</span></div>' +
      '<div class="jbfv-table-scroll"><table class="jbfv-table"><thead><tr>' +
      '<th scope="col">Pl.</th><th scope="col">Mannschaft</th><th scope="col" title="Spiele">Sp.</th>' +
      '<th scope="col" class="jbfv-opt" title="Siege">S</th><th scope="col" class="jbfv-opt" title="Unentschieden">U</th>' +
      '<th scope="col" class="jbfv-opt" title="Niederlagen">N</th><th scope="col" title="Tordifferenz">Diff.</th>' +
      '<th scope="col" title="Punkte">Pkt.</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function groupHtml(g, showLabel) {
    var next = upcoming(g.matches);
    var html = '<div class="jbfv-group">';
    if (showLabel) html += '<h3 class="jbfv-group-title">' + esc(g.label) + '</h3>';
    html += next.length
      ? '<div class="jbfv-matches">' + next.map(matchCard).join('') + '</div>'
      : '<p class="jbfv-empty">Aktuell sind beim BFV keine Spiele angesetzt.</p>';
    if (g.table && g.table.length) html += tableHtml(g);
    html += '<p class="jbfv-source">Quelle: <a href="' + esc(g.url) + '" target="_blank" rel="noopener">BFV</a></p>';
    return html + '</div>';
  }

  function render(data) {
    var groups = (data.teams && data.teams[key]) || [];
    if (!groups.length) return;
    // Mannschaften ohne Spiele und ohne Tabelle ausblenden, solange eine andere etwas zu zeigen hat
    var filled = groups.filter(function (g) {
      return upcoming(g.matches).length || (g.table && g.table.length);
    });
    var hasTable = groups.some(function (g) { return g.table && g.table.length; });
    var html = '<div class="youth-title"><span class="section-kicker">Spielbetrieb</span>' +
      '<h2>' + (hasTable ? 'Nächste Spiele und Tabelle' : 'Nächste Spiele') + '</h2></div>';

    if (!filled.length) {
      html += '<div class="jbfv-group"><p class="jbfv-empty">Aktuell sind beim BFV keine Spiele angesetzt. ' +
        'In dieser Altersklasse wird ohne Tabelle gespielt.</p></div>';
    } else {
      html += filled.map(function (g) { return groupHtml(g, filled.length > 1); }).join('');
      if (!hasTable) html += '<p class="jbfv-note">In dieser Altersklasse wird ohne Tabelle gespielt.</p>';
    }
    if (data.updatedAt) {
      var u = new Date(data.updatedAt);
      if (!isNaN(u)) html += '<p class="jbfv-updated">Stand: ' + u.toLocaleDateString('de-DE') + ', ' +
        u.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr</p>';
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  fetch('../data/jugend-bfv.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(render)
    .catch(function () { /* ohne Daten bleibt der Bereich ausgeblendet */ });
})();
