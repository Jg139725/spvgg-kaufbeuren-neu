(async()=>{
 const S=window.SVKLive,root=document.getElementById("svk-news-list"),buttons=[...document.querySelectorAll(".svk63-filter")];
 if(!S||!root)return;
 let news=[];
 const group=(category="")=>{
  const c=String(category||"").toLowerCase();
  if(c.includes("u23")||c.includes("herren 2")||c.includes("2. herren"))return"U23";
  if(c.includes("frau")||c.includes("damen"))return"Frauen";
  if(c.includes("jugend")||c.includes("u19")||c.includes("u17")||c.includes("u15")||c.includes("u13")||c.includes("u12")||c.includes("u11")||c.includes("u10")||c.includes("u9")||c.includes("u09")||c.includes("u8")||c.includes("u08")||c.includes("bambini")||c.includes("mäd"))return"Jugend";
  if(c.includes("herren"))return"Herren";
  return"Verein";
 };
 const render=(filter="Alle")=>{
  const list=filter==="Alle"?news:news.filter(n=>group(n.category)===filter);
  root.innerHTML=list.length?list.map((x,i)=>S.card(x,i)).join(""):'<div class="svk63-empty"><strong>Noch keine Meldungen in diesem Bereich.</strong><span>Schau später wieder vorbei oder wähle eine andere Kategorie.</span></div>';
  root.classList.toggle("is-filtered",filter!=="Alle");
 };
 buttons.forEach(btn=>btn.addEventListener("click",()=>{buttons.forEach(b=>b.classList.remove("is-active"));btn.classList.add("is-active");render(btn.dataset.filter)}));
 try{news=await S.getNews(100);render("Alle")}catch(e){root.innerHTML='<p class="svk40-state">Die Meldungen konnten gerade nicht geladen werden.</p>';console.error(e)}
})();
