(async()=>{
 'use strict';
 const script=document.currentScript,base=new URL('../../',script.src),cfg=window.SVK_SUPABASE;
 if(!cfg)return;
 const headers={apikey:cfg.anonKey,'Content-Type':'application/json'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pdf=p=>cfg.url+'/storage/v1/object/public/stadium-issues/'+p;
 const isArchive=location.pathname.endsWith('/stadionzeitung.html');
 const card=document.querySelector('.stadionheft-current');
 if(isArchive||card){
  const host=isArchive?document.querySelector('.issue-wrap'):card;
  try{
   const settingsResponse=await fetch(cfg.url+'/rest/v1/stadium_settings?select=url&id=eq.true',{headers});
   if(!settingsResponse.ok)throw Error('Link nicht erreichbar');
   const settings=await settingsResponse.json();let target=null;
   if(settings[0]?.url){try{const u=new URL(settings[0].url);if(u.protocol==='https:'&&!u.username&&!u.password&&!(u.origin===location.origin&&/\/stadionzeitung(?:\.html)?\/?$/.test(u.pathname)))target=u.href;}catch{}}
   if(target){
    if(isArchive){const a=document.createElement('a');a.href=target;a.textContent='Stadionzeitung öffnen →';a.rel='noopener';host.replaceChildren(a);location.replace(target);return;}
    const a=card.querySelector('.stadionheft-current__read');a.href=target;a.textContent='Stadionzeitung lesen ↗';card.querySelector('h3').textContent='Unsere Stadionzeitung online lesen';card.querySelector('p').textContent='Neuigkeiten und Geschichten rund um die SpVgg Kaufbeuren – hier geht es zur Stadionzeitung.';
   }
   if(!target){
   const r=await fetch(cfg.url+'/rest/v1/stadium_issues?select=title,issue_date,file_path&issue_date=lte.'+new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Berlin'})+'&order=issue_date.desc,created_at.desc',{headers});if(!r.ok)throw Error();
   const issues=await r.json(),first=issues[0];
   if(isArchive){host.innerHTML='<h2>Stadionzeitungen</h2>'+(!first?'<p>Noch keine Ausgabe hochgeladen.</p>':issues.map((x,i)=>`<article class="issue-current" style="margin-bottom:20px"><span class="k">${i===0?'Aktuelle Ausgabe':esc(x.issue_date)}</span><h2>${esc(x.title)}</h2><a href="${pdf(x.file_path)}" target="_blank" rel="noopener">PDF lesen ↗</a></article>`).join(''));}
   else if(first){card.querySelector('h3').textContent=first.title;const a=card.querySelector('.stadionheft-current__read');a.href=pdf(first.file_path);a.textContent='Aktuelle Ausgabe lesen ↗';}
   }
  }catch{if(isArchive)host.innerHTML='<p>Die Stadionzeitungen konnten nicht geladen werden. Bitte versuche es später erneut.</p>';}
 }
 if(location.pathname.includes('/admin/')||/redaktion/.test(location.pathname)||navigator.globalPrivacyControl||navigator.doNotTrack==='1')return;
 // Statistics require a session-only opt-in; no cross-session identifier or full referrer is stored.
 function record(){
  try{
   let id=sessionStorage.getItem('svk-visit-id');if(!id){id=crypto.randomUUID();sessionStorage.setItem('svk-visit-id',id);}
   let source=sessionStorage.getItem('svk-visit-source');
   if(!source){let h='';try{h=new URL(document.referrer).hostname;}catch{} source=!h||h===location.hostname?'Direkt / unbekannt':/(^|\.)google\./.test(h)?'Google':/(^|\.)instagram\.com$/.test(h)?'Instagram':/(^|\.)facebook\.com$/.test(h)||h==='l.facebook.com'?'Facebook':/(^|\.)bing\.com$/.test(h)?'Bing':'Andere Website';sessionStorage.setItem('svk-visit-source',source);}
   const path='/'+location.pathname.slice(base.pathname.length).replace(/[^a-zA-Z0-9/_.,-]/g,'').slice(0,199);
   fetch(cfg.url+'/rest/v1/site_visits',{method:'POST',headers,body:JSON.stringify({visit_id:id,path,source}),keepalive:true}).catch(()=>{});
  }catch{}
 }
 try{const consent=sessionStorage.getItem('svk-stats');if(consent==='yes'){record();return;}if(consent==='no')return;}catch{return;}
 const banner=document.createElement('aside');banner.setAttribute('aria-label','Optionale Besucherstatistik');banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:9999;background:white;color:#123;padding:18px;border:1px solid #abc;border-radius:14px;box-shadow:0 5px 25px #0002;max-width:620px';
 banner.innerHTML=`<p style="margin:0 0 12px">Dürfen wir deinen Besuch für die SVK-Besucherstatistik zählen? Ohne Namen, ohne gespeicherte IP-Adresse und nur für diesen Besuch. <a href="${new URL('datenschutz.html',base)}">Datenschutz</a></p><button type="button" data-choice="no">Ablehnen</button> <button type="button" data-choice="yes">Erlauben</button>`;
 banner.onclick=e=>{const c=e.target.dataset.choice;if(!c)return;try{sessionStorage.setItem('svk-stats',c);}catch{}banner.remove();if(c==='yes')record();};document.body.append(banner);
})();
