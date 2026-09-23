/**
 * Gia Phả Họ Nguyễn – Trung tâm sinh hoạt dòng họ
 * Phase 1: offline-first localStorage, preserve legacy tree data
 */
(function () {
  'use strict';

  const TREE_KEYS = ['giaPhaNguyenData_v4', 'giaPhaNguyenData_v3', 'giaPhaNguyenData_v2', 'giaPhaNguyenData_v1'];
  const TREE_KEY = 'giaPhaNguyenData_v4';
  const EVENTS_KEY = 'giaPhaEvents_v1';
  const POSTS_KEY = 'giaPhaPosts_v1';
  const CHAT_KEY = 'giaPhaNguyenChat_v1';
  const READ_KEY = 'giaPhaRead_v1';

  let data = { people: {}, rootId: null };
  let events = [];
  let posts = [];
  let currentView = 'home';
  let treeMode = 'tree';
  let contextTargetId = null;
  let photoBase64 = null;
  let calYear, calMonth;
  let currentRitual = null;

  function uid() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function loadTree() {
    for (const k of TREE_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.people && Object.keys(parsed.people).length) {
            data = parsed;
            if (k !== TREE_KEY) localStorage.setItem(TREE_KEY, raw);
            return;
          }
        }
      } catch (e) {}
    }
  }

  function saveTree() {
    localStorage.setItem(TREE_KEY, JSON.stringify(data));
    if (window.GiaCloud?.state?.user) window.GiaCloud.syncLocal(data, events, posts).catch(console.warn);
  }

  function loadEvents() {
    try { events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]'); } catch (e) { events = []; }
  }
  function saveEvents() {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    if (window.GiaCloud?.state?.user) window.GiaCloud.syncLocal(data, events, posts).catch(console.warn);
  }
  function loadPosts() {
    try { posts = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'); } catch (e) { posts = []; }
  }
  function savePosts() {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    if (window.GiaCloud?.state?.user) window.GiaCloud.syncLocal(data, events, posts).catch(console.warn);
  }

  function seedIfEmpty() {
    if (Object.keys(data.people).length > 0) return;
    const mk = (id, o) => {
      data.people[id] = {
        id, name: o.name, gender: o.gender || 'male', birthDate: o.birthDate || '',
        deathDate: o.deathDate || '', deathAnniversary: o.deathAnniversary || '',
        notes: o.notes || '', photo: null, children: [], spouses: [], sideBranches: [],
        isSide: false, isRoot: !!o.isRoot, parentId: null
      };
    };
    const link = (p, c) => {
      data.people[c].parentId = p;
      data.people[p].children.push(c);
    };
    mk('root', { name: 'Nguyễn Văn Mương', isRoot: true, notes: 'Cụ Tổ 6 đời' });
    data.rootId = 'root';
    mk('mung', { name: 'Nguyễn Văn Mừng', birthDate: '1913' });
    mk('coc', { name: 'Nguyễn Văn Cốc', birthDate: '1913' });
    mk('hach', { name: 'Nguyễn Văn Hạch', birthDate: '1912' });
    mk('ngoc', { name: 'Nguyễn Văn Ngọc', birthDate: '1914' });
    ['mung', 'coc', 'hach', 'ngoc'].forEach(id => link('root', id));
    mk('ap', { name: 'Nguyễn Văn Ấp' });
    mk('canh', { name: 'Nguyễn Văn Cảnh' });
    mk('giang', { name: 'Nguyễn Văn Giang' });
    mk('lang', { name: 'Nguyễn Văn Lạng' });
    ['ap', 'canh', 'giang', 'lang'].forEach(id => link('hach', id));
    saveTree();
  }

  /* ===== NAV ===== */
  function showView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const el = document.getElementById('view-' + name);
    if (el) el.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.nav === name || (name === 'calendar' || name === 'rituals' || name === 'data' || name === 'about' ? b.dataset.nav === 'more' : false));
    });
    if (name === 'home') renderHome();
    if (name === 'tree') refreshTree();
    if (name === 'events') renderEvents();
    if (name === 'board') renderBoard();
    if (name === 'chat') renderChat();
    if (name === 'calendar') renderCalendar();
    if (name === 'rituals') renderRituals();
    window.scrollTo(0, 0);
  }

  document.getElementById('bottomNav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (btn) showView(btn.dataset.nav);
  });
  document.querySelectorAll('.more-item, [data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      const nav = el.dataset.nav;
      if (nav && !el.closest('#bottomNav')) showView(nav);
    });
  });
  document.querySelector('.home-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (btn) showView(btn.dataset.nav);
  });

  /* ===== HOME + AI NEWS (from real data only) ===== */
  function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function buildAiNews() {
    const today = todayStr();
    const parts = [];
    const todayEvents = events.filter(ev => ev.date === today);
    const gio = Object.values(data.people).filter(p => p.deathAnniversary);
    const birth = Object.values(data.people).filter(p => p.birthDate && p.birthDate.includes(String(new Date().getDate())));

    parts.push('🌿 Bản tin dòng họ – ' + new Date().toLocaleDateString('vi-VN'));
    parts.push('');
    if (todayEvents.length) {
      parts.push('1. Việc họ hôm nay:');
      todayEvents.forEach(ev => parts.push('   • ' + ev.title + (ev.address ? ' – ' + ev.address : '')));
    } else {
      parts.push('1. Việc họ hôm nay: Không có sự kiện đặc biệt trong dòng họ hôm nay.');
    }
    parts.push('');
    const upcoming = events.filter(ev => ev.date && ev.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    if (upcoming.length) {
      parts.push('2. Sự kiện sắp tới:');
      upcoming.forEach(ev => parts.push('   • ' + ev.date + ': ' + ev.title));
    } else {
      parts.push('2. Sự kiện sắp tới: Chưa có sự kiện đã lên lịch.');
    }
    parts.push('');
    if (gio.length) {
      parts.push('3. Nhắc ngày giỗ (trong dữ liệu):');
      gio.slice(0, 5).forEach(p => parts.push('   • ' + p.name + ' – Giỗ: ' + p.deathAnniversary));
    } else {
      parts.push('3. Ngày giỗ: Chưa có ngày giỗ được ghi trong gia phả.');
    }
    parts.push('');
    parts.push('4. Lời nhắc: Con cháu Họ Nguyễn hãy giữ gìn bản sắc, đoàn kết, uống nước nhớ nguồn.');
    return parts.join('\n');
  }

  function renderHome() {
    const today = todayStr();
    const todayEv = events.filter(e => e.date === today);
    const el = document.getElementById('homeEventsList');
    el.innerHTML = todayEv.length
      ? todayEv.map(e => eventCardHtml(e)).join('')
      : '<p class="muted">Không có việc họ đặc biệt hôm nay.</p>';

    const pinned = [...events.filter(e => e.pin), ...posts.filter(p => p.pin)].slice(0, 5);
    document.getElementById('homeAnnounceList').innerHTML = pinned.length
      ? pinned.map(x => x.title ? eventCardHtml(x) : '<div class="mini-card"><strong>' + esc(x.author || '') + '</strong><p>' + esc(x.content || '') + '</p></div>').join('')
      : '<p class="muted">Chưa có thông báo ghim.</p>';

    document.getElementById('homeAiNews').textContent = buildAiNews();

    const d = new Date();
    document.getElementById('homeCalendarToday').innerHTML =
      '<p><strong>' + d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</strong></p>' +
      '<p class="muted">Ngày âm (ước lượng): xem tab Lịch dòng họ</p>';

    document.getElementById('morningText').textContent =
      'Dòng họ Nguyễn – Uống nước nhớ nguồn. Hôm nay hãy giữ nếp nhà, thương yêu bà con.';
    document.getElementById('morningBanner').classList.remove('hidden');
  }

  document.getElementById('btnCloseMorning').onclick = () => {
    document.getElementById('morningBanner').classList.add('hidden');
  };

  /* ===== TREE ===== */
  function getPerson(id) { return data.people[id] || null; }

  function refreshTree() {
    if (treeMode === 'tree') renderTree();
    else renderPersonList();
  }

  function renderTree() {
    const container = document.getElementById('treeRoot');
    const empty = document.getElementById('emptyState');
    document.getElementById('treeView').classList.remove('hidden');
    document.getElementById('listView').classList.add('hidden');
    if (!data.rootId || !data.people[data.rootId]) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    container.innerHTML = '';
    container.appendChild(renderNode(data.rootId));
  }

  function renderNode(id) {
    const p = getPerson(id);
    if (!p) return document.createTextNode('');
    const wrapper = document.createElement('div');
    wrapper.className = 'child-branch';
    const couple = document.createElement('div');
    couple.className = 'couple';
    couple.appendChild(createCard(p));
    (p.spouses || []).forEach(sid => {
      const sp = getPerson(sid);
      if (sp) {
        const plus = document.createElement('span');
        plus.className = 'plus';
        plus.textContent = '+';
        couple.appendChild(plus);
        couple.appendChild(createCard(sp));
      }
    });
    wrapper.appendChild(couple);
    const kids = [...(p.children || []), ...(p.sideBranches || [])];
    if (kids.length) {
      const row = document.createElement('div');
      row.className = 'children-row' + (kids.length > 1 ? ' has-multiple' : '');
      kids.forEach(cid => row.appendChild(renderNode(cid)));
      wrapper.appendChild(row);
    }
    return wrapper;
  }

  function createCard(p) {
    const card = document.createElement('div');
    card.className = 'person-card ' + (p.gender || 'male');
    if (p.isSide) card.classList.add('side-branch');
    if (p.isRoot || p.id === data.rootId) card.classList.add('root-card');
    card.dataset.id = p.id;
    if (p.isRoot || p.id === data.rootId) {
      const b = document.createElement('div');
      b.className = 'root-badge';
      b.textContent = 'CỤ TỔ 6 ĐỜI';
      card.appendChild(b);
    }
    if (p.photo) {
      const img = document.createElement('img');
      img.className = 'photo';
      img.src = p.photo;
      card.appendChild(img);
    }
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    card.appendChild(name);
    const dates = document.createElement('div');
    dates.className = 'dates';
    const parts = [];
    if (p.birthDate) parts.push(p.birthDate);
    if (p.deathDate) parts.push('– ' + p.deathDate);
    dates.textContent = parts.join(' ');
    if (parts.length) card.appendChild(dates);
    if (p.deathAnniversary) {
      const g = document.createElement('div');
      g.className = 'gio-date';
      g.textContent = '📅 Giỗ: ' + p.deathAnniversary;
      card.appendChild(g);
    }
    card.addEventListener('click', e => { e.stopPropagation(); showContextMenu(e, p.id); });
    return card;
  }

  function renderPersonList() {
    document.getElementById('treeView').classList.add('hidden');
    document.getElementById('listView').classList.remove('hidden');
    const q = (document.getElementById('searchTree').value || '').toLowerCase();
    const list = document.getElementById('personList');
    let people = Object.values(data.people);
    if (q) people = people.filter(p => p.name.toLowerCase().includes(q));
    people.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    list.innerHTML = people.map(p => {
      let meta = [p.birthDate, p.deathAnniversary ? 'Giỗ: ' + p.deathAnniversary : ''].filter(Boolean).join(' · ');
      if (p.id === data.rootId) meta = 'CỤ TỔ 6 ĐỜI' + (meta ? ' · ' + meta : '');
      return '<div class="list-item" data-id="' + p.id + '"><div class="info"><div class="name">' + esc(p.name) + '</div><div class="meta">' + esc(meta) + '</div></div></div>';
    }).join('');
    list.querySelectorAll('.list-item').forEach(item => {
      item.onclick = e => showContextMenu(e, item.dataset.id);
    });
  }

  document.getElementById('btnToggleView').onclick = () => {
    treeMode = treeMode === 'tree' ? 'list' : 'tree';
    refreshTree();
  };
  document.getElementById('searchTree').oninput = () => {
    if (treeMode === 'list') renderPersonList();
  };

  function showContextMenu(e, id) {
    contextTargetId = id;
    const menu = document.getElementById('contextMenu');
    menu.classList.remove('hidden');
    menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
  }
  function hideContextMenu() {
    document.getElementById('contextMenu').classList.add('hidden');
    contextTargetId = null;
  }

  document.getElementById('contextMenu').onclick = e => {
    const btn = e.target.closest('button');
    if (!btn || !contextTargetId) return;
    const action = btn.dataset.action;
    const id = contextTargetId;
    hideContextMenu();
    if (action === 'edit') openPersonModal({ title: 'Sửa', personId: id });
    if (action === 'addChild') openPersonModal({ title: 'Thêm con', parentId: id, relation: 'child' });
    if (action === 'addSpouse') openPersonModal({ title: 'Vợ/Chồng', parentId: id, relation: 'spouse' });
    if (action === 'addSide') openPersonModal({ title: 'Nhánh phụ', parentId: id, relation: 'side' });
    if (action === 'delete' && confirm('Xóa người này và con cháu?')) {
      deletePerson(id);
      saveTree();
      refreshTree();
    }
  };

  function deletePerson(id) {
    const p = data.people[id];
    if (!p) return;
    [...(p.children || []), ...(p.sideBranches || []), ...(p.spouses || [])].forEach(deletePerson);
    Object.values(data.people).forEach(par => {
      par.children = (par.children || []).filter(c => c !== id);
      par.sideBranches = (par.sideBranches || []).filter(c => c !== id);
      par.spouses = (par.spouses || []).filter(c => c !== id);
    });
    delete data.people[id];
    if (data.rootId === id) data.rootId = null;
  }

  function openPersonModal({ title, personId, parentId, relation }) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('personId').value = personId || '';
    document.getElementById('parentId').value = parentId || '';
    document.getElementById('relationType').value = relation || 'child';
    photoBase64 = null;
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('btnRemovePhoto').classList.add('hidden');
    document.getElementById('photoInput').value = '';
    if (personId && data.people[personId]) {
      const p = data.people[personId];
      document.getElementById('fullName').value = p.name || '';
      document.getElementById('gender').value = p.gender || 'male';
      document.getElementById('birthDate').value = p.birthDate || '';
      document.getElementById('deathDate').value = p.deathDate || '';
      document.getElementById('deathAnniversary').value = p.deathAnniversary || '';
      document.getElementById('notes').value = p.notes || '';
      if (p.photo) {
        photoBase64 = p.photo;
        document.getElementById('photoPreview').src = p.photo;
        document.getElementById('photoPreview').classList.remove('hidden');
        document.getElementById('btnRemovePhoto').classList.remove('hidden');
      }
    } else {
      document.getElementById('personForm').reset();
      document.getElementById('relationSelect').value = relation || 'child';
    }
    document.getElementById('personModal').classList.remove('hidden');
  }

  document.getElementById('btnAddRoot').onclick = () => openPersonModal({ title: 'Thêm thành viên', relation: 'child' });
  document.getElementById('btnCloseModal').onclick = () => document.getElementById('personModal').classList.add('hidden');
  document.getElementById('btnCancel').onclick = () => document.getElementById('personModal').classList.add('hidden');

  document.getElementById('personForm').onsubmit = e => {
    e.preventDefault();
    const id = document.getElementById('personId').value;
    const parentId = document.getElementById('parentId').value || null;
    const relation = document.getElementById('relationSelect').value || document.getElementById('relationType').value || 'child';
    const name = document.getElementById('fullName').value.trim();
    if (!name) return alert('Nhập họ tên');
    const payload = {
      name,
      gender: document.getElementById('gender').value,
      birthDate: document.getElementById('birthDate').value.trim(),
      deathDate: document.getElementById('deathDate').value.trim(),
      deathAnniversary: document.getElementById('deathAnniversary').value.trim(),
      notes: document.getElementById('notes').value.trim(),
      photo: photoBase64
    };
    if (id && data.people[id]) {
      Object.assign(data.people[id], payload);
    } else {
      const nid = uid();
      const person = {
        id: nid, ...payload, children: [], spouses: [], sideBranches: [],
        isSide: relation === 'side', isRoot: false, parentId
      };
      data.people[nid] = person;
      if (!data.rootId) {
        data.rootId = nid;
        person.isRoot = true;
      } else if (parentId && data.people[parentId]) {
        const par = data.people[parentId];
        if (relation === 'spouse') par.spouses.push(nid);
        else if (relation === 'side') { par.sideBranches.push(nid); person.isSide = true; }
        else par.children.push(nid);
      }
    }
    saveTree();
    document.getElementById('personModal').classList.add('hidden');
    refreshTree();
  };

  document.getElementById('photoInput').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2e6) return alert('Ảnh < 2MB');
    const r = new FileReader();
    r.onload = () => {
      photoBase64 = r.result;
      document.getElementById('photoPreview').src = photoBase64;
      document.getElementById('photoPreview').classList.remove('hidden');
      document.getElementById('btnRemovePhoto').classList.remove('hidden');
    };
    r.readAsDataURL(f);
  };
  document.getElementById('btnRemovePhoto').onclick = () => {
    photoBase64 = null;
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('btnRemovePhoto').classList.add('hidden');
  };

  /* ===== EVENTS ===== */
  const TYPE_LABEL = {
    tang: 'Tang lễ', vieng: 'Lễ viếng', 'an-tang': 'An táng', '49': '49 ngày', '100': '100 ngày',
    gio: 'Giỗ', cuoi: 'Cưới hỏi', tho: 'Mừng thọ', sinhnhat: 'Sinh nhật', hop: 'Họp họ', khac: 'Khác'
  };

  function mapsUrl(address) {
    const q = encodeURIComponent(address || '');
    return 'https://www.google.com/maps/search/?api=1&query=' + q;
  }

  function eventCardHtml(ev) {
    return '<div class="event-card' + (ev.pin ? ' pinned' : '') + '">' +
      (ev.pin ? '<span class="pin-badge">📌 GHIM</span>' : '') +
      '<div class="event-type">🕯️ ' + esc(TYPE_LABEL[ev.type] || ev.type) + '</div>' +
      '<h4>' + esc(ev.title) + '</h4>' +
      (ev.person ? '<p>Người liên quan: ' + esc(ev.person) + '</p>' : '') +
      '<p>📅 ' + esc(ev.date || '') + (ev.time ? ' · 🕒 ' + esc(ev.time) : '') + '</p>' +
      (ev.address ? '<p>📍 ' + esc(ev.address) + '</p><a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" href="' + mapsUrl(ev.address) + '">DẪN ĐƯỜNG</a>' : '') +
      (ev.content ? '<p class="event-body">' + esc(ev.content) + '</p>' : '') +
      '</div>';
  }

  function renderEvents() {
    const list = document.getElementById('eventsList');
    const sorted = [...events].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.innerHTML = sorted.length ? sorted.map(eventCardHtml).join('') : '<p class="muted">Chưa có sự kiện. Bấm + Tạo sự kiện.</p>';
  }

  document.getElementById('btnAddEvent').onclick = () => {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventModal').classList.remove('hidden');
  };
  document.getElementById('btnCloseEvent').onclick = () => document.getElementById('eventModal').classList.add('hidden');
  document.getElementById('btnCancelEvent').onclick = () => document.getElementById('eventModal').classList.add('hidden');

  document.getElementById('eventForm').onsubmit = e => {
    e.preventDefault();
    const ev = {
      id: uid(),
      title: document.getElementById('eventTitle').value.trim(),
      type: document.getElementById('eventType').value,
      person: document.getElementById('eventPerson').value.trim(),
      date: document.getElementById('eventDate').value,
      time: document.getElementById('eventTime').value,
      address: document.getElementById('eventAddress').value.trim(),
      content: document.getElementById('eventContent').value.trim(),
      pin: document.getElementById('eventPin').checked,
      createdAt: new Date().toISOString()
    };
    if (!ev.title) return;
    events.unshift(ev);
    saveEvents();
    document.getElementById('eventModal').classList.add('hidden');
    renderEvents();
  };

  /* ===== BOARD ===== */
  function renderBoard() {
    const list = document.getElementById('boardList');
    const sorted = [...posts].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.createdAt || '').localeCompare(a.createdAt || ''));
    list.innerHTML = sorted.length ? sorted.map(p =>
      '<div class="post-card' + (p.pin ? ' pinned' : '') + '">' +
      (p.pin ? '<span class="pin-badge">📌 GHIM</span>' : '') +
      '<strong>' + esc(p.author || 'Ẩn danh') + '</strong> <span class="muted">' + esc(p.createdAt || '') + '</span>' +
      '<p>' + esc(p.content) + '</p></div>'
    ).join('') : '<p class="muted">Chưa có bài. Bảng tin hiện lưu trên máy này.</p>';
  }

  document.getElementById('btnAddPost').onclick = () => {
    document.getElementById('postForm').reset();
    document.getElementById('postModal').classList.remove('hidden');
  };
  document.getElementById('btnClosePost').onclick = () => document.getElementById('postModal').classList.add('hidden');
  document.getElementById('btnCancelPost').onclick = () => document.getElementById('postModal').classList.add('hidden');
  document.getElementById('postForm').onsubmit = e => {
    e.preventDefault();
    posts.unshift({
      id: uid(),
      author: document.getElementById('postAuthor').value.trim() || 'Thành viên',
      content: document.getElementById('postContent').value.trim(),
      pin: document.getElementById('postPin').checked,
      createdAt: new Date().toLocaleString('vi-VN')
    });
    savePosts();
    document.getElementById('postModal').classList.add('hidden');
    renderBoard();
  };

  /* ===== CHAT ===== */
  function loadChat() {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); } catch (e) { return []; }
  }
  function renderChat() {
    const box = document.getElementById('chatMessages');
    const msgs = loadChat();
    box.innerHTML = msgs.length ? msgs.map(m =>
      '<div class="chat-msg"><strong>' + esc(m.author) + '</strong> <span class="chat-time">' + esc(m.time) + '</span><p>' + esc(m.text) + '</p></div>'
    ).join('') : '<p class="muted">Chưa có tin nhắn.</p>';
    box.scrollTop = box.scrollHeight;
  }
  document.getElementById('btnSendChat').onclick = () => {
    const author = (document.getElementById('chatAuthor').value || 'Ẩn danh').trim();
    const text = (document.getElementById('chatInput').value || '').trim();
    if (!text) return;
    const msgs = loadChat();
    msgs.push({ author, text, time: new Date().toLocaleString('vi-VN') });
    localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-100)));
    document.getElementById('chatInput').value = '';
    renderChat();
  };

  /* ===== CALENDAR ===== */
  function initCal() {
    const n = new Date();
    calYear = n.getFullYear();
    calMonth = n.getMonth();
  }

  function renderCalendar() {
    const first = new Date(calYear, calMonth, 1);
    const days = new Date(calYear, calMonth + 1, 0).getDate();
    const start = first.getDay();
    document.getElementById('calTitle').textContent = 'Tháng ' + (calMonth + 1) + '/' + calYear;
    let html = '<div class="cal-weekdays">CN T2 T3 T4 T5 T6 T7</div><div class="cal-days">';
    for (let i = 0; i < start; i++) html += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= days; d++) {
      const ds = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const has = events.some(e => e.date === ds);
      html += '<button type="button" class="cal-cell' + (has ? ' has-event' : '') + '" data-date="' + ds + '">' + d + '</button>';
    }
    html += '</div>';
    document.getElementById('calGrid').innerHTML = html;
    document.getElementById('calGrid').onclick = e => {
      const cell = e.target.closest('[data-date]');
      if (!cell) return;
      const ds = cell.dataset.date;
      const dayEv = events.filter(ev => ev.date === ds);
      document.getElementById('calDayDetail').innerHTML =
        '<h4>Ngày ' + ds + '</h4>' +
        (dayEv.length ? dayEv.map(eventCardHtml).join('') : '<p class="muted">Không có sự kiện.</p>') +
        '<p class="disclaimer">Ngày âm / can chi: tham khảo lịch dân gian (Phase 3 mở rộng).</p>';
    };
  }
  document.getElementById('btnCalPrev').onclick = () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  };
  document.getElementById('btnCalNext').onclick = () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  };

  /* ===== RITUALS ===== */
  function renderRituals() {
    const list = window.RITUAL_TEXTS || [];
    document.getElementById('ritualsList').innerHTML = list.map(r =>
      '<button type="button" class="ritual-card" data-id="' + r.id + '">' +
      '<strong>' + esc(r.name) + '</strong><span class="muted">' + esc(r.category) + '</span></button>'
    ).join('');
    document.getElementById('ritualsList').onclick = e => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const r = list.find(x => x.id === btn.dataset.id);
      if (!r) return;
      currentRitual = r;
      document.getElementById('ritualTitle').textContent = r.name;
      document.getElementById('ritualMeta').textContent = r.occasion + ' · ' + (r.source || '');
      document.getElementById('ritualBody').textContent = r.content;
      document.getElementById('ritualModal').classList.remove('hidden');
    };
  }
  document.getElementById('btnCloseRitual').onclick = () => document.getElementById('ritualModal').classList.add('hidden');
  document.getElementById('btnCopyRitual').onclick = () => {
    if (!currentRitual) return;
    navigator.clipboard.writeText(currentRitual.content).then(() => alert('Đã sao chép')).catch(() => alert('Không sao chép được'));
  };
  document.getElementById('btnSpeakRitual').onclick = () => {
    if (!currentRitual || !window.speechSynthesis) return alert('Trình duyệt không hỗ trợ đọc');
    const u = new SpeechSynthesisUtterance(currentRitual.content);
    u.lang = 'vi-VN';
    speechSynthesis.speak(u);
  };

  /* ===== DATA ===== */
  document.getElementById('btnExport').onclick = () => {
    const blob = new Blob([JSON.stringify({ tree: data, events, posts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gia-pha-ho-nguyen-backup.json';
    a.click();
  };
  document.getElementById('btnImport').onclick = () => document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (j.tree && j.tree.people) data = j.tree;
        else if (j.people) data = j;
        if (j.events) events = j.events;
        if (j.posts) posts = j.posts;
        saveTree();
        saveEvents();
        savePosts();
        alert('Nhập thành công');
        refreshTree();
      } catch (err) { alert('File không hợp lệ'); }
    };
    r.readAsText(f);
    e.target.value = '';
  };
  document.getElementById('btnResetStep1').onclick = () => {
    document.getElementById('resetConfirm').classList.remove('hidden');
  };
  document.getElementById('btnResetFinal').onclick = () => {
    if (document.getElementById('resetTyped').value !== 'RESET') return alert('Gõ đúng RESET');
    if (!confirm('Lần cuối: xóa cây hiện tại và tải mẫu?')) return;
    TREE_KEYS.forEach(k => localStorage.removeItem(k));
    data = { people: {}, rootId: null };
    seedIfEmpty();
    document.getElementById('resetConfirm').classList.add('hidden');
    alert('Đã reset mẫu');
    showView('tree');
  };

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('#contextMenu') && !e.target.closest('.person-card') && !e.target.closest('.list-item')) hideContextMenu();
  });

  /* ===== ACCOUNT / AUTH ===== */
  function renderAuth() {
    const status = document.getElementById('authStatus');
    const login = document.getElementById('authLogin');
    const userBox = document.getElementById('authUser');
    if (!status || !login || !userBox) return;
    const cloud = window.GiaCloud;
    const user = cloud?.state?.user || null;
    const profile = cloud?.state?.profile || null;
    if (!cloud?.isConfigured?.()) {
      status.textContent = 'Chưa cấu hình kết nối đám mây.';
      login.classList.remove('hidden');
      userBox.classList.add('hidden');
      return;
    }
    if (user) {
      const name = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || user.phone || 'Thành viên';
      status.textContent = 'Đã đăng nhập: ' + name;
      login.classList.add('hidden');
      userBox.classList.remove('hidden');
      document.getElementById('authName').value = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
    } else {
      status.textContent = 'Chưa đăng nhập';
      login.classList.remove('hidden');
      userBox.classList.add('hidden');
    }
  }

  function initAccountUI() {
    const btnGoogle = document.getElementById('btnGoogle');
    const btnSendOtp = document.getElementById('btnSendOtp');
    const btnVerifyOtp = document.getElementById('btnVerifyOtp');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnLogout = document.getElementById('btnLogout');
    const phone = document.getElementById('authPhone');
    const otp = document.getElementById('authOtp');

    btnGoogle?.addEventListener('click', async () => {
      try {
        btnGoogle.disabled = true;
        await window.GiaCloud.signInGoogle();
      } catch (e) {
        alert('Đăng nhập Google lỗi: ' + (e?.message || e));
        btnGoogle.disabled = false;
      }
    });

    btnSendOtp?.addEventListener('click', async () => {
      try {
        btnSendOtp.disabled = true;
        await window.GiaCloud.sendPhoneOtp(phone.value);
        document.getElementById('otpBox')?.classList.remove('hidden');
        alert('Đã gửi mã OTP. Kiểm tra SMS.');
      } catch (e) {
        alert('Không gửi được OTP: ' + (e?.message || e));
      } finally {
        btnSendOtp.disabled = false;
      }
    });

    btnVerifyOtp?.addEventListener('click', async () => {
      try {
        btnVerifyOtp.disabled = true;
        await window.GiaCloud.verifyPhoneOtp(phone.value, otp.value);
      } catch (e) {
        alert('Xác nhận OTP lỗi: ' + (e?.message || e));
      } finally {
        btnVerifyOtp.disabled = false;
      }
    });

    btnSaveProfile?.addEventListener('click', async () => {
      try {
        btnSaveProfile.disabled = true;
        await window.GiaCloud.upsertProfile({ display_name: document.getElementById('authName').value.trim() });
        renderAuth();
        alert('Đã lưu thông tin thành viên.');
      } catch (e) {
        alert('Lưu thông tin lỗi: ' + (e?.message || e));
      } finally {
        btnSaveProfile.disabled = false;
      }
    });

    btnLogout?.addEventListener('click', async () => {
      try {
        btnLogout.disabled = true;
        await window.GiaCloud.signOut();
      } catch (e) {
        alert('Đăng xuất lỗi: ' + (e?.message || e));
      } finally {
        btnLogout.disabled = false;
      }
    });

    window.addEventListener('gia-auth-changed', async () => {
      renderAuth();
      if (!window.GiaCloud?.state?.user) return;
      try {
        const cloudData = await window.GiaCloud.pullAll();
        if (cloudData) {
          data = cloudData.tree;
          events = cloudData.events;
          posts = cloudData.posts;
          saveTree();
          saveEvents();
          savePosts();
          refreshTree();
          renderEvents();
          renderBoard();
          renderHome();
        }
      } catch (e) {
        console.warn('Cloud pull failed:', e);
      }
    });

    window.addEventListener('gia-profile-changed', renderAuth);
    window.addEventListener('gia-cloud-data-changed', async () => {
      if (!window.GiaCloud?.state?.user) return;
      try {
        const cloudData = await window.GiaCloud.pullAll();
        if (!cloudData) return;
        data = cloudData.tree;
        events = cloudData.events;
        posts = cloudData.posts;
        localStorage.setItem(TREE_KEY, JSON.stringify(data));
        localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
        refreshTree();
        renderEvents();
        renderBoard();
        renderHome();
      } catch (e) {
        console.warn('Realtime pull failed:', e);
      }
    });

    renderAuth();
  }

  /* init */
  loadTree();
  seedIfEmpty();
  loadEvents();
  loadPosts();
  initCal();
  initAccountUI();
  showView('home');
})();
