/*
 * SVK Medien: Fotogalerien, Videos und Downloads aus JSON-Dateien.
 *
 * Pflege:
 *   data/galerie.json   – Fotoalben (Bilder unter assets/images/galerie/<album>/)
 *   data/videos.json    – YouTube-Videos (werden erst nach Klick geladen)
 *   data/downloads.json – PDF-Dateien (unter assets/downloads/)
 * Anleitung: README-Medien.md
 *
 * Solange eine Datei leer ist, bleibt die Seite unverändert.
 */
(function () {
  "use strict";

  const script = document.currentScript;
  const root = (script && script.dataset.root) || "";

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function url(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return root + String(path).replace(/^\/+/, "");
  }

  function datum(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  async function load(file) {
    try {
      const res = await fetch(url(file), { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function sortByDate(list) {
    return list.slice().sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")));
  }

  /* ---------- Fotogalerien ---------- */

  function lightbox() {
    let dlg = document.querySelector(".svk-lightbox");
    if (dlg) return dlg;
    dlg = document.createElement("dialog");
    dlg.className = "svk-lightbox";
    dlg.setAttribute("aria-label", "Bildansicht");
    dlg.innerHTML =
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="svk-lb-close" aria-label="Schließen">×</button>' +
      '<button type="button" class="svk-lb-prev" aria-label="Vorheriges Bild">‹</button>' +
      '<button type="button" class="svk-lb-next" aria-label="Nächstes Bild">›</button>';
    document.body.append(dlg);
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector(".svk-lb-close").addEventListener("click", () => dlg.close());
    return dlg;
  }

  function openLightbox(images, start) {
    const dlg = lightbox();
    const img = dlg.querySelector("img");
    const cap = dlg.querySelector("figcaption");
    let i = start;
    function show() {
      img.src = images[i].src;
      img.alt = images[i].alt;
      cap.textContent = images[i].alt + "  ·  " + (i + 1) + " / " + images.length;
    }
    function step(d) { i = (i + d + images.length) % images.length; show(); }
    dlg.querySelector(".svk-lb-prev").onclick = () => step(-1);
    dlg.querySelector(".svk-lb-next").onclick = () => step(1);
    dlg.onkeydown = e => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    let x0 = null;
    dlg.ontouchstart = e => { x0 = e.touches[0].clientX; };
    dlg.ontouchend = e => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      x0 = null;
    };
    show();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  function albumImages(album) {
    const folder = String(album.ordner || "").replace(/\/?$/, "/");
    return (album.bilder || []).map(b => {
      const file = typeof b === "string" ? b : b.datei;
      const alt = (typeof b === "object" && b.alt) || album.titel || "Foto";
      return { src: url(folder + file), alt: alt };
    });
  }

  async function renderGalerie(box) {
    const data = await load(box.dataset.src);
    const alben = sortByDate((data && data.alben) || []).filter(a => a && a.id && (a.bilder || []).length);
    if (!alben.length) return;

    const wanted = new URLSearchParams(location.search).get("album");
    const album = wanted && alben.find(a => a.id === wanted);

    if (album) {
      const images = albumImages(album);
      box.innerHTML =
        '<a class="svk-media-back" href="?">← Alle Alben</a>' +
        '<div class="svk-media-head"><span>' + esc(album.kategorie || "Fotogalerie") + (album.datum ? " · " + datum(album.datum) : "") + "</span>" +
        "<h2>" + esc(album.titel) + "</h2>" + (album.text ? "<p>" + esc(album.text) + "</p>" : "") +
        (album.fotograf ? '<p class="svk-media-credit">Fotos: ' + esc(album.fotograf) + "</p>" : "") + "</div>" +
        '<div class="svk-photo-grid">' +
        images.map((im, i) => '<button type="button" data-i="' + i + '"><img src="' + esc(im.src) + '" alt="' + esc(im.alt) + '" loading="lazy" decoding="async"></button>').join("") +
        "</div>";
      box.querySelectorAll(".svk-photo-grid button").forEach(btn =>
        btn.addEventListener("click", () => openLightbox(images, Number(btn.dataset.i))));
      document.title = album.titel + " | Fotogalerien | SpVgg Kaufbeuren";
    } else {
      box.innerHTML =
        '<div class="svk-media-head"><span>Alben</span><h2>Aktuelle Fotogalerien</h2></div>' +
        '<div class="svk-album-grid">' +
        alben.map(a => {
          const imgs = albumImages(a);
          const cover = a.titelbild ? url(String(a.ordner || "").replace(/\/?$/, "/") + a.titelbild) : imgs[0].src;
          return '<a class="svk-album" href="?album=' + encodeURIComponent(a.id) + '">' +
            '<img src="' + esc(cover) + '" alt="" loading="lazy" decoding="async">' +
            "<div><span>" + esc(a.kategorie || "Fotogalerie") + (a.datum ? " · " + datum(a.datum) : "") + "</span>" +
            "<h3>" + esc(a.titel) + "</h3><p>" + imgs.length + (imgs.length === 1 ? " Foto" : " Fotos") + "</p></div></a>";
        }).join("") +
        "</div>";
    }
    box.hidden = false;
  }

  /* ---------- Videos (YouTube, Laden erst nach Klick) ---------- */

  function youtubeId(v) {
    const raw = String(v.youtube || "");
    const m = raw.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(raw) ? raw : "");
  }

  async function renderVideos(box) {
    const data = await load(box.dataset.src);
    let videos = sortByDate((data && data.videos) || []).filter(v => v && youtubeId(v));
    const limit = Number(box.dataset.limit || 0);
    if (limit) videos = videos.slice(0, limit);
    if (!videos.length) return;

    box.innerHTML =
      '<div class="svk-media-head"><span>Mediathek</span><h2>' + esc(box.dataset.title || "Aktuelle Videos") + "</h2></div>" +
      '<div class="svk-video-grid">' +
      videos.map(v => {
        const poster = v.vorschau ? url(v.vorschau) : "";
        return '<article class="svk-video">' +
          '<div class="svk-video-frame' + (v.vorschau ? "" : " is-logo") + '">' +
          (poster ? '<img src="' + esc(poster) + '" alt="" loading="lazy" decoding="async">' : "") +
          '<button type="button" data-id="' + esc(youtubeId(v)) + '" data-title="' + esc(v.titel) + '" aria-label="Video abspielen: ' + esc(v.titel) + '">' +
          '<span class="svk-play" aria-hidden="true"></span></button>' +
          '<p class="svk-video-consent">Beim Abspielen werden Daten an YouTube (Google) übertragen. ' +
          '<a href="' + esc(url("datenschutz.html")) + '#youtube">Datenschutz</a></p></div>' +
          "<div><span>" + esc(v.kategorie || "Video") + (v.datum ? " · " + datum(v.datum) : "") + "</span><h3>" + esc(v.titel) + "</h3>" +
          (v.text ? "<p>" + esc(v.text) + "</p>" : "") + "</div></article>";
      }).join("") +
      "</div>";

    box.querySelectorAll(".svk-video-frame button").forEach(btn => {
      btn.addEventListener("click", () => {
        const frame = document.createElement("iframe");
        frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(btn.dataset.id) + "?autoplay=1&rel=0";
        frame.title = btn.dataset.title || "Video";
        frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
        frame.allowFullscreen = true;
        frame.loading = "lazy";
        btn.parentElement.replaceChildren(frame);
      });
    });
    box.hidden = false;
    const hide = box.dataset.hideWhenFilled && document.querySelector(box.dataset.hideWhenFilled);
    if (hide) hide.hidden = true;
  }

  /* ---------- Downloads ---------- */

  function size(bytes) {
    if (!bytes) return "";
    return bytes > 1048576 ? (bytes / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  async function renderDownloads(list) {
    const data = await load(list.dataset.src);
    const files = (data && data.downloads) || [];
    for (const f of files) {
      if (!f || !f.id || !f.datei) continue;
      const item = list.querySelector('[data-download="' + CSS.escape(f.id) + '"]');
      if (!item) continue;
      if (f.stand) {
        const p = item.querySelector("p");
        if (p) p.textContent = "Stand: " + f.stand + ".";
      }
      const badge = item.querySelector(".status-badge");
      const a = document.createElement("a");
      a.className = "status-badge svk-download-link";
      a.href = url(f.datei);
      a.setAttribute("download", "");
      a.textContent = "PDF herunterladen";
      if (badge) badge.replaceWith(a); else item.append(a);
      try {
        const res = await fetch(a.href, { method: "HEAD" });
        const len = Number(res.headers.get("content-length"));
        if (res.ok && len) a.textContent = "PDF herunterladen (" + size(len) + ")";
      } catch (e) { /* Größe ist optional */ }
    }
  }

  document.querySelectorAll("[data-svk-galerie]").forEach(renderGalerie);
  document.querySelectorAll("[data-svk-videos]").forEach(renderVideos);
  document.querySelectorAll("[data-svk-downloads]").forEach(renderDownloads);
})();
