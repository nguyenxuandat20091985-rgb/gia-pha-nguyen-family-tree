/* gallery v1 – Thư viện Ảnh & Video dòng họ, lưu cục bộ trên thiết bị */
(function(){
  'use strict';
  const KEY='giaPhaMediaGallery_v1';
  const FAMILY_ALBUM_URL='https://photos.app.goo.gl/dpfNisTdXCJpwMYp6';
  const MAX_FILE=2*1024*1024;
  const MAX_STORE=3.5*1024*1024;
  // Anh có thể đổi URL này sang album Google Photos riêng của dòng họ khi đã có link.
  const $=id=>document.getElementById(id);
  const esc=s=>{const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;};
  const uid=()=> 'media_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return[];}}
  function save(list){const raw=JSON.stringify(list);if(raw.length>MAX_STORE)throw new Error('Kho lưu trữ trên thiết bị đã gần đầy. Hãy dùng URL hoặc xóa bớt tệp.');localStorage.setItem(KEY,raw);}
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
    box.querySelectorAll('[data-del-media]').forEach(b=>b.addEventListener('click',function(e){
      e.stopPropagation();if(!confirm('Xóa kỷ niệm này khỏi thiết bị?'))return;
      save(load().filter(x=>x.id!==b.dataset.delMedia));render('galleryGrid',999,true);render('homeGalleryPreview',5,false);
    }));
  }
  function openViewer(m){
    let modal=$('galleryModal');
    if(!modal){
      modal=document.createElement('div');modal.id='galleryModal';modal.className='gallery-modal';
      modal.innerHTML='<div class="gallery-modal-inner"><button type="button" class="gallery-modal-close" id="galleryClose">×</button><div id="galleryViewer"></div></div>';
      document.body.appendChild(modal);
      $('galleryClose').onclick=()=>modal.remove();
      modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    }
    $('galleryViewer').innerHTML=(m.type==='video'
      ? '<video class="gallery-modal-media" src="'+esc(m.url)+'" controls autoplay></video>'
      : '<img class="gallery-modal-media" src="'+esc(m.url)+'" alt="'+esc(m.title)+'"/>')+
      '<h3 style="margin:10px 4px 2px;color:var(--primary)">'+esc(m.title||'Kỷ niệm dòng họ')+'</h3>'+
      (m.note?'<p class="muted" style="margin:0 4px 8px">'+esc(m.note)+'</p>':'');
    modal.classList.remove('hidden');
  }
  function showGallery(){
    if(window.GiaApp?.showView)window.GiaApp.showView('gallery');
    render('galleryGrid',999,true);
  }
  function addItem(item){const list=load();list.push(item);save(list);render('galleryGrid',999,true);render('homeGalleryPreview',5,false);}
  function bind(){
    document.querySelectorAll('[data-gallery-album]').forEach(a=>{a.href=FAMILY_ALBUM_URL;});
    $('galleryOpenUpload')?.addEventListener('click',()=>window.open(FAMILY_ALBUM_URL,'_blank','noopener'));
    $('galleryFile')?.addEventListener('change',e=>{
      const files=Array.from(e.target.files||[]);if(!files.length)return;
      const oversized=files.filter(f=>f.size>MAX_FILE);
      if(oversized.length){alert(oversized.length+' tệp vượt quá 2 MB và sẽ được bỏ qua. Anh có thể dùng URL cho video lớn.');}
      const valid=files.filter(f=>f.size<=MAX_FILE);
      if(!valid.length){e.target.value='';return;}
      let list=load(), pending=valid.length, added=0;
      valid.forEach(f=>{
        const type=f.type.startsWith('video/')?'video':'image', reader=new FileReader();
        reader.onload=()=>{
          try{
            const item={id:uid(),type,url:reader.result,title:f.name,note:'',created:Date.now()};
            const candidate=[...list,item];
            if(JSON.stringify(candidate).length<=MAX_STORE){list.push(item);added++;}
            else if(added===0){alert('Kho localStorage không đủ chỗ cho tệp này. Hãy dùng URL hoặc xóa bớt nội dung.');}
          }catch(err){}
          pending--;
          if(pending===0){
            try{save(list);}catch(err){alert(err.message||'Không thể lưu các tệp.');}
            render('galleryGrid',999,true);render('homeGalleryPreview',3,false);
            if(added)alert('Đã thêm '+added+' ảnh/video vào thư viện.');
          }
        };
        reader.readAsDataURL(f);
      });
      e.target.value='';
    });
    $('galleryAddUrl')?.addEventListener('click',()=>{
      const url=($('galleryUrl')?.value||'').trim();if(!url){alert('Nhập URL ảnh hoặc video.');return;}
      const type=($('galleryType')?.value||'image'),title=(($('galleryTitle')?.value||'').trim()||'Kỷ niệm dòng họ');
      try{addItem({id:uid(),type,url,title,note:'',created:Date.now()});$('galleryUrl').value='';$('galleryTitle').value='';}
      catch(err){alert(err.message||'Không thể lưu URL.');}
    });
    document.querySelectorAll('[data-nav="gallery"]').forEach(b=>b.addEventListener('click',showGallery));
    document.querySelectorAll('#view-gallery [data-nav="home"]').forEach(b=>b.addEventListener('click',()=>window.GiaApp?.showView('home')));
  }
  function init(){
    const main=$('mainContent');if(!main)return;
    if(!$('view-gallery')){
      const sec=document.createElement('section');sec.id='view-gallery';sec.className='view hidden';
      sec.innerHTML='<div class="gallery-panel"><div class="view-toolbar"><button type="button" class="btn btn-primary" id="galleryOpenUpload">+ Tải ảnh/video</button><button type="button" class="btn btn-secondary" style="background:#f0e6d8;color:var(--text);border:0" data-nav="home">← Trang chủ</button></div>'+
      '<div class="gallery-note">Để ứng dụng luôn nhẹ và không tràn bộ nhớ, ảnh/video dung lượng lớn được lưu tại Album Google Photos chung. Thư viện trong app chỉ giữ vài mục nhẹ từ URL để làm kỷ niệm nổi bật.</div>'+
      '<div class="gallery-upload-row"><div class="gallery-url-row"><input id="galleryUrl" type="url" placeholder="Dán URL ảnh/video để test"/><select id="galleryType"><option value="image">Ảnh</option><option value="video">Video</option></select></div><input id="galleryTitle" type="text" placeholder="Tên kỷ niệm (không bắt buộc)"/><button type="button" class="btn btn-primary btn-block" id="galleryAddUrl">+ Thêm từ URL</button><input id="galleryFile" type="file" accept="image/*,video/*" multiple hidden/></div>'+
      '<div id="galleryGrid" class="gallery-grid" style="margin-top:14px"></div></div>';
      main.appendChild(sec);
    }
    bind();render('homeGalleryPreview',3,false);
  }
  const wait=()=>{if(window.GiaApp)init();else setTimeout(wait,30);};wait();
  window.GiaGallery={showGallery,render:()=>render('galleryGrid',999,true)};
})();