(async()=>{const S=window.SVKLive,root=document.getElementById("svk-news-list");if(!S||!root)return;
try{const n=await S.getNews(100);root.innerHTML=n.length?n.map((x,i)=>S.card(x,i)).join(""):'<p class="svk40-state">Aktuell sind keine Meldungen veröffentlicht.</p>'}
catch(e){root.innerHTML='<p class="svk40-state">Die Meldungen konnten gerade nicht geladen werden.</p>';console.error(e)}})();