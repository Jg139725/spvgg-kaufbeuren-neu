(()=>{
const cfg=window.SVK_SUPABASE;if(!cfg||!window.supabase)return;
const sb=window.supabase.createClient(cfg.url,cfg.anonKey);
const safeUrl=v=>{try{const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
const make=(item,card)=>{const a=document.createElement('a');const url=safeUrl(item.url);if(url){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}else a.removeAttribute('href');a.setAttribute('aria-label',item.name);if(card)a.className='sponsor-logo-card';if(item.logo_url){const img=document.createElement('img');img.src=item.logo_url;img.alt='Logo '+item.name;img.loading='lazy';a.append(img)}else{const span=document.createElement('span');span.textContent=item.name;a.append(span)}return a};
async function run(){const {data,error}=await sb.from('foerderverein_content').select('sponsors').eq('id',1).maybeSingle();if(error||!Array.isArray(data?.sponsors)||!data.sponsors.length)return;const sponsors=data.sponsors.filter(x=>x&&typeof x.name==='string'&&x.name.trim());if(!sponsors.length)return;
for(const track of document.querySelectorAll('.home-sponsor-track,.sponsor-final-track')){track.replaceChildren();for(const s of [...sponsors,...sponsors])track.append(make(s,false));}
for(const grid of document.querySelectorAll('.sponsor-logo-grid')){grid.replaceChildren();for(const s of sponsors)grid.append(make(s,true))}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
