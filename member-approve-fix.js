/* member-approve-fix: sửa duyệt thành viên + đồng bộ list từ cloud */
(function () {
  'use strict';
  function patch() {
    var g = window.GiaCloud;
    if (!g || g.__approveFixed) return !!g;
    g.__approveFixed = true;

    var origList = g.listMembers && g.listMembers.bind(g);
    g.listMembers = async function () {
      var rows = origList ? await origList() : [];
      try {
        var key = 'giaPhaMembers_v1';
        var local = {};
        try { local = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) { local = {}; }
        (rows || []).forEach(function (m) {
          if (!m || !m.id) return;
          local[m.id] = Object.assign({}, local[m.id] || {}, {
            id: m.id,
            email: m.email || '',
            display_name: m.display_name || '',
            avatar_url: m.avatar_url || '',
            role: m.role || 'member',
            family_role: m.family_role || m.role || 'member',
            status: m.status || 'pending',
            is_tech_admin: !!m.is_tech_admin
          });
        });
        localStorage.setItem(key, JSON.stringify(local));
      } catch (_) {}
      return rows || [];
    };

    g.setMemberStatus = async function (id, status) {
      if (!g.canManageMembers || !g.canManageMembers()) {
        throw new Error('Bạn không có quyền duyệt thành viên.');
      }
      id = String(id || '');
      if (!id) throw new Error('Thiếu mã thành viên.');
      var sb = null;
      try {
        var cfg = window.GIA_SUPABASE_CONFIG || {};
        if (cfg.url && cfg.anonKey && window.supabase) {
          sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true }
          });
        }
      } catch (_) {}
      var updated = null;
      if (sb) {
        try {
          var sess = await sb.auth.getSession();
          if (sess && sess.data && sess.data.session) {
            try {
              var rpc = await sb.rpc('set_member_status', { target_id: id, new_status: status });
              if (rpc.error) throw rpc.error;
              updated = rpc.data;
            } catch (rpcErr) {
              var up = await sb.from('profiles').update({ status: status }).eq('id', id).select().maybeSingle();
              if (up.error) throw up.error;
              updated = up.data;
            }
          }
        } catch (e) {
          console.warn('setMemberStatus cloud', e);
        }
      }
      var key = 'giaPhaMembers_v1';
      var local = {};
      try { local = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) { local = {}; }
      if (local[id]) local[id].status = status;
      else local[id] = { id: id, status: status, role: 'member', display_name: '', email: '' };
      localStorage.setItem(key, JSON.stringify(local));
      return updated || local[id];
    };

    g.setMemberRole = async function (id, role) {
      var r = role;
      if (r === 'truongho' || r === 'admin') {
        if (!g.isTechAdmin || !g.isTechAdmin()) throw new Error('Chỉ Chủ quản hệ thống mới được cấp Trưởng họ.');
        r = 'truongho';
      } else {
        r = 'member';
        if (!g.canManageMembers || !g.canManageMembers()) throw new Error('Bạn không có quyền.');
      }
      id = String(id || '');
      var sb = null;
      try {
        var cfg = window.GIA_SUPABASE_CONFIG || {};
        if (cfg.url && cfg.anonKey && window.supabase) {
          sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true }
          });
        }
      } catch (_) {}
      var updated = null;
      if (sb) {
        try {
          var sess = await sb.auth.getSession();
          if (sess && sess.data && sess.data.session) {
            try {
              var rpc = await sb.rpc('set_member_role', { target_id: id, new_role: r });
              if (rpc.error) throw rpc.error;
              updated = rpc.data;
            } catch (rpcErr) {
              var up = await sb.from('profiles').update({ role: r, family_role: r }).eq('id', id).select().maybeSingle();
              if (up.error) throw up.error;
              updated = up.data;
            }
          }
        } catch (e) {
          console.warn('setMemberRole cloud', e);
        }
      }
      var key = 'giaPhaMembers_v1';
      var local = {};
      try { local = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) { local = {}; }
      if (local[id]) {
        local[id].role = r;
        local[id].family_role = r;
      } else {
        local[id] = { id: id, role: r, family_role: r, status: 'approved', display_name: '', email: '' };
      }
      localStorage.setItem(key, JSON.stringify(local));
      return updated || local[id];
    };

    return true;
  }
  function boot() {
    if (patch()) return;
    var n = 0;
    var t = setInterval(function () {
      n++;
      if (patch() || n > 40) clearInterval(t);
    }, 200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
