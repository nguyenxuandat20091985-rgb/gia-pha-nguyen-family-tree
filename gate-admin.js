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
 '<div class="admin-hero"><div class="admin-hero-icon">🛡️</div><div><span>TRUNG TÂM QUẢN TRỊ</span><h2>Admin — Gia Phả Họ Nguyễn</h2><p>Quản lý quyền, thành viên, cây gia phả, dữ liệu và nhật ký trên một màn hình.</p></div><button type="button" id="adminLock" class="admin-lock">🔒 Khóa</button></div>'+
 '<div class="admin-status" id="adminStatus"></div>'+
 '<div class="admin-dashboard-grid" id="adminDashboardGrid"><button type="button" class="admin-dashboard-card" data-tab="overview"><span class="admin-card-icon">📊</span><span class="admin-card-copy"><b>Tổng quan</b><small>Trạng thái hệ thống</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="roles"><span class="admin-card-icon">🛡️</span><span class="admin-card-copy"><b>Phân quyền</b><small>Admin & Trưởng họ</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="members"><span class="admin-card-icon">👥</span><span class="admin-card-copy"><b>Thành viên & Duyệt</b><small>Phê duyệt yêu cầu</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="tree"><span class="admin-card-icon">🌳</span><span class="admin-card-copy"><b>Sửa cây gia phả</b><small>Quản lý các nhánh</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="data"><span class="admin-card-icon">💾</span><span class="admin-card-copy"><b>Dữ liệu gia phả</b><small>Sao lưu & khôi phục</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="logs"><span class="admin-card-icon">📜</span><span class="admin-card-copy"><b>Nhật ký hoạt động</b><small>Lịch sử thay đổi</small></span><span class="admin-card-arrow">›</span></button></div><div id="adminBody"></div></div></div>';
 document.getElementById('mainContent')?.appendChild(v);
 v.querySelectorAll('[data-tab]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();activeTab=b.dataset.tab;renderTab();});
 document.getElementById('adminLock').onclick=()=>{unlocked=false;window.GiaApp?.lockTreeEditing?.();closeAdmin();};
 // Delegated fallback keeps Admin controls clickable even when another app layer re-renders the view.
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
function setStatus(){const p=window.GiaCloud?.state?.profile||{}, role=p.role||p.family_role||p.member_role||'member';const el=document.getElementById('adminStatus');if(el)el.innerHTML='<span>🔐 Đã xác thực Admin</span><b>'+esc(p.display_name||'Quản trị viên')+'</b><em>'+esc(role==='truongho'?'Trưởng họ':role==='admin'?'Admin':'Quyền cục bộ')+'</em>';}
function renderTab(){if(!unlocked)return;setStatus();const v=ensureView();v.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));const body=document.getElementById('adminBody');if(!body)return;({overview:renderOverview,roles:renderRoles,members:renderMembers,tree:renderTreeAdmin,data:renderData,logs:renderLogs}[activeTab]||renderOverview)(body);}
function renderOverview(box){const people=load(TREE_KEY,{people:{}}).people||{};const logs=load(LOG_KEY,[]);const req=load(REQ_KEY,[]).filter(x=>x.status==='pending');const cloud=window.GiaCloud;box.innerHTML='<div class="admin-stat-grid"><div><strong>'+Object.keys(people).length+'</strong><span>Thành viên cây</span></div><div><strong>'+logs.length+'</strong><span>Nhật ký</span></div><div><strong>'+req.length+'</strong><span>Yêu cầu chờ xử lý</span></div><div><strong>'+(cloud?.state?.user?'Đã đăng nhập':'Chưa đăng nhập')+'</strong><span>Tài khoản hiện tại</span></div></div><div class="admin-card"><h3>⚡ Thao tác nhanh</h3><div class="admin-quick"><button data-go="members">👥 Quản lý thành viên</button><button data-go="tree">🌳 Mở trình sửa cây</button><button data-go="data">💾 Sao lưu / khôi phục</button><button data-go="logs">📜 Xem nhật ký</button></div></div><div class="admin-note">ℹ️ Màn hình <b>Gia phả → Chỉ xem</b> vẫn là trạng thái an toàn mặc định. Chỉ khi tài khoản có quyền và đã xác thực PIN mới mở được chỉnh sửa.</div>';
 box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.go;renderTab();});}
async function renderRoles(box){
 const me=window.GiaCloud?.state?.user?.sub||'', owner=window.GiaCloud?.isOwner?.()===true;
 const myProfile=window.GiaCloud?.state?.profile||{};
 const myRole=owner?'admin':(myProfile.role||'member');
 const canManageRoles=myRole==='admin'||myProfile.is_admin===true||owner;
 box.innerHTML='<div class="admin-card"><h3>🛡️ Phân quyền tài khoản</h3><p class="muted">Luồng quyền: <b>Admin → Trưởng họ → Thành viên</b>. Admin cấp quyền Trưởng họ; Trưởng họ chỉ quản lý thành viên, không thể cấp/thu hồi Admin.</p><div id="roleList">Đang tải…</div></div>';
 if(!window.GiaCloud?.listMembers){box.querySelector('#roleList').textContent='Danh sách thành viên chưa sẵn sàng.';return;}
 try{
   const rows=await window.GiaCloud.listMembers();
   box.querySelector('#roleList').innerHTML=(rows||[]).map(m=>{
     const role=m.is_owner?'admin':(m.role||'member');
     const isSelf=m.id===me;
     const isAdmin=role==='admin';
     const canChangeAdmin=canManageRoles && !isSelf && !m.is_owner;
     const canChangeMember=canManageRoles || myRole==='truongho';
     const adminDisabled=(!canChangeAdmin)?'disabled':'';
     const truongDisabled=(!(canManageRoles) || isSelf || m.is_owner)?'disabled':'';
     const memberDisabled=(!(canChangeMember) || isSelf || m.is_owner || (isAdmin && !canManageRoles))?'disabled':'';
     return '<div class="admin-member-card">'+
       '<div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc((m.display_name||'T').charAt(0).toUpperCase())+'</div><div><strong>'+esc(m.display_name||'Chưa đặt tên')+'</strong><div class="muted">'+esc(m.email||'')+'</div></div></div>'+
       '<span class="admin-role '+esc(role)+'">'+(m.is_owner?'Admin · Trưởng họ':isAdmin?'Admin':role==='truongho'||m.family_role==='truongho'?'Trưởng họ':'Thành viên xem')+'</span></div>'+
       '<div class="admin-permission-switches">'+
         '<button type="button" class="admin-permission '+(isAdmin?'active':'')+'" data-role="admin" data-id="'+esc(m.id)+'" '+adminDisabled+'>🛡️ Admin</button>'+
         '<button type="button" class="admin-permission '+((role==='truongho'||m.family_role==='truongho')?'active':'')+'" data-role="truongho" data-id="'+esc(m.id)+'" '+truongDisabled+'>🏮 Trưởng họ</button>'+
         '<button type="button" class="admin-permission '+((role==='member')?'active':'')+'" data-role="member" data-id="'+esc(m.id)+'" '+memberDisabled+'>👁️ Thành viên xem</button>'+
       '</div>'+
       '<div class="admin-member-meta"><span class="badge '+(m.status==='approved'?'badge-ok':m.status==='rejected'?'badge-no':'badge-wait')+'">'+(m.status==='approved'?'Đã duyệt':m.status==='rejected'?'Từ chối':'Chờ duyệt')+'</span>'+(isSelf?'<small>Tài khoản hiện tại</small>':'')+(m.is_owner?'<small>👑 Chủ quản</small>':'')+'</div>'+
     '</div>';
   }).join('')||'<p class="muted">Chưa có thành viên.</p>';
   box.querySelectorAll('[data-role]').forEach(b=>b.onclick=async()=>{
     const target=b.dataset.id, role=b.dataset.role, targetRow=(rows||[]).find(x=>x.id===target);
     if(!targetRow)return;
     const targetIsOwner=!!targetRow.is_owner||String(targetRow.email||'').trim().toLowerCase()==='nguyenxuandat20091985@gmail.com';
     if(target===me || targetIsOwner){await window.GiaDialog?.alert('Tài khoản chủ quản không thể bị hạ quyền.','Bảo vệ Admin');return;}
     if(role==='admin' && !canManageRoles){await window.GiaDialog?.alert('Chỉ Admin mới được cấp hoặc thu hồi quyền Admin.','Phân quyền');return;}
     if(role==='truongho' && !canManageRoles){await window.GiaDialog?.alert('Chỉ Admin mới được cấp hoặc thu hồi quyền Trưởng họ.','Phân quyền');return;}
     if(role==='member' && !(canManageRoles||myRole==='truongho')){await window.GiaDialog?.alert('Bạn không có quyền thay đổi quyền thành viên.','Phân quyền');return;}
     const label=role==='admin'?'Admin':role==='truongho'?'Trưởng họ':'Thành viên xem';
     if(!(await window.GiaDialog?.confirm('Đặt quyền "'+label+'" cho '+(targetRow.display_name||targetRow.email)+'?','Xác nhận phân quyền')))return;
     try{
       await window.GiaCloud.setMemberStatus(target,'approved');
       await window.GiaCloud.setMemberRole(target,role);
       record('Thay đổi quyền',label+' · '+target);
       renderTab();
     }catch(e){await window.GiaDialog?.alert('Không thể thay đổi quyền: '+(e?.message||e),'Phân quyền');}
   });
 }catch(e){box.querySelector('#roleList').innerHTML='<p class="warn-text">'+esc(e?.message||e)+'</p>';}
}
async function renderMembers(box){
 const auto=window.GiaCloud?.getAutoApproval?.()===true;
 box.innerHTML='<div class="admin-card"><div class="admin-section-title"><div><h3>👥 Thành viên & Duyệt</h3><p class="muted">Kiểm soát việc thành viên mới có được vào hệ thống ngay hay phải chờ Admin.</p></div><label class="admin-toggle"><input id="autoApprovalToggle" type="checkbox" '+(auto?'checked':'')+'><span class="admin-toggle-track"><i></i></span></label></div><div class="admin-auto-row"><span class="admin-auto-dot '+(auto?'on':'')+'"></span><b>'+(auto?'Đang tự động phê duyệt thành viên mới':'Đang yêu cầu Admin duyệt thủ công')+'</b></div><div class="admin-filter-row"><button data-filter="all">Tất cả</button><button data-filter="pending">Chờ duyệt</button><button data-filter="approved">Đã duyệt</button><button data-filter="rejected">Từ chối</button></div><div id="memberList">Đang tải…</div></div>';
 const toggle=box.querySelector('#autoApprovalToggle');
 toggle.onchange=async()=>{await window.GiaCloud?.setAutoApproval?.(toggle.checked);record('Đổi duyệt thành viên',toggle.checked?'Bật tự động phê duyệt':'Tắt tự động phê duyệt');renderMembers(box);};
 let rows=[];try{rows=await window.GiaCloud?.listMembers?.()||[];}catch(e){box.querySelector('#memberList').innerHTML='<p class="warn-text">'+esc(e?.message||e)+'</p>';return;}
 const render=f=>{
   let r=f==='all'?rows:rows.filter(x=>(x.status||'pending')===f);
   box.querySelector('#memberList').innerHTML=r.map(m=>'<div class="admin-user-row"><div><strong>'+esc(m.display_name||'Chưa đặt tên')+'</strong><div class="muted">'+esc(m.email||'')+'</div></div><span class="admin-role '+esc(m.status||'pending')+'">'+esc(m.status==='pending'?'Chờ duyệt':m.status==='rejected'?'Từ chối':'Đã duyệt')+'</span><div class="admin-user-actions">'+(m.status!=='approved'?'<button data-act="approve" data-id="'+esc(m.id)+'">✅ Duyệt</button>':'')+(m.status!=='rejected'?'<button class="danger" data-act="reject" data-id="'+esc(m.id)+'">Từ chối</button>':'')+'</div></div>').join('')||'<p class="muted">Không có thành viên trong nhóm này.</p>';
   box.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{
     const next=b.dataset.act==='approve'?'approved':'rejected';
     if(!(await window.GiaDialog?.confirm(next==='approved'?'Duyệt tài khoản này vào dòng họ?':'Từ chối tài khoản này?','Xác nhận')))return;
     try{await window.GiaCloud.setMemberStatus(b.dataset.id,next);record('Phê duyệt thành viên',(next==='approved'?'Duyệt: ':'Từ chối: ')+b.dataset.id);await renderMembers(box);}catch(e){await window.GiaDialog?.alert('Lỗi: '+(e?.message||e),'Phê duyệt');}
   });
 };
 box.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>render(b.dataset.filter));render('all');
}
function renderData(box){box.innerHTML='<div class="admin-card"><h3>💾 Dữ liệu gia phả</h3><p class="muted">Khu vực này đã được đưa vào Admin. Không còn cần một mục “Dữ liệu gia phả” riêng trong menu Thêm.</p><div class="admin-data-actions"><button id="adminExport">⬇️ Xuất JSON</button><button id="adminImport">⬆️ Nhập JSON</button><input id="adminImportFile" type="file" accept=".json" hidden/><button id="adminReset" class="danger">⚠️ Reset dữ liệu mẫu</button></div><div class="admin-warning">Cảnh báo: Nhập/Reset sẽ thay đổi dữ liệu cây đang lưu trên thiết bị. Hãy Xuất JSON trước khi thao tác.</div></div>';box.querySelector('#adminExport').onclick=exportData;box.querySelector('#adminImport').onclick=()=>box.querySelector('#adminImportFile').click();box.querySelector('#adminImportFile').onchange=e=>importData(e.target.files?.[0]);box.querySelector('#adminReset').onclick=resetData;}
function exportData(){const keys=['giaPhaNguyenData_v4','giaPhaEvents_v1','giaPhaPosts_v1','giaPhaChat_v1','giaPhaFamilyFund_v1','giaPhaLiaison_v1'];const payload={version:2,exportedAt:new Date().toISOString(),keys:{}};keys.forEach(k=>{const raw=localStorage.getItem(k);if(raw)try{payload.keys[k]=JSON.parse(raw);}catch(e){payload.keys[k]=raw;}});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='gia-pha-nguyen-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();record('Xuất dữ liệu','Tạo file sao lưu JSON');}
async function importData(file){if(!file)return;try{const text=await file.text(),p=JSON.parse(text);if(!p?.keys?.giaPhaNguyenData_v4)throw new Error('Thiếu dữ liệu cây gia phả.');if(!(await window.GiaDialog?.confirm('Nhập dữ liệu sẽ ghi đè bản đang lưu trên thiết bị. Anh đã có bản sao lưu chưa?','Xác nhận nhập JSON')))return;Object.entries(p.keys).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));record('Nhập dữ liệu','Khôi phục từ JSON');await window.GiaDialog?.alert('Đã nhập dữ liệu. Ứng dụng sẽ tải lại để dùng dữ liệu mới.','Dữ liệu gia phả');location.reload();}catch(e){await window.GiaDialog?.alert('Tệp JSON không hợp lệ: '+(e?.message||e),'Nhập dữ liệu');}}
async function resetData(){if(!(await window.GiaDialog?.confirm('Reset sẽ xóa dữ liệu cây hiện tại trên thiết bị và tải lại dữ liệu mẫu. Hãy Xuất JSON trước. Tiếp tục?','⚠️ Cảnh báo an toàn')))return;if((await window.GiaDialog?.prompt('Gõ RESET để xác nhận.','','Xác nhận Reset','RESET'))!=='RESET')return;['giaPhaNguyenData_v4','giaPhaNguyenData_v3','giaPhaNguyenData_v2','giaPhaNguyenData_v1','giaPhaSeedVersion'].forEach(k=>localStorage.removeItem(k));record('Reset dữ liệu','Tải lại dữ liệu mẫu');location.reload();}
function renderLogs(box){const rows=load(LOG_KEY,[]);box.innerHTML='<div class="admin-card"><div class="admin-log-head"><h3>📜 Nhật ký hoạt động</h3><button id="clearLogs" class="danger">Xóa nhật ký</button></div><p class="muted">Nhật ký lưu tối đa 300 hoạt động trên thiết bị này.</p><div class="admin-logs">'+(rows.length?rows.map(x=>'<div class="admin-log"><time>'+esc(new Date(x.time).toLocaleString('vi-VN'))+'</time><strong>'+esc(x.action)+'</strong><span>'+esc(x.detail)+'</span><small>'+esc(x.actor)+'</small></div>').join(''):'<p class="muted">Chưa có hoạt động.</p>')+'</div></div>';box.querySelector('#clearLogs').onclick=async()=>{if(await window.GiaDialog?.confirm('Xóa toàn bộ nhật ký trên thiết bị?','Nhật ký')){save(LOG_KEY,[]);renderTab();}};}
window.addEventListener('gia-auth-changed',()=>{if(unlocked&&activeTab==='roles')renderTab();});window.addEventListener('gia-profile-changed',()=>{if(unlocked)renderTab();});
function guardPending(e){const u=window.GiaCloud?.state?.user;if(!u)return;const approved=window.GiaCloud?.isApproved?.();if(approved||!window.GiaCloud?.isPending?.())return;const t=e.target.closest?.('#btnAddRoot,#btnAddEvent,#btnAddPost,#btnSendChat,#personForm,#eventForm,#postForm');if(!t)return;e.preventDefault();e.stopPropagation();window.GiaDialog?.alert('Tài khoản đang chờ Admin duyệt. Chưa thể thêm hoặc sửa dữ liệu.','Tài khoản thành viên');}
document.addEventListener('click',guardPending,true);document.addEventListener('submit',guardPending,true);
setTimeout(ensureMenu,300);setTimeout(ensureMenu,1200);
})();