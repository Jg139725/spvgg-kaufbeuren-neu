(()=>{
  const cfg=window.SVK_SUPABASE;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const msg=(text,kind='')=>{const el=$('loginMsg');el.textContent=text;el.className=kind};
  const recoveryMsg=(text,kind='')=>{const el=$('recoveryMsg');el.textContent=text;el.className=kind};
  const showRecovery=()=>{
    $('login').classList.add('hidden');
    $('app').classList.add('hidden');
    $('recovery').classList.remove('hidden');
  };
  const showLogin=()=>{
    $('recovery').classList.add('hidden');
    $('app').classList.add('hidden');
    $('login').classList.remove('hidden');
  };
  const detailedError=(err,stage='Verbindung')=>{
    const raw=err?.message||String(err||'Unbekannter Fehler');
    if(/load failed|failed to fetch|networkerror|network request failed/i.test(raw)){
      return `${stage}: Netzwerkverbindung zu Supabase fehlgeschlagen. Bitte unten „Verbindung testen“ drücken. Technisch: ${raw}`;
    }
    return `${stage}: ${raw}`;
  };

  if(!cfg||!cfg.url||!cfg.anonKey||cfg.url.includes('DEINE_')){
    msg('Supabase ist noch nicht konfiguriert.','error');
    return;
  }
  if(typeof supabase==='undefined'){
    msg('Die Supabase-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung/Inhaltsblocker prüfen.','error');
    return;
  }

  let sb;
  try{
    sb=supabase.createClient(cfg.url,cfg.anonKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
  }catch(err){msg(detailedError(err,'Initialisierung'),'error');return}

  let user,profile,posts=[];

  async function connectivityTest(){
    const out=$('diag');
    out.hidden=false;
    out.textContent='Teste Verbindung …';
    const endpoint=cfg.url.replace(/\/$/,'')+'/auth/v1/settings';
    const lines=[`Projekt: ${cfg.url}`,`Browser online: ${navigator.onLine?'ja':'nein'}`];
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),8000);
      const r=await fetch(endpoint,{headers:{apikey:cfg.anonKey},signal:controller.signal,cache:'no-store'});
      clearTimeout(timer);
      lines.push(`Auth-API: HTTP ${r.status} ${r.ok?'OK':'FEHLER'}`);
      if(!r.ok){
        let t='';try{t=await r.text()}catch(_){ }
        if(t) lines.push('Antwort: '+t.slice(0,260));
      }
    }catch(err){
      lines.push('Auth-API: NICHT ERREICHBAR');
      lines.push('Fehler: '+(err?.name||'')+' '+(err?.message||String(err)));
      lines.push('Hinweis: Wenn hier „Load failed“ steht, blockiert Safari/Netzwerk die Anfrage oder die Supabase-Adresse ist nicht erreichbar.');
    }
    out.textContent=lines.join('\n');
  }
  $('testConnection').onclick=connectivityTest;

  async function auth(u){
    user=u;
    msg('Login erfolgreich – prüfe Berechtigung …','ok');
    try{
      const {data,error}=await sb.from('profiles').select('*').eq('id',u.id).single();
      if(error) throw error;
      profile=data;
      if(!profile||!['editor','admin'].includes(profile.role)){
        await sb.auth.signOut();
        msg('Login funktioniert, aber dieser Benutzer hat keine Redaktionsberechtigung.','error');
        return;
      }
      $('login').classList.add('hidden');
      $('app').classList.remove('hidden');
      await load();
    }catch(err){
      msg(detailedError(err,'Profil laden'),'error');
    }
  }

  $('loginForm').onsubmit=async e=>{
    e.preventDefault();
    msg('Verbinde mit Supabase …','working');
    $('loginBtn').disabled=true;
    try{
      const {data,error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
      if(error) throw error;
      if(data?.user) await auth(data.user);
    }catch(err){
      msg(detailedError(err,'Anmeldung'),'error');
    }finally{
      $('loginBtn').disabled=false;
    }
  };


  $('forgotPassword').onclick=async ()=>{
    const email=$('email').value.trim();
    if(!email){
      msg('Bitte zuerst deine E-Mail-Adresse eintragen.','error');
      $('email').focus();
      return;
    }
    msg('Recovery-E-Mail wird angefordert …','working');
    try{
      const redirectTo=new URL('admin/', window.location.href).href;
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
      if(error) throw error;
      msg('E-Mail wurde angefordert. Öffne den Link in der Mail – danach erscheint hier automatisch die Maske für ein neues Passwort.','ok');
    }catch(err){
      msg(detailedError(err,'Passwort zurücksetzen'),'error');
    }
  };

  $('recoveryForm').onsubmit=async e=>{
    e.preventDefault();
    const p1=$('newPassword').value;
    const p2=$('newPassword2').value;
    if(p1.length<8){
      recoveryMsg('Bitte mindestens 8 Zeichen verwenden.','error');
      return;
    }
    if(p1!==p2){
      recoveryMsg('Die beiden Passwörter stimmen nicht überein.','error');
      return;
    }
    recoveryMsg('Passwort wird gespeichert …','working');
    $('savePasswordBtn').disabled=true;
    try{
      const {error}=await sb.auth.updateUser({password:p1});
      if(error) throw error;
      recoveryMsg('Passwort erfolgreich geändert. Du wirst gleich zur Redaktion weitergeleitet.','ok');
      const {data}=await sb.auth.getSession();
      if(data?.session?.user){
        setTimeout(()=>auth(data.session.user),700);
      }else{
        setTimeout(showLogin,900);
      }
    }catch(err){
      recoveryMsg(detailedError(err,'Passwort speichern'),'error');
    }finally{
      $('savePasswordBtn').disabled=false;
    }
  };

  $('logout').onclick=()=>sb.auth.signOut();
  $('reload').onclick=load;

  (async()=>{
    try{
      const {data,error}=await sb.auth.getSession();
      if(error) throw error;
      if(data.session) await auth(data.session.user);
    }catch(err){
      msg(detailedError(err,'Sitzung prüfen'),'error');
    }
  })();

  sb.auth.onAuthStateChange((event,s)=>{
    if(event==='PASSWORD_RECOVERY'){
      showRecovery();
      recoveryMsg('Recovery-Link erkannt. Bitte jetzt dein neues Passwort festlegen.','ok');
      return;
    }
    if(event==='SIGNED_OUT'||!s){
      showLogin();
    }
  });

  async function load(){
    const {data,error}=await sb.from('news').select('*').order('date',{ascending:false});
    if(error)return $('posts').innerHTML='<p>'+esc(error.message)+'</p>';
    posts=data||[];
    $('posts').innerHTML=posts.map(p=>`<div class="row"><div><strong>${esc(p.title)}</strong><div class="meta">${esc(p.date)} · <span class="tag">${esc(p.category)}</span> · ${p.status==='published'?'Veröffentlicht':'Entwurf'}</div></div><div><button class="secondary" data-e="${p.id}">Bearbeiten</button>${profile.role==='admin'?` <button class="delete" data-d="${p.id}">Löschen</button>`:''}</div></div>`).join('')||'<p>Noch keine Beiträge.</p>';
    document.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>open(posts.find(x=>x.id===b.dataset.e)));
    document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>del(b.dataset.d));
  }
  function open(p={}){
    $('postForm').reset();$('postId').value=p.id||'';$('category').value=p.category||'Herren';$('date').value=p.date||new Date().toISOString().slice(0,10);$('title').value=p.title||'';$('teaser').value=p.teaser||'';$('content').value=p.content||'';$('status').value=p.status||'draft';$('editorMsg').textContent='';$('editor').showModal();
  }
  $('new').onclick=()=>open();$('cancel').onclick=()=>$('editor').close();
  async function upload(file){if(!file)return null;const ext=file.name.split('.').pop();const path=`${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;const{error}=await sb.storage.from('news-images').upload(path,file);if(error)throw error;return sb.storage.from('news-images').getPublicUrl(path).data.publicUrl}
  $('postForm').onsubmit=async e=>{e.preventDefault();try{$('editorMsg').textContent='Speichere …';const id=$('postId').value,old=posts.find(x=>x.id===id),img=await upload($('image').files[0]);const status=$('status').value,payload={category:$('category').value,date:$('date').value,title:$('title').value.trim(),teaser:$('teaser').value.trim(),content:$('content').value.trim(),status,image_url:img||old?.image_url||null,published_at:status==='published'?(old?.published_at||new Date().toISOString()):null,updated_by:user.id};const r=id?await sb.from('news').update(payload).eq('id',id):await sb.from('news').insert({...payload,created_by:user.id});if(r.error)throw r.error;$('editor').close();load()}catch(err){$('editorMsg').textContent=detailedError(err,'Speichern')}};
  async function del(id){if(profile.role!=='admin'||!confirm('Beitrag wirklich löschen?'))return;const{error}=await sb.from('news').delete().eq('id',id);if(error)alert(error.message);else load()}
})();
