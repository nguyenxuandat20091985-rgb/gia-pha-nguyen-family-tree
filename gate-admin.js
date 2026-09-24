/** Gate + Admin panel – load after auth-ux.js */
(function () {
  'use strict';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function ensureGateEl() {
    let el = document.getElementById('accessGate');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'accessGate';
    el.className = 'access-gate hidden';
    el.innerHTML =
      '<div class="access-gate-card">' +
      '<div class="access-gate-icon" id="gateIcon">⏳</div>' +
      '<h2 id="gateTitle">Chờ duyệt</h2>' +
      '<p id="gateMsg"></p>' +
      '<button type="button" class="btn btn-primary btn-block" id="gateAccount">👤 Xem tài khoản</button>' +
      '<button type="button" class="btn btn-logout btn-block" id="gateLogout">Đăng xuất</button>' +
      '</div>';
    document.body.appendChild(el);
    document.getElementById('gateAccount')?.addEventListener('click', function () {
      el.classList.add('hidden');
      document.querySelector('.more-item[data-nav="account"]')?.click();
    });
    document.getElementById('gateLogout')?.addEventListener('click', async function () {
      try { await window.GiaCloud.signOut(); } catch (e) {}
    });
    return el;
  }

  function updateGate() {
    const cloud = window.GiaCloud;
    const el = ensureGateEl();
    if (!cloud?.state?.user) {
      el.classList.add('hidden');
      document.body.classList.remove('gate-active');
      return;
    }
    const p = cloud.state.profile;
    // Profile chưa load: chờ
    if (!p) {
      el.classList.remove('hidden');
      document.body.classList.add('gate-active');
      document.getElementById('gateIcon').textContent = '⏳';
      document.getElementById('gateTitle').textContent = 'Đang tải hồ sơ…';
      document.getElementById('gateMsg').textContent = 'Vui lòng chờ giây lát.';
      return;
    }
    if (p.status === 'approved') {
      el.classList.add('hidden');
      document.body.classList.remove('gate-active');
      return;
    }
    el.classList.remove('hidden');
    document.body.classList.add('gate-active');
    if (p.status === 'rejected') {
      document.getElementById('gateIcon').textContent = '🚫';
      document.getElementById('gateTitle').textContent = 'Không được duyệt';
      document.getElementById('gateMsg').textContent =
        'Tài khoản của bạn chưa được Admin dòng họ chấp nhận. Liên hệ người quản lý gia phả để được hỗ trợ.';
    } else {
      document.getElementById('gateIcon').textContent = '⏳';
      document.getElementById('gateTitle').textContent = 'Chờ Admin duyệt';
      document.getElementById('gateMsg').textContent =
        'Xin chào ' + (p.display_name || 'thành viên') +
        '. Tài khoản đã đăng nhập thành công nhưng cần Admin dòng họ duyệt trước khi sử dụng đầy đủ.';
    }
  }

  function ensureAdminMenu() {
    const more = document.querySelector('#view-more .more-menu');
    if (!more || document.querySelector('[data-nav="admin"]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-item hidden';
    btn.dataset.nav = 'admin';
    btn.id = 'btnAdminMenu';
    btn.textContent = '🛡️ Quản trị thành viên';
    const accountBtn = more.querySelector('[data-nav="account"]');
    if (accountBtn) more.insertBefore(btn, accountBtn);
    else more.appendChild(btn);
    btn.addEventListener('click', function () {
      showAdminView();
    });
  }

  function ensureAdminView() {
    let view = document.getElementById('view-admin');
    if (view) return view;
    view = document.createElement('section');
    view.id = 'view-admin';
    view.className = 'view hidden';
    view.innerHTML =
      '<div class="admin-panel">' +
      '<h2>🛡️ Quản trị thành viên</h2>' +
      '<p class="muted">Duyệt người đăng nhập Google vào dòng họ. Chỉ Admin mới thấy mục này.</p>' +
      '<div class="admin-tabs">' +
      '<button type="button" class="admin-tab active" data-filter="pending">Chờ duyệt</button>' +
      '<button type="button" class="admin-tab" data-filter="approved">Đã duyệt</button>' +
      '<button type="button" class="admin-tab" data-filter="all">Tất cả</button>' +
      '</div>' +
      '<div id="adminMemberList" class="admin-list"></div>' +
      '<button type="button" class="btn btn-outline btn-block" id="btnAdminRefresh">🔄 Làm mới</button>' +
      '</div>';
    document.getElementById('mainContent')?.appendChild(view);

    view.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        view.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderAdminList(tab.dataset.filter);
      });
    });
    document.getElementById('btnAdminRefresh')?.addEventListener('click', function () {
      const f = view.querySelector('.admin-tab.active')?.dataset.filter || 'pending';
      renderAdminList(f);
    });
    return view;
  }

  function showAdminView() {
    if (!window.GiaCloud?.isAdmin?.()) {
      alert('Chỉ Admin mới vào được.');
      return;
    }
    ensureAdminView();
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-admin')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.nav === 'more');
    });
    renderAdminList('pending');
    window.scrollTo(0, 0);
  }

  async function renderAdminList(filter) {
    const box = document.getElementById('adminMemberList');
    if (!box) return;
    box.innerHTML = '<p class="muted">Đang tải…</p>';
    try {
      const list = await window.GiaCloud.listMembers();
      let rows = list;
      if (filter === 'pending') rows = list.filter(x => x.status === 'pending');
      else if (filter === 'approved') rows = list.filter(x => x.status === 'approved');

      if (!rows.length) {
        box.innerHTML = '<div class="empty-state"><p>Không có thành viên nào.</p></div>';
        return;
      }

      box.innerHTML = rows.map(function (m) {
        const st = m.status || 'pending';
        const role = m.role || 'member';
        const badge =
          st === 'approved' ? '<span class="badge badge-ok">Đã duyệt</span>' :
          st === 'rejected' ? '<span class="badge badge-no">Từ chối</span>' :
          '<span class="badge badge-wait">Chờ duyệt</span>';
        const roleBadge = role === 'admin' ? '<span class="badge badge-admin">Admin</span>' : '';
        const when = m.created_at ? new Date(m.created_at).toLocaleDateString('vi-VN') : '';
        return (
          '<div class="admin-row" data-id="' + esc(m.id) + '">' +
          '<div class="admin-row-main">' +
          '<strong>' + esc(m.display_name || 'Chưa đặt tên') + '</strong>' +
          badge + roleBadge +
          '<div class="muted" style="font-size:.75rem">Tham gia: ' + esc(when) + '</div>' +
          '</div>' +
          '<div class="admin-row-actions">' +
          (st !== 'approved' ? '<button type="button" class="btn btn-sm btn-approve" data-act="approve">Duyệt</button>' : '') +
          (st !== 'rejected' ? '<button type="button" class="btn btn-sm btn-reject" data-act="reject">Từ chối</button>' : '') +
          (role !== 'admin' ? '<button type="button" class="btn btn-sm" data-act="make-admin">Cho Admin</button>' :
            '<button type="button" class="btn btn-sm" data-act="make-member">Bỏ Admin</button>') +
          '</div></div>'
        );
      }).join('');

      box.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const row = btn.closest('.admin-row');
          const id = row?.dataset.id;
          const act = btn.dataset.act;
          if (!id) return;
          btn.disabled = true;
          try {
            if (act === 'approve') await window.GiaCloud.setMemberStatus(id, 'approved');
            if (act === 'reject') await window.GiaCloud.setMemberStatus(id, 'rejected');
            if (act === 'make-admin') {
              await window.GiaCloud.setMemberStatus(id, 'approved');
              await window.GiaCloud.setMemberRole(id, 'admin');
            }
            if (act === 'make-member') await window.GiaCloud.setMemberRole(id, 'member');
            const f = document.querySelector('.admin-tab.active')?.dataset.filter || 'pending';
            await renderAdminList(f);
          } catch (e) {
            alert(e?.message || e);
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      box.innerHTML = '<p class="warn-text">' + esc(e?.message || String(e)) + '</p>';
    }
  }

  function refreshAdminMenuVisibility() {
    ensureAdminMenu();
    const btn = document.getElementById('btnAdminMenu');
    if (!btn) return;
    if (window.GiaCloud?.isAdmin?.()) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
  }

  // Chặn thao tác ghi nếu chưa duyệt
  function guardWrite(e) {
    if (!window.GiaCloud?.state?.user) return;
    if (window.GiaCloud.isApproved?.()) return;
    const t = e.target.closest(
      '#btnAddRoot,#btnAddEvent,#btnAddPost,#btnSendChat,#personForm,#eventForm,#postForm'
    );
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    updateGate();
    alert('Tài khoản đang chờ Admin duyệt. Bạn chưa thể thêm dữ liệu.');
  }

  document.addEventListener('click', guardWrite, true);
  document.addEventListener('submit', guardWrite, true);

  window.addEventListener('gia-auth-changed', function () {
    setTimeout(async function () {
      try { await window.GiaCloud?.ensureProfile?.(); } catch (e) {}
      updateGate();
      refreshAdminMenuVisibility();
    }, 200);
  });
  window.addEventListener('gia-profile-changed', function () {
    updateGate();
    refreshAdminMenuVisibility();
  });

  setTimeout(function () {
    ensureGateEl();
    ensureAdminMenu();
    updateGate();
    refreshAdminMenuVisibility();
  }, 400);
  setTimeout(function () {
    updateGate();
    refreshAdminMenuVisibility();
  }, 1500);
})();
