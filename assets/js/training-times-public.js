(()=>{
 const cfg=window.SVK_SUPABASE;if(!cfg||typeof supabase==='undefined')return;
 const sb=supabase.createClient(cfg.url,cfg.anonKey); const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
 const short={Montag:'Mo',Dienstag:'Di',Mittwoch:'Mi',Donnerstag:'Do',Freitag:'Fr',Samstag:'Sa',Sonntag:'So'};
 async function run(){const {data,error}=await sb.from('training_times').select('*').eq('active',true).order('scope').order('team').order('sort_order').order('start_time');if(error||!data?.length)return;
  const youth=document.querySelector('#trainingszeiten .schedule-grid'); if(youth){const rows=data.filter(x=>x.scope==='Jugend');const groups=Object.groupBy?Object.groupBy(rows,x=>x.team):rows.reduce((a,x)=>((a[x.team]??=[]).push(x),a),{}); youth.innerHTML=Object.entries(groups).map(([team,items])=>`<article class="schedule-card"><span>${esc(team)}</span><h3>${esc(items[0].label||team)}</h3><p>${items.map(x=>`${esc(short[x.weekday]||x.weekday)} ${esc((x.start_time||'').slice(0,5))}${x.end_time?'–'+esc(x.end_time.slice(0,5)):''}${x.note?` <b>${esc(x.note)}</b>`:''}`).join('<br>')}</p></article>`).join('');}
  const all=document.getElementById('svk-training-live'); if(all){const groups=data.reduce((a,x)=>((a[x.scope]??=[]).push(x),a),{});all.innerHTML=Object.entries(groups).map(([scope,items])=>`<div class="svk-training-group"><h3>${esc(scope)}</h3>${items.map(x=>`<div class="svk-training-line"><strong>${esc(x.team)}</strong><span>${esc(x.weekday)} · ${esc((x.start_time||'').slice(0,5))}${x.end_time?'–'+esc(x.end_time.slice(0,5)):''} Uhr</span><small>${esc(x.location||'')}${x.note?' · '+esc(x.note):''}</small></div>`).join('')}</div>`).join('');}
 }
 run();
})();
