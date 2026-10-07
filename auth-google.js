/* Google Identity Services — local-only auth for Gia Phả Họ Nguyễn. */
(function () {
  'use strict';

  const USER_KEY = 'giaPhaGoogleUser_v1';
  const PROFILE_KEY = 'giaPhaProfile_v1';
  const MEMBERS_KEY = 'giaPhaMembers_v1';
  const AUTO_APPROVAL_KEY = 'giaPhaAutoApproval_v1';
  const OWNER_EMAIL = 'nguyenxuandat20091985@gmail.com';
  const OWNER_ID_KEY = 'giaPhaOwnerId_v1';
  const HOME_URL = 'https://gia-pha-nguyen-hazel.vercel.app/?v=24';
  const CLIENT_ID = '408192797989-d8uuj830okbfd0jvefnbhbsg8f3qo7o7.apps.googleusercontent.com';

  const state = { ready: true, user: null, profile: null };

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readMembers() { return read(MEMBERS_KEY, {}); }
  function writeMembers(rows) { write(MEMBERS_KEY, rows); }
  function autoApprovalEnabled() { return localStorage.getItem(AUTO_APPROVAL_KEY) === 'true'; }
  function ownerId() { return localStorage.getItem(OWNER_ID_KEY) || ''; }
  function isOwner(user) {
    if (!user) return false;
    const email = String(user.email || '').trim().toLowerCase();
    const savedOwner = ownerId();
    return email === OWNER_EMAIL || (!!savedOwner && savedOwner === user.sub);
  }
  function claimOwnerIfNeeded(user) {
    if (!user) return false;
    if (isOwner(user)) {
      if (!ownerId()) localStorage.setItem(OWNER_ID_KEY, user.sub);
      return true;
    }
    if (!ownerId() && Object.keys(readMembers()).length === 0) {
      localStorage.setItem(OWNER_ID_KEY, user.sub);
      return true;
    }
    return false;
  }
  function ensureOwnerRecord(user, row) {
    if (!user || !row || !isOwner(user)) return row;
    // Chủ quản = tech admin only — không kiêm Trưởng họ
    row.role = 'admin';
    row.family_role = 'member';
    row.member_role = 'member';
    row.is_admin = true;
    row.is_owner = true;
    row.is_tech_admin = true;
    row.status = 'approved';
    return row;
  }
  function ensureMember(user, profile) {
    const rows = readMembers();
    claimOwnerIfNeeded(user);
    const id = user.sub;
    const existing = rows[id];
    if (!existing) {
      rows[id] = Object.assign({
        id,
        email: user.email || '',
        display_name: profile.display_name || user.name || 'Thành viên',
        avatar_url: profile.avatar_url || user.picture || '',
        role: 'member',
        status: autoApprovalEnabled() ? 'approved' : 'pending',
        created_at: new Date().toISOString()
      }, profile);
      writeMembers(rows);
    } else {
      rows[id] = Object.assign({}, existing, {
        email: user.email || existing.email || '',
        display_name: profile.display_name || existing.display_name || user.name || 'Thành viên',
        avatar_url: profile.avatar_url || existing.avatar_url || user.picture || ''
      });
      writeMembers(rows);
    }
    rows[id] = ensureOwnerRecord(user, rows[id]);
    writeMembers(rows);
    return rows[id];
  }

  function decodeJwtPayload(token) {
    const part = String(token || '').split('.')[1];
    if (!part) throw new Error('Google không trả về thông tin tài khoản hợp lệ.');
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '='))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  }

  function applyUser(payload) {
    const user = {
      sub: payload.sub || '',
      name: payload.name || payload.given_name || 'Thành viên',
      email: payload.email || '',
      picture: payload.picture || '',
      email_verified: payload.email_verified === true
    };
    state.user = user;
    state.profile = Object.assign(
      { id: user.sub, display_name: user.name, avatar_url: user.picture, email: user.email, status: 'pending', role: 'member' },
      read(PROFILE_KEY, {})
    );
    state.profile.display_name = state.profile.display_name || user.name;
    state.profile.avatar_url = state.profile.avatar_url || user.picture;
    state.profile.email = state.profile.email || user.email;
    const member = ensureMember(user, state.profile);
    state.profile = Object.assign({}, state.profile, member);
    write(USER_KEY, user);
    write(PROFILE_KEY, state.profile);
    emit('gia-auth-changed', { user });
    emit('gia-profile-changed', { profile: state.profile });
  }

  function restoreUser() {
    const user = read(USER_KEY, null);
    if (user && user.email) {
      state.user = user;
      state.profile = Object.assign(
        { id: user.sub, display_name: user.name, avatar_url: user.picture, email: user.email, status: 'pending', role: 'member' },
        read(PROFILE_KEY, {})
      );
      const member = ensureMember(user, state.profile);
      state.profile = Object.assign({}, state.profile, member);
      emit('gia-auth-changed', { user });
      emit('gia-profile-changed', { profile: state.profile });
    }
  }

  function onGoogleCredential(response) {
    try {
      const payload = decodeJwtPayload(response.credential);
      if (!payload.email || payload.email_verified !== true) {
        throw new Error('Tài khoản Google chưa xác minh email.');
      }
      applyUser(payload);
      setTimeout(function () {
        window.location.replace(HOME_URL);
      }, 150);
    } catch (error) {
      const status = document.getElementById('authStatus');
      if (status) status.textContent = 'Không thể đăng nhập Google: ' + (error.message || 'Lỗi không xác định.');
      console.error('Google Identity Services:', error);
    }
  }

  function initGoogle() {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return false;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: onGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    const host = document.getElementById('btnGoogle');
    if (host) {
      host.innerHTML = '';
      window.google.accounts.id.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: Math.min(420, Math.max(280, host.clientWidth || 360))
      });
    }
    return true;
  }

  function bootGoogle() {
    if (initGoogle()) return;
    setTimeout(bootGoogle, 250);
  }

  async function signOut() {
    state.user = null;
    state.profile = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROFILE_KEY);
    if (window.google?.accounts?.id) {
      try { window.google.accounts.id.disableAutoSelect(); } catch (_) {}
    }
    emit('gia-auth-changed', { user: null });
    emit('gia-profile-changed', { profile: null });
  }

  async function upsertProfile(fields) {
    if (!state.user) throw new Error('Chưa đăng nhập.');
    const profile = Object.assign({}, state.profile || {}, fields || {}, {
      id: state.user.sub,
      email: state.user.email,
      status: state.profile?.status || (autoApprovalEnabled() ? 'approved' : 'pending')
    });
    profile.display_name = String(profile.display_name || state.user.name || '').trim() || state.user.name;
    profile.avatar_url = profile.avatar_url || state.user.picture || '';
    state.profile = profile;
    write(PROFILE_KEY, profile);
    emit('gia-profile-changed', { profile });
    return profile;
  }

  function ensureProfile() {
    if (!state.user) return null;
    if (!state.profile) {
      state.profile = {
        id: state.user.sub,
        display_name: state.user.name,
        email: state.user.email,
        avatar_url: state.user.picture || '',
        status: 'approved'
      };
      write(PROFILE_KEY, state.profile);
    }
    return state.profile;
  }

  function isTechAdminFn() {
    return !!state.user && isOwner(state.user);
  }
  function isTruongHoFn() {
    const p = state.profile;
    return !!p && (p.role === 'truongho' || p.family_role === 'truongho') && (!p.status || p.status === 'approved') && !isTechAdminFn();
  }
  function canManageMembersFn() {
    return isTechAdminFn() || isTruongHoFn();
  }

  window.GiaCloud = {
    state,
    signInGoogle: async function () {
      initGoogle();
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
      } else {
        throw new Error('Google Identity Services chưa tải xong. Vui lòng thử lại.');
      }
    },
    signOut,
    upsertProfile,
    ensureProfile,
    refreshProfile: async function () { return state.profile; },
    isConfigured: function () { return true; },
    isApproved: function () { return !!state.user && (!state.profile?.status || state.profile.status === 'approved'); },
    isPending: function () { return !!state.user && state.profile?.status === 'pending'; },
    isRejected: function () { return !!state.user && state.profile?.status === 'rejected'; },
    isAdmin: function () { return isTechAdminFn(); },
    isTechAdmin: isTechAdminFn,
    isTruongHo: isTruongHoFn,
    canManageMembers: canManageMembersFn,
    listMembers: async function () {
      if (state.user) ensureMember(state.user, state.profile || {});
      return Object.values(readMembers()).sort((a,b) => String(a.display_name||'').localeCompare(String(b.display_name||''),'vi'));
    },
    setMemberStatus: async function (id, status) {
      if (!canManageMembersFn()) throw new Error('Bạn không có quyền duyệt thành viên.');
      const rows = readMembers(); if (!rows[id]) throw new Error('Không tìm thấy thành viên.');
      if (rows[id].is_owner || String(rows[id].email||'').trim().toLowerCase() === OWNER_EMAIL) {
        throw new Error('Không đổi trạng thái tài khoản Chủ quản.');
      }
      rows[id].status = status; writeMembers(rows);
      if (state.user?.sub === id) { state.profile = Object.assign({}, state.profile, rows[id]); write(PROFILE_KEY, state.profile); emit('gia-profile-changed', {profile: state.profile}); emit('gia-auth-changed', {user: state.user}); }
      return rows[id];
    },
    setMemberRole: async function (id, role) {
      const rows = readMembers(); if (!rows[id]) throw new Error('Không tìm thấy thành viên.');
      if (rows[id].is_owner || String(rows[id].email || '').trim().toLowerCase() === OWNER_EMAIL) {
        throw new Error('Tài khoản Chủ quản được bảo vệ, không đổi quyền.');
      }
      if (role === 'truongho' || role === 'admin') {
        if (!isTechAdminFn()) throw new Error('Chỉ Chủ quản hệ thống mới được cấp / thu hồi Trưởng họ.');
        role = 'truongho';
      } else {
        role = 'member';
        if (!canManageMembersFn()) throw new Error('Bạn không có quyền đặt Thành viên liên quan.');
      }
      rows[id].role = role;
      rows[id].family_role = role === 'truongho' ? 'truongho' : 'member';
      rows[id].member_role = role === 'truongho' ? 'truongho' : 'member';
      rows[id].is_admin = false;
      rows[id].status = 'approved';
      writeMembers(rows);
      if (state.user?.sub === id) {
        state.profile = Object.assign({}, state.profile, rows[id]);
        write(PROFILE_KEY, state.profile);
        emit('gia-profile-changed', {profile: state.profile});
        emit('gia-auth-changed', {user: state.user});
      }
      return rows[id];
    },
    getAutoApproval: function () { return autoApprovalEnabled(); },
    isOwner: function () { return !!state.user && isOwner(state.user); },
    claimOwner: function () { if (!state.user) return false; const ok=claimOwnerIfNeeded(state.user); const m=ensureMember(state.user,state.profile||{}); state.profile=Object.assign({},state.profile,m); write(PROFILE_KEY,state.profile); return ok || isOwner(state.user); },
    setAutoApproval: async function (enabled) { localStorage.setItem(AUTO_APPROVAL_KEY, enabled ? 'true' : 'false'); return enabled; }
  };

  restoreUser();
  document.addEventListener('DOMContentLoaded', bootGoogle);
  bootGoogle();
})();
