(function(){
  var p=window.__A36||[];
  if(!p.length){alert('Loi tai app');return;}
  var bin=atob(p.join(''));
  var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  var code=new TextDecoder('utf-8').decode(bytes);
  (0,eval)(code);
})();
