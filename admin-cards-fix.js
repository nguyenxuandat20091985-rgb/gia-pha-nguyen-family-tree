/* Admin dashboard touch fallback: capture touch/pointer before any app layer can swallow it. */
(function(){'use strict';
function activate(card,e){
  if(!card || !card.matches('.admin-dashboard-card[data-tab]')) return;
  e.preventDefault();
  e.stopPropagation();
  HTMLElement.prototype.click.call(card);
}
function bind(){
  const root=document.getElementById('view-admin');
  if(!root)return false;
  root.querySelectorAll('.admin-dashboard-card[data-tab]').forEach(card=>{
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
  });
  return true;
}
document.addEventListener('pointerup',function(e){
  if(e.pointerType==='mouse')return;
  const card=e.target.closest?.('#view-admin .admin-dashboard-card[data-tab]');
  if(card)activate(card,e);
},true);
document.addEventListener('touchend',function(e){
  const card=e.target.closest?.('#view-admin .admin-dashboard-card[data-tab]');
  if(card)activate(card,e);
},true);
const boot=()=>{bind();const mo=new MutationObserver(bind);mo.observe(document.body,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();