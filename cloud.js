/* Gia Phả Họ Nguyễn — Supabase cloud bridge
 * Configure window.GIA_SUPABASE_URL and window.GIA_SUPABASE_ANON_KEY before use.
 * Never put a service_role key in this file.
 */
(function(){
  'use strict';
  const cfg = window.GIA_SUPABASE_CONFIG || {};
  const ready = !!(cfg.url && cfg.anonKey && window.supabase);
  let client = null, user = null;
  const state = { ready:false, user:null, profile:null };

  function emit(name, detail){ window.dispatchEvent(new CustomEvent(name,{detail:detail||{}})); }
  async function init(){
    if(!ready) { emit('gia-cloud-status',{ready:false,reason:'missing-config'}); return; }
    client = window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}} = await client.auth.getSession();
    user = session?.user || null; state.ready=true; state.user=user;
    emit('gia-auth-changed',{user});
    client.auth.onAuthStateChange((_event,session)=>{
      user=session?.user||null; state.user=user; emit('gia-auth-changed',{user});
    });
    await refreshProfile();
  }
  async function refreshProfile(){
    if(!client||!user) return null;
    const {data,error}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();
    if(!error) { state.profile=data; emit('gia-profile-changed',{profile:data}); }
    return state.profile;
  }
  async function signInGoogle(){
    if(!client) throw new Error('Supabase chưa được cấu hình.');
    return client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
  }
  async function sendPhoneOtp(phone){
    if(!client) throw new Error('Supabase chưa được cấu hình.');
    const p=String(phone||'').replace(/\s+/g,'');
    if(!/^\+[1-9]\d{7,14}$/.test(p)) throw new Error('Nhập số điện thoại theo dạng quốc tế, ví dụ +84901234567.');
    return client.auth.signInWithOtp({phone:p});
  }
  async function verifyPhoneOtp(phone,token){
    if(!client) throw new Error('Supabase chưa được cấu hình.');
    const p=String(phone||'').replace(/\s+/g,'');
    return client.auth.verifyOtp({phone:p,token:String(token||'').trim(),type:'sms'});
  }
  async function signOut(){ if(client) await client.auth.signOut(); }
  async function upsertProfile(fields){
    if(!client||!user) return;
    const row=Object.assign({id:user.id},fields||{});
    const {data,error}=await client.from('profiles').upsert(row,{onConflict:'id'}).select().single();
    if(error) throw error; state.profile=data; return data;
  }
  async function syncLocal(tree,events,posts){
    if(!client||!user) return;
    const people=Object.values(tree?.people||{}).map(p=>({
      id:p.id,name:p.name,gender:p.gender,birth_date:p.birthDate||null,death_date:p.deathDate||null,
      death_anniversary:p.deathAnniversary||null,notes:p.notes||null,photo_url:p.photo||null,
      is_root:!!p.isRoot,is_side:!!p.isSide,parent_id:p.parentId||null
    }));
    if(people.length) { const r=await client.from('family_members').upsert(people,{onConflict:'id'}); if(r.error) throw r.error; }
    const evs=(events||[]).map(e=>({id:e.id,title:e.title,event_type:e.type,related_person:e.person||null,event_date:e.date||null,event_time:e.time||null,address:e.address||null,content:e.content||null,pinned:!!e.pin,created_by:user.id}));
    if(evs.length) { const r=await client.from('family_events').upsert(evs,{onConflict:'id'}); if(r.error) throw r.error; }
    const ps=(posts||[]).map(p=>({id:p.id,author_id:user.id,content:p.content,pinned:!!p.pin,created_at:p.createdAt?new Date(p.createdAt).toISOString():new Date().toISOString()}));
    if(ps.length) { const r=await client.from('posts').upsert(ps,{onConflict:'id'}); if(r.error) throw r.error; }
  }
  async function pullAll(){
    if(!client||!user) return null;
    const [m,e,p]=await Promise.all([
      client.from('family_members').select('*'),
      client.from('family_events').select('*').order('event_date',{ascending:true}),
      client.from('posts').select('*').order('created_at',{ascending:false})
    ]);
    if(m.error) throw m.error; if(e.error) throw e.error; if(p.error) throw p.error;
    const people={}; m.data.forEach(x=>people[x.id]={id:x.id,name:x.name,gender:x.gender||'male',birthDate:x.birth_date||'',deathDate:x.death_date||'',deathAnniversary:x.death_anniversary||'',notes:x.notes||'',photo:x.photo_url||null,children:[],spouses:[],sideBranches:[],isSide:!!x.is_side,isRoot:!!x.is_root,parentId:x.parent_id||null});
    m.data.forEach(x=>{if(!people[x.parent_id]) return; if(x.is_side) people[x.parent_id].sideBranches.push(x.id); else people[x.parent_id].children.push(x.id);});
    return {
      tree:{people,rootId:(m.data.find(x=>x.is_root)||m.data[0])?.id||null},
      events:e.data.map(x=>({id:x.id,title:x.title,type:x.event_type,person:x.related_person||'',date:x.event_date||'',time:x.event_time||'',address:x.address||'',content:x.content||'',pin:!!x.pinned,createdAt:x.created_at})),
      posts:p.data.map(x=>({id:x.id,author:'Thành viên',content:x.content,pin:!!x.pinned,createdAt:x.created_at}))
    };
  }
  async function loadRealtime(){
    if(!client) return;
    client.channel('gia-pha-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'family_members'},()=>emit('gia-cloud-data-changed'))
      .on('postgres_changes',{event:'*',schema:'public',table:'family_events'},()=>emit('gia-cloud-data-changed'))
      .on('postgres_changes',{event:'*',schema:'public',table:'posts'},()=>emit('gia-cloud-data-changed'))
      .subscribe();
  }
  window.GiaCloud={state,init,signInGoogle,sendPhoneOtp,verifyPhoneOtp,signOut,upsertProfile,syncLocal,pullAll,loadRealtime,isConfigured:()=>ready};
  init().then(()=>loadRealtime()).catch(e=>emit('gia-cloud-status',{ready:false,error:e.message}));
})();