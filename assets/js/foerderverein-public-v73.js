
(async()=>{
const C=window.SVK_SUPABASE;if(!C||!window.supabase)return;
const sb=window.supabase.createClient(C.url,C.anonKey);
const $=id=>document.getElementById(id);
const txt=(tag,text)=>{const e=document.createElement(tag);e.textContent=text||'';return e};
try{
 const {data:c}=await sb.from('foerderverein_content').select('*').eq('id',1).maybeSingle();
 if(c){
  if(c.image_url)$('fv-board-image').src=c.image_url;
  if(c.caption)$('fv-caption').textContent=c.caption;
  if(Array.isArray(c.people)&&c.people.length){
   $('fv-people').replaceChildren(...c.people.map(p=>{const a=document.createElement('article');a.append(txt('span',p.role),txt('strong',p.name));return a}));
  }
  if(Array.isArray(c.sponsors))$('fv-sponsors').replaceChildren(...c.sponsors.map(s=>{
   const a=document.createElement('a');a.className='fv-sponsor';a.textContent=s.name||'Sponsor';
   if(/^https:\/\//i.test(s.url||'')){a.href=s.url;a.target='_blank';a.rel='noopener noreferrer'}
   return a;
  }));
 }
 const {data:news,error}=await sb.from('news').select('title,teaser,content,date,image_url').eq('category','Förderverein').eq('status','published').lte('published_at',new Date().toISOString()).order('date',{ascending:false}).limit(20);
 if(error)throw error;
 $('fv-news').replaceChildren(...(news||[]).map(n=>{
  const a=document.createElement('article');a.className='fv-news-card';
  a.append(txt('small',new Date(n.date+'T12:00:00').toLocaleDateString('de-DE')),txt('h3',n.title));
  if(n.image_url){const im=document.createElement('img');im.src=n.image_url;im.alt=n.title;im.loading='lazy';a.append(im)}
  a.append(txt('p',n.content||n.teaser));return a;
 }));
 if(!news?.length)$('fv-news').textContent='Noch keine veröffentlichten Fördervereinsberichte.';
}catch(err){console.error('Förderverein:',err);$('fv-news').textContent='Berichte sind momentan nicht verfügbar.'}
})();
