(() => {
  "use strict";
  const SUPABASE_URL="https://tjfnjdzqlrblvwfmswvp.supabase.co";
  const SUPABASE_KEY="sb_publishable_9hRarZ9dtcz6swzErkdaQQ_7o0FK_5R";
  const esc=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=iso=>{if(!iso)return"";const [y,m,d]=iso.slice(0,10).split("-");return `${d}.${m}.${y}`};
  const initials=n=>n==="SpVgg Kaufbeuren"?"SVK":n.replace(/\d+/g,"").trim().split(/\s+/).slice(0,3).map(w=>w[0]).join("").toUpperCase();

  async function news(){
    const grid=document.querySelector("#aktuelles .news-grid");
    if(!grid)return;
    const u=`${SUPABASE_URL}/rest/v1/news?select=id,category,date,title,teaser,image_url,published_at,status&status=eq.published&order=published_at.desc.nullslast,date.desc&limit=3`;
    const r=await fetch(u,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:"no-store"});
    if(!r.ok)throw Error("News "+r.status);
    const rows=await r.json(); if(!rows.length)return;
    grid.innerHTML=rows.map((n,i)=>{
      const href=`news.html?id=${encodeURIComponent(n.id)}`;
      const media=n.image_url
        ? `<a class="news-card__image" href="${href}"><img src="${esc(n.image_url)}" alt="${esc(n.title)}" loading="lazy"><span class="category">${esc(n.category||"SVK")}</span></a>`
        : `<a class="news-card__image svk-news-placeholder" href="${href}" aria-label="${esc(n.title)}"><img src="assets/images/logo-top.png" alt="" loading="lazy"><span class="category">${esc(n.category||"SVK")}</span></a>`;
      return `<article class="news-card${i===0?" news-card--large":""}">${media}<div class="news-card__body">
        <time datetime="${esc(n.date||"")}">${esc(fmt(n.date))}</time><h3>${esc(n.title)}</h3>
        ${n.teaser?`<p>${esc(n.teaser)}</p>`:""}<a href="${href}">Weiterlesen →</a></div></article>`;
    }).join("");
  }

  function gameCard(label,g,kind){
    if(!g)return "";
    const d=new Date(`${g.date}T12:00:00`);
    const dt=d.toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"});
    return `<article class="svk-game ${kind}">
      <div class="svk-game-top"><span>${label}</span><time>${esc(dt)} · ${esc(g.time)} Uhr</time></div>
      <div class="svk-game-row">
        <div class="svk-game-team"><b class="svk-game-badge">${esc(initials(g.home))}</b><strong>${esc(g.home)}</strong></div>
        <div class="svk-game-vs">${g.score?esc(g.score):"VS"}</div>
        <div class="svk-game-team right"><b class="svk-game-badge">${esc(initials(g.away))}</b><strong>${esc(g.away)}</strong></div>
      </div>
      <small>${esc(g.venue || (g.home==="SpVgg Kaufbeuren"?"Parkstadion Kaufbeuren":"Auswärtsspiel"))}</small>
    </article>`;
  }

  async function games(){
    const old=document.getElementById("home-live-games");
    const legacy=document.querySelector("#spiele");
    const root=old || legacy;
    if(!root)return;
    const r=await fetch(`data/herren-spielplan.json?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok)throw Error("Spiele "+r.status);
    const d=await r.json();
    const all=(d.fixtures||[]).slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const now=new Date();
    const next=all.find(g=>new Date(`${g.date}T${g.time}:00`)>=now) || all[0];
    if(!next)return;

    if(old){
      old.innerHTML=gameCard("Nächstes Spiel",next,"next")+`<div class="svk-game-foot"><a href="herren/spielplan.html">Alle Spiele der 1. Herren ansehen →</a><span>Stand: ${esc(new Date(d.updatedAt).toLocaleString("de-DE"))}</span></div>`;
      return;
    }

    // Fallback for the older homepage markup.
    const dateEl=legacy.querySelector(".match-date");
    if(dateEl)dateEl.textContent=`${fmt(next.date)} · ${next.time} Uhr`;
    const teams=legacy.querySelectorAll(".match-team strong");
    if(teams[0])teams[0].textContent=next.home;
    if(teams[1])teams[1].textContent=next.away;
    const center=legacy.querySelector(".match-center");
    if(center){
      const s=center.querySelector("span"), sm=center.querySelector("small");
      if(s)s.textContent=d.competition||"BZL Schwaben Süd";
      if(sm)sm.textContent=next.venue||"";
    }
  }

  async function run(){await Promise.allSettled([news(),games()]);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true}); else run();
  setInterval(run,300000);
})();