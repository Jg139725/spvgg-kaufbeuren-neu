
document.addEventListener("DOMContentLoaded",()=>{
 const card=document.querySelector(".office-status-card");
 if(!card) return;
 const dot=card.querySelector(".office-dot");
 const title=card.querySelector(".office-title");
 const info=card.querySelector(".office-info");

 // Öffnungszeiten bitte NICHT ändern – diese Zeiten entsprechen der vorhandenen Webseite.
 const hours={
 1:[17,19],
 2:[17,18],
 3:[17,19],
 4:null,
 5:[17,18.5]
 };

 const now=new Date();
 const day=now.getDay(); // So=0
 const h=now.getHours()+now.getMinutes()/60;

 function fmt(v){
   const hh=Math.floor(v);
   const mm=Math.round((v-hh)*60);
   return String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0");
 }

 const today=hours[day];
 if(today && h>=today[0] && h<today[1]){
   dot.className="office-dot open";
   title.textContent="Jetzt geöffnet";
   info.textContent="Heute bis "+fmt(today[1])+" Uhr geöffnet";
 }else{
   dot.className="office-dot closed";
   title.textContent="Derzeit geschlossen";
   if(today && h<today[0]){
      info.textContent="Öffnet heute um "+fmt(today[0])+" Uhr";
   }else{
      let next=day;
      for(let i=1;i<8;i++){
        let d=(day+i)%7;
        if(hours[d]){
          next=d;break;
        }
      }
      const names=["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
      info.textContent="Öffnet "+names[next]+" um "+fmt(hours[next][0])+" Uhr";
   }
 }
});
