/* features-ext v4 – events board chat calendar rituals + independent family fund */
(function(){
  const EV_KEY='giaPhaEvents_v1', POST_KEY='giaPhaPosts_v1', CHAT_KEY='giaPhaChat_v1', FUND_KEY='giaPhaFamilyFund_v1';
  let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
  const FUND_EVENTS=[
    {id:'gio-2026',name:'Giỗ tộc năm 2026'},
    {id:'nha-tho',name:'Xây nhà thờ họ'},
    {id:'khuyen-hoc',name:'Quỹ khuyến học'}
  ];
  function uid(){return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function loadJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch(e){return f;}}
  function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v));}

  const FUND_CLEANUP_KEY='giaPhaFamilyFund_cleanup_v1';
  function loadFund(){
    let rows=loadJSON(FUND_KEY,[]).filter(x=>x && x.id && x.eventId && x.name);
    if(!localStorage.getItem(FUND_CLEANUP_KEY)){
      const legacy=[
        ['Nguyễn Văn Minh','gio-2026',2000000],
        ['Nguyễn Thị Lan','gio-2026',1000000],
        ['Nguyễn Xuân Hùng','nha-tho',5000000],
        ['Nguyễn Văn Nam','khuyen-hoc',500000]
      ];
      rows=rows.filter(x=>!legacy.some(([name,eventId,amount])=>x.name===name&&x.eventId===eventId&&Number(x.amount)===amount));
      saveJSON(FUND_KEY,rows);localStorage.setItem(FUND_CLEANUP_KEY,'1');
    }
    return rows;
  }
  const LIAISON_KEY='giaPhaLiaison_v1';
  function renderLiaison(){
    const box=document.getElementById('liaisonList');if(!box)return;
    const people=loadJSON(LIAISON_KEY,[]).filter(p=>p&&p.name&&p.role&&p.phone);
    if(!people.length){box.innerHTML='<div class="liaison-empty">Chưa có thông tin Ban liên lạc. Hãy thêm đại diện sau khi xác nhận họ tên và số điện thoại.</div>';return;}
    box.innerHTML=people.map(p=>{const phone=String(p.phone).replace(/[^+0-9]/g,'');const zalo=phone.replace(/^\\+/,'');const avatar=p.avatar?'<img src="'+esc(p.avatar)+'" alt="">':'👤';return '<article class="liaison-card"><div class="liaison-avatar">'+avatar+'</div><div class="liaison-info"><strong>'+esc(p.name)+'</strong><span class="liaison-role">'+esc(p.role)+'</span><a class="liaison-phone" href="tel:'+esc(phone)+'">'+esc(p.phone)+'</a></div><div class="liaison-actions"><a class="liaison-call" href="tel:'+esc(phone)+'">☎ Gọi</a><a class="liaison-zalo" href="https://zalo.me/'+encodeURIComponent(zalo)+'" target="_blank" rel="noopener">Zalo</a></div></article>';}).join('');
  }
  document.getElementById('btnAddLiaison')?.addEventListener('click',async()=>{
    const v=await window.GiaDialog?.form([{key:'name',label:'Họ tên *',placeholder:'Họ tên đại diện'},{key:'role',label:'Vai trò *',placeholder:'Trưởng họ / Trưởng Chi 1'},{key:'phone',label:'Số điện thoại *',placeholder:'09xxxxxxxx'},{key:'avatar',label:'Ảnh đại diện (URL, không bắt buộc)',placeholder:'https://...'}],'Thêm thành viên Ban liên lạc','Chỉ nhập thông tin đã được thành viên đồng ý công khai.');
    if(!v||!v.name?.trim()||!v.role?.trim()||!v.phone?.trim())return;
    const people=loadJSON(LIAISON_KEY,[]);people.push({id:uid(),name:v.name.trim(),role:v.role.trim(),phone:v.phone.trim(),avatar:(v.avatar||'').trim()});saveJSON(LIAISON_KEY,people);renderLiaison();
  });
  function formatMoney(n){return new Intl.NumberFormat('vi-VN').format(Number(n)||0)+' ₫';}

  function renderFund(){
    const select=document.getElementById('fundEventSelect'), listBox=document.getElementById('fundList');
    if(!select||!listBox)return;
    const records=loadFund();
    if(!select.dataset.ready){
      select.innerHTML=FUND_EVENTS.map(e=>'<option value="'+e.id+'">'+esc(e.name)+'</option>').join('');
      select.value='gio-2026';select.dataset.ready='1';
    }
    const eventId=select.value||FUND_EVENTS[0].id;
    const rows=records.filter(x=>x.eventId===eventId);
    const total=rows.reduce((sum,x)=>sum+(Number(x.amount)||0),0);
    const totalEl=document.getElementById('fundTotal'), countEl=document.getElementById('fundCount');
    if(totalEl)totalEl.textContent=formatMoney(total);
    if(countEl)countEl.textContent=rows.length;
    if(!rows.length){listBox.innerHTML='<div class="fund-empty">Chưa có khoản đóng góp nào cho sự kiện này</div>';return;}
    listBox.innerHTML=rows.slice().reverse().map(x=>'<article class="fund-card"><div class="fund-person"><strong>'+esc(x.name)+'</strong><small>'+esc(x.branch||'Thành viên dòng họ')+'</small></div><div class="fund-main"><strong>'+formatMoney(x.amount)+'</strong><p>'+esc(x.note||'')+'</p></div><time>'+esc(x.date||'')+'</time></article>').join('');
  }

  function renderEvents(){
    const box=document.getElementById('eventsList');if(!box)return;
    const list=loadJSON(EV_KEY,[]);
    if(!list.length){box.innerHTML='<p class="muted">Chưa có sự kiện. Bấm + Tạo sự kiện.</p>';return;}
    box.innerHTML=list.slice().reverse().map(ev=>'<div class="event-card"><div class="event-type">'+(ev.type||'Sự kiện')+'</div><h4>'+esc(ev.title)+'</h4>'+(ev.date?'<p class="meta">📅 '+esc(ev.date)+'</p>':'')+(ev.body?'<div class="event-body">'+esc(ev.body)+'</div>':'')+'<button type="button" class="btn btn-small" data-del="'+esc(ev.id)+'">Xóa</button></div>').join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!(await window.GiaDialog?.confirm('Xóa sự kiện này?','Xóa sự kiện')))return;saveJSON(EV_KEY,loadJSON(EV_KEY,[]).filter(x=>x.id!==b.dataset.del));renderEvents();});
  }
  function renderBoard(){
    const box=document.getElementById('boardList');if(!box)return;
    const list=loadJSON(POST_KEY,[]);
    if(!list.length){box.innerHTML='<p class="muted">Chưa có bài. Bấm + Đăng bài.</p>';return;}
    box.innerHTML=list.slice().reverse().map(p=>'<div class="post-card"><h4>'+esc(p.title)+'</h4><p class="meta">'+esc(p.author||'')+(p.date?' · '+esc(p.date):'')+'</p><div class="event-body">'+esc(p.body)+'</div><button type="button" class="btn btn-small" data-del="'+esc(p.id)+'">Xóa</button></div>').join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!(await window.GiaDialog?.confirm('Xóa bài viết này?','Xóa bài đăng')))return;saveJSON(POST_KEY,loadJSON(POST_KEY,[]).filter(x=>x.id!==b.dataset.del));renderBoard();});
  }
  function renderChat(){
    const box=document.getElementById('chatMessages');if(!box)return;
    const list=loadJSON(CHAT_KEY,[]);
    if(!list.length){box.innerHTML='<div class="chat-empty">🌿 Hãy gửi lời hỏi thăm đầu tiên, để tình thân dòng họ luôn được nối dài.</div>';return;}
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
    const orig=window.GiaApp.showView;
    window.GiaApp.showView=function(name){orig(name);if(name==='events')renderEvents();if(name==='board')renderBoard();if(name==='chat')renderChat();if(name==='calendar')renderCalendar();if(name==='rituals')renderRituals();if(name==='family-fund')renderFund();if(name==='liaison')renderLiaison();};
  }
  document.getElementById('bottomNav')?.addEventListener('click',function(){setTimeout(function(){const v=document.querySelector('.view:not(.hidden)');if(!v)return;const id=v.id||'';if(id==='view-events')renderEvents();if(id==='view-board')renderBoard();if(id==='view-chat')renderChat();if(id==='view-calendar')renderCalendar();if(id==='view-rituals')renderRituals();if(id==='view-family-fund')renderFund();},50);});
  document.querySelectorAll('.more-item').forEach(el=>el.addEventListener('click',function(){setTimeout(function(){const n=el.dataset.nav;if(n==='chat')renderChat();if(n==='calendar')renderCalendar();if(n==='rituals')renderRituals();if(n==='family-fund')renderFund();if(n==='liaison')renderLiaison();},80);}));
  document.getElementById('fundEventSelect')?.addEventListener('change',renderFund);

  document.getElementById('btnAddFund')?.addEventListener('click',async e=>{
    e.preventDefault();
    const v=await window.GiaDialog?.form([
      {key:'name',label:'Họ tên *',placeholder:'Nguyễn Văn A'},
      {key:'branch',label:'Chi / Đời',placeholder:'Ví dụ: Chi 2 · Đời 5'},
      {key:'amount',label:'Số tiền *',type:'number',placeholder:'500000'},
      {key:'note',label:'Lời nhắn',type:'textarea',placeholder:'Lời kính lễ hoặc lời nhắn gửi',rows:3},
      {key:'date',label:'Ngày ghi danh',value:new Date().toLocaleDateString('vi-VN')}
    ],'Đóng góp / Ghi danh','Nhập thử một khoản đóng góp để xem giao diện.');
    if(!v||!(v.name||'').trim()||!(v.amount||'').trim())return;
    const amount=Number(String(v.amount).replace(/[^0-9]/g,''));if(!amount||amount<0){await window.GiaDialog?.alert('Vui lòng nhập số tiền hợp lệ.','Sổ vàng dòng họ');return;}
    const records=loadJSON(FUND_KEY,[]);records.push({id:uid(),eventId:document.getElementById('fundEventSelect')?.value||'gio-2026',name:v.name.trim(),branch:(v.branch||'').trim(),amount,note:(v.note||'').trim(),date:(v.date||new Date().toLocaleDateString('vi-VN')).trim()});saveJSON(FUND_KEY,records);renderFund();
  });

  document.getElementById('btnAddEvent')?.addEventListener('click',async e=>{e.preventDefault();
    const v=await window.GiaDialog?.form([{key:'title',label:'Tên sự kiện *',placeholder:'Ví dụ: Giỗ Cụ Tổ'},{key:'date',label:'Ngày',placeholder:'dd/mm/yyyy'},{key:'type',label:'Loại sự kiện',type:'select',value:'Hiếu hỉ',options:[{value:'Giỗ',label:'Giỗ'},{value:'Hiếu hỉ',label:'Hiếu hỉ'},{value:'Họp họ',label:'Họp họ'},{value:'Khác',label:'Khác'}]},{key:'body',label:'Ghi chú',type:'textarea',placeholder:'Nội dung hoặc ghi chú'}],'Tạo sự kiện','Nhập thông tin sự kiện của dòng họ.');
    if(!v||!(v.title||'').trim())return;const list=loadJSON(EV_KEY,[]);list.push({id:uid(),title:v.title.trim(),date:(v.date||'').trim(),type:v.type||'Sự kiện',body:(v.body||'').trim(),created:Date.now()});saveJSON(EV_KEY,list);renderEvents();
  });
  document.getElementById('btnAddPost')?.addEventListener('click',async e=>{e.preventDefault();
    const v=await window.GiaDialog?.form([{key:'title',label:'Tiêu đề *',placeholder:'Nhập tiêu đề bài đăng'},{key:'body',label:'Nội dung',type:'textarea',placeholder:'Viết nội dung bài đăng...',rows:5},{key:'author',label:'Tên người đăng',value:'Thành viên',placeholder:'Tên hiển thị'}],'Đăng bài','Chia sẻ thông tin với bà con trong dòng họ.');
    if(!v||!(v.title||'').trim())return;const list=loadJSON(POST_KEY,[]);list.push({id:uid(),title:v.title.trim(),body:(v.body||'').trim(),author:(v.author||'Thành viên').trim()||'Thành viên',date:new Date().toLocaleDateString('vi-VN')});saveJSON(POST_KEY,list);renderBoard();
  });
  function sendFamilyChat(e){e?.preventDefault();const input=document.getElementById('chatInput'),text=(input?.value||'').trim();if(!text)return;const author=(document.getElementById('chatAuthor')?.value||'').trim()||'Thành viên';const list=loadJSON(CHAT_KEY,[]);list.push({id:uid(),author,text,time:new Date().toLocaleString('vi-VN')});saveJSON(CHAT_KEY,list);if(input)input.value='';renderChat();input?.focus();}
  document.getElementById('chatCompose')?.addEventListener('submit',sendFamilyChat);
  document.getElementById('btnSendChat')?.addEventListener('click',e=>{e.preventDefault();sendFamilyChat();});
  document.getElementById('btnCalPrev')?.addEventListener('click',()=>{calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();});
  document.getElementById('btnCalNext')?.addEventListener('click',()=>{calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();});
  document.getElementById('btnExport')?.addEventListener('click',()=>{const payload={tree:window.GiaApp?.data,events:loadJSON(EV_KEY,[]),posts:loadJSON(POST_KEY,[]),chat:loadJSON(CHAT_KEY,[]),exportedAt:new Date().toISOString()};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='gia-pha-backup.json';a.click();});
  document.getElementById('btnImport')?.addEventListener('click',()=>document.getElementById('importFile')?.click());
  document.getElementById('importFile')?.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const p=JSON.parse(r.result);if(p.tree&&window.GiaApp){Object.assign(window.GiaApp.data,p.tree);window.GiaApp.saveTree();}if(p.events)saveJSON(EV_KEY,p.events);if(p.posts)saveJSON(POST_KEY,p.posts);if(p.chat)saveJSON(CHAT_KEY,p.chat);await window.GiaDialog?.alert('Đã nhập dữ liệu thành công.','Nhập dữ liệu');}catch(err){await window.GiaDialog?.alert('Tệp dữ liệu không hợp lệ hoặc đã bị lỗi.','Nhập dữ liệu');}};r.readAsText(f);});

  if(!document.getElementById('featStyle')){const s=document.createElement('style');s.id='featStyle';s.textContent='.cal-weekdays,.cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal-weekdays{font-size:.75rem;font-weight:700;color:var(--primary);margin-bottom:8px}.cal-day{padding:10px 4px;border-radius:10px;background:var(--card);border:1px solid var(--border)}.cal-day.empty{background:transparent;border:none}.cal-day.today{background:linear-gradient(135deg,#7a0c0c,#c9a227);color:#fff;font-weight:700}.family-chat{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:8px;height:calc(100dvh - 104px);min-height:0}.family-chat-heading{display:none}.family-chat-mark{width:42px;height:42px;display:grid;place-items:center;background:#ffffff24;border-radius:50%;font-size:1.25rem}.family-chat-heading h2{margin:0;font-family:var(--font-serif);font-size:1.08rem}.family-chat-heading p{font-size:.78rem;opacity:.9;margin:3px 0 0}.chat-messages{flex:1;height:auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:12px 9px;background:var(--card);border:1px solid var(--border);border-radius:14px;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth}.chat-bubble{align-self:flex-start;max-width:88%;background:#fff8eb;border:1px solid #ead9b8;border-radius:5px 16px 16px 16px;padding:9px 12px;box-shadow:0 2px 8px #4b2b1010;overflow-wrap:anywhere}.chat-bubble strong{display:block;color:#7a0c0c;font-size:.78rem;margin-bottom:3px}.chat-bubble p{margin:0;color:#30251f;font-size:.92rem;line-height:1.45;white-space:pre-wrap}.chat-bubble .meta{display:block;text-align:right;font-size:.67rem;color:#8b8178;margin-top:5px}.chat-compose{padding:7px 8px;background:var(--card);border:1px solid var(--border);border-radius:13px;display:flex;flex-direction:row;align-items:center;gap:7px}.chat-compose>input{width:78px;flex:0 0 78px;min-height:38px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);font:inherit;font-size:.76rem;padding:7px 8px;outline:none}.chat-compose-bottom{display:flex;align-items:center;gap:7px;flex:1;min-width:0}.chat-compose-bottom textarea{flex:1;min-width:0;resize:none;max-height:72px;min-height:38px;border:1px solid var(--border);border-radius:11px;padding:9px 10px;background:var(--bg);color:var(--text);font:inherit;font-size:.86rem;line-height:1.3;outline:none}.chat-compose-bottom button{width:42px;height:42px;flex:0 0 42px;border-radius:50%;font-size:1rem;display:grid;place-items:center;padding:0}.chat-compose-bottom button:disabled{opacity:.5}.chat-empty{margin:auto;text-align:center;color:var(--text-muted);font-size:.88rem;padding:20px}.chat-compose input:focus,.chat-compose textarea:focus{border-color:var(--gold)}@media(max-width:600px){.family-chat{height:calc(100dvh - 86px);gap:6px}.chat-messages{padding:9px 7px;gap:7px;border-radius:12px}.chat-bubble{max-width:94%;padding:8px 10px}.chat-compose{padding:6px;gap:6px}.chat-compose>input{width:72px;flex-basis:72px;font-size:.72rem;padding:6px}.chat-compose-bottom{gap:6px}.chat-compose-bottom textarea{font-size:.84rem;padding:8px 9px}.chat-compose-bottom button{width:40px;height:40px;flex-basis:40px}}.chat-bubble{max-width:94%}.family-chat-heading{padding:12px}.chat-compose{padding:9px}}/* Mobile chat space optimization: scoped only to Trò chuyện dòng tộc */.family-chat{gap:8px}.family-chat-heading{padding:9px 12px;border-radius:12px;border-bottom:2px solid var(--gold);gap:8px}.family-chat-mark{width:30px;height:30px;flex:0 0 30px;font-size:.9rem}.family-chat-heading h2{font-size:.95rem}.family-chat-heading p{display:none}.chat-messages{height:min(62vh,680px);min-height:300px;padding:10px 9px;gap:8px;border-radius:13px}.chat-bubble{max-width:92%;padding:8px 10px;border-radius:5px 13px 13px 13px}.chat-bubble strong{font-size:.74rem;margin-bottom:2px}.chat-bubble p{font-size:.88rem;line-height:1.38}.chat-bubble .meta{font-size:.62rem;margin-top:3px}.chat-compose{padding:7px 8px;border-radius:13px;gap:6px}.chat-compose>input{min-height:30px;height:30px;border:1px solid var(--border);border-radius:9px;padding:3px 9px;font-size:.76rem}.chat-compose-bottom{gap:6px}.chat-compose-bottom textarea{height:40px;min-height:40px;max-height:70px;border-radius:10px;padding:9px 10px;font-size:.84rem}.chat-compose-bottom button{width:40px;height:40px;flex-basis:40px;font-size:1rem}@media(max-width:600px){.family-chat{gap:6px}.family-chat-heading{padding:7px 10px}.family-chat-mark{width:27px;height:27px;flex-basis:27px;font-size:.82rem}.family-chat-heading h2{font-size:.9rem}.chat-messages{height:calc(100dvh - 190px);min-height:320px;padding:8px 7px;border-radius:12px}.chat-compose{padding:6px}.chat-compose>input{height:29px;min-height:29px}.chat-compose-bottom textarea{height:38px;min-height:38px}.chat-compose-bottom button{width:38px;height:38px;flex-basis:38px}}@media(max-width:380px){.chat-messages{height:calc(100dvh - 184px)}}.tree-container{overflow-x:auto}.liaison-page{max-width:760px;margin:0 auto}.liaison-head{background:linear-gradient(145deg,var(--primary),var(--primary-dark));color:#fff;border-radius:16px;padding:18px;margin-bottom:12px;border-bottom:3px solid var(--gold)}.liaison-head>span{font-size:.7rem;letter-spacing:.1em;opacity:.82}.liaison-head h2{margin:5px 0;font-family:var(--font-serif)}.liaison-head p{font-size:.84rem;opacity:.9}.liaison-list{display:flex;flex-direction:column;gap:9px}.liaison-card{display:flex;align-items:center;gap:11px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:14px;min-width:0}.liaison-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:50%;display:grid;place-items:center;background:#f8e9d1;color:#7a0c0c;font-size:1.35rem;overflow:hidden}.liaison-avatar img{width:100%;height:100%;object-fit:cover}.liaison-info{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.liaison-info strong{font-size:.92rem}.liaison-role{font-size:.76rem;color:var(--primary);font-weight:700}.liaison-phone{font-size:.82rem;color:var(--text-muted);text-decoration:none}.liaison-actions{display:flex;flex-direction:column;gap:6px}.liaison-actions a{font-size:.75rem;font-weight:700;text-decoration:none;border-radius:8px;padding:7px 9px;text-align:center;white-space:nowrap}.liaison-call{background:var(--primary);color:#fff}.liaison-zalo{background:#e8f2ff;color:#1264b3}.liaison-empty{padding:22px 16px;text-align:center;border:1px dashed var(--border);border-radius:14px;color:var(--text-muted);font-size:.88rem;background:var(--card)}.liaison-add{width:100%;margin-top:12px}.liaison-note{font-size:.72rem;color:var(--text-muted);text-align:center;margin:10px 4px 0}@media(max-width:380px){.liaison-card{gap:8px;padding:10px}.liaison-avatar{width:40px;height:40px;flex-basis:40px}.liaison-actions a{padding:7px 6px}}.fund-page{max-width:760px;margin:0 auto}.fund-head{background:linear-gradient(145deg,var(--primary),var(--primary-dark));color:#fff;border-radius:18px;padding:20px;margin-bottom:12px;border-bottom:3px solid var(--gold)}.fund-kicker{font-size:.7rem;letter-spacing:.12em;opacity:.8}.fund-head h2{font-family:var(--font-serif);margin:4px 0}.fund-head p{font-size:.88rem;opacity:.9}.fund-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.fund-summary>div{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px}.fund-summary span{display:block;color:var(--text-muted);font-size:.76rem}.fund-summary strong{display:block;color:var(--primary);font-size:1.25rem;margin-top:3px}.fund-filter{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:10px 12px;margin-bottom:10px}.fund-filter label{display:block;font-size:.76rem;color:var(--text-muted);margin-bottom:4px}.fund-filter select{width:100%;border:0;background:transparent;font:inherit;color:var(--text);outline:none}.fund-list{display:flex;flex-direction:column;gap:0;background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;max-height:58vh;overflow-y:auto}.fund-card{background:transparent;border:0;border-bottom:1px solid var(--border);border-radius:0;padding:11px 12px;display:grid;grid-template-columns:1.05fr 1.35fr auto;gap:10px;align-items:center}.fund-card:last-child{border-bottom:0}.fund-person strong,.fund-person small{display:block}.fund-person small{color:var(--text-muted);font-size:.75rem}.fund-main>strong{color:var(--primary)}.fund-main p{font-size:.8rem;color:var(--text-muted);margin-top:2px}.fund-card time{font-size:.72rem;color:var(--text-muted);white-space:nowrap}.fund-empty{padding:26px 18px;text-align:center;color:var(--text-muted);font-size:.88rem;background:transparent}.fund-add{width:100%;margin-top:12px}.fund-note{font-size:.72rem;color:var(--text-muted);text-align:center;margin:10px 4px 0}@media(max-width:600px){.fund-card{grid-template-columns:1fr auto;padding:11px}.fund-main{grid-column:1 / -1}.fund-card time{grid-column:2;grid-row:1}.fund-summary strong{font-size:1.05rem}.fund-list{max-height:55vh}}';document.head.appendChild(s);}
})();
