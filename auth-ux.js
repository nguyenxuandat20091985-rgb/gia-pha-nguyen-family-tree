/** Tài khoản thành viên — UI + thao tác (chỉ phần account) */
(function () {
  'use strict';

  let wasLoggedIn = false;
  let bound = false;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function roleLabel() {
    const c = window.GiaCloud;
    if (!c) return { text: 'Thành viên', cls: 'member' };
    if (c.isTechAdmin?.() || c.isOwner?.()) return { text: '👑 Chủ quản hệ thống', cls: 'tech' };
    if (c.isTruongHo?.()) return { text: '🏮 Trưởng họ', cls: 'truongho' };
    const p = c.state?.profile || {};
    if (p.role === 'truongho' || p.family_role === 'truongho') return { text: '🏮 Trưởng họ', cls: 'truongho' };
    return { text: '👁️ Thành viên liên quan', cls: 'member' };
  }

  function goHome() {
    if (window.GiaApp?.showView) {
      window.GiaApp.showView('home');
      return;
    }
    const homeBtn = document.querySelector('.nav-item[data-nav="home"]');
    if (homeBtn) homeBtn.click();
    else {
      document.querySelectorAll('.view').forEach(function (v) { v.classList.add('hidden'); });
      const home = document.getElementById('view-home');
      if (home) home.classList.remove('hidden');
    }
  }

  function paint() {
    const cloud = window.GiaCloud;
    const user = cloud?.state?.user || null;
    const profile = cloud?.state?.profile || null;
    const status = document.getElementById('authStatus');
    const login = document.getElementById('authLogin');
    const userBox = document.getElementById('authUser');
    const avatar = document.getElementById('authAvatar');
    const welcome = document.getElementById('authWelcome');
    const roleEl = document.getElementById('authRoleBadge');
    const emailEl = document.getElementById('authEmailLine');
    if (!status || !login || !userBox) return;

    if (user) {
      const name =
        profile?.display_name ||
        user.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        'Thành viên';
      const email = user.email || profile?.email || '';
      const initial = (String(name).trim().charAt(0) || 'N').toUpperCase();
      status.innerHTML = '<span class="status-ok">●</span> Đã đăng nhập';
      if (avatar) avatar.textContent = initial;
      if (welcome) {
        welcome.innerHTML =
          '<strong>' + esc(name) + '</strong>' +
          '<span>Chào mừng về với dòng họ</span>';
      }
      if (roleEl) {
        const r = roleLabel();
        roleEl.className = 'account-role-badge account-role-' + r.cls;
        roleEl.textContent = r.text;
        roleEl.classList.remove('hidden');
      }
      if (emailEl) {
        emailEl.textContent = email || '—';
        emailEl.classList.toggle('hidden', !email);
      }
      login.classList.add('hidden');
      userBox.classList.remove('hidden');
      const nameInput = document.getElementById('authName');
      if (nameInput && !nameInput.dataset.touched) {
        nameInput.value = profile?.display_name || user.name || '';
      }
    } else {
      status.innerHTML = 'Chưa đăng nhập — chọn Google để vào dòng họ';
      if (avatar) avatar.textContent = '👤';
      if (welcome) welcome.innerHTML = '';
      if (roleEl) roleEl.classList.add('hidden');
      if (emailEl) emailEl.classList.add('hidden');
      login.classList.remove('hidden');
      userBox.classList.add('hidden');
      wasLoggedIn = false;
    }
  }

  async function onSave() {
    const btn = document.getElementById('btnSaveProfile');
    const nameInput = document.getElementById('authName');
    const name = String(nameInput?.value || '').trim();
    if (!window.GiaCloud?.state?.user) {
      await window.GiaDialog?.alert('Anh cần đăng nhập Google trước.', 'Tài khoản');
      return;
    }
    if (!name) {
      await window.GiaDialog?.alert('Vui lòng nhập tên hiển thị.', 'Tài khoản');
      nameInput?.focus();
      return;
    }
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang lưu…';
      }
      await window.GiaCloud.upsertProfile({ display_name: name });
      if (nameInput) nameInput.dataset.touched = '';
      paint();
      await window.GiaDialog?.alert('Đã lưu thông tin tài khoản.', 'Tài khoản');
      goHome();
    } catch (e) {
      await window.GiaDialog?.alert('Không lưu được: ' + (e?.message || e), 'Tài khoản');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Lưu thông tin';
      }
    }
  }

  async function onLogout() {
    const ok = await window.GiaDialog?.confirm(
      'Đăng xuất khỏi tài khoản hiện tại?',
      'Đăng xuất'
    );
    if (!ok) return;
    try {
      await window.GiaCloud?.signOut?.();
      paint();
      await window.GiaDialog?.alert('Đã đăng xuất.', 'Tài khoản');
      goHome();
    } catch (e) {
      await window.GiaDialog?.alert('Không đăng xuất được: ' + (e?.message || e), 'Tài khoản');
    }
  }

  function bind() {
    if (bound) return;
    bound = true;
    const view = document.getElementById('view-account');
    if (!view) return;

    view.addEventListener(
      'click',
      function (e) {
        const t = e.target.closest('button, [data-account-act]');
        if (!t || !view.contains(t)) return;
        const id = t.id || t.getAttribute('data-account-act');
        if (id === 'btnSaveProfile' || id === 'save') {
          e.preventDefault();
          e.stopPropagation();
          onSave();
        } else if (id === 'btnGoHome' || id === 'home') {
          e.preventDefault();
          e.stopPropagation();
          goHome();
        } else if (id === 'btnLogout' || id === 'logout') {
          e.preventDefault();
          e.stopPropagation();
          onLogout();
        }
      },
      true
    );

    document.getElementById('authName')?.addEventListener('input', function () {
      this.dataset.touched = '1';
    });
  }

  window.addEventListener('gia-auth-changed', function () {
    const user = window.GiaCloud?.state?.user || null;
    const justLoggedIn = !!user && !wasLoggedIn;
    paint();
    if (!user) {
      wasLoggedIn = false;
      return;
    }
    wasLoggedIn = true;
    if (justLoggedIn) {
      setTimeout(function () {
        goHome();
        try {
          window.GiaDialog?.alert?.(
            'Đăng nhập thành công.\nChào mừng về với Gia Phả Họ Nguyễn!',
            'Tài khoản'
          );
        } catch (_) {}
      }, 350);
    }
  });

  window.addEventListener('gia-profile-changed', paint);

  function boot() {
    bind();
    paint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
