window.SVKLive = (() => {
  const URL="https://tjfnjdzqlrblvwfmswvp.supabase.co";
  const KEY="sb_publishable_9hRarZ9dtcz6swzErkdaQQ_7o0FK_5R";
  const esc=(v="")=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const date=iso=>{if(!iso)return"";const [y,m,d]=iso.slice(0,10).split("-");return `${d}.${m}.${y}`};
  async function getNews(limit=100){
    const q=`/rest/v1/news?select=id,category,date,title,teaser,content,image_url,published_at,status&status=eq.published&order=published_at.desc.nullslast,date.desc&limit=${limit}`;
    const r=await fetch(URL+q,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`},cache:"no-store"});
    if(!r.ok) throw Error("Supabase "+r.status); return r.json();
  }
  async function getArticle(id){
    const q=`/rest/v1/news?select=*&id=eq.${encodeURIComponent(id)}&status=eq.published&limit=1`;
    const r=await fetch(URL+q,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`},cache:"no-store"});
    if(!r.ok) throw Error("Supabase "+r.status); const a=await r.json(); return a[0]||null;
  }
  async function getGames(){
    const r=await fetch(`data/herren-spielplan.json?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok) throw Error("Spielplan "+r.status); return r.json();
  }
  const media=(n,href)=>n.image_url
    ? `<a class="svk-news-media" href="${href}"><img src="${esc(n.image_url)}" alt="${esc(n.title)}"><span>${esc(n.category||"SVK")}</span></a>`
    : `<a class="svk-news-media svk-news-empty" href="${href}"><img src="assets/images/logo-top.png" alt=""><span>${esc(n.category||"SVK")}</span></a>`;
  const card=(n,i=0)=>{const h=`artikel.html?id=${encodeURIComponent(n.id)}`;return `<article class="svk-news-card ${i===0?"featured":""}">${media(n,h)}<div class="svk-news-body"><time>${date(n.date)}</time><h3>${esc(n.title)}</h3>${n.teaser?`<p>${esc(n.teaser)}</p>`:""}<a href="${h}">Weiterlesen →</a></div></article>`};
  return {esc,date,getNews,getArticle,getGames,card};
})();