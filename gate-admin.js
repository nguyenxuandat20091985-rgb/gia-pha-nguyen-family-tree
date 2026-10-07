/* Admin entry — loads full console (no mock) */
(function(){
  var s=document.createElement('script');
  s.src='gate-admin-core.js?v=15';
  s.async=false;
  s.onerror=function(){ console.error('[gate-admin] failed to load gate-admin-core.js'); };
  document.head.appendChild(s);
})();
