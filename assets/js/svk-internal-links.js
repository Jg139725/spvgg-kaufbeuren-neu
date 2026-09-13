
(() => {
  "use strict";

  const oldHosts = new Set(["spvgg-kaufbeuren.de", "www.spvgg-kaufbeuren.de"]);

  const clean = (p) => (p || "/").replace(/\/+/g, "/").replace(/\/$/, "") || "/";

  const mapPath = (pathname) => {
    const p = clean(pathname).toLowerCase();

    // Known local destinations
    if (p === "/" || p.endsWith("/index.html")) return "index.html";
    if (p.includes("/verein/geschichte") || p.includes("/historie")) return "verein/geschichte.html";
    if (p.includes("/verein/vorstand")) return "verein/vorstand.html";
    if (p.includes("/verein/beirat")) return "verein/beirat.html";
    if (p.includes("/verein/schiedsrichter")) return "verein/schiedsrichter.html";
    if (p.includes("/verein/presseteam")) return "verein/presseteam.html";
    if (p.includes("/verein/download")) return "verein/downloads.html";
    if (p.includes("/verein/satzung")) return "verein/satzung.html";
    if (p.includes("/verein/kontakt") || p.includes("/kontakt")) return "verein/kontakt.html";
    if (p.includes("/verein/anfahrt") || p.includes("/anfahrt")) return "verein/anfahrt.html";
    if (p.includes("/verein")) return "verein/index.html";
    if (p.includes("/foerderverein")) return "foerderverein/index.html";
    if (p.includes("/news") || p.includes("/aktuelles")) return "news.html";
    if (p.includes("/stadion")) return "stadion.html";
    if (p.includes("/sponsor") || p.includes("/partner")) return "sponsoren.html";
    if (p.includes("/fanshop")) return "fanshop.html";
    if (p.includes("/galerie")) return "galerie.html";
    if (p.includes("/video")) return "videos.html";
    if (p.includes("/impressum")) return "impressum.html";
    if (p.includes("/datenschutz")) return "datenschutz.html";

    return null;
  };

  const relativeFromCurrent = (target) => {
    // Absolute-to-site-root URL is safest on GitHub Pages project sites.
    const parts = location.pathname.split("/").filter(Boolean);
    const repo = parts.length ? parts[0] : "spvgg-kaufbeuren-neu";
    return `/${repo}/${target}`;
  };

  const convert = (anchor) => {
    const raw = anchor.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;

    let u;
    try { u = new URL(raw, location.href); } catch { return; }

    if (!oldHosts.has(u.hostname.toLowerCase())) return;
    const mapped = mapPath(u.pathname);
    if (!mapped) {
      // Unknown old-site link stays on the new site and lands on the local Verein overview.
      anchor.href = relativeFromCurrent("verein/index.html");
      anchor.dataset.svkOldLink = raw;
      anchor.title = "Dieser Inhalt wird auf der neuen SVK-Seite bereitgestellt.";
      return;
    }

    anchor.href = relativeFromCurrent(mapped);
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
    anchor.dataset.svkInternalized = "true";
  };

  const scan = () => document.querySelectorAll("a[href]").forEach(convert);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  } else {
    scan();
  }

  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
