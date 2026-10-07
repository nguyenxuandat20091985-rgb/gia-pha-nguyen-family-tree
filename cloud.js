/* Gia Phả Họ Nguyễn — Supabase cloud bridge */
(function(){
  'use strict';

  const cfg = window.GIA_SUPABASE_CONFIG || {};
  const ready = !!(cfg.url && cfg.anonKey && window.supabase);

  let client = null;
  let user = null;

  const state = {
    ready: false,
    user: null,
    profile: null
  };

  function emit(name, detail){
    window.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }

  async function init(){
    if(!ready){
      emit('gia-cloud-status',{
        ready:false,
        reason:'missing-config'
      });
      return;
    }

    client = window.supabase.createClient(
      cfg.url,
      cfg.anonKey,
      {
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:true
        }
      }
    );

    const {
      data:{session}
    } = await client.auth.getSession();

    user = session?.user || null;
    state.ready = true;
    state.user = user;

    emit('gia-auth-changed',{user});

    client.auth.onAuthStateChange((_event,session)=>{
      user = session?.user || null;
      state.user = user;

      emit('gia-auth-changed',{user});

      if(user){
        refreshProfile().catch(()=>{});
      }
    });

    await refreshProfile();
  }

  async function refreshProfile(){
    if(!client || !user) return null;

    const {
      data,
      error
    } = await client
      .from('profiles')
      .select('*')
      .eq('id',user.id)
      .maybeSingle();

    if(!error){
      state.profile = data;

      emit('gia-profile-changed',{
        profile:data
      });
    }

    return state.profile;
  }

  const APP_ORIGIN =
    'https://gia-pha-nguyen-hazel.vercel.app/';

  async function signInGoogle(){
    if(!client){
      throw new Error('Supabase chưa được cấu hình.');
    }

    return client.auth.signInWithOAuth({
      provider:'google',
      options:{
        redirectTo:APP_ORIGIN
      }
    });
  }

  async function sendPhoneOtp(phone){
    if(!client){
      throw new Error('Supabase chưa được cấu hình.');
    }

    const p = String(phone || '')
      .replace(/\s+/g,'');

    if(!/^\+[1-9]\d{7,14}$/.test(p)){
      throw new Error(
        'Nhập số điện thoại theo dạng quốc tế, ví dụ +84901234567.'
      );
    }

    return client.auth.signInWithOtp({
      phone:p
    });
  }

  async function verifyPhoneOtp(phone,token){
    if(!client){
      throw new Error('Supabase chưa được cấu hình.');
    }

    const p = String(phone || '')
      .replace(/\s+/g,'');

    return client.auth.verifyOtp({
      phone:p,
      token:String(token || '').trim(),
      type:'sms'
    });
  }

  async function deletePostCloud(postId){
    if(!state.user) return;

    const r = await client
      .from('posts')
      .delete()
      .eq('id',postId)
      .eq('author_id',state.user.id);

    if(r.error) throw r.error;
  }

  async function deleteCommentCloud(commentId){
    if(!state.user) return;

    const r = await client
      .from('comments')
      .delete()
      .eq('id',commentId)
      .eq('author_id',state.user.id);

    if(r.error) throw r.error;
  }

  async function signOut(){
    if(client){
      await client.auth.signOut();
    }
  }

  async function requireUser(){
    if(!client){
      throw new Error('Supabase chưa được cấu hình.');
    }

    if(user) return user;

    const {
      data:{session}
    } = await client.auth.getSession();

    user = session?.user || null;
    state.user = user;

    if(!user){
      throw new Error(
        'Phiên đăng nhập đã hết. Hãy đăng nhập lại rồi lưu.'
      );
    }

    return user;
  }

  async function upsertProfile(fields){
    const u = await requireUser();

    const name =
      (fields && fields.display_name != null)
        ? String(fields.display_name).trim()
        : '';

    if(!name){
      throw new Error('Vui lòng nhập tên hiển thị.');
    }

    const row = Object.assign(
      {
        id:u.id
      },
      fields || {},
      {
        display_name:name
      }
    );

    let {
      data,
      error
    } = await client
      .from('profiles')
      .update({
        display_name:name,
        phone:
          fields.phone != null
            ? fields.phone
            : undefined,
        avatar_url:
          fields.avatar_url != null
            ? fields.avatar_url
            : undefined,
        branch_label:
          fields.branch_label != null
            ? fields.branch_label
            : undefined
      })
      .eq('id',u.id)
      .select()
      .maybeSingle();

    if(!error && !data){
      const ins = await client
        .from('profiles')
        .insert(row)
        .select()
        .single();

      data = ins.data;
      error = ins.error;
    }

    if(error){
      const up = await client
        .from('profiles')
        .upsert(
          row,
          {
            onConflict:'id'
          }
        )
        .select()
        .single();

      data = up.data;
      error = up.error;
    }

    if(error){
      const msg =
        error.message || String(error);

      if(/row-level security|RLS|42501/i.test(msg)){
        throw new Error(
          'Không đủ quyền lưu hồ sơ (RLS). Chạy supabase/admin-and-approval.sql'
        );
      }

      throw new Error(msg);
    }

    state.profile = data;

    emit(
      'gia-profile-changed',
      {
        profile:data
      }
    );

    return data;
  }

  async function syncLocal(
    tree,
    events,
    posts,
    comments,
    likes
  ){
    if(!client || !user) return;

    const people =
      Object.values(tree?.people || {})
        .map(p=>({
          id:p.id,
          name:p.name,
          gender:p.gender,
          birth_date:p.birthDate || null,
          death_date:p.deathDate || null,
          death_anniversary:p.deathAnniversary || null,
          notes:p.notes || null,
          photo_url:p.photo || null,
          is_root:!!p.isRoot,
          is_side:!!p.isSide,
          parent_id:p.parentId || null
        }));

    if(people.length){
      const r = await client
        .from('family_members')
        .upsert(
          people,
          {
            onConflict:'id'
          }
        );

      if(r.error) throw r.error;
    }

    const evs =
      (events || [])
        .map(e=>({
          id:e.id,
          title:e.title,
          event_type:e.type,
          related_person:e.person || null,
          event_date:e.date || null,
          event_time:e.time || null,
          address:e.address || null,
          content:e.content || null,
          pinned:!!e.pin,
          created_by:user.id
        }));

    if(evs.length){
      const r = await client
        .from('family_events')
        .upsert(
          evs,
          {
            onConflict:'id'
          }
        );

      if(r.error) throw r.error;
    }

    const ps =
      (posts || [])
        .map(p=>({
          id:p.id,
          author_id:user.id,
          content:p.content,
          pinned:!!p.pin,
          post_type:p.type || 'member',
          image_url:p.image || null,
          created_at:
            p.createdAt
              ? new Date(p.createdAt).toISOString()
              : new Date().toISOString()
        }));

    if(ps.length){
      const r = await client
        .from('posts')
        .upsert(
          ps,
          {
            onConflict:'id'
          }
        );

      if(r.error) throw r.error;
    }

    const cs =
      (comments || [])
        .map(x=>({
          id:x.id,
          post_id:x.postId,
          author_id:user.id,
          content:x.content,
          created_at:
            x.createdAt
              ? new Date(x.createdAt).toISOString()
              : new Date().toISOString()
        }));

    if(cs.length){
      const r = await client
        .from('comments')
        .upsert(
          cs,
          {
            onConflict:'id'
          }
        );

      if(r.error) throw r.error;
    }

    const lk =
      Object.entries(likes || {})
        .map(([postId])=>({
          post_id:postId,
          user_id:user.id
        }));

    if(lk.length){
      const r = await client
        .from('post_likes')
        .upsert(
          lk,
          {
            onConflict:'post_id,user_id'
          }
        );

      if(r.error) throw r.error;
    }
  }

  async function pullAll(){
    if(!client || !user) return null;

    const [
      m,
      e,
      p,
      co,
      lk
    ] = await Promise.all([
      client
        .from('family_members')
        .select('*'),

      client
        .from('family_events')
        .select('*')
        .order(
          'event_date',
          {
            ascending:true
          }
        ),

      client
        .from('posts')
        .select('*')
        .order(
          'created_at',
          {
            ascending:false
          }
        ),

      client
        .from('comments')
        .select('*')
        .order(
          'created_at',
          {
            ascending:true
          }
        ),

      client
        .from('post_likes')
        .select('post_id')
    ]);

    if(m.error) throw m.error;
    if(e.error) throw e.error;
    if(p.error) throw p.error;
    if(co.error) throw co.error;
    if(lk.error) throw lk.error;

    const people = {};

    m.data.forEach(x=>{
      people[x.id] = {
        id:x.id,
        name:x.name,
        gender:x.gender || 'male',
        birthDate:x.birth_date || '',
        deathDate:x.death_date || '',
        deathAnniversary:x.death_anniversary || '',
        notes:x.notes || '',
        photo:x.photo_url || null,
        children:[],
        spouses:[],
        sideBranches:[],
        isSide:!!x.is_side,
        isRoot:!!x.is_root,
        parentId:x.parent_id || null
      };
    });

    m.data.forEach(x=>{
      if(!people[x.parent_id]) return;

      if(x.is_side){
        people[x.parent_id]
          .sideBranches
          .push(x.id);
      }else{
        people[x.parent_id]
          .children
          .push(x.id);
      }
    });

    return {
      tree:{
        people,
        rootId:
          (m.data.find(x=>x.is_root) || m.data[0])?.id || null
      },

      events:
        e.data.map(x=>({
          id:x.id,
          title:x.title,
          type:x.event_type,
          person:x.related_person || '',
          date:x.event_date || '',
          time:x.event_time || '',
          address:x.address || '',
          content:x.content || '',
          pin:!!x.pinned,
          createdAt:x.created_at
        })),

      posts:
        p.data.map(x=>({
          id:x.id,
          author:'Thành viên',
          content:x.content,
          pin:!!x.pinned,
          type:x.post_type || 'member',
          image:x.image_url || null,
          createdAt:x.created_at
        })),

      comments:
        co.data.map(x=>({
          id:x.id,
          postId:x.post_id,
          author:'Thành viên',
          content:x.content,
          createdAt:x.created_at
        })),

      likes:
        lk.data.reduce(
          (acc,x)=>{
            acc[x.post_id] =
              (acc[x.post_id] || 0) + 1;

            return acc;
          },
          {}
        )
    };
  }

  async function loadRealtime(){
    if(!client) return;

    client
      .channel('gia-pha-live')

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'family_members'
        },
        ()=>emit('gia-cloud-data-changed')
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'family_events'
        },
        ()=>emit('gia-cloud-data-changed')
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'posts'
        },
        ()=>emit('gia-cloud-data-changed')
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'comments'
        },
        ()=>emit('gia-cloud-data-changed')
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'post_likes'
        },
        ()=>emit('gia-cloud-data-changed')
      )

      .subscribe();
  }

  /* =====================================================
     PHÂN QUYỀN — GIA PHẢ HỌ NGUYỄN
     Admin duy nhất:
     cf17b596-f674-4431-aa7f-506f955624ab
     ===================================================== */

  const TECH_ADMIN_ID =
    'cf17b596-f674-4431-aa7f-506f955624ab';

  const TECH_ADMIN_EMAIL =
    'nguyenxuandat20091985@gmail.com';

  function isOwner(){
    const p = state.profile || {};

    const email =
      String(
        state.user?.email ||
        p.email ||
        ''
      )
      .trim()
      .toLowerCase();

    return (
      String(
        state.user?.id ||
        state.user?.sub ||
        ''
      ) === TECH_ADMIN_ID
    ) ||
    String(p.id || '') === TECH_ADMIN_ID ||
    email === TECH_ADMIN_EMAIL;
  }

  function isApproved(){
    const p = state.profile;

    if(!p) return false;

    return (
      !p.status ||
      p.status === 'approved'
    );
  }

  function isAdmin(){
    return isTechAdmin();
  }

  function isTechAdmin(){
    return isOwner();
  }

  /*
   * Trưởng họ dùng family_role.
   * Giữ role fallback để tương thích với dữ liệu cũ.
   */
  function isTruongHo(){
    const p = state.profile;

    if(!p) return false;

    const familyRole =
      p.family_role ||
      p.role ||
      'member';

    return (
      familyRole === 'truongho' &&
      (!p.status || p.status === 'approved')
    );
  }

  /*
   * Admin hoặc Trưởng họ được quản lý thành viên.
   */
  function canManageMembers(){
    return (
      isTechAdmin() ||
      isTruongHo()
    );
  }

  function isPending(){
    return !!(
      state.user &&
      state.profile &&
      state.profile.status === 'pending'
    );
  }

  function isRejected(){
    return !!(
      state.profile &&
      state.profile.status === 'rejected'
    );
  }

  /*
   * Lấy danh sách thành viên.
   *
   * Không đọc cột email từ profiles vì email
   * thuộc auth.users, không phải profiles.
   *
   * family_role là trường quyền chính:
   * admin
   * truongho
   * member
   */
  async function listMembers(){
    await requireUser();

    if(!canManageMembers()){
      throw new Error(
        'Chỉ Admin hoặc Trưởng họ mới xem danh sách thành viên.'
      );
    }

    const {
      data,
      error
    } = await client
      .from('profiles')
      .select(
        'id,display_name,phone,role,family_role,status,created_at,avatar_url,is_tech_admin'
      )
      .order(
        'created_at',
        {
          ascending:false
        }
      );

    if(error) throw error;

    let invites = [];
    const ir = await client
      .from('admin_member_invites')
      .select('id,full_name,email,desired_family_role,status,linked_profile_id,created_at,updated_at')
      .eq('status','pending')
      .order('created_at',{ascending:false});
    if(!ir.error){
      invites = (ir.data || []).map(x=>({
        id:'invite:'+x.id,
        invite_id:x.id,
        display_name:x.full_name,
        email:x.email,
        phone:'',
        role:x.desired_family_role,
        family_role:x.desired_family_role,
        status:'pending',
        is_invite:true,
        is_tech_admin:false,
        created_at:x.created_at
      }));
    }
    return [...invites,...(data || [])];
  }

  async function createMemberInvite(fullName,email){
    await requireUser();
    if(!isTechAdmin()) throw new Error('Chỉ Admin mới được thêm thành viên để phân quyền.');
    const name=String(fullName||'').trim();
    const mail=String(email||'').trim().toLowerCase();
    if(!name) throw new Error('Vui lòng nhập họ tên.');
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(mail)) throw new Error('Gmail không hợp lệ.');
    const {data,error}=await client.rpc('admin_create_member_invite',{p_full_name:name,p_email:mail});
    if(error) throw error;
    return data;
  }

  async function setInviteRole(inviteId,role){
    await requireUser();
    if(!isTechAdmin()) throw new Error('Chỉ Admin mới được cấp / thu hồi Trưởng họ.');
    if(!['member','truongho'].includes(role)) throw new Error('Quyền không hợp lệ.');
    const {data,error}=await client.rpc('admin_set_invite_role',{p_invite_id:inviteId,p_family_role:role});
    if(error) throw error;
    return data;
  }

  /*
   * Duyệt / từ chối thành viên.
   *
   * RPC production:
   * set_member_status(p_user_id uuid, p_status text)
   */
  async function setMemberStatus(
    memberId,
    status
  ){
    await requireUser();

    if(!canManageMembers()){
      throw new Error(
        'Bạn không có quyền duyệt thành viên.'
      );
    }

    if(
      ![
        'pending',
        'approved',
        'rejected'
      ].includes(status)
    ){
      throw new Error(
        'Trạng thái không hợp lệ.'
      );
    }

    const {
      data,
      error
    } = await client.rpc(
      'set_member_status',
      {
        p_user_id:memberId,
        p_status:status
      }
    );

    if(error) throw error;

    return data;
  }

  /*
   * Cấp / thu hồi Trưởng họ.
   *
   * Chỉ Admin được:
   *   member -> truongho
   *   truongho -> member
   *
   * Trưởng họ không thể cấp Trưởng họ.
   *
   * RPC production:
   * set_member_role(p_user_id uuid, p_family_role text)
   */
  async function setMemberRole(
    memberId,
    role
  ){
    await requireUser();

    if(
      ![
        'member',
        'truongho'
      ].includes(role)
    ){
      throw new Error(
        'Chỉ có hai quyền hiển thị: Trưởng họ và Thành viên.'
      );
    }

    if(
      !isTechAdmin() &&
      !(
        isTruongHo() &&
        role === 'member'
      )
    ){
      throw new Error(
        'Chỉ Admin mới được cấp/thu hồi Trưởng họ; Trưởng họ chỉ quản lý cấp Thành viên.'
      );
    }

    const {
      data,
      error
    } = await client.rpc(
      'set_member_role',
      {
        p_user_id:memberId,
        p_family_role:role
      }
    );

    if(error) throw error;

    return data;
  }

  function claimOwner(){
    return isOwner();
  }

  /*
   * Tạo hồ sơ mới.
   *
   * Mặc định:
   * family_role = member
   *
   * Riêng Admin kỹ thuật:
   * family_role = admin
   * role = admin
   * is_tech_admin = true
   */
  async function ensureProfile(){
    if(!client || !user) return null;

    await refreshProfile();

    if(state.profile){
      return state.profile;
    }

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      user.phone ||
      'Thành viên mới';

    try{
      const row = {
        id:user.id,
        display_name:name,
        role:'member',
        family_role:'member'
      };

      if(isOwner()){
        row.role = 'admin';
        row.family_role = 'admin';
        row.status = 'approved';
        row.is_tech_admin = true;
      }

      const {
        data,
        error
      } = await client
        .from('profiles')
        .upsert(
          row,
          {
            onConflict:'id'
          }
        )
        .select()
        .single();

      if(!error){
        state.profile = data;

        emit(
          'gia-profile-changed',
          {
            profile:data
          }
        );
      }

      return state.profile;

    }catch(e){
      console.warn(
        'ensureProfile',
        e
      );

      return null;
    }
  }

  window.GiaCloud = {
    state,

    init,

    signInGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    signOut,

    upsertProfile,

    syncLocal,
    pullAll,
    loadRealtime,

    isConfigured:()=>ready,

    isAdmin,
    isOwner,
    isTechAdmin,
    isTruongHo,
    canManageMembers,

    isApproved,
    isPending,
    isRejected,

    listMembers,
    setMemberStatus,
    setMemberRole,

    ensureProfile,
    refreshProfile,
    claimOwner
  };

  init()
    .then(async()=>{
      await ensureProfile();
      await loadRealtime();
    })
    .catch(e=>{
      emit(
        'gia-cloud-status',
        {
          ready:false,
          error:e.message
        }
      );
    });

})();
