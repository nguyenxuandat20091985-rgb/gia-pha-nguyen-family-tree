/* Admin dashboard touch fallback: delegates native click to existing card handlers. */
(function(){'use strict';
function bind(){
 const root=document.getElementById('view-admin'); if(!root)return false;
 root.querySelectorAll('.admin-dashboard-card[data-tab]').forEach(card=>{
   if(card.dataset.touchBound==='1')return;
   card.dataset.touchBound='1';
   card.addEventListener('pointerup',function(e){
     if(e.pointerType==='mouse')return;
     e.preventDefault();
     HTMLElement.prototype.click.call(card);
   },{passive:false});
 });
 return true;
}
const boot=()=>{bind();const mo=new MutationObserver(bind);mo.observe(document.body,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
