/* gallery v2 – Thư viện Ảnh & Video dòng họ, đồng bộ cloud Supabase + local */
(function(){
  'use strict';
  const KEY='giaPhaMediaGallery_v1';
  const FAMILY_ALBUM_URL='https://photos.app.goo.gl/dpfNisTdXCJpwMYp6';
  const MAX_FILE=2*1024*1024;
  const MAX_STORE=3.5*1024*1024;
  const MAX_CLOUD_DATA_URL=600*1024;
  const $=id=>document.getElementById(id);
  const esc=s=>{const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;};
  const uid=()=> 'media_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

  let cache=[];
  let cloudReady=false;
  let syncing=false;

  function getSb(){
    try{
      if(window.GiaCloud && window.GiaCloud._sb) return window.GiaCloud._sb;
      const cfg=window.GIA_SUPABASE_CONFIG||{};
      if(cfg.url&&cfg.anonKey&&window.supabase){
        return window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
      }
    }catch(e){}
    return null;
  }

  function loadLocal(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return[];}
  }
  function saveLocal(list){
    const raw=JSON.stringify(list);
    if(raw.length>MAX_STORE) throw new Error('Kho local đã đầy. Hãy dùng URL hoặc xóa bớt.');
    localStorage.setItem(KEY,raw);
  }

  function normalize(row){
    return {
      id: String(row.id||uid()),
      type: row.type==='video'?'video':'image',
      url: String(row.url||''),
      title: String(row.title||'Kỷ niệm dòng họ'),
      note: String(row.note||''),
      created: Number(row.created||row.created_at&&Date.parse(row.created_at)||Date.now())
    };
  }

  function mergeLists(cloud, local){
    const map={};
    (cloud||[]).forEach(m=>{map[m.id]=m;});
    (local||[]).forEach(m=>{
      if(!map[m.id]) map[m.id]=m;
      else if((m.created||0)>(map[m.id].created||0)) map[m.id]=m;
    });
    return Object.values(map).sort((a,b)=>(a.created||0)-(b.created||0));
  }

  async function fetchCloud(){
    const sb=getSb();
    if(!sb) return null;
    try{
      const {data,error}=await sb.from('family_gallery').select('id,type,url,title,note,created_at').order('created_at',{ascending:true});
      if(error){
        console.warn('gallery cloud fetch', error.message||error);
        cloudReady=false;
        return null;
      }
      cloudReady=true;
      return (data||[]).map(r=>normalize({
        id:r.id, type:r.type, url:r.url, title:r.title, note:r.note,
        created: r.created_at?Date.parse(r.created_at):Date.now()
      }));
    }catch(e){
      console.warn('gallery cloud', e);
      return null;
    }
  }

  async function pushCloudItem(item){
    const sb=getSb();
    if(!sb||!cloudReady) return false;
    if(String(item.url).startsWith('data:') && item.url.length>MAX_CLOUD_DATA_URL){
      return false;
    }
    try{
      const row={
        id: item.id,
        type: item.type,
        url: item.url,
        title: item.title||'',
        note: item.note||'',
        created_at: new Date(item.created||Date.now()).toISOString()
      };
      const {error}=await sb.from('family_gallery').upsert(row,{onConflict:'id'});
      if(error){ console.warn('gallery upsert', error.message||error); return false; }
      return true;
    }catch(e){ console.warn(e); return false; }
  }

  async function deleteCloudItem(id){
    const sb=getSb();
    if(!sb||!cloudReady) return false;
    try{
      const {error}=await sb.from('family_gallery').delete().eq('id', id);
      if(error){ console.warn('gallery delete', error.message||error); return false; }
      return true;
    }catch(e){ return false; }
  }

  async function refreshAll(){
    if(syncing) return cache;
    syncing=true;
    try{
      const local=loadLocal();
      const cloud=await fetchCloud();
      if(cloud){
        cache=mergeLists(cloud, local);
        for(const m of local){
          if(!cloud.find(c=>c.id===m.id)){
            await pushCloudItem(m);
          }
        }
        try{ saveLocal(cache); }catch(e){}
      }else{
        cache=local;
      }
    }finally{
      syncing=false;
    }
    return cache;
  }

  function load(){ return cache.length?cache:loadLocal(); }

  async function save(list){
    cache=list;
    try{ saveLocal(list); }catch(e){ throw e; }
  }

  function mediaHtml(m,canDelete){
    const media=m.type==='video'
      ? '<video src="'+esc(m.url)+'" muted preload="metadata"></video><span class="gallery-play">▶</span>'
      : '<img src="'+esc(m.url)+'" alt="'+esc(m.title)+'" loading="lazy"/>';
    return '<article class="gallery-item" data-id="'+esc(m.id)+'">'+media+
      (canDelete?'<button type="button" class="gallery-item-delete" data-del-media="'+esc(m.id)+'" aria-label="Xóa">×</button>':'')+
      '<div class="gallery-caption">'+esc(m.title||'Kỷ niệm dòng họ')+'</div></article>';
  }

  function render(targetId,limit,canDelete){
    const box=$(targetId);if(!box)return;
    const list=load().slice().reverse().slice(0,Math.min(limit||999,targetId==='homeGalleryPreview'?5:999));
    box.innerHTML=list.length?list.map(m=>mediaHtml(m,canDelete)).join(''):'<div class="gallery-empty">Chưa có ảnh/video. Hãy thêm kỷ niệm đầu tiên cho dòng họ.</div>';
    box.querySelectorAll('.gallery-item').forEach(el=>el.addEventListener('click',function(e){
      if(e.target.closest('[data-del-media]'))return;
      const m=load().find(x=>x.id===el.dataset.id);if(m)openViewer(m);
    }));
    box.querySelectorAll('[data-del-media]').forEach(b=>b.addEventListener('click',async function(e){
      e.stopPropagation();
      if(!(await window.GiaDialog?.confirm('Xóa kỷ niệm này?','Xóa kỷ niệm')))return;
      const next=load().filter(x=>x.id!==b.dataset.delMedia);
      await save(next);
      await deleteCloudItem(b.dataset.delMedia);
      render('galleryGrid',999,true);
      render('homeGalleryPreview',5,false);
      startHomeCarousel();
    }));
  }

  function openViewer(m){
    let modal=$('galleryModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='galleryModal';
      modal.className='gallery-modal hidden';
      modal.innerHTML='<div class="gallery-modal-backdrop" data-close-gallery></div><div class="gallery-modal-body"><button type="button" class="gallery-modal-close" data-close-gallery aria-label="Đóng">×</button><div id="galleryModalContent"></div><div id="galleryModalTitle" class="gallery-modal-title"></div></div>';
      document.body.appendChild(modal);
      modal.querySelectorAll('[data-close-gallery]').forEach(el=>el.addEventListener('click',()=>modal.classList.add('hidden')));
    }
    const content=$('galleryModalContent');
    const title=$('galleryModalTitle');
    if(content){
      content.innerHTML=m.type==='video'
        ? '<video src="'+esc(m.url)+'" controls autoplay playsinline style="max-width:100%;max-height:70vh"></video>'
        : '<img src="'+esc(m.url)+'" alt="'+esc(m.title)+'" style="max-width:100%;max-height:70vh;object-fit:contain"/>';
    }
    if(title) title.textContent=m.title||'';
    modal.classList.remove('hidden');
  }

  function addItem(item){
    const list=load();
    list.push(item);
    return save(list).then(async()=>{
      await pushCloudItem(item);
      render('galleryGrid',999,true);
      render('homeGalleryPreview',5,false);
      startHomeCarousel();
    });
  }

  function showGallery(){
    window.GiaApp?.showView('gallery');
    render('galleryGrid',999,true);
  }

  function bind(){
    const openBtn=$('galleryOpenUpload');
    const fileInput=$('galleryFile');
    if(openBtn&&fileInput){
      openBtn.addEventListener('click',()=>fileInput.click());
      fileInput.addEventListener('change',function(){
        const files=[...fileInput.files||[]];
        fileInput.value='';
        if(!files.length)return;
        const valid=files.filter(f=>f.size<=MAX_FILE);
        if(!valid.length){
          window.GiaDialog?.alert('Tệp quá lớn (tối đa 2MB mỗi tệp). Hãy dùng URL hoặc Album Google Photos.','Thư viện');
          return;
        }
        let list=load(), pending=valid.length, added=0;
        valid.forEach(f=>{
          const type=f.type.startsWith('video/')?'video':'image';
          const reader=new FileReader();
          reader.onload=async()=>{
            try{
              const item={id:uid(),type,url:reader.result,title:f.name,note:'',created:Date.now()};
              const candidate=[...list,item];
              if(JSON.stringify(candidate).length<=MAX_STORE){
                list.push(item); added++;
                await pushCloudItem(item);
              }else if(added===0){
                window.GiaDialog?.alert('Kho thiết bị không đủ chỗ. Hãy dùng URL hoặc Album chung.','Thư viện');
              }
            }catch(err){}
            pending--;
            if(pending===0){
              try{ await save(list); }catch(err){ window.GiaDialog?.alert(err.message||'Không lưu được.','Thư viện'); }
              render('galleryGrid',999,true);
              render('homeGalleryPreview',3,false);
              startHomeCarousel();
              if(added) window.GiaDialog?.alert('Đã thêm '+added+' ảnh/video'+(cloudReady?' (đã đồng bộ cloud).':'.') ,'Thư viện');
            }
          };
          reader.readAsDataURL(f);
        });
      });
    }
    const addUrlBtn=$('galleryAddUrl');
    if(addUrlBtn){
      addUrlBtn.addEventListener('click',async function(){
        const url=($('galleryUrl')?.value||'').trim();
        const type=$('galleryType')?.value||'image';
        const title=($('galleryTitle')?.value||'').trim()||'Kỷ niệm dòng họ';
        if(!url){ window.GiaDialog?.alert('Anh hãy dán URL ảnh/video.','Thư viện'); return; }
        try{
          const item={id:uid(),type,url,title,note:'',created:Date.now()};
          await addItem(item);
          if($('galleryUrl')) $('galleryUrl').value='';
          if($('galleryTitle')) $('galleryTitle').value='';
          window.GiaDialog?.alert(cloudReady?'Đã thêm và đồng bộ cloud.':'Đã thêm trên máy này.','Thư viện');
        }catch(err){
          window.GiaDialog?.alert(err.message||'Không thể lưu URL.','Thư viện');
        }
      });
    }
    document.querySelectorAll('[data-gallery-album]').forEach(a=>{
      if(!a.href) a.href=FAMILY_ALBUM_URL;
    });
    document.querySelectorAll('[data-nav="gallery"]').forEach(b=>b.addEventListener('click',showGallery));
    document.querySelectorAll('#view-gallery [data-nav="home"]').forEach(b=>b.addEventListener('click',()=>window.GiaApp?.showView('home')));
  }

  let homeCarouselTimer=null;
  function startHomeCarousel(){
    if(homeCarouselTimer) clearInterval(homeCarouselTimer);
    const box=$('homeGalleryPreview'); if(!box) return;
    homeCarouselTimer=setInterval(()=>{
      if(document.hidden||!box.children.length) return;
      const first=box.children[0], step=first.offsetWidth+10;
      if(box.scrollLeft+box.clientWidth>=box.scrollWidth-8) box.scrollTo({left:0,behavior:'smooth'});
      else box.scrollBy({left:step,behavior:'smooth'});
    },4500);
  }

  function updateCloudBadge(){
    const note=document.querySelector('#view-gallery .gallery-note');
    if(!note) return;
    note.innerHTML=cloudReady
      ? '☁️ Thư viện <b>đồng bộ cloud</b> — Chrome và app dùng chung một kho ảnh. Ảnh lớn nên lưu Album Google Photos.'
      : 'Thư viện đang lưu trên thiết bị. Để đồng bộ mọi máy, chạy SQL family_gallery trên Supabase. Ảnh lớn: Album Google Photos.';
  }

  async function init(){
    const main=$('mainContent'); if(!main) return;
    if(!$('view-gallery')){
      const sec=document.createElement('section');
      sec.id='view-gallery';
      sec.className='view hidden';
      sec.innerHTML='<div class="gallery-panel"><div class="view-toolbar"><button type="button" class="btn btn-primary" id="galleryOpenUpload">+ Tải ảnh/video</button><button type="button" class="btn btn-secondary" style="background:#f0e6d8;color:var(--text);border:0" data-nav="home">← Trang chủ</button></div>'+
        '<div class="gallery-note">Đang kết nối kho ảnh dòng họ…</div>'+
        '<div class="gallery-upload-row"><div class="gallery-url-row"><input id="galleryUrl" type="url" placeholder="Dán URL ảnh/video"/><select id="galleryType"><option value="image">Ảnh</option><option value="video">Video</option></select></div><input id="galleryTitle" type="text" placeholder="Tên kỷ niệm (không bắt buộc)"/><button type="button" class="btn btn-primary btn-block" id="galleryAddUrl">+ Thêm từ URL</button><input id="galleryFile" type="file" accept="image/*,video/*" multiple hidden/></div>'+
        '<div id="galleryGrid" class="gallery-grid" style="margin-top:14px"></div></div>';
      main.appendChild(sec);
    }
    bind();
    await refreshAll();
    updateCloudBadge();
    render('homeGalleryPreview',5,false);
    render('galleryGrid',999,true);
    startHomeCarousel();
  }

  const wait=()=>{ if(window.GiaApp) init(); else setTimeout(wait,30); };
  wait();
  window.addEventListener('gia-auth-changed', function(){
    refreshAll().then(function(){
      updateCloudBadge();
      render('homeGalleryPreview',5,false);
      render('galleryGrid',999,true);
      startHomeCarousel();
    });
  });
  window.GiaGallery={showGallery,render:()=>render('galleryGrid',999,true),refresh:refreshAll};
})();
