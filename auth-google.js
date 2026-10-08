/* Google Identity Services + Supabase sync — Gia Phả Họ Nguyễn */
(function () {
  'use strict';

  const USER_KEY = 'giaPhaGoogleUser_v1';
  const PROFILE_KEY = 'giaPhaProfile_v1';
  const MEMBERS_KEY = 'giaPhaMembers_v1';
  const AUTO_APPROVAL_KEY = 'giaPhaAutoApproval_v1';
  const OWNER_EMAIL = 'nguyenxuandat20091985@gmail.com';
  const OWNER_ID_KEY = 'giaPhaOwnerId_v1';
  const TECH_ADMIN_ID = 'cf17b596-f674-4431-aa7f-506f955624ab';
  const HOME_URL = 'https://gia-pha-nguyen-hazel.vercel.app/';
  const CLIENT_ID = '408192797989-d8uuj830okbfd0jvefnbhbsg8f3qo7o7.apps.googleusercontent.com';

  const state = { ready: true, user: null, profile: null, cloudReady: false };
  let sb = null;

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

  function isOwnerUser(user) {
    if (!user) return false;
    const email = String(user.email || '').trim().toLowerCase();
    const id = String(user.sub || user.id || '');
    return email === OWNER_EMAIL || id === TECH_ADMIN_ID || (!!ownerId() && ownerId() === id);
  }

  function claimOwnerIfNeeded(user) {
    if (!user) return false;
    if (isOwnerUser(user)) {
      if (!ownerId()) localStorage.setItem(OWNER_ID_KEY, user.sub || user.id);
      return true;
    }
    if (!ownerId() && Object.keys(readMembers()).length === 0) {
      localStorage.setItem(OWNER_ID_KEY, user.sub || user.id);
      return true;
    }
    return false;
  }

  function ensureOwnerRecord(user, row) {
    if (!user || !row || !isOwnerUser(user)) return row;
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
    const id = user.sub || user.id;
    const existing = rows[id];
    if (!existing) {
      rows[id] = Object.assign({
        id,
        email: user.email || '',
        display_name: (profile && profile.display_name) || user.name || 'Thành viên',
        avatar_url: (profile && profile.avatar_url) || user.picture || '',
        role: 'member',
        status: autoApprovalEnabled() ? 'approved' : 'pending',
        created_at: new Date().toISOString()
      }, profile || {});
    } else {
      rows[id] = Object.assign({}, existing, {
        email: user.email || existing.email || '',
        display_name: (profile && profile.display_name) || existing.display_name || user.name || 'Thành viên',
        avatar_url: (profile && profile.avatar_url) || existing.avatar_url || user.picture || ''
      });
    }
    rows[id] = ensureOwnerRecord(user, rows[id]);
    writeMembers(rows);
    return rows[id];
  }

  function initSupabase() {
    const cfg = window.GIA_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
    try {
      sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      state.cloudReady = true;
      return sb;
    } catch (e) {
      console.warn('Supabase init', e);
      return null;
    }
  }

  async function cloudSignInWithGoogleIdToken(idToken) {
    if (!sb) initSupabase();
    if (!sb || !idToken) return null;
    try {
      const { data, error } = await sb.auth.signInWithIdToken({
        provider: 'google',
        token: idToken
      });
      if (error) throw error;
      return data?.session || null;
    } catch (e) {
      console.warn('signInWithIdToken', e);
      return null;
    }
  }

  function isWebView() {
    var ua = navigator.userAgent || '';
    return /; wv\)|WebView/i.test(ua);
  }

  async function signInWithOAuthGoogle() {
    if (!sb) initSupabase();
    if (!sb) {
      if (window.GiaDialog) window.GiaDialog.alert('Chưa kết nối được máy chủ đăng nhập. Thử lại sau.', 'Đăng nhập');
      else alert('Chưa kết nối được máy chủ đăng nhập.');
      return;
    }
    try {
      var redirectTo = (window.location.origin || HOME_URL.replace(/\/$/, '')) + '/';
      var res = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
          skipBrowserRedirect: false
        }
      });
      if (res && res.error) {
        console.warn('OAuth', res.error);
        if (window.GiaDialog) window.GiaDialog.alert('Không mở được Google: ' + (res.error.message || res.error), 'Đăng nhập');
        else alert('Không mở được Google: ' + (res.error.message || res.error));
      }
    } catch (e) {
      console.warn('OAuth exception', e);
      if (window.GiaDialog) window.GiaDialog.alert('Lỗi đăng nhập: ' + (e.message || e), 'Đăng nhập');
      else alert('Lỗi đăng nhập: ' + (e.message || e));
    }
  }

  function renderLoginButton(host) {
    if (!host) return;
    host.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;width:100%;';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btnGoogleOAuth';
    btn.className = 'btn btn-primary btn-block';
    btn.style.cssText = 'padding:14px 16px;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;';
    btn.innerHTML = '<span style="font-size:20px">G</span> Đăng nhập bằng Google';
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = 'Đang mở Google…';
      signInWithOAuthGoogle().finally(function () {
        setTimeout(function () {
          btn.disabled = false;
          btn.innerHTML = '<span style="font-size:20px">G</span> Đăng nhập bằng Google';
        }, 2500);
      });
    });
    wrap.appendChild(btn);
    var hint = document.createElement('p');
    hint.className = 'auth-hint';
    hint.style.cssText = 'margin:0;font-size:13px;color:#6d5a5a;line-height:1.45;text-align:center;';
    hint.innerHTML = 'Bấm nút → chọn tài khoản Google → quay lại app.<br>Trên điện thoại nên dùng <b>Chrome</b>.';
    wrap.appendChild(hint);
    var gsi = document.createElement('div');
    gsi.id = 'btnGoogleGsi';
    gsi.style.cssText = 'width:100%;min-height:0;';
    wrap.appendChild(gsi);
    host.appendChild(wrap);
    setTimeout(function () {
      try {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: onGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false
        });
        if (gsi && !isWebView()) {
          window.google.accounts.id.renderButton(gsi, {
            theme: 'outline',
            size: 'large',
            width: Math.max(gsi.offsetWidth || 0, 280),
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      } catch (e) { console.warn('GSI secondary', e); }
    }, 400);
  }

  function initGoogle() {
    var host = document.getElementById('btnGoogle');
    if (!host) return false;
    renderLoginButton(host);
    return true;
  }

  function bootGoogle() {
    if (document.getElementById('btnGoogleOAuth')) return;
    if (initGoogle()) return;
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (initGoogle() || tries > 20) clearInterval(t);
    }, 250);
  }

  function onGoogleCredential(response) {
    if (!response || !response.credential) return;
    const payload = decodeJwtPayload(response.credential);
    if (!payload) return;
    applyUser(payload, response.credential).then(function () {
      setTimeout(function () {
        emit('gia-auth-changed', { user: state.user });
      }, 200);
    });
  }

  function decodeJwtPayload(token) {
    try {
      const part = token.split('.')[1];
      const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(
        Array.prototype.map.call(json, function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      ));
    } catch (_) {
      return null;
    }
  }

  async function applyUser(payload, idToken) {
    if (!payload) return;
    const user = {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || payload.email || 'Thành viên',
      picture: payload.picture || ''
    };
    state.user = user;
    write(USER_KEY, user);
    claimOwnerIfNeeded(user);
    let profile = ensureMember(user, {
      id: user.sub,
      display_name: user.name,
      avatar_url: user.picture,
      email: user.email,
      status: isOwnerUser(user) ? 'approved' : 'pending',
      role: isOwnerUser(user) ? 'admin' : 'member'
    });
    state.profile = profile;
    write(PROFILE_KEY, profile);
    if (idToken) {
      await cloudSignInWithGoogleIdToken(idToken);
      const cloud = await cloudFetchMyProfile();
      if (cloud) mergeCloudProfileIntoState(cloud);
      else await cloudUpsertMyProfile({
        display_name: user.name,
        email: user.email,
        avatar_url: user.picture
      });
    }
    emit('gia-auth-changed', { user: state.user });
    emit('gia-profile-changed', { profile: state.profile });
  }

  async function cloudUpsertMyProfile(fields) {
    if (!sb) return null;
    const { data: sess } = await sb.auth.getSession();
    const uid = sess?.session?.user?.id;
    if (!uid) return null;
    const email = (fields && fields.email) || sess.session.user.email || '';
    const isOwn = String(uid) === TECH_ADMIN_ID || String(email).toLowerCase() === OWNER_EMAIL;
    const row = {
      id: uid,
      display_name: (fields && fields.display_name) || sess.session.user.user_metadata?.full_name || email || 'Thành viên',
      email: email || null,
      avatar_url: (fields && fields.avatar_url) || sess.session.user.user_metadata?.avatar_url || null,
      role: isOwn ? 'admin' : undefined,
      status: isOwn ? 'approved' : undefined,
      is_tech_admin: isOwn ? true : undefined
    };
    Object.keys(row).forEach(function (k) { if (row[k] === undefined) delete row[k]; });
    try {
      const { data, error } = await sb.from('profiles').upsert(row).select().maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('cloudUpsertMyProfile', e);
      return null;
    }
  }

  async function cloudFetchMyProfile() {
    if (!sb) return null;
    try {
      const { data: sess } = await sb.auth.getSession();
      const uid = sess?.session?.user?.id;
      if (!uid) return null;
      const { data, error } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('cloudFetchMyProfile', e);
      return null;
    }
  }

  async function cloudListMembers() {
    if (!sb) return null;
    try {
      const { data, error } = await sb.from('profiles').select('*').order('display_name');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('cloudListMembers', e);
      return null;
    }
  }

  async function cloudSetMemberStatus(id, status) {
    if (!sb) return null;
    const { data, error } = await sb.rpc('set_member_status', { target_id: id, new_status: status });
    if (error) throw error;
    return data;
  }

  async function cloudSetMemberRole(id, role) {
    if (!sb) return null;
    const { data, error } = await sb.rpc('set_member_role', { target_id: id, new_role: role });
    if (error) throw error;
    return data;
  }

  function mergeCloudProfileIntoState(cloudProfile) {
    if (!cloudProfile) return;
    state.profile = Object.assign({}, state.profile || {}, {
      id: cloudProfile.id,
      display_name: cloudProfile.display_name || state.profile?.display_name,
      email: cloudProfile.email || state.profile?.email,
      avatar_url: cloudProfile.avatar_url || state.profile?.avatar_url,
      role: cloudProfile.role || state.profile?.role || 'member',
      status: cloudProfile.status || state.profile?.status || 'pending',
      family_role: cloudProfile.family_role || cloudProfile.role || 'member',
      is_tech_admin: !!cloudProfile.is_tech_admin,
      is_admin: !!cloudProfile.is_tech_admin || cloudProfile.role === 'admin'
    });
    write(PROFILE_KEY, state.profile);
    if (state.user) ensureMember(state.user, state.profile);
  }

  function restoreUser() {
    const user = read(USER_KEY, null);
    if (!user) return;
    state.user = user;
    let profile = read(PROFILE_KEY, null) || ensureMember(user, {
      id: user.sub,
      display_name: user.name,
      avatar_url: user.picture,
      email: user.email,
      status: isOwnerUser(user) ? 'approved' : 'pending',
      role: isOwnerUser(user) ? 'admin' : 'member'
    });
    state.profile = profile;
    write(PROFILE_KEY, profile);
    emit('gia-auth-changed', { user });
    emit('gia-profile-changed', { profile });
  }

  async function signOut() {
    try {
      if (sb) await sb.auth.signOut();
    } catch (_) {}
    state.user = null;
    state.profile = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROFILE_KEY);
    emit('gia-auth-changed', { user: null });
    emit('gia-profile-changed', { profile: null });
    setTimeout(bootGoogle, 300);
  }

  async function upsertProfile(fields) {
    if (!state.user) throw new Error('Chưa đăng nhập');
    const next = Object.assign({}, state.profile || {}, fields || {}, {
      status: state.profile?.status || (autoApprovalEnabled() ? 'approved' : 'pending')
    });
    if (isOwnerUser(state.user)) {
      next.status = 'approved';
      next.role = 'admin';
      next.is_tech_admin = true;
    }
    state.profile = next;
    write(PROFILE_KEY, next);
    ensureMember(state.user, next);
    try { await cloudUpsertMyProfile(next); } catch (_) {}
    emit('gia-profile-changed', { profile: state.profile });
    return state.profile;
  }

  function isTechAdminFn() {
    if (!state.user) return false;
    if (isOwnerUser(state.user)) return true;
    const p = state.profile;
    return !!(p && (p.is_tech_admin || p.role === 'admin' || p.is_owner));
  }
  function isTruongHoFn() {
    if (!state.user || isTechAdminFn()) return false;
    const p = state.profile;
    if (!p) return false;
    return p.role === 'truongho' || p.family_role === 'truongho' || p.member_role === 'truongho';
  }
  function canManageMembersFn() {
    return isTechAdminFn() || isTruongHoFn();
  }

  window.GiaCloud = {
    state: state,
    signInGoogle: async function () { await signInWithOAuthGoogle(); return true; },
    signOut: signOut,
    upsertProfile: upsertProfile,
    refreshProfile: async function () {
      const cloud = await cloudFetchMyProfile();
      if (cloud) mergeCloudProfileIntoState(cloud);
      emit('gia-profile-changed', { profile: state.profile });
      return state.profile;
    },
    isConfigured: function () { return true; },
    isCloudReady: function () { return !!state.cloudReady && !!sb; },
    isApproved: function () {
      if (!state.user) return false;
      if (isTechAdminFn()) return true;
      return state.profile?.status === 'approved';
    },
    isPending: function () {
      if (!state.user || isTechAdminFn()) return false;
      return state.profile?.status === 'pending';
    },
    isRejected: function () {
      if (!state.user || isTechAdminFn()) return false;
      return state.profile?.status === 'rejected';
    },
    isAdmin: isTechAdminFn,
    isTechAdmin: isTechAdminFn,
    isTruongHo: isTruongHoFn,
    canManageMembers: canManageMembersFn,
    isOwner: function () { return !!state.user && isOwnerUser(state.user); },
    claimOwner: function () {
      if (!state.user) return false;
      const ok = claimOwnerIfNeeded(state.user);
      const m = ensureMember(state.user, state.profile || {});
      state.profile = Object.assign({}, state.profile, m);
      write(PROFILE_KEY, state.profile);
      return ok || isOwnerUser(state.user);
    },
    listMembers: async function () {
      try {
        if (sb || initSupabase()) {
          const { data: sess } = await sb.auth.getSession();
          if (sess?.session) {
            const rows = await cloudListMembers();
            if (rows && rows.length) return rows;
          }
        }
      } catch (e) { console.warn('listMembers cloud', e); }
      if (state.user) ensureMember(state.user, state.profile || {});
      return Object.values(readMembers()).sort(function (a, b) {
        return String(a.display_name || '').localeCompare(String(b.display_name || ''), 'vi');
      });
    },
    setMemberStatus: async function (id, status) {
      if (!canManageMembersFn()) throw new Error('Bạn không có quyền duyệt thành viên.');
      try {
        if (sb || initSupabase()) {
          const { data: sess } = await sb.auth.getSession();
          if (sess?.session) {
            const row = await cloudSetMemberStatus(id, status);
            const rows = readMembers();
            if (rows[id]) { rows[id].status = status; writeMembers(rows); }
            return row;
          }
        }
      } catch (e) { console.warn('setMemberStatus cloud', e); }
      const rows = readMembers();
      if (!rows[id]) throw new Error('Không tìm thấy thành viên.');
      rows[id].status = status;
      writeMembers(rows);
      return rows[id];
    },
    setMemberRole: async function (id, role) {
      let r = role;
      if (r === 'truongho' || r === 'admin') {
        if (!isTechAdminFn()) throw new Error('Chỉ Chủ quản hệ thống mới được cấp Trưởng họ.');
        r = 'truongho';
      } else {
        r = 'member';
        if (!canManageMembersFn()) throw new Error('Bạn không có quyền.');
      }
      try {
        if (sb || initSupabase()) {
          const { data: sess } = await sb.auth.getSession();
          if (sess?.session) {
            const row = await cloudSetMemberRole(id, r);
            const rows = readMembers();
            if (rows[id]) { rows[id].role = r; rows[id].family_role = r; writeMembers(rows); }
            return row;
          }
        }
      } catch (e) { console.warn('setMemberRole cloud', e); }
      const rows = readMembers();
      if (!rows[id]) throw new Error('Không tìm thấy thành viên.');
      rows[id].role = r;
      rows[id].family_role = r;
      writeMembers(rows);
      return rows[id];
    },
    getAutoApproval: function () { return autoApprovalEnabled(); },
    setAutoApproval: async function (enabled) {
      localStorage.setItem(AUTO_APPROVAL_KEY, enabled ? 'true' : 'false');
      return enabled;
    }
  };

  async function restoreFromSupabaseSession() {
    if (!sb) initSupabase();
    if (!sb) return false;
    try {
      try {
        var url = new URL(window.location.href);
        if (url.searchParams.get('code') || window.location.hash.indexOf('access_token') >= 0) {
          await sb.auth.exchangeCodeForSession(window.location.href).catch(function () {});
          try {
            window.history.replaceState({}, document.title, url.origin + url.pathname);
          } catch (_) {}
        }
      } catch (_) {}
      var res = await sb.auth.getSession();
      var session = res && res.data && res.data.session;
      if (!session || !session.user) return false;
      var u = session.user;
      var payload = {
        sub: u.id,
        id: u.id,
        email: u.email || '',
        name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || u.email || 'Thành viên',
        picture: (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture)) || ''
      };
      state.user = payload;
      write(USER_KEY, payload);
      claimOwnerIfNeeded(payload);
      var profile = ensureMember(payload, {
        id: payload.sub,
        display_name: payload.name,
        avatar_url: payload.picture,
        email: payload.email,
        status: isOwnerUser(payload) ? 'approved' : 'pending',
        role: isOwnerUser(payload) ? 'admin' : 'member'
      });
      state.profile = profile;
      write(PROFILE_KEY, profile);
      try {
        var cloud = await cloudFetchMyProfile();
        if (cloud) mergeCloudProfileIntoState(cloud);
        else await cloudUpsertMyProfile({
          display_name: payload.name,
          email: payload.email,
          avatar_url: payload.picture
        });
      } catch (_) {}
      emit('gia-auth-changed', { user: state.user });
      emit('gia-profile-changed', { profile: state.profile });
      return true;
    } catch (e) {
      console.warn('restoreFromSupabaseSession', e);
      return false;
    }
  }

  initSupabase();
  restoreUser();
  restoreFromSupabaseSession().then(function () {
    bootGoogle();
  });
  document.addEventListener('DOMContentLoaded', function () {
    bootGoogle();
  });
})();
