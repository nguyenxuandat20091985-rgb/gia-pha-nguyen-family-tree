/* Unified Admin console for Gia Phả Họ Nguyễn. */
(function(){
'use strict';
const LOG_KEY='giaPhaAdminActivity_v1', REQ_KEY='giaPhaAdminRequests_v1', TREE_KEY='giaPhaNguyenData_v4';
let unlocked=false, activeTab='overview';
const esc=s=>{const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;};
const load=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch(e){return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function record(action,detail){const rows=load(LOG_KEY,[]);rows.unshift({id:'log_'+Date.now().toString(36),time:new Date().toISOString(),action,detail:detail||'',actor:window.GiaCloud?.state?.profile?.display_name||window.GiaCloud?.state?.user?.email||'Quản trị viên'});save(LOG_KEY,rows.slice(0,300));}
window.GiaAdminLog={record,read:()=>load(LOG_KEY,[])};
function ensureMenu(){
 const more=document.querySelector('#view-more .more-menu'); if(!more)return;
 let btn=document.getElementById('btnAdminMenu');
 if(!btn){btn=document.createElement('button');btn.type='button';btn.id='btnAdminMenu';btn.className='more-item admin-menu-item';btn.dataset.nav='admin';btn.innerHTML='🛡️ <span>Admin</span><small>Quản trị hệ thống</small>';more.insertBefore(btn,more.firstChild);}
 btn.onclick=()=>openGate();
}
function ensureView(){
 let v=document.getElementById('view-admin'); if(v)return v;
 v=document.createElement('section');v.id='view-admin';v.className='view hidden';
 v.innerHTML='<div class="admin-shell">'+
 '<div class="admin-hero"><div class="admin-hero-icon">🛡️</div><div><span>TRUNG TÂM QUẢN TRỊ</span><h2>Gia Phả Họ Nguyễn</h2></div><button type="button" id="adminLock" class="admin-lock">🔒 Khóa</button></div>'+
 '<div class="admin-status" id="adminStatus"></div>'+
 '<div class="admin-dashboard-grid" id="adminDashboardGrid"><button type="button" class="admin-dashboard-card" data-tab="overview"><span class="admin-card-icon">📊</span><span class="admin-card-copy"><b>Tổng quan</b><small>Trạng thái hệ thống</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="roles"><span class="admin-card-icon">🛡️</span><span class="admin-card-copy"><b>Phân quyền</b><small>Admin → Trưởng họ → Thành viên</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="members"><span class="admin-card-icon">👥</span><span class="admin-card-copy"><b>Thành viên & Duyệt</b><small>Phê duyệt yêu cầu</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="tree"><span class="admin-card-icon">🌳</span><span class="admin-card-copy"><b>Sửa cây gia phả</b><small>Quản lý các nhánh</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="data"><span class="admin-card-icon">💾</span><span class="admin-card-copy"><b>Dữ liệu gia phả</b><small>Sao lưu & khôi phục</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="logs"><span class="admin-card-icon">📜</span><span class="admin-card-copy"><b>Nhật ký hoạt động</b><small>Lịch sử thay đổi</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="ai"><span class="admin-card-icon">🤖</span><span class="admin-card-copy"><b>AI Admin</b><small>Giám sát & cảnh báo</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="registered"><span class="admin-card-icon">👥</span><span class="admin-card-copy"><b>Danh sách thành viên đăng ký</b><small>Theo dõi thành viên</small></span><span class="admin-card-arrow">›</span></button></div><div id="adminBody"></div></div>';
 document.getElementById('mainContent')?.appendChild(v);
 v.querySelectorAll('[data-tab]').forEach(b=>{const activate=e=>{e.preventDefault();e.stopPropagation();activeTab=b.dataset.tab;renderTab();requestAnimationFrame(()=>document.getElementById('adminBody')?.scrollIntoView({behavior:'smooth',block:'start'}));};b.onclick=activate;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){activate(e);}};});
 document.getElementById('adminLock').onclick=()=>{unlocked=false;window.GiaApp?.lockTreeEditing?.();closeAdmin();};
 v.onclick=(e)=>{
   const tab=e.target.closest?.('[data-tab]');
   if(tab && v.contains(tab)){e.preventDefault();e.stopPropagation();activeTab=tab.dataset.tab;renderTab();return;}
   const go=e.target.closest?.('[data-go]');
   if(go && v.contains(go)){e.preventDefault();e.stopPropagation();activeTab=go.dataset.go;renderTab();}
 };
 return v;
}
async function pinGate(){
 if(unlocked)return true;
 const pin=await window.GiaDialog?.prompt('Nhập mã PIN/Mật khẩu quản trị để mở Trung tâm Admin.','','🔐 Xác thực Admin','Mã PIN / Mật khẩu');
 if(pin==null)return false;
 const ok=window.GiaAdminAuth?.verifyPin?window.GiaAdminAuth.verifyPin(pin):String(pin)==='482916';
 if(!ok){await window.GiaDialog?.alert('Mã PIN không đúng.','Từ chối truy cập');return false;}
 unlocked=true; window.GiaCloud?.claimOwner?.(); record('Đăng nhập Admin','Mở Trung tâm quản trị'); return true;
}
async function openGate(){if(!(await pinGate()))return;const v=ensureView();document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));v.classList.remove('hidden');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav==='more'));renderTab();window.scrollTo(0,0);}
function closeAdmin(){document.getElementById('view-admin')?.classList.add('hidden');window.GiaApp?.showView('home');}
function setStatus(){
 const p=window.GiaCloud?.state?.profile||{};
 const email=(window.GiaCloud?.state?.user?.email||p.email||'').trim().toLowerCase();
 const tech=window.GiaCloud?.isTechAdmin?.()===true||email==='nguyenxuandat20091985@gmail.com'||window.GiaCloud?.isOwner?.()===true;
 const role=tech?'tech_admin':(p.role==='truongho'?'truongho':'member');
 const el=document.getElementById('adminStatus');
 if(el)el.innerHTML='<span>🔐 Đã xác thực</span><b>'+esc(p.display_name||'Quản trị viên')+'</b><em>'+esc(role==='tech_admin'?'🛡️ Admin':role==='truongho'?'🏮 Trưởng họ':'👁️ Thành viên')+'</em>';
}
function renderTab(){if(!unlocked)return;setStatus();const v=ensureView();v.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===activeTab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});const body=document.getElementById('adminBody');if(!body)return;body.classList.remove('admin-content-enter');void body.offsetWidth;body.classList.add('admin-content-enter');({overview:renderOverview,roles:renderRoles,members:renderMembers,tree:renderTreeAdmin,data:renderData,logs:renderLogs,ai:renderAIAdmin,registered:renderRegisteredMembers}[activeTab]||renderOverview)(body);}

async function renderRegisteredMembers(box){
 const me=window.GiaCloud?.state?.profile||{};
 const can=window.GiaCloud?.isTechAdmin?.()===true||window.GiaCloud?.isTruongHo?.()===true;
 if(!can){box.innerHTML='<div class="admin-card"><h3>👥 Danh sách thành viên đăng ký</h3><p class="warn-text">Bạn không có quyền xem danh sách quản trị.</p></div>';return;}
 box.innerHTML='<div class="admin-card"><h3>👥 Danh sách thành viên đăng ký</h3><p class="muted">Theo dõi các tài khoản đã đăng ký vào dòng họ.</p><div class="admin-member-filters"><input id="memberSearch" type="search" placeholder="Tìm tên, Gmail hoặc số điện thoại…"><select id="memberStatusFilter"><option value="">Tất cả trạng thái</option><option value="approved">Đã duyệt</option><option value="pending">Chờ duyệt</option><option value="rejected">Từ chối</option></select></div><div id="registeredList">Đang tải…</div></div>';
 const list=box.querySelector('#registeredList'), search=box.querySelector('#memberSearch'), filter=box.querySelector('#memberStatusFilter');
 let rows=[];
 try{rows=await window.GiaCloud.listMembers()||[];}catch(e){list.innerHTML='<p class="warn-text">'+esc(e?.message||e)+'</p>';return;}
 const paint=()=>{
  const q=String(search.value||'').trim().toLowerCase(), st=filter.value;
  const filtered=rows.filter(m=>{const hay=[m.display_name,m.email,m.phone,m.role,m.family_role].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!st||(m.status||'pending')===st);});
  list.innerHTML='<div class="admin-stat-grid"><div><strong>'+filtered.length+'</strong><span>Đang hiển thị</span></div><div><strong>'+rows.filter(x=>(x.status||'pending')==='approved').length+'</strong><span>Đã duyệt</span></div><div><strong>'+rows.filter(x=>(x.status||'pending')==='pending').length+'</strong><span>Chờ duyệt</span></div><div><strong>'+rows.filter(x=>(x.status||'pending')==='rejected').length+'</strong><span>Từ chối</span></div></div>';
  list.innerHTML+='<div class="admin-role-list">'+(filtered.length?filtered.map(m=>{const role=m.family_role||m.role||'member';const status=m.status||'pending';const label=status==='approved'?'Đã duyệt':status==='rejected'?'Từ chối':'Chờ duyệt';const roleLabel=role==='admin'?'🛡️ Admin':role==='truongho'?'🏮 Trưởng họ':'👁️ Thành viên';return '<div class="admin-member-card"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc((m.display_name||'?').charAt(0).toUpperCase())+'</div><div><strong>'+esc(m.display_name||'Chưa đặt tên')+'</strong><div class="muted">'+esc(m.email||m.phone||'Gmail chưa được hiển thị')+'</div></div></div><span class="admin-role '+(role==='truongho'?'truongho':role==='admin'?'tech_admin':'member')+'">'+roleLabel+'</span></div><div class="admin-member-meta"><span class="badge '+(status==='approved'?'badge-ok':status==='rejected'?'badge-no':'badge-wait')+'">'+label+'</span><small>'+esc(m.created_at?new Date(m.created_at).toLocaleDateString('vi-VN'):'')+'</small></div></div>';}).join(''):'<p class="muted admin-empty-hint">Không có thành viên phù hợp.</p>')+'</div>';
 };
 search.oninput=paint;filter.onchange=paint;paint();
}
async function renderAIAdmin(box){
 const rows=(()=>{try{return window.GiaCloud?.listMembers?window.GiaCloud.listMembers():Promise.resolve([]);}catch(_){return Promise.resolve([]);}})();
 const people=load(TREE_KEY,{people:{}}).people||{}, logs=load(LOG_KEY,[]);
 const members=await rows;
 const pending=members.filter(m=>(m.status||'pending')==='pending').length;
 const approved=members.filter(m=>(m.status||'pending')==='approved').length;
 const findings=[];
 if(pending) findings.push({level:'high',text:'Có '+pending+' tài khoản đang chờ duyệt.'});
 if(!approved) findings.push({level:'info',text:'Chưa có thành viên nào được duyệt ngoài tài khoản Admin.'});
 const names=Object.values(people).map(x=>String(x.name||'').trim().toLowerCase()).filter(Boolean), dup=names.filter((n,i,a)=>a.indexOf(n)!==i);
 if(dup.length) findings.push({level:'medium',text:'Phát hiện tên có khả năng trùng trong dữ liệu cây gia phả.'});
 if(logs.length>250) findings.push({level:'info',text:'Nhật ký Admin đang gần giới hạn lưu cục bộ 300 dòng.'});
 box.innerHTML='<div class="admin-card"><h3>🤖 AI Admin</h3><p class="muted">AI giám sát dữ liệu và đưa ra cảnh báo. Không tự cấp/thu hồi quyền Admin hoặc Trưởng họ.</p><div class="admin-stat-grid"><div><strong>'+members.length+'</strong><span>Tài khoản</span></div><div><strong>'+pending+'</strong><span>Chờ duyệt</span></div><div><strong>'+approved+'</strong><span>Đã duyệt</span></div><div><strong>'+findings.length+'</strong><span>Cảnh báo</span></div></div><div class="admin-card"><h3>🔎 Phân tích hiện tại</h3>'+(findings.length?findings.map(f=>'<div class="admin-note">'+(f.level==='high'?'🚨':f.level==='medium'?'⚠️':'ℹ️')+' '+esc(f.text)+'</div>').join(''):'<div class="admin-note">✅ Chưa phát hiện vấn đề nổi bật.</div>')+'</div><div class="admin-note">🔐 Nguyên tắc: <b>AI phát hiện → phân tích → đề xuất → Admin xác nhận</b>.</div></div>';
}
function renderOverview(box){const people=load(TREE_KEY,{people:{}}).people||{};const logs=load(LOG_KEY,[]);const req=load(REQ_KEY,[]).filter(x=>x.status==='pending');const cloud=window.GiaCloud;box.innerHTML='<div class="admin-stat-grid"><div><strong>'+Object.keys(people).length+'</strong><span>Thành viên cây</span></div><div><strong>'+logs.length+'</strong><span>Nhật ký</span></div><div><strong>'+req.length+'</strong><span>Yêu cầu chờ xử lý</span></div><div><strong>'+(cloud?.state?.user?'Đã đăng nhập':'Chưa đăng nhập')+'</strong><span>Tài khoản hiện tại</span></div></div><div class="admin-card"><h3>⚡ Thao tác nhanh</h3><div class="admin-quick"><button data-go="roles">🛡️ Phân quyền</button><button data-go="members">👥 Duyệt thành viên</button><button data-go="tree">🌳 Mở trình sửa cây</button><button data-go="logs">📜 Xem nhật ký</button></div></div><div class="admin-note">ℹ️ <b>Quy tắc:</b> Admin → cấp <b>Trưởng họ</b> → Trưởng họ duyệt <b>Thành viên liên quan</b>.</div>';
 box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.go;renderTab();});}
async function renderRoles(box){
 const OWNER_EMAIL='nguyenxuandat20091985@gmail.com';
 const meId=String(window.GiaCloud?.state?.user?.id||window.GiaCloud?.state?.user?.sub||'');
 const meEmail=(window.GiaCloud?.state?.user?.email||window.GiaCloud?.state?.profile?.email||'').trim().toLowerCase();
 const meName=window.GiaCloud?.state?.profile?.display_name||'dat nguyen';
 const isTech=window.GiaCloud?.isTechAdmin?.()===true||window.GiaCloud?.isOwner?.()===true||meEmail===OWNER_EMAIL;
 const myRole=isTech?'tech_admin':((window.GiaCloud?.state?.profile?.family_role||window.GiaCloud?.state?.profile?.role)||'member');
 const canGrantTH=isTech;
 const canManage=isTech||myRole==='truongho';
 box.innerHTML='<div class="admin-card admin-roles-card"><h3>🛡️ Phân quyền</h3><p class="admin-roles-one-line muted">🛡️ Admin → 🏮 Trưởng họ → 👁️ Thành viên · Chờ duyệt cần phê duyệt</p><div style="margin:12px 0"><button type="button" id="btnAddMemberPermission" class="admin-permission">➕ Thêm tên + Gmail</button></div><div id="roleList" class="admin-role-list">Đang tải danh sách…</div></div>';
 const list=box.querySelector('#roleList');
 const addBtn=box.querySelector('#btnAddMemberPermission');
 const paint=async()=>{
  let rows=[]; let errMsg='';
  try{ if(window.GiaCloud?.listMembers){ rows=await window.GiaCloud.listMembers()||[]; } else { errMsg='Chưa kết nối Supabase / GiaCloud.'; } }catch(e){ errMsg=String(e?.message||e); rows=[]; }
  const isOwnerRow=m=>{ const em=String(m.email||'').trim().toLowerCase(); return !!m.is_tech_admin || em===OWNER_EMAIL || (String(m.id)===meId && isTech); };
  const ownerFromDb=rows.find(isOwnerRow);
  const ownerName=ownerFromDb?.display_name||meName||'dat nguyen';
  const ownerEmail=ownerFromDb?.email||OWNER_EMAIL;
  let html='<div class="admin-member-card admin-member-owner"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc((ownerName||'C').charAt(0).toUpperCase())+'</div><div><strong>'+esc(ownerName)+'</strong><div class="muted">'+esc(ownerEmail)+'</div></div></div><span class="admin-role tech_admin">🛡️ Admin</span></div><p class="admin-owner-lock">🔒 Bảo vệ</p><div class="admin-member-meta"><span class="badge badge-ok">Đã duyệt</span><small>🔒 Bảo vệ</small></div></div>';
  if(errMsg && !rows.length){ html+='<p class="warn-text" style="margin:10px 0">'+esc(errMsg)+'</p>'; list.innerHTML=html; return; }
  const others=rows.filter(m=>!isOwnerRow(m));
  const truong=others.filter(m=>(m.family_role||m.role||'')==='truongho');
  const pending=others.filter(m=>{ const st=m.status||'pending'; return st==='pending'||st==='rejected'; });
  const related=others.filter(m=>(m.family_role||m.role||'member')!=='truongho' && (m.status||'pending')==='approved');
  const card=(m)=>{
   const role=m.family_role||m.role||'member'; const isTH=role==='truongho'; const st=m.status||'pending';
   const stL=st==='approved'?'Đã duyệt':st==='rejected'?'Từ chối':'Chờ duyệt';
   const stC=st==='approved'?'badge-ok':st==='rejected'?'badge-no':'badge-wait';
   const name=m.display_name||'Chưa đặt tên'; const id=String(m.id); const contact=m.email||m.phone||id;
   let acts='';
   if(canGrantTH){
    if(st!=='approved') acts+='<button type="button" class="admin-permission admin-btn-approve" data-act="approve" data-id="'+esc(id)+'">✅ Duyệt tài khoản</button>';
    acts+='<button type="button" class="admin-permission '+(isTH?'active':'')+'" data-act="role" data-role="truongho" data-id="'+esc(id)+'">🏮 Cấp Trưởng họ</button>';
    acts+='<button type="button" class="admin-permission '+(!isTH && st==='approved'?'active':'')+'" data-act="role" data-role="member" data-id="'+esc(id)+'">👁️ Thành viên liên quan</button>';
   } else if(canManage){
    if(st!=='approved') acts+='<button type="button" class="admin-permission admin-btn-approve" data-act="approve" data-id="'+esc(id)+'">✅ Duyệt tài khoản</button>';
    if(isTH) acts+='<p class="admin-action-hint muted">Không đổi được quyền Trưởng họ (chỉ Admin).</p>';
    else acts+='<button type="button" class="admin-permission '+(st==='approved'?'active':'')+'" data-act="role" data-role="member" data-id="'+esc(id)+'">👁️ Thành viên liên quan</button>';
   } else acts='<p class="admin-action-hint muted">Bạn không có quyền thao tác.</p>';
   return '<div class="admin-member-card" data-id="'+esc(id)+'"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc(name.charAt(0).toUpperCase())+'</div><div><strong>'+esc(name)+'</strong><div class="muted">'+esc(contact)+'</div></div></div><span class="admin-role '+(isTH?'truongho':'member')+'">'+(isTH?'🏮 Trưởng họ':'👁️ Thành viên liên quan')+'</span></div><div class="admin-permission-switches">'+acts+'</div><div class="admin-member-meta"><span class="badge '+stC+'">'+stL+'</span></div></div>';
  };
  html+='<div class="admin-role-section"><h4 class="admin-role-section-title">🏮 Trưởng họ <small>('+truong.length+')</small></h4>';
  html+=truong.length?truong.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có</p>';
  html+='</div><div class="admin-role-section"><h4 class="admin-role-section-title">👁️ Thành viên liên quan <small>('+related.length+')</small></h4>';
  html+=related.length?related.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có</p>';
  html+='</div><div class="admin-role-section"><h4 class="admin-role-section-title">⏳ Chờ duyệt / từ chối <small>('+pending.length+')</small></h4>';
  html+=pending.length?pending.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có yêu cầu</p>';
  html+='</div>';
  list.innerHTML=html;
  list.querySelectorAll('[data-act]').forEach(btn=>{
   btn.onclick=async(ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    const id=btn.dataset.id, act=btn.dataset.act;
    const target=rows.find(x=>String(x.id)===String(id));
    if(!target){ await window.GiaDialog?.alert('Không tìm thấy tài khoản.','Phân quyền'); return; }
    if(isOwnerRow(target)){ await window.GiaDialog?.alert('Tài khoản Admin được bảo vệ, không đổi quyền.','Bảo vệ Admin'); return; }
    try{
     btn.disabled=true;
     if(act==='approve'){
      if(target.is_invite){ await window.GiaDialog?.alert('Người này chưa đăng nhập/liên kết tài khoản. Khi họ đăng nhập đúng Gmail, hệ thống sẽ tự liên kết.','Phân quyền'); btn.disabled=false; return; }
      if(!(await window.GiaDialog?.confirm('Duyệt « '+(target.display_name||id)+' » vào dòng họ?','Duyệt thành viên'))){btn.disabled=false;return;}
      await window.GiaCloud.setMemberStatus(id,'approved');
      record('Duyệt thành viên',target.display_name||id);
      await window.GiaDialog?.alert('Đã duyệt thành viên.','Phân quyền');
     } else if(act==='role'){
      const role=btn.dataset.role;
      if(role==='truongho' && !canGrantTH){ await window.GiaDialog?.alert('Chỉ Admin mới được cấp / thu hồi Trưởng họ.','Phân quyền'); btn.disabled=false; return; }
      if(role==='member' && !canManage){ await window.GiaDialog?.alert('Bạn không có quyền đặt Thành viên liên quan.','Phân quyền'); btn.disabled=false; return; }
      const label=role==='truongho'?'Trưởng họ':'Thành viên liên quan';
      if(!(await window.GiaDialog?.confirm('Đặt quyền « '+label+' » cho '+(target.display_name||id)+'?','Xác nhận phân quyền'))){btn.disabled=false;return;}
      if(target.is_invite){ await window.GiaCloud.setInviteRole(target.invite_id,role); }
      else { try{ await window.GiaCloud.setMemberStatus(id,'approved'); }catch(_e){} await window.GiaCloud.setMemberRole(id, role); }
      record('Thay đổi quyền', label+' · '+(target.display_name||id));
      await window.GiaDialog?.alert('Đã cập nhật: « '+label+' ».','Phân quyền');
     }
     await paint();
    }catch(e){
     await window.GiaDialog?.alert('Không thao tác được: '+(e?.message||e),'Phân quyền');
     btn.disabled=false;
    }
   };
  });
 };
 await paint();
 if(addBtn){ addBtn.onclick=async()=>{ if(!canGrantTH){await window.GiaDialog?.alert('Chỉ Admin mới được thêm người vào danh sách phân quyền.','Phân quyền');return;} const name=await window.GiaDialog?.prompt('Nhập họ tên người cần thêm.','','➕ Thêm thành viên','Họ và tên'); if(name==null)return; const email=await window.GiaDialog?.prompt('Nhập Gmail của người này.','','➕ Thêm thành viên','Gmail'); if(email==null)return; try{addBtn.disabled=true;await window.GiaCloud.createMemberInvite(name,email);record('Thêm thành viên phân quyền',String(name).trim()+' · '+String(email).trim().toLowerCase());await window.GiaDialog?.alert('Đã thêm người vào danh sách phân quyền.','Phân quyền');await paint();}catch(e){await window.GiaDialog?.alert('Không thêm được: '+(e?.message||e),'Phân quyền');}finally{addBtn.disabled=false;} }; }
}
