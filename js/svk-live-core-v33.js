window.SVKLive=(()=>{
const URL="https://tjfnjdzqlrblvwfmswvp.supabase.co";
const KEY="sb_publishable_9hRarZ9dtcz6swzErkdaQQ_7o0FK_5R";
const esc=(v="")=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=v=>{if(!v)return"";const p=String(v).slice(0,10).split("-");return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:v};
const norm=n=>({...n,image_url:n.image_url||n.imageUrl||null,published_at:n.published_at||n.publishedAt||n.date||"",status:n.status||"published"});
async function supa(limit=100){
 const q=`/rest/v1/news?select=id,category,date,title,teaser,content,image_url,published_at,status&status=eq.published&order=published_at.desc.nullslast,date.desc&limit=${limit}`;
 const r=await fetch(URL+q,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`},cache:"no-store"});
 if(!r.ok)throw Error("Supabase "+r.status); return (await r.json()).map(norm);
}
async function stat(){
 try{const r=await fetch("data/news.json?cb="+Date.now(),{cache:"no-store"});if(!r.ok)return[];const d=await r.json();return (d.articles||[]).map(norm)}catch{return[]}
}
async function getNews(limit=100){
 const [a,b]=await Promise.all([supa(limit).catch(()=>[]),stat()]);
 const m=new Map(); [...a,...b].forEach(n=>{if(n&&n.id&&!m.has(String(n.id)))m.set(String(n.id),n)});
 return [...m.values()].sort((x,y)=>String(y.published_at||y.date||"").localeCompare(String(x.published_at||x.date||""))).slice(0,limit);
}
async function getArticle(id){const all=await getNews(200);return all.find(n=>String(n.id)===String(id))||null}
async function getGames(){const r=await fetch(`data/herren-spielplan.json?cb=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw Error("Spielplan "+r.status);return r.json()}
const media=(n,h)=>n.image_url?`<a class="svk40-media" href="${h}"><img src="${esc(n.image_url)}" alt="${esc(n.title)}"><span>${esc(n.category||"SVK")}</span></a>`:`<a class="svk40-media svk40-empty" href="${h}"><img src="assets/images/logo-top.png" alt=""><span>${esc(n.category||"SVK")}</span></a>`;
const card=(n,i=0)=>{const h=`artikel.html?id=${encodeURIComponent(n.id)}`;return `<article class="svk40-news-card ${i===0?"featured":""}">${media(n,h)}<div class="svk40-news-body"><time>${date(n.date||n.published_at)}</time><h2>${esc(n.title)}</h2>${n.teaser?`<p>${esc(n.teaser)}</p>`:""}<a href="${h}">Weiterlesen →</a></div></article>`};
return{esc,date,getNews,getArticle,getGames,card};
})();