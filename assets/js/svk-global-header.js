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
            <a class="svk-login-link" href="${base}redaktion/index.html" title="Redaktion anmelden">
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
      <a href="${base}verein/mitglied-werden.html">Mitglied werden</a>
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