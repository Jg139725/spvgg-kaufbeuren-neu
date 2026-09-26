(()=>{
  const C=window.SVK_SUPABASE||{};
  if(!C.url||!C.anonKey||!window.supabase)return;
  const sb=window.supabase.createClient(C.url,C.anonKey);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const days={Montag:'Mo',Dienstag:'Di',Mittwoch:'Mi',Donnerstag:'Do',Freitag:'Fr',Samstag:'Sa',Sonntag:'So'};
  const dayOrder={Montag:1,Dienstag:2,Mittwoch:3,Donnerstag:4,Freitag:5,Samstag:6,Sonntag:7};
  function lines(items){return items.sort((a,b)=>(dayOrder[a.weekday]||9)-(dayOrder[b.weekday]||9)).map(x=>`${days[x.weekday]||x.weekday} ${esc((x.start_time||'').slice(0,5))}${x.end_time?'–'+esc(x.end_time.slice(0,5)):''}${x.note?' <strong>'+esc(x.note)+'</strong>':''}`).join('<br>')}
  async function run(){
    const {data:setting,error:setErr}=await sb.from('training_settings').select('active_period').eq('scope','Jugend').maybeSingle();
    if(setErr){console.warn('SVK Trainingsplan:',setErr.message);return}
    const activePeriod=setting?.active_period||'Sommerzeit';
    const {data,error}=await sb.from('training_times').select('*').eq('active',true).eq('period',activePeriod).order('sort_order').order('start_time');
    if(error){console.warn('SVK Trainingszeiten:',error.message);return}
    const rows=data||[];

    const youth=document.querySelector('#trainingszeiten .schedule-grid');
    if(youth){
      const ys=rows.filter(x=>x.scope==='Jugend');
      const groups=ys.reduce((a,x)=>((a[x.team]??=[]).push(x),a),{});
      youth.innerHTML=Object.entries(groups).map(([team,items])=>`<article class="schedule-card"><span>${esc(team)}</span><h3>${esc(items[0].label||team)}</h3><p>${lines(items)}</p></article>`).join('');
    }

    const team=document.body.dataset.trainingTeam||document.querySelector('[data-training-team]')?.dataset.trainingTeam;
    if(team){
      const items=rows.filter(x=>x.scope==='Jugend'&&x.team===team);
      const card=[...document.querySelectorAll('.training-card')].find(x=>/Trainingszeiten/i.test(x.textContent));
      const place=[...document.querySelectorAll('.training-card')].find(x=>/Trainingsort/i.test(x.textContent));
      if(card){
        card.innerHTML=items.length?`<h3>Trainingszeiten</h3><p>${lines(items)}</p>`:`<h3>Trainingszeiten</h3><p>Für ${esc(activePeriod)} sind aktuell keine Trainingszeiten eingetragen.</p>`;
      }
      if(place&&items.length)place.innerHTML=`<h3>Trainingsort</h3><p>${esc(items[0].location||'Sportpark am Haken')}</p>`;
    }

    const all=document.getElementById('svk-training-live');
    if(all){
      const groups=rows.reduce((a,x)=>((a[x.scope]??=[]).push(x),a),{});
      all.innerHTML=Object.entries(groups).map(([scope,items])=>`<div class="svk-training-group"><h3>${esc(scope)} · ${esc(activePeriod)}</h3>${items.map(x=>`<div class="svk-training-line"><strong>${esc(x.team)}</strong><span>${esc(x.weekday)} · ${esc((x.start_time||'').slice(0,5))}${x.end_time?'–'+esc(x.end_time.slice(0,5)):''} Uhr</span><small>${esc(x.location||'')}${x.note?' · '+esc(x.note):''}</small></div>`).join('')}</div>`).join('');
    }
  }
  run();
})();
