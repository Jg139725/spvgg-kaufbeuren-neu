/* Verkleinert Fotos automatisch vor dem Hochladen (max. 1920 px, JPEG ~82 %).
   Handyfotos mit 5–8 MB werden so meist zu 300–600 KB. PDFs und kleine Bilder bleiben unverändert. */
(function(){
  if(!window.supabase||!window.supabase.createClient||window.supabase.__svkShrink)return;
  var MAX=1920, QUALITY=0.82, MIN_BYTES=400*1024;
  function shrink(file){
    return new Promise(function(resolve){
      try{
        if(!(file instanceof Blob)||!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)||file.size<MIN_BYTES)return resolve(file);
        var url=URL.createObjectURL(file),img=new Image();
        img.onload=function(){
          var s=Math.min(1,MAX/Math.max(img.width,img.height)),c=document.createElement('canvas');
          c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
          var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function(b){
            if(!b||b.size>=file.size)return resolve(file);
            var name=(file.name||'bild').replace(/\.[^.]+$/,'')+'.jpg';
            try{resolve(new File([b],name,{type:'image/jpeg'}))}catch(e){resolve(b)}
          },'image/jpeg',QUALITY);
        };
        img.onerror=function(){URL.revokeObjectURL(url);resolve(file)};
        img.src=url;
      }catch(e){resolve(file)}
    });
  }
  var orig=window.supabase.createClient;
  window.supabase.createClient=function(){
    var client=orig.apply(this,arguments),from=client.storage.from.bind(client.storage);
    client.storage.from=function(bucket){
      var api=from(bucket),up=api.upload.bind(api);
      api.upload=function(path,file,opts){
        return shrink(file).then(function(f){
          if(f!==file&&f.type==='image/jpeg'){opts=Object.assign({},opts||{},{contentType:'image/jpeg'});}
          return up(path,f,opts);
        });
      };
      return api;
    };
    return client;
  };
  window.supabase.__svkShrink=true;
})();
