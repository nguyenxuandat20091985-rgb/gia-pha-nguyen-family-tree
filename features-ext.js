/* features-ext v1 – events board chat calendar rituals */
(function(){
  const EV_KEY='giaPhaEvents_v1', POST_KEY='giaPhaPosts_v1', CHAT_KEY='giaPhaChat_v1';
  let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
  function uid(){return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function loadJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch(e){return f;}}
  function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v));}

  function renderEvents(){
    const box=document.getElementById('eventsList');if(!box)return;
    const list=loadJSON(EV_KEY,[]);
    if(!list.length){box.innerHTML='<p class="muted">Chưa có sự kiện. Bấm + Tạo sự kiện.</p>';return;}
    box.innerHTML=list.slice().reverse().map(ev=>'<div class="event-card"><div class="event-type">'+(ev.type||'Sự kiện')+'</div><h4>'+esc(ev.title)+'</h4>'+(ev.date?'<p class="meta">📅 '+esc(ev.date)+'</p>':'')+(ev.body?'<div class="event-body">'+esc(ev.body)+'</div>':'')+'<button type="button" class="btn btn-small" data-del="'+esc(ev.id)+'">Xóa</button></div>').join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('Xóa?'))return;saveJSON(EV_KEY,loadJSON(EV_KEY,[]).filter(x=>x.id!==b.dataset.del));renderEvents();});
  }
  function renderBoard(){
    const box=document.getElementById('boardList');if(!box)return;
    const list=loadJSON(POST_KEY,[]);
    if(!list.length){box.innerHTML='<p class="muted">Chưa có bài. Bấm + Đăng bài.</p>';return;}
    box.innerHTML=list.slice().reverse().map(p=>'<div class="post-card"><h4>'+esc(p.title)+'</h4><p class="meta">'+esc(p.author||'')+(p.date?' · '+esc(p.date):'')+'</p><div class="event-body">'+esc(p.body)+'</div><button type="button" class="btn btn-small" data-del="'+esc(p.id)+'">Xóa</button></div>').join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('Xóa?'))return;saveJSON(POST_KEY,loadJSON(POST_KEY,[]).filter(x=>x.id!==b.dataset.del));renderBoard();});
  }
  function renderChat(){
    const box=document.getElementById('chatMessages');if(!box)return;
    const list=loadJSON(CHAT_KEY,[]);
    if(!list.length){box.innerHTML='<p class="muted">Chưa có tin nhắn.</p>';return;}
    box.innerHTML=list.map(m=>'<div class="chat-bubble"><strong>'+esc(m.author)+'</strong> <span class="meta">'+esc(m.time)+'</span><p>'+esc(m.text)+'</p></div>').join('');
    box.scrollTop=box.scrollHeight;
  }
  function renderCalendar(){
    const title=document.getElementById('calTitle'), grid=document.getElementById('calGrid');if(!grid)return;
    const months=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    if(title)title.textContent=months[calMonth]+' '+calYear;
    const startDay=(new Date(calYear,calMonth,1).getDay()+6)%7, days=new Date(calYear,calMonth+1,0).getDate(), today=new Date();
    let h='<div class="cal-weekdays"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div><div class="cal-days">';
    for(let i=0;i<startDay;i++)h+='<span class="cal-day empty"></span>';
    for(let d=1;d<=days;d++){const t=today.getFullYear()===calYear&&today.getMonth()===calMonth&&today.getDate()===d;h+='<span class="cal-day'+(t?' today':'')+'">'+d+'</span>';}
    grid.innerHTML=h+'</div>';
  }
  function renderRituals(){
    const box=document.getElementById('ritualsList');if(!box)return;
    const texts=window.RITUAL_TEXTS||[];
    if(!texts.length){box.innerHTML='<p class="muted">Chưa có văn khấn.</p>';return;}
    box.innerHTML=texts.map(r=>'<div class="event-card"><div class="event-type">'+esc(r.category||'')+'</div><h4>'+esc(r.name)+'</h4>'+(r.occasion?'<p class="meta">'+esc(r.occasion)+'</p>':'')+'<pre style="white-space:pre-wrap;font-family:inherit;font-size:0.9rem">'+esc(r.content)+'</pre></div>').join('');
  }

  if(window.GiaApp){
    const orig = window.GiaApp.showView;
    window.GiaApp.showView = function(name){
      orig(name);
      if(name==='events')renderEvents();
      if(name==='board')renderBoard();
      if(name==='chat')renderChat();
      if(name==='calendar')renderCalendar();
      if(name==='rituals')renderRituals();
    };
  }
  document.getElementById('bottomNav')?.addEventListener('click', function(){
    setTimeout(function(){
      const v=document.querySelector('.view:not(.hidden)');
      if(!v)return;
      const id=v.id||'';
      if(id==='view-events')renderEvents();
      if(id==='view-board')renderBoard();
      if(id==='view-chat')renderChat();
      if(id==='view-calendar')renderCalendar();
      if(id==='view-rituals')renderRituals();
    },50);
  });
  document.querySelectorAll('.more-item').forEach(el=>{
    el.addEventListener('click', function(){
      setTimeout(function(){
        const n=el.dataset.nav;
        if(n==='chat')renderChat();
        if(n==='calendar')renderCalendar();
        if(n==='rituals')renderRituals();
      },80);
    });
  });

  document.getElementById('btnAddEvent')?.addEventListener('click',()=>{
    const title=prompt('Tên sự kiện');if(!title)return;
    const date=prompt('Ngày','')||'';
    const type=prompt('Loại (Giỗ/Hiếu hỉ/Họp họ)','Hiếu hỉ')||'Sự kiện';
    const body=prompt('Ghi chú','')||'';
    const list=loadJSON(EV_KEY,[]);list.push({id:uid(),title,date,type,body,created:Date.now()});saveJSON(EV_KEY,list);renderEvents();
  });
  document.getElementById('btnAddPost')?.addEventListener('click',()=>{
    const title=prompt('Tiêu đề');if(!title)return;
    const body=prompt('Nội dung')||'';
    const author=prompt('Tên','Thành viên')||'Thành viên';
    const list=loadJSON(POST_KEY,[]);list.push({id:uid(),title,body,author,date:new Date().toLocaleDateString('vi-VN')});saveJSON(POST_KEY,list);renderBoard();
  });
  document.getElementById('btnSendChat')?.addEventListener('click',()=>{
    const input=document.getElementById('chatInput');const text=(input?.value||'').trim();if(!text)return;
    const author=(document.getElementById('chatAuthor')?.value||'').trim()||'Thành viên';
    const list=loadJSON(CHAT_KEY,[]);list.push({id:uid(),author,text,time:new Date().toLocaleString('vi-VN')});saveJSON(CHAT_KEY,list);if(input)input.value='';renderChat();
  });
  document.getElementById('btnCalPrev')?.addEventListener('click',()=>{calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();});
  document.getElementById('btnCalNext')?.addEventListener('click',()=>{calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();});
  document.getElementById('btnExport')?.addEventListener('click',()=>{
    const payload={tree:window.GiaApp?.data,events:loadJSON(EV_KEY,[]),posts:loadJSON(POST_KEY,[]),chat:loadJSON(CHAT_KEY,[]),exportedAt:new Date().toISOString()};
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='gia-pha-backup.json';a.click();
  });
  document.getElementById('btnImport')?.addEventListener('click',()=>document.getElementById('importFile')?.click());
  document.getElementById('importFile')?.addEventListener('change',e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(p.tree&&window.GiaApp){Object.assign(window.GiaApp.data,p.tree);window.GiaApp.saveTree();}if(p.events)saveJSON(EV_KEY,p.events);if(p.posts)saveJSON(POST_KEY,p.posts);if(p.chat)saveJSON(CHAT_KEY,p.chat);alert('Đã nhập dữ liệu');}catch(err){alert('File lỗi');}};r.readAsText(f);
  });

  if(!document.getElementById('featStyle')){const s=document.createElement('style');s.id='featStyle';s.textContent='.cal-weekdays,.cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal-weekdays{font-size:.75rem;font-weight:700;color:var(--primary);margin-bottom:8px}.cal-day{padding:10px 4px;border-radius:10px;background:var(--card);border:1px solid var(--border)}.cal-day.empty{background:transparent;border:none}.cal-day.today{background:linear-gradient(135deg,#7a0c0c,#c9a227);color:#fff;font-weight:700}.chat-bubble{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:8px}.chat-messages{max-height:50vh;overflow-y:auto}.tree-container{overflow-x:auto}';document.head.appendChild(s);}
})();
