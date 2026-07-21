(() => {
  function normalizedPath(path) {
    return path.replace(/\/+/g, '/');
  }

  function prefixForCurrentPage() {
    const path = window.location.pathname;
    const repoMarker = '/spvgg-kaufbeuren-neu/';
    const afterRepo = path.includes(repoMarker)
        ? path.split(repoMarker)[1]
        : path.replace(/^\/+/, '');

    const parts = afterRepo.split('/').filter(Boolean);
    const filename = parts.at(-1) || '';
    const folderDepth = filename.includes('.') ? parts.length - 1 : parts.length;

    return '../'.repeat(Math.max(0, folderDepth));
  }

  const prefix = prefixForCurrentPage();

  const navLinks = [...document.querySelectorAll('nav a')];
  const vereinLink = navLinks.find(
    (link) => link.textContent.trim().toLowerCase() === 'verein'
  );

  if (!vereinLink || vereinLink.closest('.svk-verein-menu-wrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'svk-verein-menu-wrap';

  const toggle = vereinLink.cloneNode(true);
  toggle.classList.add('svk-verein-menu-toggle');
  toggle.removeAttribute('href');
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('tabindex', '0');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `${vereinLink.textContent.trim()} <span aria-hidden="true">⌄</span>`;

  const panel = document.createElement('div');
  panel.className = 'svk-verein-menu-panel';
  panel.innerHTML = `
    <a href="${normalizedPath(prefix + 'verein/index.html')}">Vereinsübersicht</a>
    <a href="${normalizedPath(prefix + 'stadion.html')}">Parkstadion</a>
    <a class="svk-training-link" href="${normalizedPath(prefix + 'trainingsgelaende/index.html')}">
      Trainingsgelände
      <small>2× Rasen · 1× Kunstrasen</small>
    </a>
    <a href="${normalizedPath(prefix + 'historie.html')}">Historie</a>
    <a href="${normalizedPath(prefix + 'verein/vorstandschaft.html')}">Vorstandschaft</a>
    <a href="${normalizedPath(prefix + 'verein/schiedsrichter.html')}">Schiedsrichter</a>
    <a href="${normalizedPath(prefix + 'verein/downloads.html')}">Formulare & Downloads</a>
    <a href="${normalizedPath(prefix + 'sponsoren.html')}">Sponsoren</a>
    <a href="${normalizedPath(prefix + 'verein/kontakt.html')}">Kontakt</a>
  `;

  vereinLink.replaceWith(wrap);
  wrap.append(toggle, panel);

  function toggleMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    const open = wrap.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', toggleMenu);
  toggle.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') toggleMenu(event);
  });

  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) {
      wrap.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
