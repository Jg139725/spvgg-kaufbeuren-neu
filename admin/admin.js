
(() => {
  "use strict";
  const OWNER = "Jg139725";
  const REPO = "spvgg-kaufbeuren-neu";
  const BRANCH = "main";
  const API = "https://api.github.com";

  let token = "";
  let username = "";
  let items = [];

  const $ = s => document.querySelector(s);
  const status = (el, msg, ok=true) => { el.textContent = msg; el.style.color = ok ? "#0b6b38" : "#a51d2d"; };

  const slugify = s => String(s || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);

  const headers = () => ({
    "Accept":"application/vnd.github+json",
    "Authorization":`Bearer ${token}`,
    "X-GitHub-Api-Version":"2022-11-28"
  });

  async function gh(path, options={}) {
    const r = await fetch(`${API}${path}`, {...options, headers:{...headers(), ...(options.headers||{})}});
    const text = await r.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) throw new Error(data?.message || `GitHub Fehler ${r.status}`);
    return data;
  }

  const b64EncodeUnicode = str => btoa(unescape(encodeURIComponent(str)));
  const b64DecodeUnicode = str => decodeURIComponent(escape(atob(str.replace(/\n/g,""))));

  async function getFile(path) {
    try { return await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`); }
    catch (e) { if (String(e.message).includes("Not Found")) return null; throw e; }
  }

  async function putText(path, text, message, sha=null) {
    const body = {message, content:b64EncodeUnicode(text), branch:BRANCH};
    if (sha) body.sha = sha;
    return gh(`/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
      method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
    });
  }

  async function putBase64(path, contentBase64, message, sha=null) {
    const body = {message, content:contentBase64, branch:BRANCH};
    if (sha) body.sha = sha;
    return gh(`/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
      method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
    });
  }

  async function deleteFile(path, message) {
    const f = await getFile(path);
    if (!f) return;
    return gh(`/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message, sha:f.sha, branch:BRANCH})
    });
  }

  async function loadItems() {
    const file = await getFile("data/news.json");
    if (!file) { items = []; return; }
    items = JSON.parse(b64DecodeUnicode(file.content) || "[]");
    if (!Array.isArray(items)) items = [];
  }

  async function saveItems(message) {
    const file = await getFile("data/news.json");
    await putText("data/news.json", JSON.stringify(items, null, 2) + "\n", message, file?.sha || null);
  }

  function articleHtml(item, bodyText) {
    const paragraphs = String(bodyText || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      .map(p => `<p>${p.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])).replace(/\n/g,"<br>")}</p>`).join("\n");
    const img = item.image || "../assets/images/logo-top.png";
    return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${item.teaser.replace(/"/g,"&quot;")}"><title>${item.title.replace(/</g,"&lt;")} | SpVgg Kaufbeuren</title>
<link rel="stylesheet" href="../assets/css/subpages.css"><style>
.article{width:min(900px,calc(100% - 32px));margin:46px auto 80px}.article img{width:100%;max-height:520px;object-fit:cover;border-radius:20px}.article-meta{color:#0b4c9b;font-weight:800;margin-top:24px}.article h1{font-size:clamp(2.2rem,6vw,4.7rem);line-height:1.02;margin:.25em 0}.article .lead{font-size:1.25rem;color:#506278}.article-body{font-size:1.08rem;line-height:1.8;margin-top:34px}.back{display:inline-block;margin-top:28px;font-weight:800;color:#0b4c9b;text-decoration:none}
</style></head><body>
<header class="sub-header"><div class="wrap sub-header-row"><a class="sub-brand" href="../index.html"><img src="../assets/images/logo-top.png" alt="SpVgg Kaufbeuren"></a>
<nav class="sub-nav"><a href="../index.html">Start</a><a class="active" href="../news.html">News</a><a href="../herren/index.html">Herren</a><a href="../jugend/index.html">Jugend</a><a href="../verein/index.html">Verein</a></nav></div></header>
<main class="article"><img src="../${img}" alt="${item.title.replace(/"/g,"&quot;")}"><div class="article-meta">${item.categoryLabel} · ${item.date.split("-").reverse().join(".")}</div>
<h1>${item.title}</h1><p class="lead">${item.teaser}</p><div class="article-body">${paragraphs}</div><a class="back" href="../news.html">← Zurück zu allen News</a></main>
<script src="../assets/js/svk-internal-links.js"></script></body></html>`;
  }

  function renderManage() {
    const list = $("#news-list"); list.innerHTML = "";
    if (!items.length) { list.innerHTML = "<p>Noch keine Beiträge über die Redaktion veröffentlicht.</p>"; return; }
    items.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(item => {
      const row = document.createElement("div"); row.className="news-row";
      row.innerHTML = `<div><h3>${item.title}</h3><p>${item.date} · ${item.categoryLabel || item.category}</p></div>
      <div class="news-row-actions"><a href="../${item.url}" target="_blank"><button class="secondary">Ansehen</button></a>
      <button class="secondary edit-btn">Bearbeiten</button><button class="danger delete-btn">Löschen</button></div>`;
      row.querySelector(".edit-btn").onclick = () => editItem(item);
      row.querySelector(".delete-btn").onclick = () => removeItem(item);
      list.appendChild(row);
    });
  }

  async function editItem(item) {
    try {
      const f = await getFile(item.url);
      let body = "";
      if (f) {
        const html = b64DecodeUnicode(f.content);
        const m = html.match(/<div class="article-body">([\s\S]*?)<\/div><a class="back"/);
        if (m) body = m[1].replace(/<br\s*\/?>/gi,"\n").replace(/<\/p>\s*<p>/gi,"\n\n").replace(/<\/?p>/gi,"").replace(/<[^>]+>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
      }
      $("#title").value=item.title||""; $("#date").value=item.date||""; $("#category").value=item.category||"verein";
      $("#teaser").value=item.teaser||""; $("#body").value=body; $("#editing-slug").value=item.slug||"";
      document.querySelector('[data-tab="editor"]').click();
      window.scrollTo({top:0,behavior:"smooth"});
    } catch(e){ status($("#manage-status"), e.message, false); }
  }

  async function removeItem(item) {
    if (!confirm(`„${item.title}“ wirklich löschen?`)) return;
    const s=$("#manage-status"); status(s,"Beitrag wird gelöscht …");
    try {
      await deleteFile(item.url, `News löschen: ${item.title}`);
      if (item.image && item.image.startsWith("assets/images/news/editor-")) {
        try { await deleteFile(item.image, `Newsbild löschen: ${item.title}`); } catch {}
      }
      items = items.filter(x => x.slug !== item.slug);
      await saveItems(`Newsindex aktualisieren: ${item.title} entfernt`);
      renderManage(); status(s,"Beitrag wurde online entfernt.");
    } catch(e){ status(s,e.message,false); }
  }

  $("#login-btn").onclick = async () => {
    username=$("#gh-user").value.trim(); token=$("#gh-token").value.trim();
    if (!username || !token) return status($("#login-status"),"Bitte Benutzername und Zugangsschlüssel eingeben.",false);
    status($("#login-status"),"Zugang wird geprüft …");
    try {
      const me = await gh("/user");
      await gh(`/repos/${OWNER}/${REPO}`);
      await loadItems();
      $("#login-panel").hidden=true; $("#workspace").hidden=false;
      $("#welcome").textContent=`Hallo ${me.name || me.login}`;
      renderManage(); status($("#login-status"),"");
    } catch(e){ token=""; status($("#login-status"),"Anmeldung fehlgeschlagen: "+e.message,false); }
  };

  $("#logout-btn").onclick = () => { token=""; username=""; location.reload(); };

  document.querySelectorAll(".tab").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
    $("#tab-editor").hidden = btn.dataset.tab !== "editor";
    $("#tab-manage").hidden = btn.dataset.tab !== "manage";
    if(btn.dataset.tab==="manage") renderManage();
  });

  $("#reset-btn").onclick = () => {
    ["title","teaser","body","editing-slug"].forEach(id=>$("#"+id).value="");
    $("#image").value=""; $("#category").value="verein"; $("#date").value=new Date().toISOString().slice(0,10);
  };

  $("#reload-btn").onclick = async () => {
    try { await loadItems(); renderManage(); status($("#manage-status"),"Liste aktualisiert."); }
    catch(e){ status($("#manage-status"),e.message,false); }
  };

  $("#publish-btn").onclick = async () => {
    const s=$("#publish-status");
    const title=$("#title").value.trim(), date=$("#date").value, category=$("#category").value;
    const teaser=$("#teaser").value.trim(), body=$("#body").value.trim(), oldSlug=$("#editing-slug").value.trim();
    if(!title||!date||!teaser||!body) return status(s,"Bitte Titel, Datum, Teaser und Artikeltext ausfüllen.",false);

    const labels={herren:"Herren",jugend:"Jugend",verein:"Verein",veranstaltung:"Veranstaltung"};
    const slug = oldSlug || slugify(title);
    const existing = items.find(x=>x.slug===slug);
    let imagePath = existing?.image || "";
    status(s,"Beitrag wird veröffentlicht …");

    try {
      const imgFile=$("#image").files[0];
      if(imgFile){
        const ext=(imgFile.name.split(".").pop()||"jpg").toLowerCase().replace("jpeg","jpg");
        imagePath=`assets/images/news/editor-${slug}.${ext}`;
        const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(imgFile);});
        const b64=String(dataUrl).split(",")[1];
        const old=await getFile(imagePath);
        await putBase64(imagePath,b64,`Newsbild: ${title}`,old?.sha||null);
      }

      const item={slug,title,date,category,categoryLabel:labels[category],teaser,image:imagePath||"assets/images/logo-top.png",url:`news/${slug}.html`};
      const articleFile=await getFile(item.url);
      await putText(item.url, articleHtml(item,body), `${existing?"News bearbeiten":"News veröffentlichen"}: ${title}`, articleFile?.sha||null);

      items = items.filter(x=>x.slug!==slug);
      items.push(item);
      await saveItems(`Newsindex aktualisieren: ${title}`);
      $("#editing-slug").value=slug;
      renderManage();
      status(s,"Fertig – der Beitrag wurde in GitHub veröffentlicht. GitHub Pages aktualisiert die Website anschließend automatisch.");
    } catch(e){ status(s,"Veröffentlichung fehlgeschlagen: "+e.message,false); }
  };

  $("#date").value = new Date().toISOString().slice(0,10);
})();
