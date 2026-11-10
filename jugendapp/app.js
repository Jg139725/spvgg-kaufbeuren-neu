/* SVK Jugend-App V1
   Rollen:  Leitung  = profiles.role admin/jugend_redaktion ODER freigegebenes App-Mitglied mit rolle 'leitung'
            Trainer  = freigegebenes App-Mitglied, sieht nur seine Teams (Datenbank-Regeln erzwingen das zusätzlich)
   Tabellen: jugend_spielverlegungen, jugend_app_mitglieder, team_staff (area = 'Jugend') */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = window.SVK_SUPABASE;
  if (!C || !window.supabase) { document.body.innerHTML = '<p style="padding:20px">Die App konnte nicht geladen werden. Bitte Internetverbindung prüfen.</p>'; return; }
  const sb = window.supabase.createClient(C.url, C.anonKey);

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

  const LEITUNG_ROLES = ['admin', 'jugend_redaktion'];
  const TEAMS = [['u19','U19'],['u17','U17'],['u15','U15'],['u13','U13'],['u12','U12'],['u11','U11'],['u10','U10'],['u09','U09'],['u08','U08'],['g-jugend','G1/G2'],['maedels','Mädels']];
  const STATUS = {
    offen:      { label: 'Offen',              next: 'angefragt',  nextLabel: 'Als angefragt markieren' },
    angefragt:  { label: 'Angefragt',          next: 'zugestimmt', nextLabel: 'Gegner hat zugestimmt' },
    zugestimmt: { label: 'Zugestimmt',         next: 'beantragt',  nextLabel: 'Beim BFV beantragt' },
    beantragt:  { label: 'Beim BFV beantragt', next: 'erledigt',   nextLabel: 'Bestätigt – erledigt' },
    erledigt:   { label: 'Erledigt' },
    abgelehnt:  { label: 'Abgelehnt' }
  };
  const ACTIVE = ['offen', 'angefragt', 'zugestimmt', 'beantragt'];
  const T_V = 'jugend_spielverlegungen', T_M = 'jugend_app_mitglieder';
  const PENDING_KEY = 'svkJugendPendingRegistration';

  const me = { user: null, profile: null, mitglied: null, leitung: false, teams: [] };
  let verlegungen = [], staff = [], mitglieder = [], setupMissing = false;
  let bfv = { games: [], updatedAt: null };
  let personen = [], aufgaben = [], msgMeta = {}, aScope = 'mir', detailId = null, aufgabenMissing = false;
  const T_A = 'jugend_aufgaben', T_N = 'jugend_aufgaben_nachrichten';

  // ---------- Helpers ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const teamName = k => (TEAMS.find(t => t[0] === k) || [k, k])[1];
  const myTeamList = () => me.leitung ? TEAMS : TEAMS.filter(t => me.teams.includes(t[0]));
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function fmtDate(d, long) {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number), dt = new Date(y, m - 1, day);
    return (long ? WDL : WD)[dt.getDay()] + ', ' + String(day).padStart(2, '0') + '.' + String(m).padStart(2, '0') + '.' + (long ? y : String(y).slice(2));
  }
  const fmtTime = t => t ? t.slice(0, 5) + ' Uhr' : '';
  const when = (d, t, long) => [fmtDate(d, long), fmtTime(t)].filter(Boolean).join(', ') || 'noch offen';
  function waNumber(p) {
    let n = String(p || '').replace(/[^\d+]/g, '');
    if (!n) return '';
    if (n.startsWith('+')) n = n.slice(1); else if (n.startsWith('00')) n = n.slice(2); else if (n.startsWith('0')) n = '49' + n.slice(1);
    return n.replace(/\D/g, '');
  }
  const telHref = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
  const waHref = (p, text) => 'https://wa.me/' + waNumber(p) + (text ? '?text=' + encodeURIComponent(text) : '');
  const mailHref = (to, subject, body) => 'mailto:' + encodeURIComponent(to || '').replace(/%40/g, '@').replace(/%2C/gi, ',') + '?subject=' + encodeURIComponent(subject || '') + '&body=' + encodeURIComponent(body || '');
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; }
  }
  const initials = n => (n || '?').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const myName = () => me.mitglied?.name || me.profile?.full_name || 'Jugendleitung';
  const missing = err => err && (['42P01', 'PGRST205', 'PGRST202', '42883'].includes(err.code) || /does not exist|could not find/i.test(err.message || ''));
  const show = id => ['login', 'waiting', 'app'].forEach(s => $(s).hidden = s !== id);
  const setMsg = (el, text, cls = '') => { el.className = 'msg ' + cls; el.textContent = text; };

  // ---------- Anmelden / Registrieren ----------
  $('showRegister').onclick = () => { $('loginForm').hidden = true; $('registerForm').hidden = false; };
  $('showLogin').onclick = () => { $('loginForm').hidden = false; $('registerForm').hidden = true; };

  $('loginForm').onsubmit = async e => {
    e.preventDefault();
    setMsg($('loginMsg'), 'Anmelden …');
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    if (error) {
      if (/confirm/i.test(error.message)) { showResend('Deine E-Mail ist noch nicht bestätigt. Fordere eine neue Bestätigungs-Mail an und klicke den Link darin innerhalb von 1 Stunde.'); return; }
      return setMsg($('loginMsg'), /invalid/i.test(error.message) ? 'E-Mail oder Passwort falsch.' : error.message, 'error');
    }
    setMsg($('loginMsg'), ''); $('resendBtn').hidden = true;
    start();
  };

  // Bestätigungs-Mail erneut senden (Link ist nur ca. 1 Stunde gültig)
  function showResend(text) {
    $('loginForm').hidden = false; $('registerForm').hidden = true;
    setMsg($('loginMsg'), text, 'error');
    $('resendBtn').hidden = false;
  }
  $('resendBtn').onclick = async () => {
    const email = $('email').value.trim();
    if (!email) return setMsg($('loginMsg'), 'Bitte oben deine E-Mail eintragen und dann erneut tippen.', 'error');
    $('resendBtn').disabled = true;
    const { error } = await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: location.origin + '/jugendapp/' } });
    $('resendBtn').disabled = false;
    setMsg($('loginMsg'), error
      ? (/seconds|rate/i.test(error.message) ? 'Bitte kurz warten und es dann noch einmal versuchen.' : error.message)
      : 'Neue Bestätigungs-Mail ist unterwegs (auch im Spam/Junk-Ordner schauen). Bitte den Link innerhalb von 1 Stunde anklicken.', error ? 'error' : 'ok');
  };
  // Fehler aus dem Bestätigungslink (z. B. abgelaufen) abfangen
  (() => {
    const h = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
    const code = h.get('error_code') || '', desc = h.get('error_description') || '';
    if (!code && !h.get('error')) return;
    history.replaceState(null, '', location.pathname);
    window.__linkError = /expired/i.test(code + desc)
      ? 'Der Bestätigungslink ist abgelaufen. Trag unten deine E-Mail ein und fordere eine neue Mail an.'
      : 'Der Link hat nicht funktioniert (' + (desc || code) + '). Fordere unten eine neue Mail an.';
  })();

  $('forgot').onclick = async () => {
    const email = $('email').value.trim();
    if (!email) return setMsg($('loginMsg'), 'Bitte oben zuerst deine E-Mail eintragen.', 'error');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/jugendapp/' });
    setMsg($('loginMsg'), error ? error.message : 'Wir haben dir eine E-Mail zum Zurücksetzen geschickt.', error ? 'error' : 'ok');
  };

  $('registerForm').onsubmit = async e => {
    e.preventDefault();
    const reg = { name: $('rName').value.trim(), telefon: $('rPhone').value.trim(), email: $('rEmail').value.trim().toLowerCase() };
    setMsg($('registerMsg'), 'Wird angelegt …');
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(reg)); } catch {}
    const { data, error } = await sb.auth.signUp({
      email: reg.email, password: $('rPassword').value,
      options: { data: { full_name: reg.name }, emailRedirectTo: location.origin + '/jugendapp/' }
    });
    if (error) return setMsg($('registerMsg'), /registered|exists/i.test(error.message) ? 'Mit dieser E-Mail gibt es schon einen Zugang. Bitte anmelden.' : error.message, 'error');
    if (data.session) return start();
    setMsg($('registerMsg'), 'Fast fertig: Wir haben dir eine E-Mail geschickt. Bitte den Link darin anklicken und dich danach hier anmelden.', 'ok');
  };

  $('logout').onclick = $('waitingLogout').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('waitingReload').onclick = () => start();

  sb.auth.onAuthStateChange(async (event) => {
    if (event === 'PASSWORD_RECOVERY') {
      const pw = window.prompt('Neues Passwort (mind. 8 Zeichen):');
      if (pw && pw.length >= 8) {
        const { error } = await sb.auth.updateUser({ password: pw });
        alert(error ? 'Fehler: ' + error.message : 'Passwort geändert ✓');
      }
      start();
    }
  });

  // ---------- Start / Rolle bestimmen ----------
  async function start() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { show('login'); if (window.__linkError) { showResend(window.__linkError); window.__linkError = null; } return; }
    me.user = session.user;
    const [{ data: profile }, mRes] = await Promise.all([
      sb.from('profiles').select('id,full_name,role').eq('id', me.user.id).maybeSingle(),
      sb.from(T_M).select('*').eq('user_id', me.user.id).maybeSingle()
    ]);
    me.profile = profile;
    setupMissing = missing(mRes.error);
    me.mitglied = mRes.data || null;

    // Zugang beantragen, falls noch kein Eintrag (z. B. nach E-Mail-Bestätigung)
    if (!me.mitglied && !setupMissing && !LEITUNG_ROLES.includes(profile?.role)) {
      let reg = {}; try { reg = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}'); } catch {}
      const row = { user_id: me.user.id, name: reg.name || me.user.user_metadata?.full_name || profile?.full_name || me.user.email.split('@')[0], telefon: reg.telefon || null, email: me.user.email };
      const ins = await sb.from(T_M).insert(row).select().maybeSingle();
      if (!ins.error) { me.mitglied = ins.data || { ...row, freigegeben: false }; try { localStorage.removeItem(PENDING_KEY); } catch {} }
    }

    if (!me.mitglied && !setupMissing && LEITUNG_ROLES.includes(profile?.role)) {
      const row = { user_id: me.user.id, name: profile.full_name || me.user.email.split('@')[0], email: me.user.email, rolle: 'leitung', freigegeben: true, teams: TEAMS.map(t => t[0]) };
      const ins = await sb.from(T_M).insert(row).select().maybeSingle();
      if (!ins.error) me.mitglied = ins.data || row;
    }
    me.leitung = LEITUNG_ROLES.includes(profile?.role) || (me.mitglied?.freigegeben && me.mitglied?.rolle === 'leitung');
    me.teams = me.mitglied?.freigegeben ? (me.mitglied.teams || []) : [];

    if (!me.leitung && !me.mitglied?.freigegeben) {
      $('waitingText').textContent = setupMissing
        ? 'Die Jugend-App wird gerade eingerichtet. Bitte versuche es später noch einmal.'
        : 'Hallo ' + (me.mitglied?.name?.split(' ')[0] || '') + '! Dein Zugang ist beantragt. Sobald die Jugendleitung dich freigeschaltet und deinem Team zugeordnet hat, geht es hier los.';
      show('waiting'); return;
    }
    if (!me.leitung && !me.teams.length) {
      $('waitingText').textContent = 'Du bist freigeschaltet, aber noch keinem Team zugeordnet. Bitte kurz bei der Jugendleitung melden.';
      show('waiting'); return;
    }
    openApp();
  }

  let appReady = false;
  async function openApp() {
    document.body.classList.toggle('is-leitung', me.leitung);
    $('roleLabel').textContent = me.leitung ? 'Jugendleitung' : 'Trainer · ' + me.teams.map(teamName).join(', ');
    $('hello').textContent = 'Servus ' + (myName().split(' ')[0]) + '!';
    $('myTeams').textContent = me.leitung ? 'Du siehst alle Jugendmannschaften.' : 'Dein Team: ' + me.teams.map(teamName).join(', ');
    $('todoTitle').textContent = me.leitung ? 'Als Nächstes zu tun' : 'Aktuelle Verlegungen deines Teams';
    $('flowHint').innerHTML = me.leitung
      ? 'Ablauf: <b>Offen</b> → <b>Angefragt</b> (Nachricht an Gegner raus) → <b>Zugestimmt</b> → <b>Beim BFV beantragt</b> (Antrag im DFBnet) → <b>Erledigt</b> (bestätigt, Trainer informiert).'
      : 'Trag hier ein, welches Spiel verlegt werden soll. Die Jugendleitung klärt das mit dem Gegner und dem BFV – den Stand siehst du jederzeit hier.';
    $('newBtn').textContent = me.leitung ? '+ Neue Verlegung' : '+ Verlegung melden';
    const opts = myTeamList().map(t => `<option value="${t[0]}">${t[1]}</option>`).join('');
    $('vTeam').innerHTML = opts;
    $('fTeam').innerHTML = (myTeamList().length > 1 ? '<option value="">Alle Mannschaften</option>' : '') + opts;
    $('sTeam').innerHTML = (myTeamList().length > 1 ? '<option value="">Alle Mannschaften</option>' : '') + opts;
    $('vStatus').innerHTML = Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
    show('app');
    if (!appReady) { bindApp(); appReady = true; }
    setupInstall();
    await Promise.all([loadBfv(), loadVerlegungen(), loadStaff(), me.leitung ? loadMitglieder() : null, loadPersonen().then(loadAufgaben)]);
    subscribeLive();
  }

  // ---------- Navigation ----------
  function showTab(name) {
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach(s => s.hidden = s.id !== 'tab-' + name);
    window.scrollTo(0, 0);
  }

  function bindApp() {
    document.querySelectorAll('.bottom-nav button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
    $('fStatus').onchange = renderVerlegungen; $('fTeam').onchange = renderVerlegungen;
    $('tSearch').oninput = renderStaff;
    $('sTeam').onchange = renderSpiele; $('sNurAenderungen').onchange = renderSpiele;
 bindAufgaben();
    $('vGame').onchange = () => { const g = bfv.games.find(x => x.id === $('vGame').value); if (g) fillFromGame(g); };
    $('copyAllMails').onclick = async () => {
      const mails = [...new Set(staff.filter(s => s.email && s.active !== false).map(s => s.email))];
      if (!mails.length) return alert('Keine E-Mail-Adressen hinterlegt.');
      await copy(mails.join(', ')); alert(mails.length + ' E-Mail-Adressen kopiert – am besten ins BCC einfügen.');
    };
    $('vCancel').onclick = () => $('vEditor').close();
    $('vForm').onsubmit = saveVerlegung;
    $('vDelete').onclick = deleteVerlegung;
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-action]'); if (!a) return;
      const x = verlegungen.find(v => v.id === a.dataset.id);
      ({
        'new': () => openEditor(),
        'edit': () => openEditor(x),
        'a-new': () => openAufgabeEditor(),
        'a-open': () => openDetail(a.dataset.id),
        'verlegen': () => openEditorFromGame(bfv.games.find(g => g.id === a.dataset.game)),
        'next': () => advance(x),
        'msg-gegner': () => openGegnerMessage(x),
        'msg-trainer': () => openTrainerMessage(x),
        'goto': () => { if (a.dataset.filter != null) $('fStatus').value = a.dataset.filter; renderVerlegungen(); showTab(a.dataset.tab); },
        'z-save': () => saveMitglied(a.dataset.id, a.dataset.approve === '1'),
        'z-block': () => blockMitglied(a.dataset.id),
        'z-delete': () => deleteMitglied(a.dataset.id)
      }[a.dataset.action] || (() => {}))();
    });
  }

  // ---------- Installieren ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; setupInstall(); });
  function setupInstall() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    let dismissed = false; try { dismissed = localStorage.getItem('svkJugendInstallDismissed') === '1'; } catch {}
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (standalone || dismissed || (!deferredPrompt && !ios) || $('app').hidden) { $('installBar').hidden = true; return; }
    $('installBar').hidden = false;
    $('installBtn').textContent = ios ? 'So geht’s' : 'Installieren';
    $('installBtn').onclick = async () => {
      if (ios) return $('iosHelp').showModal();
      deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('installBar').hidden = true;
    };
    $('installClose').onclick = () => { $('installBar').hidden = true; try { localStorage.setItem('svkJugendInstallDismissed', '1'); } catch {} };
  }

  // ---------- Spielverlegungen ----------
  async function loadVerlegungen() {
    const { data, error } = await sb.from(T_V).select('*').order('alt_datum', { ascending: true, nullsFirst: false });
    if (error) {
      $('setupWarn').hidden = false;
      $('setupWarn').textContent = 'Spielverlegungen konnten nicht geladen werden: ' + error.message;
      verlegungen = [];
    } else {
      $('setupWarn').hidden = true;
      verlegungen = me.leitung ? (data || []) : (data || []).filter(x => me.teams.includes(x.team_key));
    }
    renderVerlegungen(); renderStart();
  }

  const byName = id => {
    if (!id) return '';
    if (id === me.user.id) return 'dir';
    const m = mitglieder.find(x => x.user_id === id);
    return m ? m.name : 'Jugendleitung';
  };

  function card(x) {
    const st = STATUS[x.status] || STATUS.offen, moved = x.neu_datum || x.neu_uhrzeit;
    const hasContact = x.kontakt_telefon || x.kontakt_email;
    const L = me.leitung;
    return `<article class="card">
      <div class="card-head">
        <div><div class="card-title">${esc(teamName(x.team_key))} ${x.heim ? 'vs.' : '@'} ${esc(x.gegner)}</div>
        <div class="meta">${esc(x.wettbewerb)} · ${x.heim ? 'Heimspiel' : 'Auswärts'} · Wunsch von ${x.angefragt_von === 'wir' ? 'uns' : 'Gegner'}${x.grund ? ' · ' + esc(x.grund) : ''}</div></div>
        <span class="pill s-${esc(x.status)}">${esc(st.label)}</span>
      </div>
      <div class="dates"><span class="${moved ? 'old' : ''}">${esc(when(x.alt_datum, x.alt_uhrzeit))}</span>${moved ? ` → <span class="new">${esc(when(x.neu_datum, x.neu_uhrzeit))}</span>${x.neu_ort ? ' <span class="meta">(' + esc(x.neu_ort) + ')</span>' : ''}` : ''}</div>
      ${x.kontakt_name ? `<div class="meta">Kontakt Gegner: ${esc(x.kontakt_name)}</div>` : ''}
      ${x.notizen ? `<div class="meta">📝 ${esc(x.notizen)}</div>` : ''}
      ${bfvHint(x)}
      ${L && x.created_by ? `<div class="by">Eingetragen von ${esc(byName(x.created_by))}</div>` : ''}
      <div class="card-actions">
        ${L && st.next ? `<button class="small next" data-action="next" data-id="${x.id}">✓ ${esc(st.nextLabel)}</button>` : ''}
        ${L ? `<button class="small ghost" data-action="msg-gegner" data-id="${x.id}">✉ Nachricht an Gegner${hasContact ? '' : ' (Text)'}</button>` : ''}
        ${L && ['zugestimmt', 'beantragt', 'erledigt'].includes(x.status) ? `<button class="small ghost" data-action="msg-trainer" data-id="${x.id}">📣 Trainer informieren</button>` : ''}
        <button class="small ghost" data-action="edit" data-id="${x.id}">Bearbeiten</button>
      </div>
    </article>`;
  }

  function renderVerlegungen() {
    const fs = $('fStatus').value, ft = $('fTeam').value;
    let arr = verlegungen.filter(x => !ft || x.team_key === ft);
    if (fs === 'aktiv') arr = arr.filter(x => ACTIVE.includes(x.status)); else if (fs === 'erledigt') arr = arr.filter(x => !ACTIVE.includes(x.status));
    $('vList').innerHTML = arr.map(card).join('') || '<div class="empty">Keine Spielverlegungen in dieser Auswahl.</div>';
    const open = verlegungen.filter(x => ACTIVE.includes(x.status)).length;
    $('badgeOpen').hidden = !open; $('badgeOpen').textContent = open;
  }

  function renderStart() {
    const count = s => verlegungen.filter(x => x.status === s).length;
    const items = me.leitung
      ? [['offen', 'noch nicht angefragt'], ['angefragt', 'warten auf Gegner'], ['zugestimmt', 'beim BFV beantragen'], ['beantragt', 'warten auf BFV']]
      : [['offen', 'gemeldet'], ['angefragt', 'beim Gegner angefragt'], ['zugestimmt', 'Gegner einverstanden'], ['beantragt', 'beim BFV']];
    let html = items.map(([s, t]) => `<button class="stat" data-action="goto" data-tab="verlegungen" data-filter="aktiv"><b>${count(s)}</b><span>${esc(STATUS[s].label)} – ${t}</span></button>`).join('');
    html += `<button class="stat" data-action="goto" data-tab="trainer"><b>${staff.filter(s => s.active !== false).length}</b><span>Trainer & Betreuer</span></button>`;
    const pending = mitglieder.filter(m => !m.freigegeben).length;
    if (me.leitung && pending) html += `<button class="stat" data-action="goto" data-tab="zugaenge" style="border-color:#f5c26b"><b>${pending}</b><span>Zugang wartet auf Freigabe</span></button>`;
    $('stats').innerHTML = html;
    renderMyTasks();
    const ng = upcomingGames().slice(0, 3);
    $('nextGames').innerHTML = ng.map(gameRow).join('') || `<div class="empty">${bfv.updatedAt ? 'Keine anstehenden Spiele im BFV-Spielplan.' : 'Der BFV-Spielplan wird geladen …'}</div>`;
    const todo = verlegungen.filter(x => ACTIVE.includes(x.status))
      .sort((a, b) => ACTIVE.indexOf(a.status) - ACTIVE.indexOf(b.status) || String(a.alt_datum).localeCompare(String(b.alt_datum))).slice(0, 5);
    $('todo').innerHTML = todo.map(card).join('') || `<div class="empty">${me.leitung ? 'Alles erledigt 👍 Keine offenen Spielverlegungen.' : 'Keine offenen Verlegungen für dein Team.'}</div>`;
    $('clubList').innerHTML = [...new Set(verlegungen.map(x => x.gegner).filter(Boolean))].sort().map(g => `<option value="${esc(g)}">`).join('');
  }

  function openEditor(x = {}) {
    $('vForm').reset(); setMsg($('vMsg'), '');
    $('vId').value = x.id || '';
    $('vTitle').textContent = x.id ? 'Spielverlegung bearbeiten' : (me.leitung ? 'Neue Spielverlegung' : 'Verlegung melden');
    $('vTeam').value = x.team_key || ($('fTeam').value || myTeamList()[0]?.[0] || '');
    $('vComp').value = x.wettbewerb || 'Punktspiel';
    $('vGegner').value = x.gegner || '';
    $('vHeim').value = String(x.heim ?? true);
    $('vVon').value = x.angefragt_von || 'wir';
    $('vAltDatum').value = x.alt_datum || ''; $('vAltZeit').value = (x.alt_uhrzeit || '').slice(0, 5);
    $('vNeuDatum').value = x.neu_datum || ''; $('vNeuZeit').value = (x.neu_uhrzeit || '').slice(0, 5);
    $('vNeuOrt').value = x.neu_ort || ''; $('vGrund').value = x.grund || '';
    $('vKName').value = x.kontakt_name || ''; $('vKTel').value = x.kontakt_telefon || ''; $('vKMail').value = x.kontakt_email || '';
    $('vStatus').value = x.status || 'offen'; $('vNotiz').value = x.notizen || '';
    $('vDelete').hidden = !x.id;
    const games = upcomingGames();
    $('vGameWrap').hidden = !!x.id || !games.length;
    $('vGame').innerHTML = '<option value="">– Spiel auswählen oder unten selbst eintragen –</option>' + games.map(g =>
      `<option value="${esc(g.id)}">${esc(fmtDate(g.date))} ${esc(g.time)} · ${esc(teamsLabel(g))} ${g.heim ? 'vs.' : '@'} ${esc(g.gegner)}</option>`).join('');
    $('vGegner').onchange = () => {
      if ($('vKName').value || $('vKTel').value || $('vKMail').value) return;
      const prev = verlegungen.find(v => v.gegner === $('vGegner').value && (v.kontakt_telefon || v.kontakt_email));
      if (prev) { $('vKName').value = prev.kontakt_name || ''; $('vKTel').value = prev.kontakt_telefon || ''; $('vKMail').value = prev.kontakt_email || ''; }
    };
    $('vEditor').showModal();
  }

  async function saveVerlegung(e) {
    e.preventDefault();
    const id = $('vId').value, key = $('vTeam').value;
    const payload = {
      team_key: key, team_name: teamName(key), wettbewerb: $('vComp').value, gegner: $('vGegner').value.trim(),
      heim: $('vHeim').value === 'true', angefragt_von: $('vVon').value,
      alt_datum: $('vAltDatum').value || null, alt_uhrzeit: $('vAltZeit').value || null,
      neu_datum: $('vNeuDatum').value || null, neu_uhrzeit: $('vNeuZeit').value || null,
      neu_ort: $('vNeuOrt').value.trim() || null, grund: $('vGrund').value.trim(),
      kontakt_name: $('vKName').value.trim() || null, kontakt_telefon: $('vKTel').value.trim() || null, kontakt_email: $('vKMail').value.trim() || null,
      notizen: $('vNotiz').value.trim(), updated_by: me.user.id, updated_at: new Date().toISOString()
    };
    if (me.leitung) payload.status = $('vStatus').value;
    if (!payload.gegner) return setMsg($('vMsg'), 'Bitte den Gegner eintragen.', 'error');
    if (!key) return setMsg($('vMsg'), 'Bitte eine Mannschaft wählen.', 'error');
    setMsg($('vMsg'), 'Speichere …');
    const r = id ? await sb.from(T_V).update(payload).eq('id', id).select().single()
                 : await sb.from(T_V).insert({ status: 'offen', ...payload, created_by: me.user.id }).select().single();
    if (r.error) return setMsg($('vMsg'), r.error.message, 'error');
    $('vEditor').close();
    await loadVerlegungen();
    if (!id && me.leitung && r.data?.status === 'offen') openGegnerMessage(r.data);
    if (!id && !me.leitung) alert('Danke! Die Jugendleitung sieht deine Meldung jetzt und kümmert sich darum.');
  }

  async function deleteVerlegung() {
    const id = $('vId').value;
    if (!id || !confirm('Diese Spielverlegung wirklich löschen?')) return;
    const { error } = await sb.from(T_V).delete().eq('id', id);
    if (error) return setMsg($('vMsg'), error.message, 'error');
    $('vEditor').close(); loadVerlegungen();
  }

  async function advance(x) {
    const next = STATUS[x?.status]?.next; if (!next) return;
    const { error } = await sb.from(T_V).update({ status: next, updated_by: me.user.id, updated_at: new Date().toISOString() }).eq('id', x.id);
    if (error) return alert(error.message);
    await loadVerlegungen();
    const fresh = verlegungen.find(v => v.id === x.id);
    if (next === 'erledigt' && fresh && confirm('Erledigt! Sollen die Trainer der ' + teamName(fresh.team_key) + ' jetzt informiert werden?')) openTrainerMessage(fresh);
  }

  // ---------- Nachrichten ----------
  function gegnerText(x) {
    const team = teamName(x.team_key);
    const spiel = x.heim ? `unser Heimspiel ${team} gegen ${x.gegner}` : `das Spiel ${x.gegner} gegen SpVgg Kaufbeuren ${team}`;
    const hallo = x.kontakt_name ? `Hallo ${x.kontakt_name.split(' ')[0]},` : 'Hallo,';
    const neu = (x.neu_datum || x.neu_uhrzeit) ? when(x.neu_datum, x.neu_uhrzeit, true) + (x.neu_ort ? ` (${x.neu_ort})` : '') : '';
    const gruss = `${myName()}\nJugendleitung SpVgg Kaufbeuren`;
    if (x.angefragt_von === 'gegner')
      return `${hallo}\n\nwir sind mit der Verlegung von ${spiel} (ursprünglich ${when(x.alt_datum, x.alt_uhrzeit, true)})${neu ? ` auf ${neu}` : ''} einverstanden.\n\nBitte stellt den Verlegungsantrag im DFBnet, wir stimmen dann zu.\n\nSportliche Grüße\n${gruss}`;
    return `${hallo}\n\nwir würden gerne ${spiel} am ${when(x.alt_datum, x.alt_uhrzeit, true)} verlegen${x.grund ? ` (Grund: ${x.grund})` : ''}.\n\n${neu ? `Unser Vorschlag: ${neu}.` : 'Welcher Ausweichtermin würde euch passen?'}\n\nWäre das für euch in Ordnung? Den Antrag im DFBnet stellen wir dann.\n\nVielen Dank und sportliche Grüße\n${gruss}`;
  }
  function trainerText(x) {
    const team = teamName(x.team_key);
    const neu = (x.neu_datum || x.neu_uhrzeit) ? when(x.neu_datum, x.neu_uhrzeit, true) : 'neuer Termin folgt';
    const stand = x.status === 'erledigt' ? 'ist vom BFV bestätigt' : x.status === 'beantragt' ? 'ist beim BFV beantragt (Bestätigung steht noch aus)' : 'ist mit dem Gegner abgesprochen (BFV-Antrag folgt)';
    return `Hallo zusammen,\n\ndie Spielverlegung ${team} ${x.heim ? 'gegen' : 'bei'} ${x.gegner} ${stand}:\n\nAlt: ${when(x.alt_datum, x.alt_uhrzeit, true)}\nNeu: ${neu}${x.neu_ort ? `\nOrt: ${x.neu_ort}` : ''}\n\nBitte gebt das an die Eltern weiter.\n\nGrüße\n${myName()}`;
  }

  function openMessage({ title, text, subject, targets, onSent }) {
    $('mTitle').textContent = title; $('mText').value = text; setMsg($('mMsg'), '');
    let current = targets[0] || null;
    const paint = () => {
      $('mTargets').innerHTML = targets.length > 1
        ? targets.map((t, i) => `<button type="button" class="chip ${t === current ? 'active' : ''}" data-i="${i}">${esc(t.name)}</button>`).join('')
        : (current ? `<span class="meta">An: ${esc(current.name)}</span>` : '<span class="meta">Kein Kontakt hinterlegt – Text kopieren und selbst senden.</span>');
      $('mTargets').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { current = targets[+b.dataset.i]; paint(); });
      const t = () => $('mText').value, btns = [];
      if (current?.phone && waNumber(current.phone)) btns.push('<a class="btn" id="mWa" target="_blank" rel="noopener" style="background:#128c4a">WhatsApp</a>');
      if (current?.email) btns.push('<a class="btn ghost" id="mMail">E-Mail</a>');
      if (current?.phone) btns.push(`<a class="btn ghost" href="${telHref(current.phone)}">Anrufen</a>`);
      btns.push('<button type="button" class="ghost" id="mCopy">Text kopieren</button>');
      $('mActions').innerHTML = btns.join('');
      const wa = $('mWa'); if (wa) wa.onclick = () => { wa.href = waHref(current.phone, t()); onSent && onSent(); };
      const ml = $('mMail'); if (ml) ml.onclick = () => { ml.href = mailHref(current.email, subject, t()); onSent && onSent(); };
      $('mCopy').onclick = async () => { await copy(t()); setMsg($('mMsg'), 'Kopiert ✓', 'ok'); onSent && onSent(); };
    };
    paint(); $('mDialog').showModal();
  }

  function openGegnerMessage(x) {
    if (!x) return;
    const targets = (x.kontakt_telefon || x.kontakt_email) ? [{ name: x.kontakt_name || x.gegner, phone: x.kontakt_telefon, email: x.kontakt_email }] : [];
    let marked = false;
    openMessage({
      title: x.angefragt_von === 'gegner' ? 'Zusage an ' + x.gegner : 'Verlegungsanfrage an ' + x.gegner,
      text: gegnerText(x),
      subject: `Spielverlegung ${teamName(x.team_key)}: SpVgg Kaufbeuren – ${x.gegner} (${fmtDate(x.alt_datum) || 'Termin'})`,
      targets,
      onSent: async () => {
        if (marked || x.status !== 'offen') return; marked = true;
        const next = x.angefragt_von === 'gegner' ? 'zugestimmt' : 'angefragt';
        await sb.from(T_V).update({ status: next, updated_by: me.user.id, updated_at: new Date().toISOString() }).eq('id', x.id);
        setMsg($('mMsg'), 'Status auf „' + STATUS[next].label + '“ gesetzt ✓', 'ok');
        loadVerlegungen();
      }
    });
  }

  function openTrainerMessage(x) {
    if (!x) return;
    const fromStaff = staff.filter(s => s.team_key === x.team_key && s.active !== false && (s.phone || s.email)).map(p => ({ name: p.name + (p.role ? ' (' + p.role + ')' : ''), phone: p.phone, email: p.email }));
    const fromApp = mitglieder.filter(m => m.freigegeben && (m.teams || []).includes(x.team_key) && (m.telefon || m.email) && !fromStaff.some(s => s.name.startsWith(m.name)))
      .map(m => ({ name: m.name + ' (App)', phone: m.telefon, email: m.email }));
    openMessage({ title: 'Trainer der ' + teamName(x.team_key) + ' informieren', text: trainerText(x), subject: `Spielverlegung ${teamName(x.team_key)} – ${x.gegner}`, targets: [...fromStaff, ...fromApp] });
  }

  // ---------- Aufgaben + Chat ----------
  const A_STATUS = { offen: 'Offen', in_bearbeitung: 'In Bearbeitung', erledigt: 'Erledigt' };
  const person = id => personen.find(p => p.user_id === id) || (id === me.user?.id ? { user_id: id, name: myName() } : null);
  const pName = id => id === me.user.id ? 'Du' : (person(id)?.name || 'Unbekannt');
  const seenKey = id => 'svkJugendSeen:' + id;
  const getSeen = id => { try { return localStorage.getItem(seenKey(id)) || ''; } catch { return ''; } };
  const setSeen = (id, ts) => { try { localStorage.setItem(seenKey(id), ts); } catch {} };
  const fmtTs = ts => { const d = new Date(ts), t = new Date(); return (d.toDateString() === t.toDateString() ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ') + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); };

  async function loadPersonen() {
    const { data, error } = await sb.rpc('jugend_personen');
    personen = error ? [] : (data || []);
    $('aPerson').innerHTML = '<option value="">Alle Personen</option>' + personen.map(p => `<option value="${p.user_id}">${esc(p.name)}</option>`).join('');
  }

  async function loadAufgaben() {
    const { data, error } = await sb.from(T_A).select('*').order('created_at', { ascending: false });
    aufgabenMissing = missing(error);
    aufgaben = error ? [] : (data || []);
    const ids = aufgaben.map(a => a.id);
    msgMeta = {};
    if (ids.length) {
      const { data: msgs } = await sb.from(T_N).select('aufgabe_id,user_id,created_at').in('aufgabe_id', ids).order('created_at');
      (msgs || []).forEach(m => {
        const x = msgMeta[m.aufgabe_id] ||= { count: 0, last: '', lastOther: '' };
        x.count++; x.last = m.created_at;
        if (m.user_id !== me.user.id) x.lastOther = m.created_at;
      });
    }
    renderAufgaben(); renderStart();
  }

  const isMine = a => (a.zugewiesen_an || []).includes(me.user.id);
  const unread = a => { const m = msgMeta[a.id]; return !!(m && m.lastOther && m.lastOther > getSeen(a.id)); };

  function taskRow(a) {
    const t = today(), late = a.faellig_am && a.status !== 'erledigt' && a.faellig_am < t;
    const m = msgMeta[a.id];
    const wer = (a.zugewiesen_an || []);
    return `<div class="task ${a.status === 'erledigt' ? 'done' : ''}" data-action="a-open" data-id="${a.id}">
      <div class="task-check ${a.status}">${a.status === 'erledigt' ? '✓' : ''}</div>
      <div class="task-main">
        <div class="task-title">${a.wichtig ? '<span class="prio">! </span>' : ''}${esc(a.titel)}</div>
        <div class="task-meta">
          <span class="pill s-${a.status}">${A_STATUS[a.status]}</span>
          ${wer.length ? `<span>👤 ${esc(wer.map(pName).join(', '))}</span>` : '<span>👤 niemand zugewiesen</span>'}
          ${a.faellig_am ? `<span class="${late ? 'late' : ''}">📅 ${esc(fmtDate(a.faellig_am))}${late ? ' – überfällig' : ''}</span>` : ''}
          ${a.team_key ? `<span>⚽ ${esc(teamName(a.team_key))}</span>` : ''}
          ${a.created_by !== me.user.id ? `<span>von ${esc(pName(a.created_by))}</span>` : ''}
        </div>
      </div>
      <div class="task-right">${unread(a) ? '<span class="unread" title="Neue Nachricht"></span>' : ''}${m ? `<span class="meta">💬 ${m.count}</span>` : ''}</div>
    </div>`;
  }

  function sortTasks(list) {
    const o = { in_bearbeitung: 0, offen: 1, erledigt: 2 };
    return list.sort((a, b) => (o[a.status] - o[b.status]) || (b.wichtig - a.wichtig) || String(a.faellig_am || '9999').localeCompare(String(b.faellig_am || '9999')) || String(b.created_at).localeCompare(String(a.created_at)));
  }

  function renderAufgaben() {
    const st = $('aStatus').value, pid = $('aPerson').value;
    let list = aufgaben.filter(a => aScope === 'mir' ? isMine(a) : aScope === 'von' ? a.created_by === me.user.id : true);
    if (st === 'aktiv') list = list.filter(a => a.status !== 'erledigt'); else if (st === 'erledigt') list = list.filter(a => a.status === 'erledigt');
    if (pid && aScope === 'alle') list = list.filter(a => (a.zugewiesen_an || []).includes(pid));
    $('aList').innerHTML = sortTasks(list).map(taskRow).join('') || `<div class="empty">${aufgabenMissing ? 'Aufgaben sind in der Datenbank noch nicht eingerichtet (SQL V92).' : aScope === 'mir' ? 'Dir ist gerade nichts zugewiesen 👍' : 'Keine Aufgaben in dieser Auswahl.'}</div>`;
    const offen = aufgaben.filter(a => isMine(a) && a.status !== 'erledigt').length, neu = aufgaben.some(unread);
    $('badgeA').hidden = !offen && !neu; $('badgeA').textContent = offen || '•';
  }

  function renderMyTasks() {
    if (!$('myTasks')) return;
    const list = sortTasks(aufgaben.filter(a => isMine(a) && a.status !== 'erledigt')).slice(0, 4);
    $('myTasks').innerHTML = list.map(taskRow).join('') || `<div class="empty">${aufgabenMissing ? 'Aufgaben werden gerade eingerichtet.' : 'Keine offenen Aufgaben für dich.'}</div>`;
  }

  function bindAufgaben() {
    $('aScope').querySelectorAll('[data-scope]').forEach(b => b.onclick = () => {
      aScope = b.dataset.scope;
      $('aScope').querySelectorAll('[data-scope]').forEach(x => x.classList.toggle('active', x === b));
      renderAufgaben();
    });
    $('aStatus').onchange = renderAufgaben; $('aPerson').onchange = renderAufgaben;
    $('aCancel').onclick = () => $('aEditor').close();
    $('aForm').onsubmit = saveAufgabe;
    $('aDelete').onclick = deleteAufgabe;
    $('dClose').onclick = () => $('aDetail').close();
    $('aDetail').addEventListener('close', () => { detailId = null; renderAufgaben(); renderMyTasks(); });
    $('dEdit').onclick = () => { const a = aufgaben.find(x => x.id === detailId); if (a) { $('aDetail').close(); openAufgabeEditor(a); } };
    $('dStatus').querySelectorAll('[data-status]').forEach(b => b.onclick = () => setAufgabeStatus(detailId, b.dataset.status));
    $('dForm').onsubmit = sendNachricht;
    $('dText').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !/mobile|android|iphone/i.test(navigator.userAgent)) { e.preventDefault(); sendNachricht(e); } });
    $('dText').addEventListener('input', () => { const t = $('dText'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; });
  }

  let aWer = [];
  function paintWer() {
    const list = personen.length ? personen : [{ user_id: me.user.id, name: myName() }];
    $('aWer').innerHTML = list.map(p => `<button type="button" class="chip ${aWer.includes(p.user_id) ? 'active' : ''}" data-uid="${p.user_id}"><span class="av">${esc(initials(p.name))}</span>${esc(p.user_id === me.user.id ? 'Ich' : p.name)}</button>`).join('');
    $('aWer').querySelectorAll('[data-uid]').forEach(b => b.onclick = () => {
      const id = b.dataset.uid; aWer = aWer.includes(id) ? aWer.filter(x => x !== id) : [...aWer, id]; paintWer();
    });
  }

  function openAufgabeEditor(a = {}) {
    if (aufgabenMissing) return alert('Die Aufgaben sind in der Datenbank noch nicht eingerichtet.');
    $('aForm').reset(); setMsg($('aMsg'), '');
    $('aId').value = a.id || '';
    $('aTitle').textContent = a.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe';
    $('aTitel').value = a.titel || ''; $('aBeschreibung').value = a.beschreibung || '';
    $('aFaellig').value = a.faellig_am || ''; $('aWichtig').checked = !!a.wichtig;
    $('aTeam').innerHTML = '<option value="">– keine –</option>' + TEAMS.map(t => `<option value="${t[0]}">${t[1]}</option>`).join('');
    $('aTeam').value = a.team_key || '';
    aWer = [...(a.zugewiesen_an || [])];
    paintWer();
    $('aDelete').hidden = !a.id || !(me.leitung || a.created_by === me.user.id);
    $('aEditor').showModal();
    setTimeout(() => $('aTitel').focus(), 50);
  }

  async function saveAufgabe(e) {
    e.preventDefault();
    const id = $('aId').value, before = aufgaben.find(x => x.id === id);
    const payload = {
      titel: $('aTitel').value.trim(), beschreibung: $('aBeschreibung').value.trim(),
      faellig_am: $('aFaellig').value || null, team_key: $('aTeam').value || null,
      wichtig: $('aWichtig').checked, zugewiesen_an: aWer,
      updated_by: me.user.id, updated_at: new Date().toISOString()
    };
    if (!payload.titel) return setMsg($('aMsg'), 'Bitte eintragen, was zu tun ist.', 'error');
    setMsg($('aMsg'), 'Speichere …');
    const r = id ? await sb.from(T_A).update(payload).eq('id', id).select().single()
                 : await sb.from(T_A).insert({ ...payload, status: 'offen', created_by: me.user.id }).select().single();
    if (r.error) return setMsg($('aMsg'), r.error.message, 'error');
    $('aEditor').close();
    const neuZu = aWer.filter(u => u !== me.user.id && !(before?.zugewiesen_an || []).includes(u));
    await loadAufgaben();
    if (neuZu.length) notifyAssigned(r.data, neuZu);
  }

  function notifyAssigned(a, ids) {
    const targets = ids.map(person).filter(p => p && (p.telefon || p.email)).map(p => ({ name: p.name, phone: p.telefon, email: p.email }));
    if (!targets.length) return;
    openMessage({
      title: 'Bescheid geben?',
      text: `Hallo, ich habe dir in der SVK-Jugend-App eine Aufgabe gegeben:\n\n„${a.titel}“${a.faellig_am ? '\nBis: ' + when(a.faellig_am, null, true) : ''}\n\n${location.origin}/jugendapp/\n\nGrüße\n${myName()}`,
      subject: 'Neue Aufgabe: ' + a.titel, targets
    });
  }

  async function deleteAufgabe() {
    const id = $('aId').value;
    if (!id || !confirm('Aufgabe samt Chat löschen?')) return;
    const { error } = await sb.from(T_A).delete().eq('id', id);
    if (error) return setMsg($('aMsg'), error.message, 'error');
    $('aEditor').close(); loadAufgaben();
  }

  async function setAufgabeStatus(id, status) {
    const a = aufgaben.find(x => x.id === id);
    if (!a || a.status === status) return;
    const { error } = await sb.from(T_A).update({ status, erledigt_am: status === 'erledigt' ? new Date().toISOString() : null, updated_by: me.user.id, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return alert(error.message);
    await sb.from(T_N).insert({ aufgabe_id: id, user_id: me.user.id, text: '§status:' + status });
    a.status = status; paintDetail(); loadMessages(); loadAufgaben();
  }

  function paintDetail() {
    const a = aufgaben.find(x => x.id === detailId); if (!a) return;
    $('dTitel').textContent = (a.wichtig ? '! ' : '') + a.titel;
    const wer = (a.zugewiesen_an || []).map(pName).join(', ') || 'niemand';
    $('dMeta').textContent = `Für: ${wer}${a.faellig_am ? ' · bis ' + fmtDate(a.faellig_am) : ''}${a.team_key ? ' · ' + teamName(a.team_key) : ''} · von ${pName(a.created_by)}`;
    $('dStatus').querySelectorAll('[data-status]').forEach(b => b.classList.toggle('on', b.dataset.status === a.status));
    $('dEdit').hidden = !(me.leitung || a.created_by === me.user.id);
  }

  async function openDetail(id) {
    if (!aufgaben.find(x => x.id === id)) return;
    detailId = id; paintDetail();
    $('dBody').innerHTML = '<div class="sys">Lade …</div>';
    $('aDetail').showModal();
    await loadMessages();
  }

  async function loadMessages() {
    const id = detailId; if (!id) return;
    const a = aufgaben.find(x => x.id === id);
    const { data, error } = await sb.from(T_N).select('*').eq('aufgabe_id', id).order('created_at');
    if (id !== detailId) return;
    let html = a?.beschreibung ? `<div class="chat-desc">${esc(a.beschreibung)}</div>` : '';
    html += `<div class="sys">${esc(pName(a.created_by))} hat die Aufgabe am ${esc(fmtTs(a.created_at))} angelegt</div>`;
    (error ? [] : data || []).forEach(m => {
      if (m.text.startsWith('§status:')) { html += `<div class="sys">${esc(pName(m.user_id))}: ${esc(A_STATUS[m.text.slice(8)] || m.text.slice(8))} · ${esc(fmtTs(m.created_at))}</div>`; return; }
      const mine = m.user_id === me.user.id;
      html += `<div class="bubble ${mine ? 'mine' : ''}"><span class="who">${esc(pName(m.user_id))}</span>${esc(m.text)}<span class="t">${esc(fmtTs(m.created_at))}</span></div>`;
    });
    $('dBody').innerHTML = html;
    $('dBody').scrollTop = $('dBody').scrollHeight;
    const last = (data || []).at(-1)?.created_at; if (last) setSeen(id, last);
  }

  async function sendNachricht(e) {
    e && e.preventDefault();
    const text = $('dText').value.trim(); if (!text || !detailId) return;
    $('dText').value = ''; $('dText').style.height = 'auto';
    const { error } = await sb.from(T_N).insert({ aufgabe_id: detailId, user_id: me.user.id, text });
    if (error) { $('dText').value = text; return alert(error.message); }
    await loadMessages(); loadAufgaben();
  }

  // Live-Aktualisierung (Supabase Realtime), Fallback: beim Zurückkehren in die App neu laden
  let liveTimer = null;
  const reloadSoon = () => { clearTimeout(liveTimer); liveTimer = setTimeout(() => { loadAufgaben(); if (detailId) loadMessages(); }, 400); };
  function subscribeLive() {
    if (subscribeLive.done) return; subscribeLive.done = true;
    try {
      sb.channel('jugend-aufgaben')
        .on('postgres_changes', { event: '*', schema: 'public', table: T_A }, reloadSoon)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: T_N }, reloadSoon)
        .subscribe();
    } catch {}
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('app').hidden) reloadSoon(); });
  }

  // ---------- BFV-Spielplan ----------
  async function loadBfv() {
    try {
      const r = await fetch('/data/jugend-spiele.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      bfv = { games: (d.games || []), updatedAt: d.updatedAt };
    } catch { bfv = { games: [], updatedAt: null }; }
    renderSpiele(); renderStart(); renderVerlegungen();
  }

  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const allowedTeamKeys = () => myTeamList().map(t => t[0]);
  // Teams der App, zu denen ein BFV-Spiel gehören kann – gefiltert auf die eigenen Teams
  const gameTeams = g => (g.teams || []).filter(k => allowedTeamKeys().includes(k));
  const teamsLabel = g => { const t = gameTeams(g); return t.length ? t.map(teamName).join('/') : (g.altersklasse || ''); };
  function upcomingGames(teamKey) {
    const t = today();
    return bfv.games.filter(g => g.date >= t && gameTeams(g).length && (!teamKey || gameTeams(g).includes(teamKey)));
  }
  const norm = s => String(s || '').toLowerCase().replace(/\(sg\)|[^a-z0-9äöüß]+/g, ' ').replace(/\s+/g, ' ').trim();
  const sameClub = (a, b) => { const x = norm(a), y = norm(b); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };
  const runningFor = g => verlegungen.find(v => ACTIVE.includes(v.status) && sameClub(v.gegner, g.gegner) && (g.teams || []).includes(v.team_key) && (v.alt_datum === g.date || v.neu_datum === g.date));

  function gameRow(g) {
    const run = runningFor(g);
    const venue = g.venue ? `<a href="https://maps.google.com/?q=${encodeURIComponent(g.venue)}" target="_blank" rel="noopener">📍 ${esc(g.venue.split(',')[0])}</a>` : '';
    const home = g.heim ? `<span class="svk">${esc(teamsLabel(g))}</span>` : esc(g.home);
    const away = g.heim ? esc(g.away) : `<span class="svk">${esc(teamsLabel(g))}</span>`;
    return `<div class="game">
      <div class="game-time">${esc(g.time)}<small>${esc(fmtDate(g.date))}</small></div>
      <div class="game-main">
        <div class="game-teams">${home} – ${away}</div>
        <div class="game-meta"><span class="tag">${esc(g.altersklasse)}</span><span class="tag">${esc(g.wettbewerb || g.typ)}</span>${g.geaendert ? '<span class="tag changed">beim BFV geändert</span>' : ''}${run ? `<span class="tag running">Verlegung: ${esc(STATUS[run.status].label)}</span>` : ''}</div>
        ${venue ? `<div class="game-meta">${venue}</div>` : ''}
      </div>
      ${run ? '' : `<button class="small ghost" data-action="verlegen" data-game="${esc(g.id)}">Verlegen</button>`}
    </div>`;
  }

  function renderSpiele() {
    const ft = $('sTeam').value, only = $('sNurAenderungen').checked;
    const list = upcomingGames(ft).filter(g => !only || g.geaendert);
    let html = '', day = '';
    list.forEach(g => { if (g.date !== day) { day = g.date; html += `<div class="day-head">${esc(fmtDate(g.date, true))}</div>`; } html += gameRow(g); });
    $('sList').innerHTML = html || `<div class="empty">${bfv.updatedAt ? 'Keine anstehenden Spiele in dieser Auswahl.' : 'Spielplan konnte nicht geladen werden.'}</div>`;
    $('bfvStand').textContent = bfv.updatedAt
      ? 'Quelle: offizieller BFV-Vereinsspielplan, Stand ' + new Date(bfv.updatedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + ' Uhr. Wird alle 3 Stunden automatisch aktualisiert. Bei D- bis F-Junioren unterscheidet der BFV nicht zwischen z. B. U13 und U12 – deshalb steht dort beides.'
      : '';
  }

  function fillFromGame(g) {
    const teams = gameTeams(g);
    if (teams.length && !teams.includes($('vTeam').value)) $('vTeam').value = teams[0];
    const typ = { 'Punktspiel': 'Punktspiel', 'Pokal': 'Pokal', 'Freundschaftsspiel': 'Freundschaftsspiel', 'Hallenturnier': 'Turnier', 'Turnier': 'Turnier' }[g.typ] || 'Punktspiel';
    $('vComp').value = typ;
    $('vGegner').value = g.gegner; $('vHeim').value = String(!!g.heim);
    $('vAltDatum').value = g.date; $('vAltZeit').value = g.time;
    $('vGegner').onchange && $('vGegner').onchange();
  }
  function openEditorFromGame(g) {
    if (!g) return;
    openEditor();
    $('vGame').value = g.id; fillFromGame(g);
    if (gameTeams(g).length > 1) setMsg($('vMsg'), 'Bitte prüfen: Der BFV führt hier nur die Altersklasse (' + g.altersklasse + '). Stimmt die Mannschaft?');
  }

  // Abgleich einer Verlegung mit dem aktuellen BFV-Spielplan
  function bfvHint(x) {
    if (!bfv.games.length || !ACTIVE.includes(x.status) && x.status !== 'erledigt') return '';
    const cand = bfv.games.filter(g => (g.teams || []).includes(x.team_key) && sameClub(g.gegner, x.gegner));
    if (!cand.length) return '';
    if (x.neu_datum) {
      const neu = cand.find(g => g.date === x.neu_datum && (!x.neu_uhrzeit || g.time === x.neu_uhrzeit.slice(0, 5)));
      if (neu) return x.status === 'erledigt' ? '' : `<div class="bfv-ok">✓ Der BFV-Spielplan zeigt schon den neuen Termin (${esc(fmtDate(neu.date))}, ${esc(neu.time)} Uhr)${me.leitung ? ' – kann auf „Erledigt“' : ''}.</div>`;
    }
    const alt = cand.find(g => g.date === x.alt_datum);
    if (alt && alt.geaendert) return '<div class="bfv-warn">⚠ Der BFV hat dieses Spiel als geändert markiert – bitte Termin prüfen.</div>';
    if (alt && ['beantragt'].includes(x.status)) return '<div class="by">BFV zeigt noch den alten Termin.</div>';
    return '';
  }

  // ---------- Trainer ----------
  async function loadStaff() {
    const { data, error } = await sb.from('team_staff').select('*').eq('area', 'Jugend').order('sort_order').order('name');
    if (error) { $('tList').innerHTML = `<div class="empty">Trainer konnten nicht geladen werden: ${esc(error.message)}</div>`; return; }
    staff = data || []; renderStaff(); renderStart();
  }

  function renderStaff() {
    const q = $('tSearch').value.trim().toLowerCase(), order = TEAMS.map(t => t[0]);
    const arr = staff.filter(s => !q || [s.name, s.role, s.team_name, teamName(s.team_key)].join(' ').toLowerCase().includes(q));
    const groups = {}; arr.forEach(s => (groups[s.team_key] ??= []).push(s));
    // eigene Teams zuerst
    const rank = k => (me.teams.includes(k) ? -100 : 0) + (order.indexOf(k) + 1 || 99);
    const keys = Object.keys(groups).sort((a, b) => rank(a) - rank(b));
    $('tList').innerHTML = keys.map(k => {
      const list = groups[k], mails = list.filter(s => s.email).map(s => s.email);
      return `<section class="team-group">
        <div class="team-group-head"><h3>${esc(list[0].team_name || teamName(k))}${me.teams.includes(k) ? ' <span class="pill s-zugestimmt">Dein Team</span>' : ''}</h3>${mails.length ? `<a class="btn ghost small" href="${mailHref(mails.join(','), 'SpVgg Kaufbeuren ' + (list[0].team_name || teamName(k)), '')}">✉ Mail an alle</a>` : ''}</div>
        <div class="people">${list.map(s => `<div class="person">
          ${s.image_url ? `<img class="avatar" src="${esc(s.image_url)}" alt="" loading="lazy">` : `<div class="avatar">${esc(initials(s.name))}</div>`}
          <div class="person-info"><strong>${esc(s.name)}</strong><span class="meta">${esc(s.role || '')}${s.active === false ? ' · inaktiv' : ''}</span></div>
          <div class="icons">
            <a class="btn icon" href="${s.phone ? telHref(s.phone) : '#'}" aria-disabled="${!s.phone}" aria-label="${esc(s.name)} anrufen">📞</a>
            <a class="btn icon wa" href="${s.phone && waNumber(s.phone) ? waHref(s.phone) : '#'}" target="_blank" rel="noopener" aria-disabled="${!(s.phone && waNumber(s.phone))}" aria-label="WhatsApp an ${esc(s.name)}">💬</a>
            <a class="btn icon" href="${s.email ? 'mailto:' + esc(s.email) : '#'}" aria-disabled="${!s.email}" aria-label="E-Mail an ${esc(s.name)}">✉</a>
          </div></div>`).join('')}</div></section>`;
    }).join('') || '<div class="empty">Keine Trainer gefunden.</div>';
  }

  // ---------- Zugänge (nur Leitung) ----------
  async function loadMitglieder() {
    const { data, error } = await sb.from(T_M).select('*').order('freigegeben').order('created_at', { ascending: false });
    if (error) { $('zList').innerHTML = `<div class="empty">${missing(error) ? 'Die Zugangsverwaltung ist in der Datenbank noch nicht eingerichtet (SQL V91).' : esc(error.message)}</div>`; return; }
    mitglieder = data || []; renderMitglieder(); renderStart(); renderVerlegungen();
  }

  function renderMitglieder() {
    const pending = mitglieder.filter(m => !m.freigegeben).length;
    $('badgeZ').hidden = !pending; $('badgeZ').textContent = pending;
    $('zList').innerHTML = mitglieder.map(m => `<article class="card z-card ${m.freigegeben ? '' : 'pending'}" data-z="${m.user_id}">
      <div class="card-head"><div><div class="card-title">${esc(m.name)}</div><div class="meta">${esc(m.email || '')}${m.telefon ? ' · <a href="' + telHref(m.telefon) + '">' + esc(m.telefon) + '</a>' : ''}</div></div>
      <span class="pill ${m.freigegeben ? 's-erledigt' : 's-angefragt'}">${m.freigegeben ? 'Freigegeben' : 'Wartet'}</span></div>
      <div class="teams">${TEAMS.map(t => `<label><input type="checkbox" value="${t[0]}" ${(m.teams || []).includes(t[0]) ? 'checked' : ''}>${t[1]}</label>`).join('')}</div>
      <div class="z-row">
        <select data-role><option value="trainer" ${m.rolle === 'trainer' ? 'selected' : ''}>Trainer (nur eigene Teams)</option><option value="leitung" ${m.rolle === 'leitung' ? 'selected' : ''}>Jugendleitung (alles)</option></select>
        <span class="spacer"></span>
        ${m.freigegeben
          ? `<button class="small" data-action="z-save" data-id="${m.user_id}">Speichern</button><button class="small ghost" data-action="z-block" data-id="${m.user_id}">Sperren</button>`
          : `<button class="small" data-action="z-save" data-approve="1" data-id="${m.user_id}">✓ Freigeben</button><button class="small ghost danger" data-action="z-delete" data-id="${m.user_id}">Ablehnen</button>`}
      </div></article>`).join('') || '<div class="empty">Noch keine Zugänge beantragt. Schick deinen Trainern einfach den Link zur App – sie können sich dort selbst registrieren.</div>';
  }

  async function saveMitglied(id, approve) {
    const el = document.querySelector(`[data-z="${id}"]`);
    const teams = [...el.querySelectorAll('.teams input:checked')].map(i => i.value);
    const rolle = el.querySelector('[data-role]').value;
    if (rolle === 'trainer' && !teams.length) return alert('Bitte mindestens ein Team auswählen.');
    const upd = { teams, rolle, updated_at: new Date().toISOString() };
    if (approve) upd.freigegeben = true;
    const { error } = await sb.from(T_M).update(upd).eq('user_id', id);
    if (error) return alert(error.message);
    await loadMitglieder();
    const m = mitglieder.find(x => x.user_id === id);
    if (approve && m) openMessage({
      title: m.name + ' Bescheid geben',
      text: `Hallo ${m.name.split(' ')[0]},\n\ndein Zugang zur SVK-Jugend-App ist freigeschaltet${teams.length ? ' (' + teams.map(teamName).join(', ') + ')' : ''}.\n\nHier geht's zur App: ${location.origin}/jugendapp/\nTipp: Über „Zum Home-Bildschirm“ kannst du sie wie eine normale App aufs Handy legen.\n\nGrüße\n${myName()}`,
      subject: 'Dein Zugang zur SVK-Jugend-App',
      targets: (m.telefon || m.email) ? [{ name: m.name, phone: m.telefon, email: m.email }] : []
    });
  }
  async function blockMitglied(id) {
    if (!confirm('Zugang sperren? Die Person sieht danach keine Daten mehr.')) return;
    const { error } = await sb.from(T_M).update({ freigegeben: false, updated_at: new Date().toISOString() }).eq('user_id', id);
    if (error) alert(error.message); else loadMitglieder();
  }
  async function deleteMitglied(id) {
    if (!confirm('Antrag ablehnen und entfernen?')) return;
    const { error } = await sb.from(T_M).delete().eq('user_id', id);
    if (error) alert(error.message); else loadMitglieder();
  }

  start();
})();
