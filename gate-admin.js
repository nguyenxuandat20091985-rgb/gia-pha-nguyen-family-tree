/* Unified Admin console for Gia Phả Họ Nguyễn — loader */
(function(){
  function boot(code){
    try {
      var s = document.createElement('script');
      s.textContent = code;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {
      console.error('gate-admin boot', e);
    }
  }
  Promise.all([
    fetch('gate-admin-a.js?v=21').then(function(r){ if(!r.ok) throw new Error('a '+r.status); return r.text(); }),
    fetch('gate-admin-b.js?v=21').then(function(r){ if(!r.ok) throw new Error('b '+r.status); return r.text(); })
  ]).then(function(parts){
    boot(parts[0] + parts[1]);
  }).catch(function(e){
    console.error('gate-admin load failed', e);
  });
})();
