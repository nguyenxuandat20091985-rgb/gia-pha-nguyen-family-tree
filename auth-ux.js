/** Auth UX enhancements — load after app.js */
(function () {
  'use strict';
  let wasLoggedIn = false;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function enhanceRenderAuth() {
    const cloud = window.GiaCloud;
    const user = cloud?.state?.user || null;
    const profile = cloud?.state?.profile || null;
    const status = document.getElementById('authStatus');
    const login = document.getElementById('authLogin');
    const userBox = document.getElementById('authUser');
    const avatar = document.getElementById('authAvatar');
    const welcome = document.getElementById('authWelcome');
    if (!status || !login || !userBox) return;

    if (user) {
      const name = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || user.phone || 'Thành viên';
      const initial = (name.trim().charAt(0) || 'N').toUpperCase();
      status.innerHTML = '<span class="status-ok">●</span> Đã đăng nhập';
      if (avatar) avatar.textContent = initial;
      if (welcome) welcome.innerHTML = '<strong>' + esc(name) + '</strong><span>Chào mừng về với dòng họ</span>';
      login.classList.add('hidden');
      userBox.classList.remove('hidden');
      const nameInput = document.getElementById('authName');
      if (nameInput && !nameInput.dataset.touched) {
        nameInput.value = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
      }
    } else {
      status.textContent = 'Chưa đăng nhập — chọn Google để vào dòng họ';
      if (avatar) avatar.textContent = '👤';
      if (welcome) welcome.innerHTML = '';
      login.classList.remove('hidden');
      userBox.classList.add('hidden');
      wasLoggedIn = false;
    }
  }

  function goHome() {
    const homeBtn = document.querySelector('.nav-item[data-nav="home"]');
    if (homeBtn) homeBtn.click();
    else {
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      const home = document.getElementById('view-home');
      if (home) home.classList.remove('hidden');
    }
  }

  document.getElementById('authName')?.addEventListener('input', function () {
    this.dataset.touched = '1';
  });

  document.getElementById('btnGoHome')?.addEventListener('click', goHome);

  // After save → về trang chủ
  const btnSave = document.getElementById('btnSaveProfile');
  if (btnSave && !btnSave.dataset.uxBound) {
    btnSave.dataset.uxBound = '1';
    btnSave.addEventListener('click', function () {
      setTimeout(function () {
        if (window.GiaCloud?.state?.profile) goHome();
      }, 900);
    });
  }

  window.addEventListener('gia-auth-changed', function () {
    const user = window.GiaCloud?.state?.user || null;
    const justLoggedIn = !!user && !wasLoggedIn;
    enhanceRenderAuth();
    if (!user) {
      wasLoggedIn = false;
      return;
    }
    wasLoggedIn = true;
    if (justLoggedIn) {
      setTimeout(function () {
        goHome();
        try {
          if (typeof customAlert === 'function') {
            customAlert('Đăng nhập thành công.\nChào mừng về với Gia Phả Họ Nguyễn!');
          }
        } catch (e) {}
      }, 400);
    }
  });

  window.addEventListener('gia-profile-changed', enhanceRenderAuth);

  // Initial paint
  setTimeout(enhanceRenderAuth, 300);
  setTimeout(enhanceRenderAuth, 1200);
})();
