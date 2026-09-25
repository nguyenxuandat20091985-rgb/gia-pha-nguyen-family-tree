(function(){
'use strict';
const TREE_KEY='giaPhaNguyenData_v4';
const TREE_KEYS=['giaPhaNguyenData_v4','giaPhaNguyenData_v3','giaPhaNguyenData_v2','giaPhaNguyenData_v1'];
let data={people:{},rootId:null}, currentView='home', treeMode='tree', contextTargetId=null, photoBase64=null, _uiBound=false;

function uid(){return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function loadTree(){
  for(const k of TREE_KEYS){try{const raw=localStorage.getItem(k);if(raw){const p=JSON.parse(raw);if(p&&p.people&&Object.keys(p.people).length){data=p;if(k!==TREE_KEY)localStorage.setItem(TREE_KEY,raw);return;}}}catch(e){}}
}
function saveTree(){localStorage.setItem(TREE_KEY,JSON.stringify(data));}
function seedIfEmpty(){
  if(typeof window.GIA_TREE_SEED==='function'){const next=window.GIA_TREE_SEED(data,saveTree);if(next)data=next;return;}
  if(Object.keys(data.people||{}).length)return;
  data.people.root={id:'root',name:'Nguyễn Văn Mương',gender:'male',birthDate:'',deathDate:'',deathAnniversary:'',notes:'Cụ Tổ 6 đời',photo:null,children:[],spouses:[],sideBranches:[],isSide:false,isRoot:true,parentId:null};
  data.rootId='root';saveTree();
}
function showView(name){
  currentView=name;
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  const el=document.getElementById('view-'+name);if(el)el.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(b=>{
    const more=['calendar','rituals','data','about','account'].includes(name);
    b.classList.toggle('active',b.dataset.nav===name||(more&&b.dataset.nav==='more'));
  });
  if(name==='tree')refreshTree();
  if(name==='home')renderHome();
  window.scrollTo(0,0);
}
function renderHome(){
  const list=document.getElementById('homeEventsList');
  if(list)list.innerHTML='<p class="muted">Chào mừng dòng họ Nguyễn.</p>';
  const ai=document.getElementById('homeAiNews');
  if(ai)ai.textContent='🌿 Bản tin dòng họ – Uống nước nhớ nguồn.';
  const cal=document.getElementById('homeCalendarToday');
  if(cal){const d=new Date();cal.innerHTML='<p><strong>'+d.toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</strong></p>';}
  const morning=document.getElementById('morningText');
  if(morning)morning.textContent='Dòng họ Nguyễn – Uống nước nhớ nguồn.';
  document.getElementById('morningBanner')?.classList.remove('hidden');
}
function getPerson(id){return data.people[id]||null;}
function refreshTree(){if(treeMode==='list')renderPersonList();else renderTree();}
function renderTree(){
  const container=document.getElementById('treeRoot'), empty=document.getElementById('emptyState');
  if(!container)return;
  document.getElementById('treeView')?.classList.remove('hidden');
  document.getElementById('listView')?.classList.add('hidden');
  if(!data.rootId||!data.people[data.rootId]){container.innerHTML='';empty?.classList.remove('hidden');return;}
  empty?.classList.add('hidden');container.innerHTML='';container.appendChild(renderNode(data.rootId));
}
function renderNode(id){
  const p=getPerson(id);if(!p)return document.createTextNode('');
  const wrap=document.createElement('div');wrap.className='child-branch';
  const couple=document.createElement('div');couple.className='couple';
  couple.appendChild(createCard(p));
  (p.spouses||[]).forEach(sid=>{const sp=getPerson(sid);if(sp){const plus=document.createElement('span');plus.className='plus';plus.textContent='+';couple.appendChild(plus);couple.appendChild(createCard(sp));}});
  wrap.appendChild(couple);
  const kids=[...(p.children||[]),...(p.sideBranches||[])];
  if(kids.length){const row=document.createElement('div');row.className='children-row'+(kids.length>1?' has-multiple':'');kids.forEach(cid=>row.appendChild(renderNode(cid)));wrap.appendChild(row);}
  return wrap;
}
function createCard(p){
  const card=document.createElement('div');
  card.className='person-card '+(p.gender||'male');
  if(p.isSide)card.classList.add('side-branch');
  if(p.isRoot||p.id===data.rootId)card.classList.add('root-card');
  card.dataset.id=p.id;card.style.cursor='pointer';
  if(p.isRoot||p.id===data.rootId){const b=document.createElement('div');b.className='root-badge';b.textContent='CỤ TỔ 6 ĐỜI';card.appendChild(b);}
  if(p.photo){const img=document.createElement('img');img.className='photo';img.src=p.photo;card.appendChild(img);}
  const name=document.createElement('div');name.className='name';name.textContent=p.name;card.appendChild(name);
  const parts=[];if(p.birthDate)parts.push(p.birthDate);if(p.deathDate)parts.push('– '+p.deathDate);
  if(parts.length){const dates=document.createElement('div');dates.className='dates';dates.textContent=parts.join(' ');card.appendChild(dates);}
  if(p.deathAnniversary){const g=document.createElement('div');g.className='gio-date';g.textContent='📅 Giỗ: '+p.deathAnniversary;card.appendChild(g);}
  card.addEventListener('click',function(e){e.stopPropagation();showContextMenu(e,p.id);});
  return card;
}
function renderPersonList(){
  document.getElementById('treeView')?.classList.add('hidden');
  document.getElementById('listView')?.classList.remove('hidden');
  const q=(document.getElementById('searchTree')?.value||'').toLowerCase();
  const list=document.getElementById('personList');if(!list)return;
  let people=Object.values(data.people);
  if(q)people=people.filter(p=>(p.name||'').toLowerCase().includes(q));
  people.sort((a,b)=>(a.name||'').localeCompare(b.name||'','vi'));
  list.innerHTML=people.map(p=>{
    let meta=[p.birthDate,p.deathAnniversary?'Giỗ: '+p.deathAnniversary:''].filter(Boolean).join(' · ');
    if(p.id===data.rootId)meta='CỤ TỔ 6 ĐỜI'+(meta?' · '+meta:'');
    return '<div class="list-item" data-id="'+p.id+'"><div class="info"><div class="name">'+esc(p.name)+'</div><div class="meta">'+esc(meta)+'</div></div></div>';
  }).join('');
  list.querySelectorAll('.list-item').forEach(item=>{item.style.cursor='pointer';item.onclick=function(e){showContextMenu(e,item.dataset.id);};});
}
function ensureTreeUI(){
  if(!document.getElementById('contextMenu')){
    const m=document.createElement('div');m.id='contextMenu';m.className='context-menu hidden';
    m.innerHTML='<button type="button" data-action="edit">✏️ Sửa</button><button type="button" data-action="addChild">➕ Thêm con</button><button type="button" data-action="addSpouse">💍 Vợ/Chồng</button><button type="button" data-action="addSide">🌿 Nhánh phụ</button><button type="button" data-action="delete" class="danger">🗑️ Xóa</button>';
    document.body.appendChild(m);
  }
  if(!document.getElementById('personModal')){
    const modal=document.createElement('div');modal.id='personModal';modal.className='modal hidden';
    modal.innerHTML='<div class="modal-content"><div class="modal-header"><h2 id="modalTitle">Thành viên</h2><button type="button" class="modal-close" id="btnCloseModal">×</button></div><form id="personForm"><input type="hidden" id="personId"/><input type="hidden" id="parentId"/><input type="hidden" id="relationType"/><div class="form-row"><label>Họ và tên *</label><input type="text" id="fullName" required/></div><div class="form-row two-cols"><div><label>Giới tính</label><select id="gender"><option value="male">Nam</option><option value="female">Nữ</option></select></div><div><label>Quan hệ</label><select id="relationSelect"><option value="child">Con</option><option value="spouse">Vợ/Chồng</option><option value="side">Nhánh phụ</option></select></div></div><div class="form-row two-cols"><div><label>Ngày sinh</label><input type="text" id="birthDate"/></div><div><label>Ngày mất</label><input type="text" id="deathDate"/></div></div><div class="form-row"><label>📅 Ngày giỗ</label><input type="text" id="deathAnniversary"/></div><div class="form-row"><label>Ghi chú</label><textarea id="notes" rows="2"></textarea></div><div class="form-row"><label>Ảnh</label><div class="photo-upload"><img id="photoPreview" class="photo-preview hidden" alt=""/><input type="file" id="photoInput" accept="image/*"/><button type="button" id="btnRemovePhoto" class="btn btn-small hidden">Xóa ảnh</button></div></div><div class="form-actions"><button type="button" class="btn btn-secondary" id="btnCancel">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form></div>';
    document.body.appendChild(modal);
  }
  if(!_uiBound){
    _uiBound=true;
    document.getElementById('contextMenu').addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn||!contextTargetId)return;
      const action=btn.dataset.action,id=contextTargetId;hideContextMenu();
      if(action==='edit')openPersonModal(id);
      else if(action==='addChild')openPersonModal(null,id,'child');
      else if(action==='addSpouse')openPersonModal(null,id,'spouse');
      else if(action==='addSide')openPersonModal(null,id,'side');
      else if(action==='delete')deletePerson(id);
    });
    document.getElementById('btnCloseModal').addEventListener('click',closePersonModal);
    document.getElementById('btnCancel').addEventListener('click',closePersonModal);
    document.getElementById('personForm').addEventListener('submit',savePerson);
    document.getElementById('photoInput').addEventListener('change',e=>{
      const f=e.target.files&&e.target.files[0];if(!f)return;
      const reader=new FileReader();
      reader.onload=()=>{photoBase64=reader.result;const prev=document.getElementById('photoPreview');if(prev){prev.src=photoBase64;prev.classList.remove('hidden');}document.getElementById('btnRemovePhoto')?.classList.remove('hidden');};
      reader.readAsDataURL(f);
    });
    document.getElementById('btnRemovePhoto')?.addEventListener('click',()=>{photoBase64=null;document.getElementById('photoPreview')?.classList.add('hidden');document.getElementById('btnRemovePhoto')?.classList.add('hidden');});
  }
}
function showContextMenu(e,id){
  ensureTreeUI();contextTargetId=id;
  const menu=document.getElementById('contextMenu');
  menu.classList.remove('hidden');
  menu.style.left=Math.min((e&&e.clientX)||80,window.innerWidth-200)+'px';
  menu.style.top=Math.min((e&&e.clientY)||120,window.innerHeight-220)+'px';
}
function hideContextMenu(){document.getElementById('contextMenu')?.classList.add('hidden');contextTargetId=null;}
function openPersonModal(editId,parentId,relationType){
  ensureTreeUI();
  const modal=document.getElementById('personModal');
  photoBase64=null;
  document.getElementById('personId').value=editId||'';
  document.getElementById('parentId').value=parentId||'';
  document.getElementById('relationType').value=relationType||'child';
  document.getElementById('modalTitle').textContent=editId?'Sửa thành viên':'Thêm thành viên';
  const p=editId?getPerson(editId):null;
  document.getElementById('fullName').value=p?p.name:'';
  document.getElementById('gender').value=p?(p.gender||'male'):'male';
  document.getElementById('birthDate').value=p?(p.birthDate||''):'';
  document.getElementById('deathDate').value=p?(p.deathDate||''):'';
  document.getElementById('deathAnniversary').value=p?(p.deathAnniversary||''):'';
  document.getElementById('notes').value=p?(p.notes||''):'';
  const prev=document.getElementById('photoPreview');
  if(p&&p.photo){prev.src=p.photo;prev.classList.remove('hidden');document.getElementById('btnRemovePhoto')?.classList.remove('hidden');photoBase64=p.photo;}
  else{prev?.classList.add('hidden');document.getElementById('btnRemovePhoto')?.classList.add('hidden');}
  modal.classList.remove('hidden');
}
function closePersonModal(){document.getElementById('personModal')?.classList.add('hidden');}
function savePerson(e){
  e.preventDefault();
  const name=(document.getElementById('fullName').value||'').trim();if(!name){alert('Nhập họ tên');return;}
  const editId=document.getElementById('personId').value;
  const parentId=document.getElementById('parentId').value;
  const relation=document.getElementById('relationType').value||'child';
  const fields={name,gender:document.getElementById('gender').value||'male',birthDate:document.getElementById('birthDate').value||'',deathDate:document.getElementById('deathDate').value||'',deathAnniversary:document.getElementById('deathAnniversary').value||'',notes:document.getElementById('notes').value||'',photo:photoBase64};
  if(editId&&data.people[editId]){Object.assign(data.people[editId],fields);}
  else{
    const id=uid();
    data.people[id]={id,...fields,children:[],spouses:[],sideBranches:[],isSide:relation==='side',isRoot:false,parentId:parentId||null};
    if(!data.rootId){data.rootId=id;data.people[id].isRoot=true;}
    else if(parentId&&data.people[parentId]){
      if(relation==='spouse'){if(!data.people[parentId].spouses.includes(id))data.people[parentId].spouses.push(id);if(!data.people[id].spouses.includes(parentId))data.people[id].spouses.push(parentId);}
      else if(relation==='side'){if(!data.people[parentId].sideBranches.includes(id))data.people[parentId].sideBranches.push(id);}
      else{data.people[id].parentId=parentId;if(!data.people[parentId].children.includes(id))data.people[parentId].children.push(id);}
    }
  }
  saveTree();closePersonModal();refreshTree();
}
function deletePerson(id){
  const p=getPerson(id);if(!p)return;
  if(p.id===data.rootId){alert('Không xóa Cụ Tổ');return;}
  if(!confirm('Xóa '+p.name+'?'))return;
  Object.values(data.people).forEach(x=>{x.children=(x.children||[]).filter(c=>c!==id);x.spouses=(x.spouses||[]).filter(c=>c!==id);x.sideBranches=(x.sideBranches||[]).filter(c=>c!==id);});
  delete data.people[id];saveTree();refreshTree();
}
document.getElementById('bottomNav')?.addEventListener('click',e=>{const btn=e.target.closest('[data-nav]');if(btn)showView(btn.dataset.nav);});
document.querySelectorAll('.more-item').forEach(el=>el.addEventListener('click',()=>{if(el.dataset.nav)showView(el.dataset.nav);}));
document.querySelector('.home-actions')?.addEventListener('click',e=>{const btn=e.target.closest('[data-nav]');if(btn)showView(btn.dataset.nav);});
document.getElementById('btnCloseMorning')?.addEventListener('click',()=>document.getElementById('morningBanner')?.classList.add('hidden'));
document.getElementById('btnToggleView')?.addEventListener('click',()=>{treeMode=treeMode==='tree'?'list':'tree';refreshTree();});
document.getElementById('searchTree')?.addEventListener('input',()=>{if(treeMode==='list')renderPersonList();});
document.getElementById('btnAddRoot')?.addEventListener('click',()=>{openPersonModal(null,data.rootId||null,'child');});
document.addEventListener('click',e=>{const menu=document.getElementById('contextMenu');if(menu&&!menu.classList.contains('hidden')&&!menu.contains(e.target)&&!e.target.closest('.person-card'))hideContextMenu();});
document.getElementById('btnResetStep1')?.addEventListener('click',()=>document.getElementById('resetConfirm')?.classList.remove('hidden'));
document.getElementById('btnResetFinal')?.addEventListener('click',()=>{
  if((document.getElementById('resetTyped')?.value||'')!=='RESET'){alert('Gõ đúng RESET');return;}
  TREE_KEYS.forEach(k=>localStorage.removeItem(k));localStorage.removeItem('giaPhaSeedVersion');
  data={people:{},rootId:null};seedIfEmpty();alert('Đã tải lại dữ liệu mẫu');showView('tree');
});
document.getElementById('btnGoHome')?.addEventListener('click',()=>showView('home'));
ensureTreeUI();loadTree();seedIfEmpty();showView('home');
window.GiaApp={showView,data,saveTree,seedIfEmpty,refreshTree};
})();
