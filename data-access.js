/* Local access gate for accidental entry into genealogy data tools.
   Change ADMIN_PIN before deployment. This client-side PIN is a deterrent, not server-side security. */
(function(){
'use strict';
const ADMIN_PIN='482916'; // Admin PIN; replace with a private value before sharing
let unlocked=false;
let modal;
function build(){
 if(modal)return modal;
 modal=document.createElement('div');
 modal.id='dataAccessGate';
 modal.style.cssText='position:fixed;inset:0;z-index:10000;background:#1b120fe8;display:none;align-items:center;justify-content:center;padding:18px';
 modal.innerHTML='<form id="dataAccessForm" style="width:min(100%,380px);background:var(--card,#fffdf9);color:var(--text,#2a1810);border-radius:18px;padding:22px;box-shadow:0 12px 45px #0005"><h2 style="margin-bottom:8px">🔐 Xác thực quản trị</h2><p style="margin-bottom:14px">Nhập mã PIN để mở khu vực Xuất / Nhập / Reset dữ liệu gia phả.</p><label for="dataAccessPin">Mã PIN quản trị</label><input id="dataAccessPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="32" required style="display:block;width:100%;margin:8px 0;padding:12px;border:1px solid var(--border,#e0d0b8);border-radius:10px;font:inherit"><p id="dataAccessError" role="alert" style="color:#b42318;min-height:24px;font-size:.85rem"></p><div style="display:flex;gap:8px"><button type="button" id="dataAccessCancel" class="btn btn-secondary" style="flex:1">Hủy</button><button type="submit" class="btn btn-primary" style="flex:1">Mở khóa</button></div></form>';
 document.body.appendChild(modal);
 modal.querySelector('#dataAccessCancel').onclick=()=>{modal.style.display='none';modal.querySelector('#dataAccessPin').value='';};
 modal.querySelector('form').onsubmit=e=>{e.preventDefault();const pin=modal.querySelector('#dataAccessPin').value;if(pin!==ADMIN_PIN){modal.querySelector('#dataAccessError').textContent='Từ chối truy cập: mã PIN không đúng.';modal.querySelector('#dataAccessPin').value='';return;}unlocked=true;modal.style.display='none';modal.querySelector('#dataAccessPin').value='';window.GiaApp?.showView('data');};
 return modal;
}
document.addEventListener('click',e=>{
 const item=e.target.closest('[data-nav="data"]');if(!item)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 if(unlocked){window.GiaApp?.showView('data');return;}
 const el=build();el.style.display='flex';el.querySelector('#dataAccessError').textContent='';setTimeout(()=>el.querySelector('#dataAccessPin').focus(),30);
},true);
document.addEventListener('click',e=>{
 const nav=e.target.closest('#bottomNav [data-nav]');if(nav&&unlocked&&nav.dataset.nav!=='data')unlocked=false;
 const other=e.target.closest('.more-item[data-nav]');if(other&&other.dataset.nav!=='data')unlocked=false;
},true);
})();
