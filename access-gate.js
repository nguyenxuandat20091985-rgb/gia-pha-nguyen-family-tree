/* Access gate: bắt buộc đăng nhập + khóa tài khoản chờ duyệt / bị từ chối */
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
      '  <h2 id="gateTitle">Đăng nhập</h2>' +
      '  <p id="gateMessage" class="member-access-msg"></p>' +
      '  <p id="gateHint" class="member-access-hint"></p>' +
      '  <div class="member-access-actions">' +
      '    <button type="button" class="btn btn-primary" id="gateLogin">🔐 Đăng nhập bằng Google</button>' +
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
            btn.textContent = '🔐 Đăng nhập bằng Google';
          }
          paint();
        }, 2000);
      }
    };

    el.querySelector('#gateRefresh').onclick = async function () {
      try {
        await window.GiaCloud?.refreshProfile?.();
      } catch (_) {}
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
      el.querySelector('#gateIcon').textContent = '🔐';
      el.querySelector('#gateTitle').textContent = 'Đăng nhập để vào Gia Phả';
      el.querySelector('#gateMessage').innerHTML =
        'Ứng dụng <b>Gia Phả Họ Nguyễn</b> dành cho thành viên dòng họ.<br>Anh/chị vui lòng đăng nhập bằng Google để tiếp tục.';
      el.querySelector('#gateHint').textContent =
        'Sau khi đăng nhập, tài khoản mới có thể cần Chủ quản hoặc Trưởng họ phê duyệt.';
      setActions('login');
      return;
    }

    if (cloud.isRejected?.()) {
      el.classList.remove('hidden');
      lockApp(true);
      el.querySelector('#gateIcon').textContent = '🚫';
      el.querySelector('#gateTitle').textContent = 'Tài khoản bị từ chối';
      el.querySelector('#gateMessage').innerHTML =
        'Tài khoản <b>' + esc(cloud.state.profile?.display_name || cloud.state.user?.email || '') + '</b> chưa được chấp nhận vào dòng họ.';
      el.querySelector('#gateHint').textContent =
        'Liên hệ Chủ quản hoặc Trưởng họ nếu anh/chị cần được xét duyệt lại.';
      setActions('rejected');
      return;
    }

    if (cloud.isPending?.()) {
      el.classList.remove('hidden');
      lockApp(true);
      el.querySelector('#gateIcon').textContent = '⏳';
      el.querySelector('#gateTitle').textContent = 'Chờ duyệt vào dòng họ';
      el.querySelector('#gateMessage').innerHTML =
        'Tài khoản <b>' + esc(cloud.state.profile?.display_name || cloud.state.user?.email || '') + '</b> đang chờ <b>Chủ quản</b> hoặc <b>Trưởng họ</b> phê duyệt.';
      el.querySelector('#gateHint').textContent =
        'Sau khi được duyệt, bấm « Kiểm tra lại » hoặc đăng nhập lại để vào app.';
      setActions('pending');
      return;
    }

    el.classList.add('hidden');
    lockApp(false);
  }

  window.addEventListener('gia-auth-changed', paint);
  window.addEventListener('gia-profile-changed', paint);
  document.addEventListener('DOMContentLoaded', paint);
  setTimeout(paint, 300);
  setTimeout(paint, 1000);
  setTimeout(paint, 2500);
})();
