/* Access gate: khóa tài khoản chờ duyệt / bị từ chối */
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
      '  <div class="member-access-icon" id="gateIcon">⏳</div>' +
      '  <h2 id="gateTitle">Chờ duyệt</h2>' +
      '  <p id="gateMessage" class="member-access-msg"></p>' +
      '  <p id="gateHint" class="member-access-hint"></p>' +
      '  <div class="member-access-actions">' +
      '    <button type="button" class="btn btn-outline" id="gateRefresh">🔄 Kiểm tra lại</button>' +
      '    <button type="button" class="btn btn-logout" id="gateLogout">🚪 Đăng xuất</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(el);

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
      if (window.GiaApp?.showView) window.GiaApp.showView('home');
    };
    return el;
  }

  function paint() {
    const cloud = window.GiaCloud;
    const el = ensureGate();
    if (!cloud || !cloud.state?.user) {
      el.classList.add('hidden');
      document.body.classList.remove('member-gate-active');
      return;
    }
    if (cloud.isTechAdmin?.() || cloud.isOwner?.()) {
      el.classList.add('hidden');
      document.body.classList.remove('member-gate-active');
      return;
    }
    if (cloud.isRejected?.()) {
      el.classList.remove('hidden');
      document.body.classList.add('member-gate-active');
      el.querySelector('#gateIcon').textContent = '🚫';
      el.querySelector('#gateTitle').textContent = 'Tài khoản bị từ chối';
      el.querySelector('#gateMessage').innerHTML =
        'Tài khoản <b>' + esc(cloud.state.profile?.display_name || cloud.state.user?.email || '') + '</b> chưa được chấp nhận vào dòng họ.';
      el.querySelector('#gateHint').textContent =
        'Liên hệ Chủ quản hoặc Trưởng họ nếu anh/chị cần được xét duyệt lại.';
      return;
    }
    if (cloud.isPending?.()) {
      el.classList.remove('hidden');
      document.body.classList.add('member-gate-active');
      el.querySelector('#gateIcon').textContent = '⏳';
      el.querySelector('#gateTitle').textContent = 'Chờ duyệt vào dòng họ';
      el.querySelector('#gateMessage').innerHTML =
        'Tài khoản <b>' + esc(cloud.state.profile?.display_name || cloud.state.user?.email || '') + '</b> đang chờ <b>Chủ quản</b> hoặc <b>Trưởng họ</b> phê duyệt.';
      el.querySelector('#gateHint').textContent =
        'Sau khi được duyệt, bấm « Kiểm tra lại » hoặc đăng nhập lại để vào app.';
      return;
    }
    el.classList.add('hidden');
    document.body.classList.remove('member-gate-active');
  }

  window.addEventListener('gia-auth-changed', paint);
  window.addEventListener('gia-profile-changed', paint);
  document.addEventListener('DOMContentLoaded', paint);
  setTimeout(paint, 400);
  setTimeout(paint, 1500);
})();
