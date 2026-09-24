/**
 * Gia Phả Họ Nguyễn – minimal restore (clickable)
 */
(function () {
  'use strict';
  const TREE_KEY = 'giaPhaNguyenData_v4';
  let data = { people: {}, rootId: null };
  let currentView = 'home';

  function loadTree() {
    try {
      const raw = localStorage.getItem(TREE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.people) data = p;
      }
    } catch (e) {}
  }
  function saveTree() {
    localStorage.setItem(TREE_KEY, JSON.stringify(data));
  }
  function seedIfEmpty() {
    if (typeof window.GIA_TREE_SEED === 'function') {
      const next = window.GIA_TREE_SEED(data, saveTree);
      if (next) data = next;
      return;
    }
    if (Object.keys(data.people || {}).length) return;
    data.people = {
      root: { id:'root', name:'Nguyễn Văn Mương', gender:'male', birthDate:'', deathDate:'', deathAnniversary:'', notes:'Cụ Tổ 6 đời', photo:null, children:[], spouses:[], sideBranches:[], isSide:false, isRoot:true, parentId:null }
    };
    data.rootId = 'root';
    saveTree();
  }

  function showView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const el = document.getElementById('view-' + name);
    if (el) el.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.nav === name ||
        (['calendar','rituals','data','about'].includes(name) && b.dataset.nav === 'more'));
    });
    if (name === 'tree') renderTree();
    if (name === 'home') renderHome();
    window.scrollTo(0, 0);
  }

  function renderHome() {
    const list = document.getElementById('homeEventsList');
    if (list) list.innerHTML = '<p class="muted">Chào mừng dòng họ Nguyễn.</p>';
    const ai = document.getElementById('homeAiNews');
    if (ai) ai.textContent = '🌿 Bản tin dòng họ – Uống nước nhớ nguồn. Con cháu hãy đoàn kết, giữ gìn bản sắc.';
    const cal = document.getElementById('homeCalendarToday');
    if (cal) {
      const d = new Date();
      cal.innerHTML = '<p><strong>' + d.toLocaleDateString('vi-VN', {weekday:'long', day:'numeric', month:'long', year:'numeric'}) + '</strong></p>';
    }
    const morning = document.getElementById('morningText');
    if (morning) morning.textContent = 'Dòng họ Nguyễn – Uống nước nhớ nguồn.';
    document.getElementById('morningBanner')?.classList.remove('hidden');
  }

  function renderTree() {
    const container = document.getElementById('treeRoot');
    const empty = document.getElementById('emptyState');
    if (!container) return;
    document.getElementById('treeView')?.classList.remove('hidden');
    document.getElementById('listView')?.classList.add('hidden');
    if (!data.rootId || !data.people[data.rootId]) {
      container.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');
    container.innerHTML = '';
    container.appendChild(renderNode(data.rootId));
  }

  function renderNode(id) {
    const p = data.people[id];
    if (!p) return document.createTextNode('');
    const wrap = document.createElement('div');
    wrap.className = 'child-branch';
    const couple = document.createElement('div');
    couple.className = 'couple';
    couple.appendChild(createCard(p));
    (p.spouses || []).forEach(sid => {
      const sp = data.people[sid];
      if (sp) {
        const plus = document.createElement('span');
        plus.className = 'plus';
        plus.textContent = '+';
        couple.appendChild(plus);
        couple.appendChild(createCard(sp));
      }
    });
    wrap.appendChild(couple);
    const kids = [...(p.children || []), ...(p.sideBranches || [])];
    if (kids.length) {
      const row = document.createElement('div');
      row.className = 'children-row' + (kids.length > 1 ? ' has-multiple' : '');
      kids.forEach(cid => row.appendChild(renderNode(cid)));
      wrap.appendChild(row);
    }
    return wrap;
  }

  function createCard(p) {
    const card = document.createElement('div');
    card.className = 'person-card ' + (p.gender || 'male');
    if (p.isRoot || p.id === data.rootId) card.classList.add('root-card');
    if (p.isRoot || p.id === data.rootId) {
      const b = document.createElement('div');
      b.className = 'root-badge';
      b.textContent = 'CỤ TỔ 6 ĐỜI';
      card.appendChild(b);
    }
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    card.appendChild(name);
    if (p.birthDate) {
      const d = document.createElement('div');
      d.className = 'dates';
      d.textContent = p.birthDate;
      card.appendChild(d);
    }
    return card;
  }

  document.getElementById('bottomNav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (btn) showView(btn.dataset.nav);
  });
  document.querySelectorAll('.more-item, [data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const nav = el.dataset.nav;
      if (nav && !el.closest('#bottomNav')) showView(nav);
    });
  });
  document.querySelector('.home-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (btn) showView(btn.dataset.nav);
  });
  document.getElementById('btnCloseMorning')?.addEventListener('click', () => {
    document.getElementById('morningBanner')?.classList.add('hidden');
  });
  document.getElementById('btnToggleView')?.addEventListener('click', () => {
    showView('tree');
  });

  document.getElementById('btnResetStep1')?.addEventListener('click', () => {
    document.getElementById('resetConfirm')?.classList.remove('hidden');
  });
  document.getElementById('btnResetFinal')?.addEventListener('click', () => {
    if ((document.getElementById('resetTyped')?.value || '') !== 'RESET') {
      alert('Gõ đúng RESET');
      return;
    }
    localStorage.removeItem(TREE_KEY);
    localStorage.removeItem('giaPhaSeedVersion');
    data = { people: {}, rootId: null };
    seedIfEmpty();
    alert('Đã tải lại dữ liệu mẫu');
    showView('tree');
  });

  loadTree();
  seedIfEmpty();
  showView('home');
  window.GiaApp = { showView, data, saveTree, seedIfEmpty };
})();
