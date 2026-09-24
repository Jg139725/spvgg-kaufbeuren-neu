(async()=>{const S=window.SVKLive,root=document.getElementById("svk-article");if(!S||!root)return;
const id=new URLSearchParams(location.search).get("id");if(!id){root.innerHTML="<h1>Beitrag nicht gefunden</h1>";return}
try{const n=await S.getArticle(id);if(!n){root.innerHTML="<h1>Beitrag nicht gefunden</h1>";return}
document.title=`${n.title} | SpVgg Kaufbeuren`;
const paras=S.esc(n.content||n.teaser||"").replace(/\n\n+/g,"</p><p>").replace(/\n/g,"<br>");
root.innerHTML=`<a class="svk-back" href="news.html">← Alle Meldungen</a><span class="svk-article-cat">${S.esc(n.category||"SVK")}</span><time>${S.date(n.date)}</time><h1>${S.esc(n.title)}</h1>${n.teaser?`<p class="lead">${S.esc(n.teaser)}</p>`:""}${n.image_url?`<img class="svk-article-image" src="${S.esc(n.image_url)}" alt="${S.esc(n.title)}">`:""}<div class="svk-article-copy"><p>${paras}</p></div>`}
catch(e){root.innerHTML="<h1>Beitrag konnte nicht geladen werden</h1>";console.error(e)}})();