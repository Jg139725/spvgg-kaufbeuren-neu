
(()=>{
const C=window.SVK_SUPABASE;if(!C||!window.supabase)return;
const sb=window.supabase.createClient(C.url,C.anonKey),$=id=>document.getElementById(id);
let role=null,record=null;
const allowed=()=>['admin','editor','foerderverein_redaktion'].includes(role);
async function start(){
 const {data:{session}}=await sb.auth.getSession();
 if(!session){$('tabFoerderverein').classList.add('hidden');return}
 const {data:p}=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
 role=p?.role;
 $('tabFoerderverein').classList.toggle('hidden',!allowed());
 if(role==='foerderverein_redaktion'){
   ['tabTraining','tabTrainers'].forEach(id=>$(id)?.classList.add('hidden'));
 }
 if(!allowed())return;
 $('tabFoerderverein').onclick=async()=>{
   document.querySelectorAll('.cms-tabs button').forEach(b=>b.className='secondary');
   $('tabFoerderverein').className='active';
   ['newsPanel','trainingPanel','trainersPanel'].forEach(id=>$(id)?.classList.add('hidden'));
   $('foerdervereinPanel').classList.remove('hidden');
   await load();
 };
 $('tabNews').addEventListener('click',()=>{$('foerdervereinPanel').classList.add('hidden')});
 $('tabTraining').addEventListener('click',()=>{$('foerdervereinPanel').classList.add('hidden')});
 $('tabTrainers').addEventListener('click',()=>{$('foerdervereinPanel').classList.add('hidden')});
 if(role==='foerderverein_redaktion'){
   $('tabFoerderverein').classList.remove('hidden');
 }
}
async function load(){
 const {data,error}=await sb.from('foerderverein_content').select('*').eq('id',1).maybeSingle();
 if(error){$('fvStatus').textContent=error.message;return}
 record=data||{};
 $('fvCaption').value=record.caption||'';
 $('fvPeople').value=(record.people||[]).map(x=>[x.role,x.name].join(' | ')).join('\n');
 $('fvSponsors').value=(record.sponsors||[]).map(x=>[x.name,x.url||''].join(' | ')).join('\n');
}
$('fvForm').onsubmit=async e=>{
 e.preventDefault();if(!allowed())return;
 $('fvStatus').textContent='Speichere …';
 try{
  let image_url=record?.image_url||null;
  const file=$('fvImage').files[0];
  if(file){
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5e6)throw Error('Nur JPG, PNG oder WebP bis 5 MB.');
   const {data:{user}}=await sb.auth.getUser();
   const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path=user.id+'/'+crypto.randomUUID()+'.'+ext;
   const r=await sb.storage.from('foerderverein-images').upload(path,file,{contentType:file.type});
   if(r.error)throw r.error;
   image_url=sb.storage.from('foerderverein-images').getPublicUrl(path).data.publicUrl;
  }
  const people=$('fvPeople').value.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const [role,name]=x.split('|').map(t=>t?.trim());return {role:role||'',name:name||''}});
  const previous=record?.sponsors||[];
  const sponsors=$('fvSponsors').value.split('\n').map(x=>x.trim()).filter(Boolean).map((x,i)=>{const [name,url]=x.split('|').map(t=>t?.trim());if(!name)throw Error('Sponsorname fehlt.');if(url&&!/^https:\/\//i.test(url))throw Error('Sponsor-Links müssen mit https:// beginnen.');const old=previous.find(y=>y.name===name)||{};return {name,url:url||'',logo_url:old.logo_url||''}});
  const logoFile=$('fvLogoFile').files[0];
  if(logoFile){
    const idx=Number($('fvLogoIndex').value)-1;
    if(!Number.isInteger(idx)||idx<0||idx>=sponsors.length)throw Error('Bitte gültige Sponsor-Zeilennummer eingeben.');
    if(!['image/jpeg','image/png','image/webp'].includes(logoFile.type)||logoFile.size>5e6)throw Error('Nur JPG, PNG oder WebP bis 5 MB.');
    const {data:{user}}=await sb.auth.getUser();
    const ext=logoFile.type==='image/png'?'png':logoFile.type==='image/webp'?'webp':'jpg';
    const path=user.id+'/sponsors/'+crypto.randomUUID()+'.'+ext;
    const uploaded=await sb.storage.from('foerderverein-images').upload(path,logoFile,{contentType:logoFile.type});
    if(uploaded.error)throw uploaded.error;
    sponsors[idx].logo_url=sb.storage.from('foerderverein-images').getPublicUrl(path).data.publicUrl;
  }
  const {error}=await sb.from('foerderverein_content').upsert({id:1,caption:$('fvCaption').value,people,sponsors,image_url,updated_at:new Date().toISOString()});
  if(error)throw error;$('fvStatus').textContent='Gespeichert.';await load();
 }catch(err){$('fvStatus').textContent=err.message}
};
sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')setTimeout(start,100);if(event==='SIGNED_OUT')role=null});
setTimeout(start,200);
})();
