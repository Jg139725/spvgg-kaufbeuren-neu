(()=>{
const C=window.SVK_SUPABASE;if(!C||!window.supabase)return;
const sb=window.supabase.createClient(C.url,C.anonKey),$=id=>document.getElementById(id);
let role=null,record={},sponsors=[];
const allowed=()=>['admin','editor','foerderverein_redaktion'].includes(role);
const defaults=window.SVK_SPONSOR_DEFAULTS||[];
const normalized=x=>String(x||'').trim().toLocaleLowerCase('de');
const validItems=arr=>(Array.isArray(arr)?arr:[]).filter(x=>x&&typeof x.name==='string'&&x.name.trim());
const managed=arr=>Array.isArray(arr)&&arr.some(x=>x?._svk_managed===true);
const combined=arr=>{const saved=validItems(arr);if(managed(arr))return saved.map(x=>({...x}));const result=defaults.map(x=>({...x}));for(const x of saved){const i=result.findIndex(y=>normalized(y.name)===normalized(x.name));if(i>=0)result[i]={...result[i],...x,logo_url:x.logo_url||result[i].logo_url};else result.push({...x});}return result;};
function render(){const list=$('fvSponsorList');list.replaceChildren();sponsors.forEach((s,i)=>{
 const wrap=document.createElement('div');wrap.className='fv-sponsor-item';
 const head=document.createElement('div');head.className='sponsor-head';const title=document.createElement('strong');title.textContent=`Sponsor ${i+1}: ${s.name||'Neu'}`;const remove=document.createElement('button');remove.type='button';remove.className='remove-sponsor';remove.textContent='Löschen';remove.onclick=()=>{if(!confirm('Diesen Sponsor wirklich entfernen? Bitte anschließend speichern.'))return;sponsors.splice(i,1);render();};head.append(title,remove);wrap.append(head);
 const field=(label,type,value,cb)=>{const lab=document.createElement('label');lab.textContent=label;const inp=document.createElement('input');inp.type=type;inp.value=value||'';inp.addEventListener('input',()=>{cb(inp.value);title.textContent=`Sponsor ${i+1}: ${s.name||'Neu'}`});lab.append(inp);wrap.append(lab)};
 field('Sponsorname','text',s.name,v=>s.name=v);field('Website (https://...)','url',s.url,v=>s.url=v);
 if(s.logo_url){const img=document.createElement('img');img.src=/^https?:\/\//.test(s.logo_url)?s.logo_url:'../'+s.logo_url.replace(/^\.\//,'');img.alt='Logo '+s.name;wrap.append(img)}
 const lab=document.createElement('label');lab.textContent='Logo hochladen (JPG, PNG, WebP, max. 5 MB)';const inp=document.createElement('input');inp.type='file';inp.accept='image/jpeg,image/png,image/webp';inp.onchange=()=>{s._file=inp.files[0]||null};lab.append(inp);wrap.append(lab);list.append(wrap);
 });if(!sponsors.length){const p=document.createElement('p');p.textContent='Noch keine Sponsoren. Klicke auf „+ Sponsor hinzufügen“.';list.append(p)}}
async function start(){const {data:{session}}=await sb.auth.getSession();if(!session){$('tabFoerderverein')?.classList.add('hidden');return}const {data:p}=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();role=p?.role;
 $('tabFoerderverein').classList.toggle('hidden',!allowed());if(role==='foerderverein_redaktion')['tabTraining','tabTrainers'].forEach(id=>$(id)?.classList.add('hidden'));
 if(!allowed())return;$('tabFoerderverein').onclick=async()=>{document.querySelectorAll('.cms-tabs button').forEach(b=>b.className='secondary');$('tabFoerderverein').className='active';['newsPanel','trainingPanel','trainersPanel'].forEach(id=>$(id)?.classList.add('hidden'));$('foerdervereinPanel').classList.remove('hidden');await load()};
 ['tabNews','tabTraining','tabTrainers'].forEach(id=>$(id)?.addEventListener('click',()=>$('foerdervereinPanel').classList.add('hidden')));
}
async function load(){const {data,error}=await sb.from('foerderverein_content').select('*').eq('id',1).maybeSingle();if(error){$('fvStatus').textContent=error.message;return}record=data||{};$('fvCaption').value=record.caption||'';$('fvPeople').value=(record.people||[]).map(x=>[x.role,x.name].join(' | ')).join('\n');sponsors=combined(record.sponsors);render();}
$('fvAddSponsor').onclick=()=>{sponsors.push({name:'',url:'',logo_url:''});render();document.querySelector('#fvSponsorList .fv-sponsor-item:last-child input')?.focus()};
$('fvForm').onsubmit=async e=>{e.preventDefault();if(!allowed())return;$('fvStatus').textContent='Speichere …';try{
 let image_url=record?.image_url||null;const file=$('fvImage').files[0];
 const upload=async f=>{if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5e6)throw Error('Nur JPG, PNG oder WebP bis 5 MB.');const {data:{user},error:authError}=await sb.auth.getUser();if(authError||!user)throw Error('Bitte erneut anmelden.');const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg';const path=user.id+'/sponsors/'+crypto.randomUUID()+'.'+ext;const r=await sb.storage.from('foerderverein-images').upload(path,f,{contentType:f.type});if(r.error)throw r.error;return sb.storage.from('foerderverein-images').getPublicUrl(path).data.publicUrl};
 if(file)image_url=await upload(file);
 const people=$('fvPeople').value.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const [role,name]=x.split('|').map(t=>t?.trim());return {role:role||'',name:name||''}});
 const names=new Set();const output=[];for(const item of sponsors){const name=(item.name||'').trim(),url=(item.url||'').trim();if(!name)throw Error('Bitte für jeden Sponsor einen Namen eingeben.');if(names.has(normalized(name)))throw Error('Sponsor doppelt vorhanden: '+name);names.add(normalized(name));if(url&&!/^https:\/\//i.test(url))throw Error('Website muss mit https:// beginnen: '+name);let logo_url=item.logo_url||'';if(item._file)logo_url=await upload(item._file);output.push({name,url,logo_url,_svk_managed:true})}
 // A marker allows deliberate deletion of every sponsor without restoring the defaults.
 if(!output.length)output.push({_svk_managed:true});
 const {error}=await sb.from('foerderverein_content').upsert({id:1,caption:$('fvCaption').value,people,sponsors:output,image_url,updated_at:new Date().toISOString()});if(error)throw error;$('fvStatus').textContent='Sponsoren erfolgreich gespeichert.';await load();
 }catch(err){$('fvStatus').textContent='Fehler: '+(err.message||err)}};
 sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')setTimeout(start,100);if(event==='SIGNED_OUT')role=null});setTimeout(start,200);
})();