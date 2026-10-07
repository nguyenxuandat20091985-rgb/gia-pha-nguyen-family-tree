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
 '<div class="admin-dashboard-grid" id="adminDashboardGrid"><button type="button" class="admin-dashboard-card" data-tab="overview"><span class="admin-card-icon">📊</span><span class="admin-card-copy"><b>Tổng quan</b><small>Trạng thái hệ thống</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="roles"><span class="admin-card-icon">🛡️</span><span class="admin-card-copy"><b>Phân quyền</b><small>Chủ quản → Trưởng họ → Liên quan</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="members"><span class="admin-card-icon">👥</span><span class="admin-card-copy"><b>Thành viên & Duyệt</b><small>Phê duyệt yêu cầu</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="tree"><span class="admin-card-icon">🌳</span><span class="admin-card-copy"><b>Sửa cây gia phả</b><small>Quản lý các nhánh</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="data"><span class="admin-card-icon">💾</span><span class="admin-card-copy"><b>Dữ liệu gia phả</b><small>Sao lưu & khôi phục</small></span><span class="admin-card-arrow">›</span></button><button type="button" class="admin-dashboard-card" data-tab="logs"><span class="admin-card-icon">📜</span><span class="admin-card-copy"><b>Nhật ký hoạt động</b><small>Lịch sử thay đổi</small></span><span class="admin-card-arrow">›</span></button></div><div id="adminBody"></div></div>';
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
 if(el)el.innerHTML='<span>🔐 Đã xác thực</span><b>'+esc(p.display_name||'Quản trị viên')+'</b><em>'+esc(role==='tech_admin'?'👑 Chủ quản hệ thống':role==='truongho'?'🏮 Trưởng họ':'👁️ Thành viên')+'</em>';
}
function renderTab(){if(!unlocked)return;setStatus();const v=ensureView();v.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===activeTab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});const body=document.getElementById('adminBody');if(!body)return;body.classList.remove('admin-content-enter');void body.offsetWidth;body.classList.add('admin-content-enter');({overview:renderOverview,roles:renderRoles,members:renderMembers,tree:renderTreeAdmin,data:renderData,logs:renderLogs}[activeTab]||renderOverview)(body);}
function renderOverview(box){const people=load(TREE_KEY,{people:{}}).people||{};const logs=load(LOG_KEY,[]);const req=load(REQ_KEY,[]).filter(x=>x.status==='pending');const cloud=window.GiaCloud;box.innerHTML='<div class="admin-stat-grid"><div><strong>'+Object.keys(people).length+'</strong><span>Thành viên cây</span></div><div><strong>'+logs.length+'</strong><span>Nhật ký</span></div><div><strong>'+req.length+'</strong><span>Yêu cầu chờ xử lý</span></div><div><strong>'+(cloud?.state?.user?'Đã đăng nhập':'Chưa đăng nhập')+'</strong><span>Tài khoản hiện tại</span></div></div><div class="admin-card"><h3>⚡ Thao tác nhanh</h3><div class="admin-quick"><button data-go="roles">🛡️ Phân quyền</button><button data-go="members">👥 Duyệt thành viên</button><button data-go="tree">🌳 Mở trình sửa cây</button><button data-go="logs">📜 Xem nhật ký</button></div></div><div class="admin-note">ℹ️ <b>Quy tắc:</b> Chủ quản (nguyenxuandat20091985@gmail.com) → cấp <b>Trưởng họ</b> → Trưởng họ duyệt <b>Thành viên liên quan</b>.</div>';
 box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.go;renderTab();});}
async function renderRoles(box){
 const OWNER_EMAIL='nguyenxuandat20091985@gmail.com';
 const meId=String(window.GiaCloud?.state?.user?.id||window.GiaCloud?.state?.user?.sub||'');
 const meEmail=(window.GiaCloud?.state?.user?.email||window.GiaCloud?.state?.profile?.email||'').trim().toLowerCase();
 const meName=window.GiaCloud?.state?.profile?.display_name||'dat nguyen';
 const isTech=window.GiaCloud?.isTechAdmin?.()===true||window.GiaCloud?.isOwner?.()===true||meEmail===OWNER_EMAIL;
 const myRole=isTech?'tech_admin':((window.GiaCloud?.state?.profile?.role)||'member');
 const canGrantTH=isTech;
 const canManage=isTech||myRole==='truongho';
 box.innerHTML='<div class="admin-card admin-roles-card"><h3>🛡️ Phân quyền tài khoản</h3><p class="admin-roles-flow"><b>Quy tắc 3 cấp (bắt buộc)</b><br/><span class="admin-flow-step">👑 Chủ quản</span> <span class="admin-flow-arrow">→</span> <span class="admin-flow-step">🏮 Trưởng họ</span> <span class="admin-flow-arrow">→</span> <span class="admin-flow-step">👁️ Thành viên liên quan</span></p><div class="admin-role-help"><div><b>👑 Chủ quản hệ thống</b><small>Tài khoản <b>'+esc(OWNER_EMAIL)+'</b>. Gán / thu hồi <b>Trưởng họ</b>. Khóa bảo vệ — không kiêm Trưởng họ, không bị hạ quyền.</small></div><div><b>🏮 Trưởng họ</b><small>Do Chủ quản bổ nhiệm. Duyệt thành viên mới và cấp quyền <b>Thành viên liên quan</b>. Không được cấp Chủ quản hay Trưởng họ mới.</small></div><div><b>👁️ Thành viên liên quan</b><small>Do Trưởng họ (hoặc Chủ quản) cấp. Tham gia / phụ trách việc họ; không phân quyền cho người khác.</small></div></div><div id="roleList" class="admin-role-list">Đang tải danh sách…</div></div>';
 const list=box.querySelector('#roleList');
 const paint=async()=>{
  let rows=[]; let errMsg='';
  try{ if(window.GiaCloud?.listMembers){ rows=await window.GiaCloud.listMembers()||[]; } else { errMsg='Chưa kết nối Supabase / GiaCloud.'; } }catch(e){ errMsg=String(e?.message||e); rows=[]; }
  const isOwnerRow=m=>{ const em=String(m.email||'').trim().toLowerCase(); return !!m.is_tech_admin || em===OWNER_EMAIL || (String(m.id)===meId && isTech); };
  const ownerFromDb=rows.find(isOwnerRow);
  const ownerName=ownerFromDb?.display_name||meName||'dat nguyen';
  const ownerEmail=ownerFromDb?.email||OWNER_EMAIL;
  let html='<div class="admin-member-card admin-member-owner"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc((ownerName||'C').charAt(0).toUpperCase())+'</div><div><strong>'+esc(ownerName)+'</strong><div class="muted">'+esc(ownerEmail)+'</div></div></div><span class="admin-role tech_admin">👑 Chủ quản hệ thống</span></div><p class="admin-owner-lock">🔒 Tài khoản được bảo vệ — không cấp/hạ quyền, không gộp vai Trưởng họ.</p><div class="admin-member-meta"><span class="badge badge-ok">Đã duyệt</span><small>Cấp 1 · Điểm bắt đầu phân quyền</small></div></div>';
  if(errMsg && !rows.length){ html+='<p class="warn-text" style="margin:10px 0">'+esc(errMsg)+'</p><div class="admin-note">Đăng nhập Google bằng tài khoản Chủ quản rồi mở lại Phân quyền để tải danh sách thành viên thật từ Supabase.</div>'; list.innerHTML=html; return; }
  const others=rows.filter(m=>!isOwnerRow(m));
  const truong=others.filter(m=>(m.role||'')==='truongho');
  const pending=others.filter(m=>{ const st=m.status||'pending'; return st==='pending'||st==='rejected'; });
  const related=others.filter(m=>(m.role||'member')!=='truongho' && (m.status||'pending')==='approved');
  const card=(m)=>{
   const role=m.role||'member'; const isTH=role==='truongho'; const st=m.status||'pending';
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
    if(isTH) acts+='<p class="admin-action-hint muted">Không đổi được quyền Trưởng họ (chỉ Chủ quản).</p>';
    else acts+='<button type="button" class="admin-permission '+(st==='approved'?'active':'')+'" data-act="role" data-role="member" data-id="'+esc(id)+'">👁️ Thành viên liên quan</button>';
   } else acts='<p class="admin-action-hint muted">Bạn không có quyền thao tác.</p>';
   return '<div class="admin-member-card" data-id="'+esc(id)+'"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc(name.charAt(0).toUpperCase())+'</div><div><strong>'+esc(name)+'</strong><div class="muted">'+esc(contact)+'</div></div></div><span class="admin-role '+(isTH?'truongho':'member')+'">'+(isTH?'🏮 Trưởng họ':'👁️ Thành viên liên quan')+'</span></div><div class="admin-permission-switches">'+acts+'</div><div class="admin-member-meta"><span class="badge '+stC+'">'+stL+'</span></div></div>';
  };
  html+='<div class="admin-role-section"><h4 class="admin-role-section-title">🏮 Trưởng họ <small>('+truong.length+')</small></h4>';
  html+=truong.length?truong.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có Trưởng họ. Chủ quản chọn một thành viên đã duyệt → bấm <b>🏮 Cấp Trưởng họ</b>.</p>';
  html+='</div><div class="admin-role-section"><h4 class="admin-role-section-title">👁️ Thành viên liên quan <small>('+related.length+')</small></h4>';
  html+=related.length?related.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có thành viên liên quan đã duyệt.</p>';
  html+='</div><div class="admin-role-section"><h4 class="admin-role-section-title">⏳ Chờ duyệt / từ chối <small>('+pending.length+')</small></h4>';
  html+=pending.length?pending.map(card).join(''):'<p class="muted admin-empty-hint">Không có yêu cầu chờ. Khi có người đăng ký Google, họ sẽ hiện tại đây.</p>';
  html+='</div>';
  if(!others.length){ html+='<div class="admin-note" style="margin-top:12px">📋 <b>Chưa có thành viên đăng ký trên hệ thống.</b><br/><b>Luồng thao tác:</b><br/>1. Thành viên đăng nhập Google → vào <b>Chờ duyệt</b><br/>2. <b>Chủ quản</b> bấm <b>Duyệt</b> hoặc <b>Cấp Trưởng họ</b><br/>3. <b>Trưởng họ</b> duyệt thêm <b>Thành viên liên quan</b></div>'; }
  list.innerHTML=html;
  list.querySelectorAll('[data-act]').forEach(btn=>{
   btn.onclick=async(ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    const id=btn.dataset.id, act=btn.dataset.act;
    const target=rows.find(x=>String(x.id)===String(id));
    if(!target){ await window.GiaDialog?.alert('Không tìm thấy tài khoản.','Phân quyền'); return; }
    if(isOwnerRow(target)){ await window.GiaDialog?.alert('Tài khoản Chủ quản được bảo vệ, không đổi quyền.','Bảo vệ Chủ quản'); return; }
    try{
     btn.disabled=true;
     if(act==='approve'){
      if(!(await window.GiaDialog?.confirm('Duyệt « '+(target.display_name||id)+' » vào dòng họ?','Duyệt thành viên'))){btn.disabled=false;return;}
      await window.GiaCloud.setMemberStatus(id,'approved');
      record('Duyệt thành viên',target.display_name||id);
      await window.GiaDialog?.alert('Đã duyệt thành viên.','Phân quyền');
     } else if(act==='role'){
      const role=btn.dataset.role;
      if(role==='truongho' && !canGrantTH){ await window.GiaDialog?.alert('Chỉ Chủ quản hệ thống mới được cấp / thu hồi Trưởng họ.','Phân quyền'); btn.disabled=false; return; }
      if(role==='member' && !canManage){ await window.GiaDialog?.alert('Bạn không có quyền đặt Thành viên liên quan.','Phân quyền'); btn.disabled=false; return; }
      const label=role==='truongho'?'Trưởng họ':'Thành viên liên quan';
      if(!(await window.GiaDialog?.confirm('Đặt quyền « '+label+' » cho '+(target.display_name||id)+'?','Xác nhận phân quyền'))){btn.disabled=false;return;}
      try{ await window.GiaCloud.setMemberStatus(id,'approved'); }catch(_e){}
      await window.GiaCloud.setMemberRole(id, role);
      record('Thay đổi quyền', label+' · '+(target.display_name||id));
      await window.GiaDialog?.alert('Đã cập nhật: « '+label+' ».','Phân quyền');
     }
     await paint();
    }catch(e){
     await window.GiaDialog?.alert('Không thao tác được: '+(e?.message||e)+'\n\nCần đăng nhập đúng tài khoản Chủ quản và Supabase đang hoạt động.','Phân quyền');
     btn.disabled=false;
    }
   };
  });
 };
 await paint();
}
async function renderMembers(box){
 const auto=window.GiaCloud?.getAutoApproval?.()===true;
 box.innerHTML='<div class="admin-card"><div class="admin-section-title"><div><h3>👥 Thành viên & Duyệt</h3><p class="muted">Kiểm soát việc thành viên mới có được vào hệ thống ngay hay phải chờ duyệt.</p></div><label class="admin-toggle"><input id="autoApprovalToggle" type="checkbox" '+(auto?'checked':'')+'><span class="admin-toggle-track"><i></i></span></label></div><div class="admin-auto-row"><span class="admin-auto-dot '+(auto?'on':'')+'"></span><b>'+(auto?'Đang tự động phê duyệt thành viên mới':'Đang yêu cầu duyệt thủ công')+'</b></div><div class="admin-filter-row"><button data-filter="all">Tất cả</button><button data-filter="pending">Chờ duyệt</button><button data-filter="approved">Đã duyệt</button><button data-filter="rejected">Từ chối</button></div><div id="memberList">Đang tải…</div></div>';
 const toggle=box.querySelector('#autoApprovalToggle');
 if(toggle) toggle.onchange=async()=>{await window.GiaCloud?.setAutoApproval?.(toggle.checked);record('Đổi duyệt thành viên',toggle.checked?'Bật tự động':'Tắt tự động');renderMembers(box);};
 let rows=[];try{rows=await window.GiaCloud?.listMembers?.()||[];}catch(e){box.querySelector('#memberList').innerHTML='<p class="warn-text">'+esc(e?.message||e)+'</p>';return;}
 const render=f=>{ let r=f==='all'?rows:rows.filter(x=>(x.status||'pending')===f); box.querySelector('#memberList').innerHTML=r.map(m=>'<div class="admin-user-row"><div><strong>'+esc(m.display_name||'Chưa đặt tên')+'</strong><div class="muted">'+esc(m.email||m.phone||'')+'</div></div><span class="admin-role '+esc(m.status||'pending')+'">'+esc(m.status==='pending'?'Chờ duyệt':m.status==='rejected'?'Từ chối':'Đã duyệt')+'</span><div class="admin-user-actions">'+(m.status!=='approved'?'<button data-act="approve" data-id="'+esc(m.id)+'">✅ Duyệt</button>':'')+(m.status!=='rejected'?'<button class="danger" data-act="reject" data-id="'+esc(m.id)+'">Từ chối</button>':'')+'</div></div>').join('')||'<p class="muted">Không có thành viên trong nhóm này.</p>'; box.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{ const next=b.dataset.act==='approve'?'approved':'rejected'; if(!(await window.GiaDialog?.confirm(next==='approved'?'Duyệt tài khoản này vào dòng họ?':'Từ chối tài khoản này?','Xác nhận')))return; try{await window.GiaCloud.setMemberStatus(b.dataset.id,next);record('Phê duyệt thành viên',(next==='approved'?'Duyệt: ':'Từ chối: ')+b.dataset.id);await renderMembers(box);}catch(e){await window.GiaDialog?.alert('Lỗi: '+(e?.message||e),'Phê duyệt');}}); };
 box.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>render(b.dataset.filter));render('all');
}
function renderTreeAdmin(box){
 box.innerHTML='<div class="admin-card"><div class="admin-section-title"><div><h3>🌳 Sửa cây gia phả</h3><p class="muted">Quản lý cây gia phả trong chế độ chỉnh sửa.</p></div></div><div class="admin-note">🔐 <b>Chế độ an toàn:</b> Cây mặc định <b>Chỉ xem</b>. Chỉ phiên Admin đã xác thực mới mở thêm/sửa/xóa.</div><div class="admin-data-actions"><button type="button" id="adminTreeOpen" class="btn btn-primary">🌳 Mở cây — Chỉnh sửa</button><button type="button" id="adminTreeLock" class="btn btn-secondary">🔒 Khóa chỉnh sửa</button></div><div class="admin-note" id="adminTreeState">Đang kiểm tra…</div></div>';
 const state=box.querySelector('#adminTreeState');
 const unlockedTree=window.GiaApp?.isTreeWriteUnlocked?.()===true;
 if(state)state.innerHTML=unlockedTree?'🟢 <b>Đang mở quyền chỉnh sửa.</b>':'🔴 <b>Đang khóa — Chỉ xem.</b>';
 box.querySelector('#adminTreeOpen').onclick=async()=>{ const ok=await window.GiaApp?.authorizeTreeFromAdmin?.(); if(!ok)return; record('Mở quyền sửa cây','Admin mở Cây gia phả'); if(state)state.innerHTML='🟢 <b>Đang mở quyền chỉnh sửa.</b>'; window.GiaApp?.showView?.('tree'); };
 box.querySelector('#adminTreeLock').onclick=()=>{ window.GiaApp?.lockTreeEditing?.(); if(state)state.innerHTML='🔴 <b>Đang khóa — Chỉ xem.</b>'; record('Khóa sửa cây','Admin khóa chỉnh sửa'); };
}
function renderData(box){
 box.innerHTML='<div class="admin-card"><h3>💾 Dữ liệu gia phả</h3><p class="muted">Sao lưu / khôi phục dữ liệu trên thiết bị.</p><div class="admin-data-actions"><button type="button" id="btnExportData" class="btn btn-primary">⬇️ Xuất sao lưu</button><button type="button" id="btnImportData" class="btn btn-secondary">⬆️ Nhập sao lưu</button></div><input type="file" id="importFile" accept="application/json" class="hidden"/></div>';
 box.querySelector('#btnExportData').onclick=()=>{ const data={tree:load(TREE_KEY,{people:{}}),logs:load(LOG_KEY,[]),exportedAt:new Date().toISOString()}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gia-pha-backup-'+Date.now()+'.json'; a.click(); record('Xuất sao lưu','Tải file JSON'); };
 box.querySelector('#btnImportData').onclick=()=>box.querySelector('#importFile').click();
 box.querySelector('#importFile').onchange=async(e)=>{ const f=e.target.files?.[0]; if(!f)return; try{ const text=await f.text(); const data=JSON.parse(text); if(data.tree) save(TREE_KEY,data.tree); record('Nhập sao lưu',f.name); await window.GiaDialog?.alert('Đã nhập sao lưu.','Dữ liệu'); }catch(err){ await window.GiaDialog?.alert('File không hợp lệ: '+(err?.message||err),'Dữ liệu'); } };
}
function renderLogs(box){const rows=load(LOG_KEY,[]);box.innerHTML='<div class="admin-card"><div class="admin-log-head"><h3>📜 Nhật ký hoạt động</h3><button id="clearLogs" class="danger">Xóa nhật ký</button></div><p class="muted">Nhật ký lưu tối đa 300 hoạt động trên thiết bị này.</p><div class="admin-logs">'+(rows.length?rows.map(x=>'<div class="admin-log"><time>'+esc(new Date(x.time).toLocaleString('vi-VN'))+'</time><strong>'+esc(x.action)+'</strong><span>'+esc(x.detail)+'</span><small>'+esc(x.actor)+'</small></div>').join(''):'<p class="muted">Chưa có hoạt động.</p>')+'</div></div>';box.querySelector('#clearLogs').onclick=async()=>{if(await window.GiaDialog?.confirm('Xóa toàn bộ nhật ký trên thiết bị?','Nhật ký')){save(LOG_KEY,[]);renderTab();}};}
function bootPending(){ensureMenu();}
document.addEventListener('DOMContentLoaded',bootPending);
setTimeout(ensureMenu,300);setTimeout(ensureMenu,1200);
})();
