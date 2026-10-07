async function renderMembers(box){
 const auto=window.GiaCloud?.getAutoApproval?.()===true;
 box.innerHTML='<div class="admin-card"><div class="admin-section-title"><div><h3>👥 Thành viên & Duyệt</h3><p class="muted">Kiểm soát việc thành viên mới có được vào hệ thống ngay hay phải chờ duyệt.</p></div><label class="admin-toggle"><input id="autoApprovalToggle" type="checkbox" '+(auto?'checked':'')+'><span class="admin-toggle-track"><i></i></span></label></div><div class="admin-auto-row"><span class="admin-auto-dot '+(auto?'on':'')+'"></span><b>'+(auto?'Đang tự động phê duyệt thành viên mới':'Đang yêu cầu duyệt thủ công')+'</b></div><div class="admin-filter-row"><button data-filter="all">Tất cả</button><button data-filter="pending">Chờ duyệt</button><button data-filter="approved">Đã duyệt</button><button data-filter="rejected">Từ chối</button></div><div id="memberList">Đang tải…</div></div>';
 const toggle=box.querySelector('#autoApprovalToggle');
 if(toggle) toggle.onchange=async()=>{await window.GiaCloud?.setAutoApproval?.(toggle.checked);record('Đổi duyệt thành viên',toggle.checked?'Bật tự động':'Tắt tự động');renderMembers(box);};
 let rows=[];try{rows=await window.GiaCloud?.listMembers?.()||[];}catch(e){box.querySelector('#memberList').innerHTML='<p class="warn-text">'+esc(e?.message||e)+'</p>';return;}
 const render=f=>{ let r=f==='all'?rows:rows.filter(x=>(x.status||'pending')===f); box.querySelector('#memberList').innerHTML=r.map(m=>'<div class="admin-user-row"><div><strong>'+esc(m.display_name||'Chưa đặt tên')+'</strong><div class="muted">'+esc(m.email||m.id)+'</div></div><div class="admin-user-actions"><span class="badge '+(m.status==='approved'?'badge-ok':m.status==='rejected'?'badge-no':'badge-wait')+'">'+(m.status==='approved'?'Đã duyệt':m.status==='rejected'?'Từ chối':'Chờ duyệt')+'</span>'+(m.status!=='approved'?'<button data-act="approve" data-id="'+esc(String(m.id))+'">Duyệt</button>':'')+(m.status!=='rejected'?'<button data-act="reject" data-id="'+esc(String(m.id))+'">Từ chối</button>':'')+'</div></div>').join('')||'<p class="muted">Không có thành viên trong nhóm này.</p>';
   box.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{ const next=b.dataset.act==='approve'?'approved':'rejected'; if(!(await window.GiaDialog?.confirm(next==='approved'?'Duyệt tài khoản này vào dòng họ?':'Từ chối tài khoản này?','Xác nhận')))return; try{await window.GiaCloud.setMemberStatus(b.dataset.id,next);record('Phê duyệt thành viên',(next==='approved'?'Duyệt: ':'Từ chối: ')+b.dataset.id);await renderMembers(box);}catch(e){await window.GiaDialog?.alert(String(e?.message||e),'Lỗi');}});};
 box.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>render(b.dataset.filter));
 render('all');
}
function renderTreeAdmin(box){
 box.innerHTML='<div class="admin-card"><h3>🌳 Sửa cây gia phả</h3><p class="muted">Mở trình sửa cây trên trang Gia phả.</p><button type="button" class="btn btn-primary" id="btnOpenTreeEdit">Mở trình sửa cây</button></div>';
 box.querySelector('#btnOpenTreeEdit').onclick=async()=>{
  const ok=await window.GiaApp?.authorizeTreeFromAdmin?.();
  if(ok===false)return;
  window.GiaAdminLog?.record?.('Mở quyền sửa cây','Admin mở chỉnh sửa từ Trung tâm quản trị');
  window.GiaApp?.showView?.('tree');
};
}
function renderData(box){
 box.innerHTML='<div class="admin-card"><h3>💾 Dữ liệu gia phả</h3><p class="muted">Sao lưu / khôi phục dữ liệu local.</p><div class="admin-quick"><button type="button" id="btnExportData">Xuất JSON</button><button type="button" id="btnImportData">Nhập JSON</button></div><input type="file" id="importFile" accept="application/json" class="hidden"/></div>';
 box.querySelector('#btnExportData').onclick=()=>{const data=load(TREE_KEY,{});const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gia-pha-backup.json';a.click();record('Xuất dữ liệu','JSON');};
 box.querySelector('#btnImportData').onclick=()=>box.querySelector('#importFile').click();
 box.querySelector('#importFile').onchange=async(e)=>{const f=e.target.files?.[0];if(!f)return;try{const text=await f.text();const data=JSON.parse(text);save(TREE_KEY,data);record('Nhập dữ liệu',f.name);await window.GiaDialog?.alert('Đã nhập dữ liệu.','Dữ liệu');}catch(err){await window.GiaDialog?.alert('File không hợp lệ.','Lỗi');}};
}
function renderLogs(box){
 const rows=load(LOG_KEY,[]);
 box.innerHTML='<div class="admin-card"><h3>📜 Nhật ký hoạt động</h3><div class="admin-log-list">'+(rows.slice(0,50).map(r=>'<div class="admin-log-item"><strong>'+esc(r.action)+'</strong><div class="muted">'+esc(r.detail||'')+' · '+esc(r.actor||'')+' · '+esc(r.time||'')+'</div></div>').join('')||'<p class="muted">Chưa có nhật ký.</p>')+'</div></div>';
}
function bootPending(){ensureMenu();}
document.addEventListener('DOMContentLoaded',bootPending);
setTimeout(ensureMenu,300);setTimeout(ensureMenu,1200);
})();
