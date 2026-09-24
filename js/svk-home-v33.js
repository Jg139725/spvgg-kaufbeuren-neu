(async()=>{const S=window.SVKLive;if(!S)return;
  try{
    const n=await S.getNews(3), grid=document.querySelector("#aktuelles .news-grid");
    if(grid&&n.length){grid.classList.add("svk-live-news-grid");grid.innerHTML=n.map(S.card).join("")}
  }catch(e){console.error(e)}
  try{
    const d=await S.getGames(), root=document.getElementById("home-live-games");
    if(!root)return;
    const now=Date.now(), all=(d.fixtures||[]).slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const g=all.find(x=>new Date(`${x.date}T${x.time}:00`).getTime()>=now)||all[0];
    if(!g){root.innerHTML='<div class="svk-live-error">Aktuell ist kein kommendes Spiel hinterlegt.</div>';return}
    const dt=new Date(g.date+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
    root.innerHTML=`<article class="svk-home-game"><div class="svk-home-game-head"><span>Nächstes Spiel</span><b>${S.esc(dt)} · ${S.esc(g.time)} Uhr</b></div><div class="svk-home-game-teams"><strong>${S.esc(g.home)}</strong><em>VS</em><strong>${S.esc(g.away)}</strong></div><small>${S.esc(g.venue||"")}</small></article><div class="svk-live-foot"><a href="herren/spielplan.html">Alle Spiele & Tabelle →</a><span>Stand ${S.esc(new Date(d.updatedAt).toLocaleString("de-DE"))}</span></div>`;
  }catch(e){console.error(e);const r=document.getElementById("home-live-games");if(r)r.innerHTML='<div class="svk-live-error">Spieldaten konnten gerade nicht geladen werden.</div>'}
})();