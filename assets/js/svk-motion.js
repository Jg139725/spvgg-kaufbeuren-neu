/*
 * SVK Spieltag-Effekte (Startseite & Live-Center)
 * - Spielstände zählen hoch, sobald sie ins Bild kommen
 * - Countdown-Ziffern kippen beim Wechsel
 * - eigene Tabellenzeile leuchtet einmal auf
 * - Handy: Leiste „Nächstes Spiel“ (nur Startseite, data-next-bar)
 * Bei „Bewegung reduzieren“ werden nur die Leiste und statische Inhalte gezeigt.
 */
(function () {
  "use strict";
  const script = document.currentScript;
  const root = (script && script.dataset.root) || "";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const css = `
  @keyframes svkm-flip{0%{transform:perspective(300px) rotateX(0)}45%{transform:perspective(300px) rotateX(-90deg);opacity:.2}55%{transform:perspective(300px) rotateX(90deg);opacity:.2}100%{transform:perspective(300px) rotateX(0)}}
  @keyframes svkm-pop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
  @keyframes svkm-shine{from{background-position:-150% 0}to{background-position:250% 0}}
  .svkm-flip{animation:svkm-flip .5s ease-in-out}
  .svkm-pop{animation:svkm-pop .45s ease-out}
  tr.svkm-shine>*{background-image:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.85) 50%,transparent 70%);background-size:60% 100%;background-repeat:no-repeat;animation:svkm-shine 1.4s .2s ease-in-out 2 both}
  .svkm-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:900;display:none;align-items:center;gap:12px;padding:10px 10px 10px 16px;border-radius:16px;background:#021f46;color:#fff;box-shadow:0 12px 30px rgba(2,31,70,.35);transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.8,.2,1);font-size:14px;line-height:1.25}
  .svkm-bar.show{transform:none}
  .svkm-bar div{flex:1;min-width:0}
  .svkm-bar small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#8fc0ff;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
  .svkm-bar strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .svkm-bar a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:12px;background:#0b66d0;color:#fff;font-weight:850;text-decoration:none}
  .svkm-bar button{flex:none;width:36px;height:44px;border:0;background:none;color:#fff;font-size:22px;opacity:.7;cursor:pointer}
  @media(max-width:760px){.svkm-bar{display:flex}}
  @media(prefers-reduced-motion:reduce){.svkm-bar{transition:none}}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const SCORE = /^\s*(\d{1,2})\s*:\s*(\d{1,2})\s*$/;

  /* ---------- Spielstand hochzählen ---------- */
  function countScore(el) {
    if (el.dataset.svkmDone) return;
    const m = el.textContent.match(SCORE);
    if (!m) return;
    el.dataset.svkmDone = "1";
    if (reduced) return;
    const a = +m[1], b = +m[2], sep = el.textContent.includes(" : ") ? " : " : ":";
    const steps = Math.max(a, b);
    if (!steps) { el.classList.add("svkm-pop"); return; }
    let i = 0;
    el.textContent = "0" + sep + "0";
    const timer = setInterval(() => {
      i++;
      el.textContent = Math.min(i, a) + sep + Math.min(i, b);
      if (i >= steps) {
        clearInterval(timer);
        el.classList.add("svkm-pop");
      }
    }, 260);
  }

  const scoreIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      scoreIO.unobserve(e.target);
      setTimeout(() => countScore(e.target), 250);
    });
  }, { threshold: 0.6 });

  function scanScores() {
    document.querySelectorAll(".svk37-score, .score > b, .score b").forEach(el => {
      if (el.dataset.svkmSeen || !SCORE.test(el.textContent)) return;
      el.dataset.svkmSeen = "1";
      scoreIO.observe(el);
    });
  }

  /* ---------- Countdown-Ziffern kippen ---------- */
  function watchCountdown() {
    if (reduced) return;
    ["days", "hours", "mins", "secs"].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.svkmFlip) return;
      el.dataset.svkmFlip = "1";
      let last = el.textContent;
      new MutationObserver(() => {
        if (el.textContent === last) return;
        last = el.textContent;
        el.classList.remove("svkm-flip");
        void el.offsetWidth;
        el.classList.add("svkm-flip");
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ---------- eigene Tabellenzeile ---------- */
  const rowIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      rowIO.unobserve(e.target);
      e.target.classList.add("svkm-shine");
    });
  }, { threshold: 0.4 });
  function scanTable() {
    if (reduced) return;
    document.querySelectorAll("tr.svk").forEach(tr => {
      if (tr.dataset.svkmRow) return;
      tr.dataset.svkmRow = "1";
      rowIO.observe(tr);
    });
  }

  /* ---------- Handy: Leiste „Nächstes Spiel“ ---------- */
  async function nextBar() {
    if (!script || !script.hasAttribute("data-next-bar")) return;
    try { if (sessionStorage.getItem("svkm-bar-closed")) return; } catch (e) { /* ohne Speicher weiter */ }
    let data;
    try {
      const r = await fetch(root + "data/herren-spielplan.json?cb=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      data = await r.json();
    } catch (e) { return; }
    const g = data && (data.nextGame || (data.fixtures || [])[0]);
    if (!g || !g.home || !g.away) return;
    const d = String(g.date || "").slice(0, 10).split("-");
    const when = d.length === 3 ? new Date(+d[0], +d[1] - 1, +d[2]) : null;
    if (when && when < new Date(new Date().toDateString())) return;
    const day = when ? when.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(",", "") : "";
    const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const bar = document.createElement("aside");
    bar.className = "svkm-bar";
    bar.setAttribute("aria-label", "Nächstes Spiel");
    const svkHome = /spvgg kaufbeuren/i.test(g.home);
    const svkAway = /spvgg kaufbeuren/i.test(g.away);
    const match = svkHome ? "vs. " + g.away : svkAway ? "bei " + g.home : g.home + " – " + g.away;
    bar.innerHTML = `<div><small>${esc(day)}${g.time ? " · " + esc(g.time) + " Uhr" : ""}</small><strong>${esc(match)}</strong></div>` +
      `<a href="${root}verein/live-center.html">Live-Center</a><button type="button" aria-label="Leiste schließen">×</button>`;
    document.body.appendChild(bar);
    bar.querySelector("button").addEventListener("click", () => {
      bar.remove();
      try { sessionStorage.setItem("svkm-bar-closed", "1"); } catch (e) { /* egal */ }
    });

    const hero = document.querySelector(".hero, #start");
    const footer = document.querySelector("footer");
    const consentOpen = () => !!document.querySelector('aside[aria-label="Optionale Besucherstatistik"]');
    let pastHero = false, atFooter = false;
    const update = () => bar.classList.toggle("show", pastHero && !atFooter && !consentOpen());
    if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; update(); }).observe(hero); else pastHero = true;
    if (footer) new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; update(); }).observe(footer);
    document.addEventListener("click", () => setTimeout(update, 50));
    update();
  }

  /* Inhalte werden per JavaScript nachgeladen → beobachten */
  function scan() { scanScores(); watchCountdown(); scanTable(); }
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
  scan();
  nextBar();
})();
