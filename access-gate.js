/* Access gate v3: Đăng nhập/Đăng ký Google → Chờ duyệt → Vào app */
(function () {
  'use strict';

  const GATE_ID = 'memberAccessGate';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function ensureGate() {
    let el = document.getElementById(GATE_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = GATE_ID;
    el.className = 'member-access-gate hidden';
    el.innerHTML =
      '<div class="member-access-card" role="dialog" aria-modal="true">' +
      '  <div class="member-access-icon" id="gateIcon">🔐</div>' +
      '  <h2 id="gateTitle">Đăng nhập / Đăng ký</h2>' +
      '  <p id="gateMessage" class="member-access-msg"></p>' +
      '  <p id="gateHint" class="member-access-hint"></p>' +
      '  <div class="member-access-actions">' +
      '    <button type="button" class="btn btn-primary" id="gateLogin">Tiếp tục với Google</button>' +
      '    <button type="button" class="btn btn-outline" id="gateRefresh">🔄 Kiểm tra lại</button>' +
      '    <button type="button" class="btn btn-logout" id="gateLogout">🚪 Đăng xuất</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('#gateLogin').onclick = async function () {
      var btn = el.querySelector('#gateLogin');
      try {
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Đang mở Google…';
        }
        if (window.GiaCloud && typeof window.GiaCloud.signInGoogle === 'function') {
          await window.GiaCloud.signInGoogle();
        } else if (window.GiaApp && window.GiaApp.showView) {
          window.GiaApp.showView('account');
        }
      } catch (e) {
        console.warn('gate login', e);
      } finally {
        setTimeout(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Tiếp tục với Google';
          }
          paint();
        }, 2500);
      }
    };

    el.querySelector('#gateRefresh').onclick = async function () {
      var btn = el.querySelector('#gateRefresh');
      try {
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Đang kiểm tra…';
        }
        await window.GiaCloud?.refreshProfile?.();
      } catch (_) {}
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔄 Kiểm tra lại';
      }
      paint();
    };

    el.querySelector('#gateLogout').onclick = async function () {
      try {
        await window.GiaCloud?.signOut?.();
      } catch (_) {}
      paint();
    };

    return el;
  }

  function setActions(mode) {
    var el = ensureGate();
    var login = el.querySelector('#gateLogin');
    var refresh = el.querySelector('#gateRefresh');
    var logout = el.querySelector('#gateLogout');
    if (login) login.style.display = mode === 'login' ? '' : 'none';
    if (refresh) refresh.style.display = mode === 'pending' || mode === 'rejected' ? '' : 'none';
    if (logout) logout.style.display = mode === 'pending' || mode === 'rejected' ? '' : 'none';
  }

  function lockApp(on) {
    if (on) document.body.classList.add('member-gate-active');
    else document.body.classList.remove('member-gate-active');
  }

  function applyAutoApprovalIfNeeded() {
    try {
      var cloud = window.GiaCloud;
      if (!cloud || !cloud.state || !cloud.state.user) return;
      if (cloud.isTechAdmin?.() || cloud.isOwner?.()) return;
      if (!cloud.getAutoApproval || !cloud.getAutoApproval()) return;
      if (!cloud.isPending || !cloud.isPending()) return;

      var profile = Object.assign({}, cloud.state.profile || {}, { status: 'approved' });
      cloud.state.profile = profile;
      try {
        localStorage.setItem('giaPhaProfile_v1', JSON.stringify(profile));
      } catch (_) {}

      try {
        var cfg = window.GIA_SUPABASE_CONFIG || {};
        if (cfg.url && cfg.anonKey && window.supabase) {
          var sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true }
          });
          sb.auth.getSession().then(function (res) {
            var uid = res && res.data && res.data.session && res.data.session.user && res.data.session.user.id;
            if (!uid) return;
            sb.from('profiles').update({ status: 'approved' }).eq('id', uid).then(function () {
              window.dispatchEvent(new CustomEvent('gia-profile-changed', { detail: { profile: profile } }));
            });
          });
        }
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('gia-profile-changed', { detail: { profile: profile } }));
    } catch (_) {}
  }

  function paint() {
    var cloud = window.GiaCloud;
    var el = ensureGate();

    if (!cloud) {
      el.classList.add('hidden');
      lockApp(false);
      return;
    }

    if (cloud.isTechAdmin?.() || cloud.isOwner?.()) {
      el.classList.add('hidden');
      lockApp(false);
      return;
    }

    if (!cloud.state?.user) {
      el.classList.remove('hidden');
      lockApp(true);
      el.querySelector('#gateIcon').textContent = '🌿';
      el.querySelector('#gateTitle').textContent = 'Đăng nhập / Đăng ký';
      el.querySelector('#gateMessage').innerHTML =
        'Chào mừng đến <b>Gia Phả Họ Nguyễn</b>.<br>' +
        'Thành viên mới bấm <b>Tiếp tục với Google</b> để đăng ký.<br>' +
        'Thành viên cũ dùng cùng tài khoản Google để đăng nhập.';
      el.querySelector('#gateHint').textContent =
        'Tài khoản mới sẽ chờ Chủ quản hoặc Trưởng họ phê duyệt (trừ khi bật tự động duyệt).';
      setActions('login');
      return;
    }

    applyAutoApprovalIfNeeded();

    if (cloud.isRejected?.()) {
      el.classList.remove('hidden');
      lockApp(true);
      el.querySelector('#gateIcon').textContent = '🚫';
      el.querySelector('#gateTitle').textContent = 'Tài khoản bị từ chối';
      el.querySelector('#gateMessage').innerHTML =
        'Yêu cầu của <b>' + esc(cloud.state.profile?.display_name || cloud.state.user?.email || '') + '</b> chưa được chấp nhận vào dòng họ.';
      el.querySelector('#gateHint').textContent =
        'Liên hệ Chủ quản hoặc Trưởng họ nếu cần xét duyệt lại. Có thể đăng xuất và dùng tài khoản khác.';
      setActions('rejected');
      return;
    }

    if (cloud.isPending?.()) {
      el.classList.remove('hidden');
      lockApp(true);
      el.querySelector('#gateIcon').textContent = '⏳';
      el.querySelector('#gateTitle').textContent = 'Đã gửi yêu cầu';
      el.querySelector('#gateMessage').innerHTML =
        'Đã gửi yêu cầu tham gia dòng họ.<br>' +
        'Tài khoản <b>' + esc(cloud.state.profile?.display_name || cloud.state.user?.email || '') + '</b><br>' +
        'Vui lòng chờ <b>Chủ quản</b> hoặc <b>Trưởng họ</b> phê duyệt.';
      el.querySelector('#gateHint').textContent =
        'Sau khi được duyệt, bấm « Kiểm tra lại » để vào app.';
      setActions('pending');
      return;
    }

    el.classList.add('hidden');
    lockApp(false);
  }

  window.addEventListener('gia-auth-changed', function () {
    setTimeout(paint, 100);
    setTimeout(paint, 800);
  });
  window.addEventListener('gia-profile-changed', function () {
    setTimeout(paint, 100);
  });
  document.addEventListener('DOMContentLoaded', paint);
  setTimeout(paint, 300);
  setTimeout(paint, 1000);
  setTimeout(paint, 2500);
  setTimeout(paint, 5000);
})();
