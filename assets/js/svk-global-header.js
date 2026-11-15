(() => {
  function getBasePath() {
    const scripts = [...document.scripts];
    const known = scripts.find(s =>
      /\/assets\/js\/(?:subpages|herren2|svk-global-header)\.js(?:\?|$)/.test(s.src)
    );
    if (known) {
      const marker = "/assets/js/";
      const index = known.src.indexOf(marker);
      if (index !== -1) return known.src.slice(0, index + 1);
    }

    const parts = window.location.pathname.split("/").filter(Boolean);
    if (window.location.hostname.endsWith("github.io") && parts.length) {
      return `${window.location.origin}/${parts[0]}/`;
    }
    return `${window.location.origin}/`;
  }

  function relativeActive(path) {
    const current = window.location.pathname.toLowerCase();
    if (path === "news.html") return current.includes("/news") || current.includes("/artikel");
    if (path === "verein/live-center.html") return current.includes("/live-center");
    if (path === "herren/index.html") return current.includes("/herren/") || current.includes("/herren2/");
    if (path === "jugend/index.html") return current.includes("/jugend/");
    if (path === "verein/index.html") {
      return current.includes("/verein/") &&
        !current.includes("live-center") &&
        !current.includes("geschichte");
    }
    if (path === "verein/geschichte.html") return current.includes("geschichte");
    if (path === "stadion.html") return current.includes("stadion");
    if (path === "fanshop.html") return current.includes("fanshop");
    return false;
  }

  function buildHeader(base) {
    const header = document.createElement("header");
    header.className = "svk-global-header";

    const links = [
      ["Aktuelles", "news.html"],
      ["Spiele", "verein/live-center.html"],
      ["Mannschaften", "herren/index.html"],
      ["Jugend", "jugend/index.html"],
      ["Verein", "verein/index.html"],
      ["Historie", "verein/geschichte.html"],
      ["Stadion", "stadion.html"],
      ["Fanshop", "fanshop.html"]
    ];

    header.innerHTML = `
      <div class="svk-global-topbar">
        <div class="svk-global-topbar-inner">
          <span>SpVgg Kaufbeuren e. V.</span>
          <div class="svk-global-toplinks">
            <a href="${base}verein/kontakt.html">Kontakt</a>
            <a href="${base}sponsoren.html">Partner</a>
            <a class="svk-insta-top" href="https://www.instagram.com/spvgg_kaufbeuren/" target="_blank" rel="noopener"
               aria-label="SpVgg Kaufbeuren auf Instagram" title="SpVgg Kaufbeuren auf Instagram">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a class="svk-login-link" href="${base}admin/index.html" data-svk-login="1" title="Redaktion anmelden">
              <span class="svk-login-icon" aria-hidden="true">↪</span>
              Anmelden
            </a>
          </div>
        </div>
      </div>

      <div class="svk-global-main">
        <div class="svk-global-main-inner">
          <a class="svk-global-brand" href="${base}index.html"
             aria-label="SpVgg Kaufbeuren – zur Startseite">
            <img src="${base}assets/images/logo-top.png"
                 alt="SpVgg Kaufbeuren e. V.">
          </a>

          <button class="svk-global-menu" type="button"
                  aria-label="Menü öffnen" aria-expanded="false">☰</button>

          <nav class="svk-global-nav">
            ${links.map(([label, path]) => `
              <a href="${base}${path}"
                 class="${relativeActive(path) ? "active" : ""} ${path === "fanshop.html" ? "svk-global-fanshop" : ""}">
                ${label}
              </a>
            `).join("")}
          </nav>
        </div>
      </div>
    `;

    const button = header.querySelector(".svk-global-menu");
    const nav = header.querySelector(".svk-global-nav");

    button.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      });
    });

    // Login immer auf den echten Admin-/Redaktionsbereich zwingen.
    // Dadurch kann kein alter /redaktion/index.html-Link mehr greifen.
    const loginLink = header.querySelector('[data-svk-login="1"]');
    if (loginLink) {
      loginLink.href = `${base}admin/index.html`;
      loginLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = `${base}admin/index.html`;
      });
    }

    return header;
  }

  function installVereinDropdown() {
    const nav = document.querySelector(".svk-global-nav");
    if (!nav || nav.querySelector(".svk-verein-dropdown")) return;

    const vereinLink = [...nav.querySelectorAll("a")].find(link =>
      (link.textContent || "").trim().toLowerCase() === "verein"
    );
    if (!vereinLink) return;

    const baseHref = vereinLink.getAttribute("href") || "";
    const base = baseHref.replace(/verein\/index\.html(?:\?.*)?$/, "");

    const wrapper = document.createElement("div");
    wrapper.className = "svk-verein-dropdown";

    const trigger = vereinLink.cloneNode(true);
    trigger.classList.add("svk-verein-trigger");
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "svk-verein-menu";
    menu.innerHTML = `
      <a href="${base}verein/index.html">Übersicht</a>
      <a href="${base}verein/vorstand.html">Vorstand</a>
      <a href="${base}verein/geschichte.html">Historie</a>
      <a href="${base}verein/kontakt.html">Ansprechpartner</a>
      <a href="${base}foerderverein/index.html">Förderverein</a>
      <a href="${base}verein/downloads.html">Mitglied werden</a>
      <a href="${base}verein/satzung.html">Satzung</a>
    `;

    vereinLink.replaceWith(wrapper);
    wrapper.append(trigger, menu);

    function setOpen(open) {
      wrapper.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    }

    trigger.addEventListener("click", event => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        event.preventDefault();
        setOpen(!wrapper.classList.contains("open"));
      }
    });
    wrapper.addEventListener("mouseenter", () => {
      if (!window.matchMedia("(max-width: 900px)").matches) setOpen(true);
    });
    wrapper.addEventListener("mouseleave", () => {
      if (!window.matchMedia("(max-width: 900px)").matches) setOpen(false);
    });
    document.addEventListener("click", event => {
      if (!wrapper.contains(event.target)) setOpen(false);
    });
  }

  function installStadionDropdown() {
    const nav = document.querySelector(".svk-global-nav");
    if (!nav || nav.querySelector(".svk-stadion-dropdown")) return;
    const stadionLink = [...nav.querySelectorAll(":scope > a")].find(link =>
      (link.textContent || "").trim().toLowerCase() === "stadion"
    );
    if (!stadionLink) return;
    const href = stadionLink.getAttribute("href") || "";
    const base = href.replace(/stadion\.html(?:\?.*)?$/, "");
    const wrapper = document.createElement("div");
    wrapper.className = "svk-verein-dropdown svk-stadion-dropdown";
    const trigger = stadionLink.cloneNode(true);
    trigger.classList.add("svk-verein-trigger");
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.className = "svk-verein-menu";
    menu.innerHTML = `
      <a href="${base}stadion.html">Parkstadion</a>
      <a href="${base}trainingsgelaende/index.html">Trainingsgelände</a>
    `;
    stadionLink.replaceWith(wrapper); wrapper.append(trigger, menu);
    const setOpen = open => { wrapper.classList.toggle("open", open); trigger.setAttribute("aria-expanded", String(open)); };
    trigger.addEventListener("click", e => { if (window.matchMedia("(max-width: 900px)").matches) { e.preventDefault(); setOpen(!wrapper.classList.contains("open")); } });
    wrapper.addEventListener("mouseenter", () => { if (!window.matchMedia("(max-width: 900px)").matches) setOpen(true); });
    wrapper.addEventListener("mouseleave", () => { if (!window.matchMedia("(max-width: 900px)").matches) setOpen(false); });
    document.addEventListener("click", e => { if (!wrapper.contains(e.target)) setOpen(false); });
  }

  function installHeader() {
    const base = getBasePath();

    // Alte direkte Seiten-Header entfernen, damit nie zwei Kopfzeilen übereinander liegen.
    [...document.querySelectorAll("body > header")].forEach(h => h.remove());
    document.querySelectorAll(".sub-header,.h2-header,.site-header,.page-header")
      .forEach(h => h.remove());

    if (!document.querySelector('link[href*="svk-global-header.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `${base}assets/css/svk-global-header.css?v=42`;
      document.head.appendChild(css);
    }

    document.body.prepend(buildHeader(base));
    installVereinDropdown();
    installStadionDropdown();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installHeader);
  } else {
    installHeader();
  }
})();
/* Site-wide copyright credit. */
(() => {
  function installCopyright() {
    let footer = document.getElementById("svk-copyright");
    if (!footer) {
      footer = document.createElement("div");
      footer.id = "svk-copyright";
      footer.style.cssText = "padding:15px;text-align:center;background:#071d3c;color:#fff;font:13px/1.6 system-ui,sans-serif;overflow-wrap:anywhere";
      document.body.append(footer);
    }
    footer.textContent = "© " + new Date().getFullYear() + " SpVgg Kaufbeuren e. V. · Alle Rechte vorbehalten. · © Herzfotografen";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installCopyright);
  } else {
    installCopyright();
  }
})();
/* Site-wide Instagram links: Symbol in der Kopfleiste (oben) und Leiste vor dem Fußbereich. */
(() => {
  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>';
  const ACCOUNTS = [
    { key: "verein", label: "Verein & Herren", handle: "spvgg_kaufbeuren" },
    { key: "jugend", label: "Junioren", handle: "spvgg_kaufbeuren_junioren" },
    { key: "frauen", label: "Frauen", handle: "svk_frauen" }
  ];
  const CSS = `
.svk-insta-top{display:inline-flex!important;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;color:#fff!important;background:#ffffff12;border:1px solid #ffffff50}
.svk-insta-top:hover{background:#fff;color:#075eb4!important}
.svk-social{background:#f2f6fb;border-top:1px solid #dce5ef;padding:44px 0;font-family:Inter,Arial,sans-serif;color:#122033}
.svk-social *{box-sizing:border-box}
.svk-social-inner{width:min(1180px,calc(100% - 36px));margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:22px 34px;flex-wrap:wrap}
.svk-social-text span{display:block;color:#0753a5;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.svk-social-text strong{display:block;margin-top:6px;font-size:clamp(22px,2.6vw,28px);letter-spacing:-.03em;color:#021f46}
.svk-social-links{display:flex;gap:12px;flex-wrap:wrap}
.svk-social-links a{display:flex;align-items:center;gap:11px;padding:11px 16px 11px 12px;border:1px solid #dce5ef;border-radius:14px;background:#fff;color:#021f46;text-decoration:none;box-shadow:0 8px 22px rgba(2,31,70,.06);transition:.2s}
.svk-social-links a:hover{transform:translateY(-2px);border-color:#0753a5}
.svk-social-links a.is-current{border-color:#0753a5;box-shadow:0 0 0 2px #0753a533,0 8px 22px rgba(2,31,70,.06)}
.svk-social-icon{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;color:#fff;background:linear-gradient(135deg,#0753a5,#021f46)}
.svk-social-links b{display:block;font-size:14px;font-weight:900;line-height:1.2}
.svk-social-links small{display:block;margin-top:2px;color:#66758a;font-size:12px;line-height:1.2}
@media(max-width:700px){.svk-social{padding:34px 0}.svk-social-links{width:100%;flex-direction:column}.svk-social-links a{width:100%}}
`;

  function installSocial() {
    if (document.getElementById("svk-social")) return;
    if (!document.querySelector(".svk-global-header")) return;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // Redaktions- und App-Seiten bekommen nur das Symbol oben, keine Leiste
    const path = window.location.pathname.toLowerCase();
    if (/\/(admin|redaktion|jugendapp)\b|redaktion\.html/.test(path)) return;

    const current = path.includes("/jugend/") ? "jugend" : path.includes("/frauen/") ? "frauen" : "verein";
    // Der Kanal, der zur aktuellen Seite passt, steht vorne
    const list = [...ACCOUNTS].sort((a, b) => (b.key === current) - (a.key === current));

    const section = document.createElement("section");
    section.id = "svk-social";
    section.className = "svk-social";
    section.setAttribute("aria-label", "SpVgg Kaufbeuren auf Instagram");
    section.innerHTML = `<div class="svk-social-inner">
      <div class="svk-social-text"><span>Instagram</span><strong>Folgt der SVK</strong></div>
      <div class="svk-social-links">${list.map(a => `
        <a href="https://www.instagram.com/${a.handle}/" target="_blank" rel="noopener"${a.key === current ? ' class="is-current"' : ""}>
          <span class="svk-social-icon">${ICON}</span>
          <span><b>${a.label}</b><small>@${a.handle}</small></span>
        </a>`).join("")}
      </div></div>`;

    const footers = [...document.querySelectorAll("footer")].filter(f => !f.closest(".svk-global-header"));
    const footer = footers[footers.length - 1];
    const copyright = document.getElementById("svk-copyright");
    if (footer) footer.before(section);
    else if (copyright) copyright.before(section);
    else document.body.append(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installSocial);
  } else {
    installSocial();
  }
})();

// Shared public statistics and magazine loader.
window.addEventListener('load',()=>{const own=[...document.scripts].find(s=>/svk-global-header\.js/.test(s.src));if(!own)return;const base=new URL('./',own.src);const run=()=>{if(document.querySelector('script[src*="svk-visitor-magazine.js"]'))return;const s=document.createElement('script');s.src=new URL('svk-visitor-magazine.js?v=83',base);document.body.append(s);};if(window.SVK_SUPABASE)run();else{const s=document.createElement('script');s.src=new URL('supabase-config.js',base);s.onload=run;document.body.append(s);}});
