(() => {
"use strict";
if (window.__SVK_V34_RUNNING__) return;
window.__SVK_V34_RUNNING__=true;

const SB="https://tjfnjdzqlrblvwfmswvp.supabase.co";
const KEY="sb_publishable_9hRarZ9dtcz6swzErkdaQQ_7o0FK_5R";
const esc=(v="")=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>{if(!v)return"";const s=String(v).slice(0,10),p=s.split("-");return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:s};
const parseDT=g=>{
  const date=g.date||g.datum||""; let time=g.time||g.uhrzeit||"00:00";
  time=String(time).replace(" Uhr","").trim()||"00:00";
  const d=new Date(`${date}T${time.length===5?time+":00":time}`);
  return isNaN(d)?new Date(`${date}T12:00:00`):d;
};
const normGame=g=>({
 date:g.date||g.datum||"", time:g.time||g.uhrzeit||"",
 home:g.home||g.homeTeam||g.heim||g.heimteam||"",
 away:g.away||g.awayTeam||g.gast||g.gastteam||"",
 score:g.score||g.ergebnis||"", venue:g.venue||g.spielort||g.location||""
});
async function gameData(){
 const r=await fetch(`data/herren-spielplan.json?cb=${Date.now()}`,{cache:"no-store"});
 if(!r.ok)throw Error("HTTP "+r.status);
 const d=await r.json();
 const raw=d.fixtures||d.games||d.matches||d.spiele||[];
 return {raw:d,games:Array.isArray(raw)?raw.map(normGame):[]};
}
async function newsData(limit=3){
 const q=`/rest/v1/news?select=id,category,date,title,teaser,content,image_url,published_at,status&status=eq.published&order=published_at.desc.nullslast,date.desc&limit=${limit}`;
 const r=await fetch(SB+q,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`},cache:"no-store"});
 if(!r.ok)throw Error("News HTTP "+r.status); return r.json();
}
function newsCard(n){
 const href=`artikel.html?id=${encodeURIComponent(n.id)}`;
 const img=n.image_url
 ? `<a class="v34-news-media" href="${href}"><img src="${esc(n.image_url)}" alt="${esc(n.title)}"><span>${esc(n.category||"SVK")}</span></a>`
 : `<a class="v34-news-media v34-empty" href="${href}"><img src="assets/images/logo-top.png" alt=""><span>${esc(n.category||"SVK")}</span></a>`;
 return `<article class="v34-news-card">${img}<div class="v34-news-copy"><time>${fmt(n.date)}</time><h3>${esc(n.title)}</h3>${n.teaser?`<p>${esc(n.teaser)}</p>`:""}<a href="${href}">Weiterlesen →</a></div></article>`;
}
async function renderHomeNews(){
 const grid=document.querySelector("#aktuelles .news-grid"); if(!grid)return;
 try{const n=await newsData(3);if(n.length){grid.className="news-grid v34-news-grid";grid.innerHTML=n.map(newsCard).join("")}}
 catch(e){console.error("SVK News:",e)}
}
async function renderHomeGame(){
 const root=document.getElementById("home-live-games");
 if(!root)return;
 try{
  const {raw,games}=await gameData();
  if(!games.length)throw Error("Keine Spiele im JSON gefunden");
  const now=new Date();
  const sorted=games.slice().sort((a,b)=>parseDT(a)-parseDT(b));
  const future=sorted.filter(g=>parseDT(g)>=now);
  const past=sorted.filter(g=>parseDT(g)<now);
  const next=future[0]||sorted[sorted.length-1];
  const last=past[past.length-1]||null;
  const one=(label,g,kind)=>!g?"":`<article class="v34-match ${kind}">
   <div class="v34-match-top"><span>${label}</span><time>${fmt(g.date)} · ${esc(g.time)} Uhr</time></div>
   <div class="v34-teams"><strong>${esc(g.home)}</strong><b>${g.score?esc(g.score):"VS"}</b><strong>${esc(g.away)}</strong></div>
   ${g.venue?`<small>${esc(g.venue)}</small>`:""}
  </article>`;
  root.innerHTML=`<div class="v34-match-grid">${one("Nächstes Spiel",next,"next")}${one("Letztes Spiel",last,"last")}</div>
  <div class="v34-match-footer"><a href="herren/spielplan.html">Spielplan & Tabelle ansehen →</a><span>${raw.updatedAt?`Aktualisiert: ${esc(new Date(raw.updatedAt).toLocaleString("de-DE"))}`:"Automatisch vom BFV aktualisiert"}</span></div>`;
 }catch(e){console.error("SVK Spiele:",e);root.innerHTML=`<div class="v34-error"><b>Spieldaten konnten nicht angezeigt werden.</b><small>${esc(e.message)}</small></div>`}
}
async function run(){renderHomeNews();renderHomeGame()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
setInterval(run,300000);
})();