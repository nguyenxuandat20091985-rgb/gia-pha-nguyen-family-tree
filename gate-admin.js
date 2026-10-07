/* Admin console — core only, no mock/demo accounts */
(function(){
'use strict';
function loadScript(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');
    s.src=src; s.async=false;
    s.onload=function(){resolve();};
    s.onerror=function(){reject(new Error('load fail '+src));};
    document.head.appendChild(s);
  });
}
/* Stable Phân quyền UI (3 cấp) from commit 0bea4b6 — không gắn tài khoản giả */
var CORE='https://cdn.jsdelivr.net/gh/nguyenxuandat20091985-rgb/gia-pha-nguyen-family-tree@0bea4b6bf12cb0961e04035470a1ad020275e0d0/gate-admin.js';
loadScript(CORE).catch(function(e){ console.error('[gate-admin]', e); });
})();
