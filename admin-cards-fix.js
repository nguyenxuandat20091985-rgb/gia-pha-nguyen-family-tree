/* Admin dashboard interaction guard: handle the earliest mobile touch/pointer event. */
(function(){'use strict';
let lastTab='';
let lastAt=0;
function activate(card,e){
  if(!card || !card.matches('.admin-dashboard-card[data-tab]')) return;
  const tab=card.dataset.tab||'overview';
  const now=Date.now();
  if(lastTab===tab && now-lastAt<350) return;
  lastTab=tab; lastAt=now;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  HTMLElement.prototype.click.call(card);
}
function bind(){
  const root=document.getElementById('view-admin');
  if(!root)return false;
  root.querySelectorAll('.admin-dashboard-card[data-tab]').forEach(card=>{
    if(card.dataset.earlyTouchBound==='1')return;
    card.dataset.earlyTouchBound='1';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.ontouchstart=function(e){activate(card,e);};
    card.onpointerdown=function(e){if(e.pointerType!=='mouse')activate(card,e);};
  });
  return true;
}
function findCard(e){
  return e.target?.closest?.('#view-admin .admin-dashboard-card[data-tab]');
}
document.addEventListener('pointerdown',function(e){
  if(e.pointerType==='mouse')return;
  const card=findCard(e);
  if(card)activate(card,e);
},true);
document.addEventListener('touchstart',function(e){
  const card=findCard(e);
  if(card)activate(card,e);
},true);
document.addEventListener('pointerup',function(e){
  if(e.pointerType==='mouse')return;
  const card=findCard(e);
  if(card)activate(card,e);
},true);
document.addEventListener('touchend',function(e){
  const card=findCard(e);
  if(card)activate(card,e);
},true);
const boot=()=>{bind();const mo=new MutationObserver(bind);mo.observe(document.body,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();