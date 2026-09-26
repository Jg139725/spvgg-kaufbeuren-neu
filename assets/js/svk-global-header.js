(() => {
  function getBasePath() {
    const scripts = [...document.scripts];
    const known = scripts.find(s => /\/assets\/js\/(?:subpages|herren2|svk-global-header)\.js(?:\?|$)/.test(s.src));
    if (known) {
      const marker="/assets/js/", i=known.src.indexOf(marker);
      if (i!==-1) return known.src.slice(0,i+1);
    }
    const parts=location.pathname.split("/").filter(Boolean);
    if (location.hostname.endsWith("github.io") && parts.length) return `${location.origin}/${parts[0]}/`;
    return `${location.origin}/`;
  }

  function relativeActive(path) {
    const c=location.pathname.toLowerCase();
    if(path==="news.html") return c.includes("/news")||c.includes("/artikel");
    if(path==="verein/live-center.html") return c.includes("/live-center");
    if(path==="herren/index.html") return c.includes("/herren/")||c.includes("/herren2/");
    if(path==="jugend/index.html") return c.includes("/jugend/");
    if(path==="verein/index.html") return c.includes("/verein/")&&!c.includes("live-center")&&!c.includes("geschichte");
    if(path==="verein/geschichte.html") return c.includes("geschichte");
    if(path==="stadion.html") return c.includes("stadion");
    if(path==="fanshop.html") return c.includes("fanshop");
    return false;
  }

  function buildHeader(base) {
    const h=document.createElement("header");
    h.className="svk-global-header";
    const links=[
      ["Aktuelles","news.html"],
      ["Spiele","verein/live-center.html"],
      ["Mannschaften","herren/index.html"],
      ["Jugend","jugend/index.html"],
      ["Verein","verein/index.html"],
      ["Historie","verein/geschichte.html"],
      ["Stadion","stadion.html"],
      ["Fanshop","fanshop.html"]
    ];
    h.innerHTML=`<div class="svk-global-main"><div class="svk-global-main-inner">
      <a class="svk-global-brand" href="${base}index.html" aria-label="SpVgg Kaufbeuren – Startseite">
        <img src="${base}assets/images/logo-top.png" alt="SpVgg Kaufbeuren e. V.">
      </a>
      <button class="svk-global-menu" type="button" aria-label="Menü öffnen" aria-expanded="false">☰</button>
      <nav class="svk-global-nav">${links.map(([label,path])=>`<a href="${base}${path}" class="${relativeActive(path)?"active":""} ${path==="fanshop.html"?"svk-global-fanshop":""}">${label}</a>`).join("")}</nav>
    </div></div>`;

    const btn=h.querySelector(".svk-global-menu"), nav=h.querySelector(".svk-global-nav");
    btn.addEventListener("click",()=>{const open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",String(open))});
    nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");btn.setAttribute("aria-expanded","false")}));
    return h;
  }

  function installHeader(){
    const base=getBasePath();
    // Wichtig: alle direkten alten Header entfernen. Genau dieser Rest erzeugte links den blauen Kasten.
    [...document.querySelectorAll("body > header")].forEach(h=>h.remove());
    document.querySelectorAll(".sub-header,.h2-header,.site-header,.page-header").forEach(h=>h.remove());

    if(!document.querySelector('link[href*="svk-global-header.css"]')){
      const l=document.createElement("link");l.rel="stylesheet";l.href=`${base}assets/css/svk-global-header.css?v=411`;document.head.appendChild(l);
    }
    document.body.prepend(buildHeader(base));
    installVereinDropdown();
  }

  function installVereinDropdown(){
    const nav=document.querySelector(".svk-global-nav");
    if(!nav||nav.querySelector(".svk-verein-dropdown"))return;
    const verein=[...nav.querySelectorAll("a")].find(a=>(a.textContent||"").trim()==="Verein");
    if(!verein)return;
    const href=verein.getAttribute("href")||"", base=href.replace(/verein\/index\.html(?:\?.*)?$/,"");
    const w=document.createElement("div");w.className="svk-verein-dropdown";
    const t=verein.cloneNode(true);t.classList.add("svk-verein-trigger");t.setAttribute("aria-haspopup","true");t.setAttribute("aria-expanded","false");
    const m=document.createElement("div");m.className="svk-verein-menu";
    m.innerHTML=`<a href="${base}verein/index.html">Übersicht</a><a href="${base}verein/vorstand.html">Vorstand</a><a href="${base}verein/geschichte.html">Historie</a><a href="${base}verein/kontakt.html">Ansprechpartner</a><a href="${base}verein/mitglied-werden.html">Mitglied werden</a><a href="${base}verein/satzung.html">Satzung</a>`;
    verein.replaceWith(w);w.append(t,m);
    const set=o=>{w.classList.toggle("open",o);t.setAttribute("aria-expanded",String(o))};
    t.addEventListener("click",e=>{if(matchMedia("(max-width:900px)").matches){e.preventDefault();set(!w.classList.contains("open"))}});
    w.addEventListener("mouseenter",()=>{if(!matchMedia("(max-width:900px)").matches)set(true)});
    w.addEventListener("mouseleave",()=>{if(!matchMedia("(max-width:900px)").matches)set(false)});
    document.addEventListener("click",e=>{if(!w.contains(e.target))set(false)});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installHeader);
  else installHeader();
})();