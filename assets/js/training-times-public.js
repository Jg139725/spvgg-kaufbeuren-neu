(()=>{
 const cfg=window.SVK_SUPABASE;if(!cfg||typeof supabase==='undefined')return;
 const sb=supabase.createClient(cfg.url,cfg.anonKey); const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
 const short={Montag:'Mo',Dienstag:'Di',Mittwoch:'Mi',Donnerstag:'Do',Freitag:'Fr',Samstag:'Sa',Sonntag:'So'};
 const teamFromPath=()=>{const f=(location.pathname.split('/').pop()||'').replace('.html','');return ({'g-jugend':'G1/G2','maedels':'Mädels'})[f]||f.toUpperCase()};
 const lines=items=>items.map(x=>`${esc(short[x.weekday]||x.weekday)} ${esc((x.start_time||'').slice(0,5))}${x.end_time?'–'+esc(x.end_time.slice(0,5)):''} Uhr${x.note?` <b>${esc(x.note)}</b>`:''}`).join('<br>');
 async function run(){const {data,error}=await sb.from('training_times').select('*').eq('active',true).order('scope').order('team').order('sort_order').order('start_time');if(error||!data?.length)return;
  const youth=document.querySelector('#trainingszeiten .schedule-grid'); if(youth){const rows=data.filter(x=>x.scope==='Jugend');const groups=rows.reduce((a,x)=>((a[x.team]??=[]).push(x),a),{}); youth.innerHTML=Object.entries(groups).map(([team,items])=>`<article class="schedule-card"><span>${esc(team)}</span><h3>${esc(items[0].label||team)}</h3><p>${lines(items)}</p></article>`).join('');}
  if(location.pathname.includes('/jugend/') && !/\/jugend\/(index|historie|abteilungsleitung|hallenturniere|torwarttrainer)/.test(location.pathname)){
    const team=teamFromPath(),items=data.filter(x=>x.scope==='Jugend'&&String(x.team).toUpperCase()===team.toUpperCase());
    const card=[...document.querySelectorAll('.training-card')].find(x=>/Trainingszeiten/i.test(x.textContent));
    const place=[...document.querySelectorAll('.training-card')].find(x=>/Trainingsort/i.test(x.textContent));
    if(items.length&&card){card.innerHTML=`<h3>Trainingszeiten</h3><p>${lines(items)}</p>`;}
    if(items.length&&place){const loc=[...new Set(items.map(x=>x.location).filter(Boolean))].join('<br>');if(loc)place.innerHTML=`<h3>Trainingsort</h3><p>${esc(loc)}</p>`;}
  }
  const all=document.getElementById('svk-training-live'); if(all){const groups=data.reduce((a,x)=>((a[x.scope]??=[]).push(x),a),{});all.innerHTML=Object.entries(groups).map(([scope,items])=>`<div class="svk-training-group"><h3>${esc(scope)}</h3>${items.map(x=>`<div class="svk-training-line"><strong>${esc(x.team)}</strong><span>${esc(x.weekday)} · ${esc((x.start_time||'').slice(0,5))}${x.end_time?'–'+esc(x.end_time.slice(0,5)):''} Uhr</span><small>${esc(x.location||'')}${x.note?' · '+esc(x.note):''}</small></div>`).join('')}</div>`).join('');}
 }
 run();
})();