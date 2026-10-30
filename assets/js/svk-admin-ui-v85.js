/* SVK V85 – zeigt an, wer angemeldet ist und für welchen Bereich, plus Link zur Website.
   Liest nur das eigene Profil (wie bisher), ändert keine Daten und keine Rechte. */
(function () {
  var ROLES = {
    admin: 'Administrator',
    editor: 'Redaktion (alle Bereiche)',
    herren_news_redaktion: 'Herren-Redaktion',
    damen_redaktion: 'Damen-Redaktion',
    jugend_redaktion: 'Jugend-Redaktion',
    foerderverein_redaktion: 'Förderverein'
  };
  function el(id) { return document.getElementById(id); }

  // Login: kleiner Hinweis + Link zurück zur Website
  var login = el('login');
  if (login && !login.querySelector('.svk-login-foot')) {
    var foot = document.createElement('p');
    foot.className = 'svk-login-foot';
    foot.innerHTML = 'Zugang nur für Redakteurinnen und Redakteure der SpVgg Kaufbeuren. <a href="/">Zur Website</a>';
    login.appendChild(foot);
  }

  // Kopfbereich: Website-Link + Abmelden gruppieren, Platz für "Angemeldet als"
  var header = document.querySelector('#app > header');
  var logout = el('logout');
  if (header && logout && !header.querySelector('.svk-head-actions')) {
    var actions = document.createElement('div');
    actions.className = 'svk-head-actions';
    var site = document.createElement('a');
    site.href = '/'; site.target = '_blank'; site.rel = 'noopener';
    site.textContent = 'Website ansehen ↗';
    actions.appendChild(site);
    header.insertBefore(actions, logout);
    actions.appendChild(logout);
    var who = document.createElement('div');
    who.className = 'svk-whoami';
    who.hidden = true;
    var titleBox = header.querySelector('div');
    if (titleBox) titleBox.appendChild(who);
  }

  function showWho() {
    var C = window.SVK_SUPABASE, who = document.querySelector('.svk-whoami');
    if (!who || !C || !window.supabase) return;
    var sb = window.supabase.createClient(C.url, C.anonKey);
    sb.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (!s) { who.hidden = true; return; }
      return sb.from('profiles').select('full_name,role').eq('id', s.user.id).maybeSingle().then(function (res) {
        var p = res && res.data;
        if (!p) return;
        var name = p.full_name || s.user.email || '';
        who.innerHTML = 'Angemeldet als <b></b> <span class="svk-role"></span>';
        who.querySelector('b').textContent = name;
        who.querySelector('.svk-role').textContent = ROLES[p.role] || p.role;
        who.hidden = false;
      });
    }).catch(function () {});
  }

  // Nach dem Login erscheint #app – dann Rolle anzeigen
  var app = el('app');
  if (app && window.MutationObserver) {
    new MutationObserver(function () {
      if (!app.classList.contains('hidden')) showWho();
    }).observe(app, { attributes: true, attributeFilter: ['class'] });
  }
  if (app && !app.classList.contains('hidden')) showWho();
})();
