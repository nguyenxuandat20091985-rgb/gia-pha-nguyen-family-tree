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
    setTimeout(async function () {
      try {
        if (sb || initSupabase()) {
          const cloud = await cloudFetchMyProfile();
          if (cloud) {
            mergeCloudProfileIntoState(cloud);
            emit('gia-profile-changed', { profile: state.profile });
            emit('gia-auth-changed', { user: state.user });
          }
        }
      } catch (_) {}
    }, 600);
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

  function initGoogle() {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return false;
    try {
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
          theme: 'outline',
          size: 'large',
          width: host.offsetWidth || 320,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });
      }
      return true;
    } catch (e) {
      console.warn('initGoogle', e);
      return false;
    }
  }

  function bootGoogle() {
    if (initGoogle()) return;
    let tries = 0;
    const t = setInterval(function () {
      tries++;
      if (initGoogle() || tries > 40) clearInterval(t);
    }, 250);
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
    try {
      await cloudUpsertMyProfile(next);
    } catch (_) {}
    emit('gia-profile-changed', { profile: state.profile });
    return state.profile;
  }

  function ensureProfile() {
    if (!state.user) return null;
    if (!state.profile) {
      state.profile = ensureMember(state.user, {
        display_name: state.user.name,
        email: state.user.email,
        status: isOwnerUser(state.user) ? 'approved' : 'pending'
      });
      write(PROFILE_KEY, state.profile);
    }
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
    signInGoogle: async function () {
      bootGoogle();
      return true;
    },
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
      } catch (e) {
        console.warn('listMembers cloud', e);
      }
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
      } catch (e) {
        console.warn('setMemberStatus cloud', e);
      }
      const rows = readMembers();
      if (!rows[id]) throw new Error('Không tìm thấy thành viên (cloud/local). Chạy SQL approval-3tier trên Supabase và đăng nhập lại.');
      if (rows[id].is_owner || String(rows[id].email || '').trim().toLowerCase() === OWNER_EMAIL) {
        throw new Error('Không đổi trạng thái tài khoản Chủ quản.');
      }
      rows[id].status = status;
      writeMembers(rows);
      if (state.user && (state.user.sub === id || state.user.id === id)) {
        state.profile = Object.assign({}, state.profile, rows[id]);
        write(PROFILE_KEY, state.profile);
        emit('gia-profile-changed', { profile: state.profile });
        emit('gia-auth-changed', { user: state.user });
      }
      return rows[id];
    },
    setMemberRole: async function (id, role) {
      let r = role;
      if (r === 'truongho' || r === 'admin') {
        if (!isTechAdminFn()) throw new Error('Chỉ Chủ quản hệ thống mới được cấp / thu hồi Trưởng họ.');
        r = 'truongho';
      } else {
        r = 'member';
        if (!canManageMembersFn()) throw new Error('Bạn không có quyền đặt Thành viên liên quan.');
      }
      try {
        if (sb || initSupabase()) {
          const { data: sess } = await sb.auth.getSession();
          if (sess?.session) {
            const row = await cloudSetMemberRole(id, r);
            const rows = readMembers();
            if (rows[id]) {
              rows[id].role = r;
              rows[id].family_role = r;
              rows[id].status = 'approved';
              writeMembers(rows);
            }
            return row;
          }
        }
      } catch (e) {
        console.warn('setMemberRole cloud', e);
      }
      const rows = readMembers();
      if (!rows[id]) throw new Error('Không tìm thấy thành viên (cloud/local).');
      if (rows[id].is_owner || String(rows[id].email || '').trim().toLowerCase() === OWNER_EMAIL) {
        throw new Error('Tài khoản Chủ quản được bảo vệ, không đổi quyền.');
      }
      rows[id].role = r;
      rows[id].family_role = r;
      rows[id].member_role = r;
      rows[id].is_admin = false;
      rows[id].status = 'approved';
      writeMembers(rows);
      return rows[id];
    },
    getAutoApproval: function () { return autoApprovalEnabled(); },
    setAutoApproval: async function (enabled) {
      localStorage.setItem(AUTO_APPROVAL_KEY, enabled ? 'true' : 'false');
      return enabled;
    }
  };

  initSupabase();
  restoreUser();
  document.addEventListener('DOMContentLoaded', bootGoogle);
  bootGoogle();
})();
