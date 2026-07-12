
const b=document.querySelector('.sub-menu'),n=document.querySelector('.sub-nav');
if(b&&n)b.addEventListener('click',()=>{n.classList.toggle('open');b.setAttribute('aria-expanded',n.classList.contains('open'))});


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

    if (path.includes("news")) return current.includes("news");
    if (path.includes("herren/index")) {
      return current.includes("/herren/") || current.includes("/herren2/");
    }
    if (path.includes("jugend")) return current.includes("/jugend/");
    if (path.includes("verein/index")) {
      return current.includes("/verein/") &&
        !current.includes("geschichte") &&
        !current.includes("live-center");
    }
    if (path.includes("geschichte")) return current.includes("geschichte");
    if (path.includes("live-center")) return current.includes("live-center");
    if (path.includes("stadion")) return current.includes("stadion");
    if (path.includes("fanshop")) return current.includes("fanshop");
    return current.endsWith("/index.html") || current.endsWith("/");
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
      ["SVK Live", "verein/live-center.html"],
      ["Stadion", "stadion.html"],
      ["Fanshop", "https://textilstars.com/SpVgg-Kaufbeuren"]
    ];

    header.innerHTML = `
      <div class="svk-global-topbar">
        <div class="svk-global-topbar-inner">
          <span>SpVgg Kaufbeuren e. V.</span>
          <div class="svk-global-toplinks">
            <a href="${base}verein/kontakt.html">Kontakt</a>
            <a href="${base}sponsoren.html">Partner</a>
            <a href="${base}verein/kontakt.html">Kontakt</a>
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
                 class="${relativeActive(path) ? "active" : ""} ${path.includes("fanshop") ? "svk-global-fanshop" : ""}">
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

  function installHeader() {
    if (document.querySelector(".svk-global-header")) return;

    const base = getBasePath();

    if (!document.querySelector('link[href*="svk-global-header.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `${base}assets/css/svk-global-header.css`;
      document.head.appendChild(css);
    }

    const oldHeader = document.querySelector(
      "body > header, .sub-header, .h2-header, .site-header, .page-header"
    );

    const newHeader = buildHeader(base);

    if (oldHeader) oldHeader.replaceWith(newHeader);
    else document.body.prepend(newHeader);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installHeader);
  } else {
    installHeader();
  }
})();


/* Fanshop-Hardfix: alle alten oder lokalen Shoplinks direkt auf Textilstars setzen */
document.addEventListener("DOMContentLoaded", () => {
  const correctShopUrl = "https://textilstars.com/SpVgg-Kaufbeuren";

  document.querySelectorAll("a").forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    const text = (link.textContent || "").trim().toLowerCase();

    if (
      text.includes("fanshop") ||
      href.includes("fanshop.html") ||
      href.includes("fan12.de") ||
      href.includes("textilstars.com/spvgg-kaufbeuren")
    ) {
      link.setAttribute("href", correctShopUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });
});
