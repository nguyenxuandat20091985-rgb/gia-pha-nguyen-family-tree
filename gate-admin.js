/* Phân quyền redesign — loads base admin then upgrades roles UI */
(function(){
'use strict';
const OWNER_EMAIL='nguyenxuandat20091985@gmail.com';
const esc=s=>{const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;};

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;s.async=false;
    s.onload=()=>resolve();
    s.onerror=()=>reject(new Error('load '+src));
    document.head.appendChild(s);
  });
}

async function upgradeRolesUI(){
  const observer=new MutationObserver(()=>{
    const body=document.getElementById('adminBody');
    if(!body)return;
    if(body.innerHTML.includes('Chưa có thành viên đăng ký') || body.innerHTML.includes('Phân quyền tài khoản')){
      if(body.dataset.rolesUpgraded==='1')return;
      if(!body.querySelector('.admin-roles-card'))return;
      if(body.querySelector('.admin-role-section')){ body.dataset.rolesUpgraded='1'; return; }
      rebuildRoles(body);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

async function rebuildRoles(box){
  const meEmail=(window.GiaCloud?.state?.user?.email||'').trim().toLowerCase();
  const meName=window.GiaCloud?.state?.profile?.display_name||'dat nguyen';
  const pinOk=!!document.getElementById('view-admin')&&!document.getElementById('view-admin').classList.contains('hidden');
  const isOwner=window.GiaCloud?.isTechAdmin?.()===true||meEmail===OWNER_EMAIL||pinOk;
  const myRole=isOwner?'tech_admin':(window.GiaCloud?.state?.profile?.role||'member');

  let rows=[];
  try{ rows=await window.GiaCloud?.listMembers?.()||[]; }catch(e){ rows=[]; }

  const ownerCard='<div class="admin-member-card admin-member-owner"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">D</div><div><strong>'+esc(meName)+'</strong><div class="muted">'+esc(OWNER_EMAIL)+'</div></div></div><span class="admin-role tech_admin">👑 Chủ quản hệ thống</span></div><p class="admin-owner-lock">🔒 Tài khoản gốc — cấp / thu hồi Trưởng họ. Không bị hạ quyền.</p><div class="admin-member-meta"><span class="badge badge-ok">Đã duyệt</span></div></div>';

  const others=(rows||[]).filter(m=>{
    const em=(m.email||'').trim().toLowerCase();
    return !(m.is_tech_admin||em===OWNER_EMAIL);
  });
  const truong=others.filter(m=>(m.role||'')==='truongho');
  const pending=others.filter(m=>(m.status||'pending')!=='approved');
  const related=others.filter(m=>(m.role||'')!=='truongho'&&(m.status||'')==='approved');

  function card(m){
    const role=m.role||'member';
    const isTH=role==='truongho';
    const st=m.status||'pending';
    const stL=st==='approved'?'Đã duyệt':st==='rejected'?'Từ chối':'Chờ duyệt';
    const stC=st==='approved'?'badge-ok':st==='rejected'?'badge-no':'badge-wait';
    const name=m.display_name||'Chưa đặt tên';
    const id=String(m.id);
    let acts='';
    if(isOwner){
      if(st!=='approved') acts+='<button type="button" class="admin-permission" data-act="approve" data-id="'+esc(id)+'">✅ Duyệt thành viên</button>';
      acts+='<button type="button" class="admin-permission '+(isTH?'active':'')+'" data-act="role" data-role="truongho" data-id="'+esc(id)+'">🏮 Cấp Trưởng họ</button>';
      acts+='<button type="button" class="admin-permission '+(!isTH&&st==='approved'?'active':'')+'" data-act="role" data-role="member" data-id="'+esc(id)+'">👁️ Người có liên quan</button>';
    } else if(myRole==='truongho'){
      if(st!=='approved') acts+='<button type="button" class="admin-permission" data-act="approve" data-id="'+esc(id)+'">✅ Duyệt thành viên</button>';
      if(!isTH) acts+='<button type="button" class="admin-permission" data-act="role" data-role="member" data-id="'+esc(id)+'">👁️ Đặt Người có liên quan</button>';
    }
    return '<div class="admin-member-card"><div class="admin-member-head"><div class="admin-member-identity"><div class="admin-avatar">'+esc(name.charAt(0).toUpperCase())+'</div><div><strong>'+esc(name)+'</strong><div class="muted">'+esc(m.email||m.phone||id)+'</div></div></div><span class="admin-role '+(isTH?'truongho':'member')+'">'+(isTH?'🏮 Trưởng họ':'👁️ Người liên quan')+'</span></div><div class="admin-permission-switches">'+acts+'</div><div class="admin-member-meta"><span class="badge '+stC+'">'+stL+'</span></div></div>';
  }

  let html='<div class="admin-card admin-roles-card"><h3>🛡️ Phân quyền tài khoản</h3>'+
    '<p class="admin-roles-flow"><b>Quy tắc phân quyền</b><br/><span class="admin-flow-step">🛡️ Admin</span> → <span class="admin-flow-step">🏮 Trưởng họ</span> → <span class="admin-flow-step">👁️ Người có liên quan</span></p>'+
    '<div class="admin-role-help">'+
    '<div><b>🛡️ Admin · '+esc(OWNER_EMAIL)+'</b><small>Cấp / thu hồi Trưởng họ, duyệt thành viên. Khóa bảo vệ.</small></div>'+
    '<div><b>🏮 Trưởng họ</b><small>Do Admin cấp. Duyệt và đặt Người có liên quan. Không cấp Admin/Trưởng họ mới.</small></div>'+
    '<div><b>👁️ Người có liên quan</b><small>Đã duyệt. Xem/tham gia; không phân quyền.</small></div></div>'+
    ownerCard+
    '<div class="admin-role-section"><h4 class="admin-role-section-title">🏮 Trưởng họ <small>('+truong.length+')</small></h4>'+(truong.length?truong.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có. Admin chọn thành viên → <b>Cấp Trưởng họ</b>.</p>')+'</div>'+
    '<div class="admin-role-section"><h4 class="admin-role-section-title">👁️ Người có liên quan <small>('+related.length+')</small></h4>'+(related.length?related.map(card).join(''):'<p class="muted admin-empty-hint">Chưa có thành viên đã duyệt.</p>')+'</div>'+
    '<div class="admin-role-section"><h4 class="admin-role-section-title">⏳ Chờ duyệt <small>('+pending.length+')</small></h4>'+(pending.length?pending.map(card).join(''):'<p class="muted admin-empty-hint">Không có yêu cầu. Khi có người đăng ký sẽ hiện ở đây.</p>')+'</div>';

  if(!others.length){
    html+='<div class="admin-note" style="margin-top:12px">📋 <b>Chưa có thành viên đăng ký.</b><br/>1. Người dùng đăng nhập Google → vào Chờ duyệt<br/>2. Admin bấm <b>Duyệt</b> hoặc <b>Cấp Trưởng họ</b><br/>3. Trưởng họ duyệt thêm Người có liên quan</div>';
  }
  html+='</div>';

  box.innerHTML=html;
  box.dataset.rolesUpgraded='1';

  box.querySelectorAll('[data-act]').forEach(b=>{
    b.onclick=async()=>{
      const id=b.dataset.id, act=b.dataset.act;
      const target=rows.find(x=>String(x.id)===String(id));
      if(!target)return;
      try{
        if(act==='approve'){
          if(!(await window.GiaDialog?.confirm('Duyệt « '+(target.display_name||id)+' »?','Duyệt')))return;
          await window.GiaCloud.setMemberStatus(id,'approved');
        } else {
          const role=b.dataset.role;
          if(role==='truongho'&&!isOwner){await window.GiaDialog?.alert('Chỉ Admin được cấp Trưởng họ.','Phân quyền');return;}
          const label=role==='truongho'?'Trưởng họ':'Người có liên quan';
          if(!(await window.GiaDialog?.confirm('Đặt « '+label+' » cho '+(target.display_name||id)+'?','Xác nhận')))return;
          await window.GiaCloud.setMemberStatus(id,'approved');
          await window.GiaCloud.setMemberRole(id,role);
        }
        box.dataset.rolesUpgraded='0';
        rebuildRoles(box);
      }catch(e){
        await window.GiaDialog?.alert('Lỗi: '+(e?.message||e),'Phân quyền');
      }
    };
  });
}

loadScript('https://cdn.jsdelivr.net/gh/nguyenxuandat20091985-rgb/gia-pha-nguyen-family-tree@0bea4b6bf12cb0961e04035470a1ad020275e0d0/gate-admin.js')
  .then(()=>upgradeRolesUI())
  .catch(e=>console.error('[gate-admin]',e));
})();
