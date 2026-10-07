(function(){
'use strict';
const TREE_KEY='giaPhaNguyenData_v4';
const TREE_KEYS=['giaPhaNguyenData_v4','giaPhaNguyenData_v3','giaPhaNguyenData_v2','giaPhaNguyenData_v1'];
let data={people:{},rootId:null}, currentView='home', treeMode='tree', contextTargetId=null, photoBase64=null, _uiBound=false, treeWriteUnlocked=false, adminTreeWriteSession=false;
let expandedNodes=new Set(['root','coc','lach','ngoc']);
function uid(){return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function loadTree(){for(const k of TREE_KEYS){try{const raw=localStorage.getItem(k);if(raw){const p=JSON.parse(raw);if(p&&p.people&&Object.keys(p.people).length){data=p;if(k!==TREE_KEY)localStorage.setItem(TREE_KEY,raw);return;}}}catch(e){}}}
function saveTree(){localStorage.setItem(TREE_KEY,JSON.stringify(data));}
function seedIfEmpty(){if(typeof window.GIA_TREE_SEED==='function'){const next=window.GIA_TREE_SEED(data,saveTree);if(next)data=next;return;}if(Object.keys(data.people||{}).length)return;data.people.root={id:'root',name:'Nguyễn Mường',gender:'male',birthDate:'',deathDate:'',deathAnniversary:'2/3',notes:'Cụ tổ đời 1',photo:null,children:[],spouses:[],sideBranches:[],isSide:false,isRoot:true,parentId:null,generation:1};data.rootId='root';saveTree();}
function showView(name){currentView=name;document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));const el=document.getElementById('view-'+name);if(el)el.classList.remove('hidden');document.querySelectorAll('.nav-item').forEach(b=>{const more=['calendar','rituals','data','about','account','admin'].includes(name);b.classList.toggle('active',b.dataset.nav===name||(more&&b.dataset.nav==='more'));});if(name==='tree')refreshTree();if(name==='home')renderHome();window.scrollTo(0,0);}
function renderHome(){const list=document.getElementById('homeEventsList');if(list)list.innerHTML='<p class="muted">Chào mừng dòng họ Nguyễn.</p>';const ai=document.getElementById('homeAiNews');if(ai)ai.textContent='🌿 Bản tin dòng họ – Uống nước nhớ nguồn.';const cal=document.getElementById('homeCalendarToday');if(cal){const d=new Date();cal.innerHTML='<p><strong>'+d.toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</strong></p>';}const morning=document.getElementById('morningText');if(morning)morning.textContent='Dòng họ Nguyễn – Uống nước nhớ nguồn.';document.getElementById('morningBanner')?.classList.remove('hidden');}
function getPerson(id){return data.people[id]||null;}
function hasTreeWriteRole(){
  const p=window.GiaCloud?.state?.profile||{};
  const role=String(p.role||p.family_role||p.member_role||'').toLowerCase().replace(/[\s_-]+/g,'');
  return !!window.GiaCloud?.state?.user && (
    window.GiaCloud?.isAdmin?.() === true || role==='admin' || role==='truongho' ||
    role==='quantri' || role==='manager' || role==='moderator' ||
    p.is_admin===true || p.isAdmin===true || p.tree_write===true ||
    p.treeWrite===true || p.can_edit_tree===true || p.can_manage_tree===true
  );
}
async function ensureTreeWriteAccess(options){
  options=options||{};
  const adminAuthorized=options.fromAdmin===true || adminTreeWriteSession===true;
  if(!window.GiaCloud?.state?.user && !adminAuthorized){
    await window.GiaDialog?.alert('Vui lòng đăng nhập tài khoản được cấp quyền quản trị gia phả.','Chế độ chỉ xem');
    return false;
  }
  if(!hasTreeWriteRole() && !adminAuthorized){
    await window.GiaDialog?.alert('Tài khoản này đang ở chế độ chỉ xem. Chỉ Admin, Trưởng họ hoặc tài khoản được cấp quyền mới được thêm, sửa, xóa thành viên.','Phân quyền gia phả');
    return false;
  }
  if(treeWriteUnlocked){
    if(adminAuthorized)adminTreeWriteSession=true;
    updateTreeAccessUI();
    return true;
  }
  if(adminAuthorized){
    adminTreeWriteSession=true;
    treeWriteUnlocked=true;
    updateTreeAccessUI();
    refreshTree();
    return true;
  }
  const pin=await window.GiaDialog?.prompt(
    'Nhập mã PIN quản trị để mở quyền chỉnh sửa Cây gia phả.',
    '',
    '🔐 Xác thực quản trị',
    'Mã PIN quản trị'
  );
  if(pin==null)return false;
  const ok=window.GiaAdminAuth?.verifyPin ? window.GiaAdminAuth.verifyPin(pin) : String(pin)==='482916';
  if(!ok){
    await window.GiaDialog?.alert('Mã PIN không đúng. Cây gia phả vẫn ở chế độ chỉ xem.','Từ chối truy cập');
    return false;
  }
  treeWriteUnlocked=true;
  if(adminAuthorized)adminTreeWriteSession=true;
  updateTreeAccessUI();
  refreshTree();
  return true;
}
function lockTreeEditing(){treeWriteUnlocked=false;adminTreeWriteSession=false;hideContextMenu();closePersonModal();updateTreeAccessUI();}
function updateTreeAccessUI(){
  const add=document.getElementById('btnAddRoot');
  const mode=document.getElementById('treeAccessMode');
  const writable=hasTreeWriteRole() || adminTreeWriteSession;
  if(add)add.classList.toggle('hidden',!writable || !treeWriteUnlocked);
  if(mode){
    const active=treeWriteUnlocked&&(writable||adminTreeWriteSession);
    mode.textContent=active?'🔒 Khóa lại':'👁️ Chỉ xem';
    mode.classList.toggle('write',active);
    mode.title=treeWriteUnlocked&&writable?'Khóa chế độ chỉnh sửa':'Bấm để xác thực quyền chỉnh sửa';
  }
  const menu=document.getElementById('contextMenu');
  if(menu&&!writable&&!adminTreeWriteSession)menu.classList.add('hidden');
}
function refreshTree(){if(treeMode==='list')renderPersonList();else renderTree();}

function renderTree(){
  updateTreeAccessUI();
  const container=document.getElementById('treeRoot'),empty=document.getElementById('emptyState');
  if(!container)return;
  document.getElementById('treeView')?.classList.remove('hidden');
  document.getElementById('listView')?.classList.add('hidden');
  if(!data.rootId||!data.people[data.rootId]){container.innerHTML='';empty?.classList.remove('hidden');return;}
  empty?.classList.add('hidden');
  let hint=document.getElementById('treeScrollHint');
  if(!hint){
    hint=document.createElement('p');hint.id='treeScrollHint';hint.className='tree-hint';
    hint.textContent=treeWriteUnlocked&&(hasTreeWriteRole()||adminTreeWriteSession)?'📜 Chế độ chỉnh sửa · Vuốt ngang · Bấm ▼ mở nhánh · Bấm tên để sửa':'📜 Chế độ chỉ xem · Vuốt ngang · Bấm ▼ mở nhánh';
    document.getElementById('treeView')?.insertBefore(hint, container);
  } else {
    hint.textContent=treeWriteUnlocked&&(hasTreeWriteRole()||adminTreeWriteSession)?'📜 Chế độ chỉnh sửa · Vuốt ngang · Bấm ▼ mở nhánh · Bấm tên để sửa':'📜 Chế độ chỉ xem · Vuốt ngang · Bấm ▼ mở nhánh';
  }
  container.innerHTML='';
  container.className='tree org-tree';
  expandedNodes.add(data.rootId);
  container.appendChild(renderNode(data.rootId, 0));
}

function renderNode(id, depth){
  depth = depth || 0;
  const p=getPerson(id);if(!p)return document.createTextNode('');
  const wrap=document.createElement('div');
  wrap.className='org-node'+(depth===1?' org-branch':'');
  if(depth===1 && p.branchLabel){
    const bl=document.createElement('div');
    bl.className='org-branch-label';
    bl.textContent=p.branchLabel;
    wrap.appendChild(bl);
  }
  wrap.appendChild(createCard(p));
  const kids=[...(p.children||[]),...(p.sideBranches||[])];
  if(kids.length){
    if(depth===0) expandedNodes.add(id);
    if(depth===1 && !expandedNodes.has('__init_'+id)){ expandedNodes.add(id); expandedNodes.add('__init_'+id); }
    const isOpen = expandedNodes.has(id);
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='org-toggle'+(isOpen?' open':'');
    toggle.textContent=isOpen?('▲ Thu ('+kids.length+')'):('▼ '+kids.length+' con');
    toggle.addEventListener('click', function(e){
      e.stopPropagation();
      if(expandedNodes.has(id)) expandedNodes.delete(id);
      else expandedNodes.add(id);
      refreshTree();
    });
    wrap.appendChild(toggle);
    if(isOpen){
      const row=document.createElement('div');
      row.className='org-children'+(kids.length>1?' multi':'')+(depth===0?' root-row':'');
      kids.forEach(cid => row.appendChild(renderNode(cid, depth+1)));
      wrap.appendChild(row);
    }
  }
  return wrap;
}

function createCard(p){
  const card=document.createElement('div');
  card.className='person-card '+(p.gender||'male');
  if(p.isRoot||p.id===data.rootId)card.classList.add('root-card');
  if(p.gender==='female')card.classList.add('female');
  card.dataset.id=p.id;
  card.style.cursor=treeWriteUnlocked&&(hasTreeWriteRole()||adminTreeWriteSession)?'pointer':'default';
  if(p.isRoot||p.id===data.rootId){
    const b=document.createElement('div');b.className='root-badge';b.textContent='CỤ TỔ ĐỜI 1';card.appendChild(b);
  } else if(p.generation){
    const g=document.createElement('div');g.className='gen-badge';g.textContent='Đời '+p.generation;card.appendChild(g);
  }
  if(p.photo){const img=document.createElement('img');img.className='photo';img.src=p.photo;card.appendChild(img);}
  const name=document.createElement('div');name.className='name';name.textContent=p.name;card.appendChild(name);
  if(p.deathAnniversary){const g=document.createElement('div');g.className='gio-date';g.textContent='📅 '+p.deathAnniversary;card.appendChild(g);}
  card.addEventListener('click',function(e){e.stopPropagation();if(treeWriteUnlocked&&(hasTreeWriteRole()||adminTreeWriteSession))showContextMenu(e,p.id);});
  return card;
}

function renderPersonList(){document.getElementById('treeView')?.classList.add('hidden');document.getElementById('listView')?.classList.remove('hidden');const q=(document.getElementById('searchTree')?.value||'').toLowerCase();const list=document.getElementById('personList');if(!list)return;let people=Object.values(data.people);if(q)people=people.filter(p=>(p.name||'').toLowerCase().includes(q));people.sort((a,b)=>(a.name||'').localeCompare(b.name||'','vi'));list.innerHTML=people.map(p=>{let meta=[p.deathAnniversary?'Giỗ: '+p.deathAnniversary:''].filter(Boolean).join(' · ');if(p.id===data.rootId)meta='CỤ TỔ ĐỜI 1'+(meta?' · '+meta:'');else if(p.generation)meta='Đời '+p.generation+(meta?' · '+meta:'');return '<div class="list-item" data-id="'+p.id+'"><div class="info"><div class="name">'+esc(p.name)+'</div><div class="meta">'+esc(meta)+'</div></div>';}).join('');list.querySelectorAll('.list-item').forEach(item=>{item.style.cursor='pointer';item.onclick=function(e){if(treeWriteUnlocked&&(hasTreeWriteRole()||adminTreeWriteSession))showContextMenu(e,item.dataset.id);};});}

function ensureTreeUI(){if(!document.getElementById('contextMenu')){const m=document.createElement('div');m.id='contextMenu';m.className='context-menu hidden';m.innerHTML='<div class="context-menu-head"><strong>Thành viên</strong><button type="button" class="context-menu-close" aria-label="Đóng">×</button></div><button type="button" data-action="edit">✏️ Sửa</button><button type="button" data-action="addChild">➕ Thêm con</button><button type="button" data-action="addSpouse">💍 Vợ/Chồng</button><button type="button" data-action="addSide">🌿 Nhánh phụ</button><button type="button" data-action="delete" class="danger">🗑️ Xóa</button>';document.body.appendChild(m);}if(!document.getElementById('personModal')){const modal=document.createElement('div');modal.id='personModal';modal.className='modal hidden';modal.innerHTML='<div class="modal-content"><div class="modal-header"><h2 id="modalTitle">Thành viên</h2><button type="button" class="modal-close" id="btnCloseModal">×</button></div><form id="personForm"><input type="hidden" id="personId"/><input type="hidden" id="parentId"/><input type="hidden" id="relationType"/><div class="form-row"><label>Họ và tên *</label><input type="text" id="fullName" required/></div><div class="form-row two-cols"><div><label>Giới tính</label><select id="gender"><option value="male">Nam</option><option value="female">Nữ</option></select></div><div><label>Quan hệ</label><select id="relationSelect"><option value="child">Con</option><option value="spouse">Vợ/Chồng</option><option value="side">Nhánh phụ</option></select></div></div><div class="form-row two-cols"><div><label>Ngày sinh</label><input type="text" id="birthDate"/></div><div><label>Ngày mất</label><input type="text" id="deathDate"/></div></div><div class="form-row"><label>📅 Ngày giỗ</label><input type="text" id="deathAnniversary"/></div><div class="form-row"><label>Ghi chú</label><textarea id="notes" rows="2"></textarea></div><div class="form-row"><label>Ảnh</label><div class="photo-upload"><img id="photoPreview" class="photo-preview hidden" alt=""/><input type="file" id="photoInput" accept="image/*"/><button type="button" id="btnRemovePhoto" class="btn btn-small hidden">Xóa ảnh</button></div></div><div class="form-actions"><button type="button" class="btn btn-secondary" id="btnCancel">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form></div>';document.body.appendChild(modal);}if(!_uiBound){_uiBound=true;document.getElementById('contextMenu').addEventListener('click',e=>{if(e.target.closest('.context-menu-close')){hideContextMenu();return;}const btn=e.target.closest('[data-action]');if(!btn||!contextTargetId)return;const action=btn.dataset.action,id=contextTargetId;hideContextMenu();if(action==='edit')openPersonModal(id);else if(action==='addChild')openPersonModal(null,id,'child');else if(action==='addSpouse')openPersonModal(null,id,'spouse');else if(action==='addSide')openPersonModal(null,id,'side');else if(action==='delete')deletePerson(id);});document.getElementById('btnCloseModal').addEventListener('click',closePersonModal);document.addEventListener('click',function(e){const menu=document.getElementById('contextMenu');if(menu&&!menu.classList.contains('hidden')&&!menu.contains(e.target)&&!e.target.closest('.person-card,.list-item'))hideContextMenu();});document.addEventListener('keydown',function(e){if(e.key==='Escape')hideContextMenu();});document.getElementById('btnCancel').addEventListener('click',closePersonModal);document.getElementById('personForm').addEventListener('submit',savePerson);document.getElementById('photoInput').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{photoBase64=reader.result;const prev=document.getElementById('photoPreview');if(prev){prev.src=photoBase64;prev.classList.remove('hidden');}document.getElementById('btnRemovePhoto')?.classList.remove('hidden');};reader.readAsDataURL(f);});document.getElementById('btnRemovePhoto')?.addEventListener('click',()=>{photoBase64=null;document.getElementById('photoPreview')?.classList.add('hidden');document.getElementById('btnRemovePhoto')?.classList.add('hidden');});}}
async function showContextMenu(e,id){if(!await ensureTreeWriteAccess())return;ensureTreeUI();contextTargetId=id;const menu=document.getElementById('contextMenu');menu.classList.remove('hidden');menu.style.visibility='hidden';menu.style.left='0px';menu.style.top='0px';const target=e?.currentTarget?.getBoundingClientRect?.()||null;const x=(target?target.left+target.width/2:(e?.clientX||window.innerWidth/2));const y=(target?target.top+target.height:(e?.clientY||window.innerHeight/2));requestAnimationFrame(()=>{const r=menu.getBoundingClientRect(),gap=8;let left=x-r.width/2;let top=y+gap;if(top+r.height>window.innerHeight-8)top=(target?target.top-r.height-gap:y-r.height-gap);left=Math.max(8,Math.min(left,window.innerWidth-r.width-8));top=Math.max(8,Math.min(top,window.innerHeight-r.height-8));menu.style.left=Math.round(left)+'px';menu.style.top=Math.round(top)+'px';menu.style.visibility='visible';});}
function hideContextMenu(){document.getElementById('contextMenu')?.classList.add('hidden');contextTargetId=null;}
async function openPersonModal(editId,parentId,relationType){if(!treeWriteUnlocked||( !hasTreeWriteRole()&&!adminTreeWriteSession)){if(!await ensureTreeWriteAccess())return;}ensureTreeUI();const modal=document.getElementById('personModal');photoBase64=null;document.getElementById('personId').value=editId||'';document.getElementById('parentId').value=parentId||'';document.getElementById('relationType').value=relationType||'child';document.getElementById('modalTitle').textContent=editId?'Sửa thành viên':'Thêm thành viên';const p=editId?getPerson(editId):null;document.getElementById('fullName').value=p?p.name:'';document.getElementById('gender').value=p?(p.gender||'male'):'male';document.getElementById('birthDate').value=p?(p.birthDate||''):'';document.getElementById('deathDate').value=p?(p.deathDate||''):'';document.getElementById('deathAnniversary').value=p?(p.deathAnniversary||''):'';document.getElementById('notes').value=p?(p.notes||''):'';const prev=document.getElementById('photoPreview');if(p&&p.photo){prev.src=p.photo;prev.classList.remove('hidden');document.getElementById('btnRemovePhoto')?.classList.remove('hidden');photoBase64=p.photo;}else{prev?.classList.add('hidden');document.getElementById('btnRemovePhoto')?.classList.add('hidden');}modal.classList.remove('hidden');}
function closePersonModal(){document.getElementById('personModal')?.classList.add('hidden');}
async function savePerson(e){e.preventDefault();if(!await ensureTreeWriteAccess())return;const name=(document.getElementById('fullName').value||'').trim();if(!name){window.GiaDialog?.alert('Vui lòng nhập họ và tên.','Thành viên dòng họ');return;}const editId=document.getElementById('personId').value;const parentId=document.getElementById('parentId').value;const relation=document.getElementById('relationType').value||'child';const fields={name,gender:document.getElementById('gender').value||'male',birthDate:document.getElementById('birthDate').value||'',deathDate:document.getElementById('deathDate').value||'',deathAnniversary:document.getElementById('deathAnniversary').value||'',notes:document.getElementById('notes').value||'',photo:photoBase64};if(editId&&data.people[editId]){Object.assign(data.people[editId],fields);}else{const id=uid();data.people[id]={id,...fields,children:[],spouses:[],sideBranches:[],isSide:relation==='side',isRoot:false,parentId:parentId||null};if(!data.rootId){data.rootId=id;data.people[id].isRoot=true;}else if(parentId&&data.people[parentId]){if(relation==='spouse'){if(!data.people[parentId].spouses.includes(id))data.people[parentId].spouses.push(id);if(!data.people[id].spouses.includes(parentId))data.people[id].spouses.push(parentId);}else if(relation==='side'){if(!data.people[parentId].sideBranches.includes(id))data.people[parentId].sideBranches.push(id);}else{data.people[id].parentId=parentId;if(!data.people[parentId].children.includes(id))data.people[parentId].children.push(id);}}}window.GiaAdminLog?.record(editId?'Sửa thành viên':'Thêm thành viên',name);saveTree();closePersonModal();refreshTree();}
async function deletePerson(id){if(!await ensureTreeWriteAccess())return;const p=getPerson(id);if(!p)return;if(p.id===data.rootId){await window.GiaDialog?.alert('Không thể xóa Cụ Tổ.','Gia Phả Họ Nguyễn');return;}if(!(await window.GiaDialog?.confirm('Xóa '+p.name+' khỏi cây gia phả?','Xóa thành viên')))return;Object.values(data.people).forEach(x=>{x.children=(x.children||[]).filter(c=>c!==id);x.spouses=(x.spouses||[]).filter(c=>c!==id);x.sideBranches=(x.sideBranches||[]).filter(c=>c!==id);});delete data.people[id];window.GiaAdminLog?.record('Xóa thành viên',p.name);saveTree();refreshTree();}

document.getElementById('btnCloseMorning')?.addEventListener('click',()=>document.getElementById('morningBanner')?.classList.add('hidden'));
document.getElementById('btnToggleView')?.addEventListener('click',()=>{treeMode=treeMode==='tree'?'list':'tree';refreshTree();});
document.getElementById('searchTree')?.addEventListener('input',()=>{if(treeMode==='list')renderPersonList();});
document.getElementById('btnAddRoot')?.addEventListener('click',async()=>{if(await ensureTreeWriteAccess())openPersonModal(null,data.rootId||null,'child');});
document.addEventListener('click',e=>{const menu=document.getElementById('contextMenu');if(menu&&!menu.classList.contains('hidden')&&!menu.contains(e.target)&&!e.target.closest('.person-card'))hideContextMenu();});
document.getElementById('btnResetStep1')?.addEventListener('click',()=>document.getElementById('resetConfirm')?.classList.remove('hidden'));
document.getElementById('btnResetFinal')?.addEventListener('click',async()=>{if((document.getElementById('resetTyped')?.value||'')!=='RESET'){await window.GiaDialog?.alert('Vui lòng gõ đúng chữ RESET để xác nhận.','Xác nhận đặt lại dữ liệu');return;}TREE_KEYS.forEach(k=>localStorage.removeItem(k));localStorage.removeItem('giaPhaSeedVersion');data={people:{},rootId:null};expandedNodes=new Set(['root','coc','lach','ngoc']);seedIfEmpty();await window.GiaDialog?.alert('Đã tải lại cây theo sơ đồ.','Gia Phả Họ Nguyễn');showView('tree');});
document.getElementById('btnGoHome')?.addEventListener('click',()=>showView('home'));
window.addEventListener('gia-auth-changed',()=>{lockTreeEditing();});
window.addEventListener('gia-profile-changed',()=>{if(!adminTreeWriteSession){treeWriteUnlocked=false;updateTreeAccessUI();}});
document.getElementById('treeAccessMode')?.addEventListener('click',async()=>{if(treeWriteUnlocked){lockTreeEditing();return;}await ensureTreeWriteAccess();});
ensureTreeUI();loadTree();seedIfEmpty();showView('home');
window.GiaApp={showView,data,saveTree,seedIfEmpty,refreshTree,requestTreeWriteAccess:ensureTreeWriteAccess,
    authorizeTreeFromAdmin:()=>ensureTreeWriteAccess({fromAdmin:true}),lockTreeEditing,isTreeWriteUnlocked:()=>!!treeWriteUnlocked,isAdminTreeWriteSession:()=>!!adminTreeWriteSession};
})();
