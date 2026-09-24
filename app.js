/* plain base64 loader - no zlib needed */
(function(){
  function run(){
    var parts = window.__GIA_B64 || [];
    if (!parts.length) { alert('Thiếu mã app'); return; }
    var b64 = parts.join('');
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    var code = new TextDecoder('utf-8').decode(bytes);
    (0,eval)(code);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
