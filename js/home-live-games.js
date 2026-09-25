(()=>{
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=v=>{const p=String(v||"").slice(0,10).split("-");return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:(v||"")};
const isSVK=n=>String(n||"").toLowerCase().includes("spvgg kaufbeuren");
const meta=g=>`${date(g.date)}${g.time?` · ${esc(g.time)} Uhr`:""}`;
function card(label,g,type){if(!g)return `<article class="svk37-card ${type}"><div class="svk37-label">${label}</div><div class="svk37-empty">Noch keine Spieldaten verfügbar.</div></article>`;
 const score=g.score?esc(g.score):"– : –";
 const place=g.venue?esc(g.venue):(isSVK(g.home)?"Heimspiel":"Auswärtsspiel");
 return `<article class="svk37-card ${type}">
 <div class="svk37-cardhead"><span class="svk37-label">${label}</span><time>${meta(g)}</time></div>
 <div class="svk37-matchrow"><div class="svk37-team ${isSVK(g.home)?"svk":""}"><strong>${esc(g.home)}</strong></div><div class="svk37-score">${score}</div><div class="svk37-team right ${isSVK(g.away)?"svk":""}"><strong>${esc(g.away)}</strong></div></div>
 <div class="svk37-place">${place}</div></article>`}
function css(){if(document.getElementById("svk37-css"))return;const s=document.createElement("style");s.id="svk37-css";s.textContent=`
#home-live-games{font-family:inherit}.svk37-wrap{width:100%}.svk37-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.svk37-card{min-width:0;padding:25px 27px 23px;border:1px solid rgba(255,255,255,.23);border-radius:24px;background:rgba(255,255,255,.105);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}.svk37-card.next{background:rgba(255,255,255,.14)}.svk37-cardhead{display:flex;align-items:center;justify-content:space-between;gap:18px}.svk37-cardhead time{font-weight:750;font-size:14px;white-space:nowrap}.svk37-label{display:inline-flex;align-items:center;background:#fff;color:#1260b7;border-radius:999px;padding:7px 13px;font-size:12px;line-height:1;font-weight:950;letter-spacing:.04em;text-transform:uppercase}.svk37-matchrow{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:18px;min-height:112px;margin-top:8px}.svk37-team{font-size:23px;line-height:1.08}.svk37-team.right{text-align:right}.svk37-team.svk strong{color:#fff}.svk37-score{min-width:78px;text-align:center;font-size:28px;font-weight:950;letter-spacing:-.03em;background:rgba(255,255,255,.12);padding:10px 12px;border-radius:13px}.svk37-place{font-size:14px;opacity:.78;border-top:1px solid rgba(255,255,255,.13);padding-top:13px}.svk37-footer{display:flex;justify-content:flex-end;margin-top:17px}.svk37-footer a{color:#fff;text-decoration:none;font-weight:850}.svk37-footer a:hover{text-decoration:underline}.svk37-empty{padding:35px 0;opacity:.8}@media(max-width:820px){.svk37-grid{grid-template-columns:1fr}.svk37-card{padding:21px}.svk37-matchrow{min-height:96px}.svk37-team{font-size:19px}.svk37-score{font-size:23px;min-width:68px}}@media(max-width:520px){.svk37-cardhead{align-items:flex-start;flex-direction:column;gap:10px}.svk37-matchrow{gap:10px}.svk37-team{font-size:16px}.svk37-score{font-size:20px;min-width:58px;padding:9px 8px}}
`;document.head.appendChild(s)}
function tuneHeading(x){const section=x.closest("section");if(!section)return;const h=section.querySelector("h2");if(h)h.textContent="1. Herren";const k=section.querySelector(".kicker, [class*=kicker]");if(k)k.textContent="Bezirksliga Schwaben Süd";const topLink=section.querySelector(".section-heading a, [class*=heading] a");if(topLink){topLink.textContent="Alle Spiele & Tabelle →";topLink.setAttribute("href","herren/spielplan.html");}}
async function load(){const x=document.getElementById("home-live-games");if(!x)return;css();tuneHeading(x);try{const r=await fetch("data/herren-spielplan.json?cb="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error(r.status);const d=await r.json();x.innerHTML=`<div class="svk37-wrap"><div class="svk37-grid">${card("Letztes Spiel",d.lastGame,"last")}${card("Nächstes Spiel",d.nextGame||d.fixtures?.[0],"next")}</div><div class="svk37-footer"><a href="herren/spielplan.html">Alle Spiele & Tabelle ansehen →</a></div></div>`}catch(e){x.innerHTML='<div class="svk37-empty">Spieldaten konnten nicht geladen werden.</div>'}}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",load):load();setInterval(load,300000);

async function loadHomeNews(){
 const grid=document.querySelector("#aktuelles .news-grid, .news-grid");
 if(!grid)return;
 try{
   if(!window.SVKLive){
     await new Promise((ok,fail)=>{const s=document.createElement("script");s.src="js/svk-live-core-v33.js?v=40";s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
   }
   const S=window.SVKLive;if(!S)return;
   const items=await S.getNews(3); if(!items.length)return;
   grid.innerHTML=items.map((n,i)=>{
     const h=`artikel.html?id=${encodeURIComponent(n.id)}`;
     const img=n.image_url?`<img src="${S.esc(n.image_url)}" alt="${S.esc(n.title)}">`:`<img src="assets/images/logo-top.png" alt="">`;
     return `<article class="news-card ${i===0?"news-card--large":""}"><a class="news-card__image" href="${h}">${img}<span class="category">${S.esc(n.category||"SVK")}</span></a><div class="news-card__body"><time>${S.date(n.date||n.published_at)}</time><h3>${S.esc(n.title)}</h3>${n.teaser?`<p>${S.esc(n.teaser)}</p>`:""}<a href="${h}">Weiterlesen →</a></div></article>`;
   }).join("");
 }catch(e){console.error("SVK News:",e)}
}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",loadHomeNews):loadHomeNews();

})();
