/**
 * Gia Phả Họ Nguyễn - Family Tree App
 * Hỗ trợ: nhánh chính, nhánh phụ, vợ/chồng, ảnh, chi tiết
 * Dữ liệu lưu localStorage
 */

const STORAGE_KEY = 'giaPhaNguyenData_v2';

let data = {
  people: {},
  rootId: null
};

let currentView = 'tree';
let contextTargetId = null;
let photoBase64 = null;

function uid() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Load failed', e);
  }
}

function getPerson(id) {
  return data.people[id] || null;
}

/** Tạo người với id cố định để seed ổn định */
function makePerson(id, { name, gender = 'male', birthDate = '', deathDate = '', notes = '', isSide = false }) {
  const person = {
    id,
    name,
    gender,
    birthDate,
    deathDate,
    notes,
    photo: null,
    children: [],
    spouses: [],
    sideBranches: [],
    isSide,
    parentId: null
  };
  data.people[id] = person;
  return person;
}

function linkChild(parentId, childId, asSide = false) {
  const parent = data.people[parentId];
  const child = data.people[childId];
  if (!parent || !child) return;
  child.parentId = parentId;
  if (asSide) {
    child.isSide = true;
    if (!parent.sideBranches.includes(childId)) parent.sideBranches.push(childId);
  } else {
    if (!parent.children.includes(childId)) parent.children.push(childId);
  }
}

function seedSampleIfEmpty() {
  if (Object.keys(data.people).length > 0) return;

  // ===== Dữ liệu từ bản viết tay gia phả Họ Nguyễn =====
  // Cụ Tổ (gốc)
  makePerson('root', {
    name: 'Cụ Tổ Họ Nguyễn',
    gender: 'male',
    notes: 'Cụ Tổ dòng họ – 6 đời'
  });
  data.rootId = 'root';

  // Đời 2 – các con cụ tổ (đọc từ sơ đồ trên giấy)
  makePerson('mung', { name: 'Nguyễn Văn Mừng', gender: 'male', birthDate: '1913', notes: 'Đời 2' });
  makePerson('coc', { name: 'Nguyễn Văn Cốc', gender: 'male', birthDate: '1913', notes: 'Đời 2' });
  makePerson('hach', { name: 'Nguyễn Văn Hạch', gender: 'male', birthDate: '1912', notes: 'Đời 2' });
  makePerson('ngoc', { name: 'Nguyễn Văn Ngọc', gender: 'male', birthDate: '1914', notes: 'Đời 2' });

  linkChild('root', 'mung');
  linkChild('root', 'coc');
  linkChild('root', 'hach');
  linkChild('root', 'ngoc');

  // Đời 3 – nhánh Nguyễn Văn Hạch
  makePerson('ap', { name: 'Nguyễn Văn Ấp', gender: 'male', notes: 'Đời 3 – con Hạch' });
  makePerson('canh', { name: 'Nguyễn Văn Cảnh', gender: 'male', notes: 'Đời 3 – con Hạch' });
  makePerson('giang', { name: 'Nguyễn Văn Giang', gender: 'male', notes: 'Đời 3 – con Hạch' });
  makePerson('lang', { name: 'Nguyễn Văn Lạng', gender: 'male', notes: 'Đời 3 – con Hạch' });
  makePerson('nghia', { name: 'Nguyễn Văn Nghĩa', gender: 'male', notes: 'Đời 3' });
  makePerson('thu', { name: 'Nguyễn Văn Thu', gender: 'male', notes: 'Đời 3 – nhánh Ngọc' });

  linkChild('hach', 'ap');
  linkChild('hach', 'canh');
  linkChild('hach', 'giang');
  linkChild('hach', 'lang');
  linkChild('hach', 'nghia');
  linkChild('ngoc', 'thu');

  // Đời 4 – con của Lạng / Giang / các nhánh
  makePerson('nhan', { name: 'Nguyễn Văn Nhẫn', gender: 'male', birthDate: '1971', notes: 'Đời 4' });
  makePerson('gioi', { name: 'Nguyễn Giỏi', gender: 'male', notes: 'Đời 4' });
  makePerson('hop', { name: 'Nguyễn Hợp', gender: 'male', notes: 'Đời 4' });
  makePerson('ty', { name: 'Nguyễn Tý', gender: 'male', notes: 'Đời 4' });
  makePerson('nhac', { name: 'Nguyễn Nhạc', gender: 'male', notes: 'Đời 4' });
  makePerson('huong', { name: 'Nguyễn Hưởng', gender: 'male', notes: 'Đời 4' });
  makePerson('dien', { name: 'Nguyễn Điền', gender: 'male', notes: 'Đời 4' });
  makePerson('the', { name: 'Nguyễn Văn Thế', gender: 'male', notes: 'Đời 4 – nhánh Thu' });
  makePerson('giang2', { name: 'Nguyễn Giang', gender: 'male', notes: 'Đời 4' });

  linkChild('lang', 'nhan');
  linkChild('lang', 'gioi');
  linkChild('lang', 'hop');
  linkChild('giang', 'ty');
  linkChild('giang', 'nhac');
  linkChild('nghia', 'huong');
  linkChild('nghia', 'dien');
  linkChild('thu', 'the');
  linkChild('thu', 'giang2');

  // Đời 5 – con của Nhẫn và các anh em
  makePerson('xoai', { name: 'Nguyễn Xoài', gender: 'male', notes: 'Đời 5' });
  makePerson('tam', { name: 'Nguyễn Tám', gender: 'male', notes: 'Đời 5' });
  makePerson('thue', { name: 'Nguyễn Thuế', gender: 'male', notes: 'Đời 5' });
  makePerson('nha', { name: 'Nguyễn Nhà', gender: 'male', notes: 'Đời 5' });
  makePerson('thuy', { name: 'Nguyễn Thủy', gender: 'female', notes: 'Đời 5' });
  makePerson('danh', { name: 'Nguyễn Đảnh', gender: 'male', notes: 'Đời 5' });
  makePerson('nhom', { name: 'Nguyễn Nhóm', gender: 'male', notes: 'Đời 5' });
  makePerson('tam2', { name: 'Nguyễn Tâm', gender: 'male', notes: 'Đời 5' });
  makePerson('hinh', { name: 'Nguyễn Hình', gender: 'male', notes: 'Đời 5' });
  makePerson('hung', { name: 'Nguyễn Hùng', gender: 'male', notes: 'Đời 5' });
  makePerson('quang', { name: 'Nguyễn Quang', gender: 'male', notes: 'Đời 5' });
  makePerson('dung', { name: 'Nguyễn Dũng', gender: 'male', notes: 'Đời 5' });
  makePerson('hao', { name: 'Nguyễn Hào', gender: 'male', notes: 'Đời 5' });
  makePerson('oanh', { name: 'Nguyễn Oanh', gender: 'female', notes: 'Đời 5' });

  linkChild('nhan', 'xoai');
  linkChild('nhan', 'tam');
  linkChild('nhan', 'thue');
  linkChild('nhan', 'nha');
  linkChild('gioi', 'thuy');
  linkChild('gioi', 'danh');
  linkChild('hop', 'nhom');
  linkChild('hop', 'tam2');
  linkChild('ty', 'hinh');
  linkChild('ty', 'hung');
  linkChild('nhac', 'quang');
  linkChild('nhac', 'dung');
  linkChild('huong', 'hao');
  linkChild('dien', 'oanh');

  // Đời 5–6 thêm từ cột bên trái (nhánh Ấp / Cảnh)
  makePerson('thuan', { name: 'Nguyễn Bá Thuận', gender: 'male', notes: 'Đời 5' });
  makePerson('thanhminh', { name: 'Nguyễn Thanh Minh', gender: 'male', notes: 'Đời 5' });
  makePerson('thanhngan', { name: 'Nguyễn Thanh Ngân', gender: 'male', notes: 'Đời 5' });
  makePerson('manh', { name: 'Nguyễn Mạnh', gender: 'male', notes: 'Đời 5' });
  makePerson('cuong', { name: 'Nguyễn Cương', gender: 'male', notes: 'Đời 5' });

  linkChild('ap', 'thuan');
  linkChild('ap', 'thanhminh');
  linkChild('canh', 'thanhngan');
  linkChild('canh', 'manh');
  linkChild('canh', 'cuong');

  // Đời 6 – thế hệ trẻ (đọc từ hàng dưới)
  makePerson('hung2', { name: 'Nguyễn Hùng', gender: 'male', notes: 'Đời 6' });
  makePerson('phuong', { name: 'Nguyễn Phương', gender: 'female', notes: 'Đời 6' });
  makePerson('duc', { name: 'Nguyễn Đức', gender: 'male', notes: 'Đời 6' });
  makePerson('vuminh', { name: 'Nguyễn Vũ Minh', gender: 'male', notes: 'Đời 6' });
  makePerson('manhduy', { name: 'Nguyễn Mạnh Duy Trung', gender: 'male', notes: 'Đời 6' });
  makePerson('thanh', { name: 'Nguyễn Thanh', gender: 'male', notes: 'Đời 6' });
  makePerson('thai', { name: 'Nguyễn Thái', gender: 'male', notes: 'Đời 6' });

  linkChild('xoai', 'hung2');
  linkChild('xoai', 'phuong');
  linkChild('tam', 'duc');
  linkChild('thue', 'vuminh');
  linkChild('nha', 'manhduy');
  linkChild('thuan', 'thanh');
  linkChild('thanhminh', 'thai');

  save();
}

function addPerson({ name, gender = 'male', birthDate = '', deathDate = '', notes = '', photo = null, parentId = null, relation = 'child' }) {
  const id = uid();
  const person = {
    id,
    name,
    gender,
    birthDate,
    deathDate,
    notes,
    photo,
    children: [],
    spouses: [],
    sideBranches: [],
    isSide: relation === 'side',
    parentId: parentId || null
  };
  data.people[id] = person;

  if (parentId && data.people[parentId]) {
    const parent = data.people[parentId];
    if (relation === 'spouse') {
      if (!parent.spouses.includes(id)) parent.spouses.push(id);
    } else if (relation === 'side') {
      if (!parent.sideBranches.includes(id)) parent.sideBranches.push(id);
      person.isSide = true;
    } else {
      if (!parent.children.includes(id)) parent.children.push(id);
    }
  } else if (!data.rootId) {
    data.rootId = id;
  }

  return person;
}

function renderTree() {
  const container = document.getElementById('treeRoot');
  const empty = document.getElementById('emptyState');

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

  (p.spouses || []).forEach((sid) => {
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

  const allKids = [...(p.children || []), ...(p.sideBranches || [])];
  if (allKids.length > 0) {
    const row = document.createElement('div');
    row.className = 'children-row' + (allKids.length > 1 ? ' has-multiple' : '');
    allKids.forEach(cid => {
      row.appendChild(renderNode(cid));
    });
    wrapper.appendChild(row);
  }

  return wrapper;
}

function createCard(p) {
  const card = document.createElement('div');
  card.className = 'person-card ' + (p.gender || 'male');
  if (p.isSide) card.classList.add('side-branch');
  card.dataset.id = p.id;

  if (p.photo) {
    const img = document.createElement('img');
    img.className = 'photo';
    img.src = p.photo;
    img.alt = p.name;
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
  if (p.deathDate) parts.push('- ' + p.deathDate);
  dates.textContent = parts.join(' ') || '-';
  card.appendChild(dates);

  if (p.isSide) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'Nhánh phụ';
    card.appendChild(badge);
  }

  card.addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e, p.id);
  });

  return card;
}

function renderList() {
  const list = document.getElementById('personList');
  const search = (document.getElementById('searchInput').value || '').toLowerCase();
  const genderFilter = document.getElementById('filterGender').value;

  const people = Object.values(data.people).filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (genderFilter && p.gender !== genderFilter) return false;
    return true;
  });

  list.innerHTML = '';
  if (people.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Không tìm thấy</p>';
    return;
  }

  people.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  people.forEach(p => {
    const item = document.createElement('div');
    item.className = 'list-item ' + (p.gender || '') + (p.isSide ? ' side' : '');
    item.dataset.id = p.id;

    if (p.photo) {
      const img = document.createElement('img');
      img.src = p.photo;
      img.alt = p.name;
      item.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width:48px;height:48px;border-radius:50%;background:#f0e6d8;display:flex;align-items:center;justify-content:center;font-size:1.4rem;';
      placeholder.textContent = p.gender === 'female' ? 'F' : 'M';
      item.appendChild(placeholder);
    }

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = '<div class="name">' + escapeHtml(p.name) + '</div><div class="meta">' + (p.birthDate || '') + (p.deathDate ? ' - ' + p.deathDate : '') + (p.isSide ? ' | Nhánh phụ' : '') + '</div>';
    item.appendChild(info);

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      showContextMenu(e, p.id);
    });

    list.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showContextMenu(e, id) {
  contextTargetId = id;
  const menu = document.getElementById('contextMenu');
  menu.classList.remove('hidden');
  const x = Math.min(e.clientX, window.innerWidth - 220);
  const y = Math.min(e.clientY, window.innerHeight - 220);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function hideContextMenu() {
  document.getElementById('contextMenu').classList.add('hidden');
  contextTargetId = null;
}

function openModal({ title, personId = null, parentId = null, relation = 'child' }) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('personId').value = personId || '';
  document.getElementById('parentId').value = parentId || '';
  document.getElementById('relationType').value = relation;

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
    document.getElementById('notes').value = p.notes || '';
    document.getElementById('relationSelect').value = p.isSide ? 'side' : 'child';
    if (p.photo) {
      photoBase64 = p.photo;
      const prev = document.getElementById('photoPreview');
      prev.src = p.photo;
      prev.classList.remove('hidden');
      document.getElementById('btnRemovePhoto').classList.remove('hidden');
    }
  } else {
    document.getElementById('personForm').reset();
    document.getElementById('relationSelect').value = relation;
  }

  document.getElementById('relationSelect').closest('.form-row').style.display = personId ? 'none' : '';
  document.getElementById('personModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('personModal').classList.add('hidden');
}

document.getElementById('btnAddRoot').addEventListener('click', () => {
  openModal({ title: 'Thêm Cụ Tổ / Người gốc', relation: 'child' });
});

document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);

document.getElementById('personForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('personId').value;
  const parentId = document.getElementById('parentId').value || null;
  let relation = document.getElementById('relationSelect').value || document.getElementById('relationType').value || 'child';

  const name = document.getElementById('fullName').value.trim();
  if (!name) return alert('Vui lòng nhập họ tên');

  const payload = {
    name,
    gender: document.getElementById('gender').value,
    birthDate: document.getElementById('birthDate').value.trim(),
    deathDate: document.getElementById('deathDate').value.trim(),
    notes: document.getElementById('notes').value.trim(),
    photo: photoBase64
  };

  if (id && data.people[id]) {
    Object.assign(data.people[id], payload);
    if (relation === 'side') data.people[id].isSide = true;
  } else {
    if (!data.rootId) {
      const p = addPerson({ ...payload, relation: 'child' });
      data.rootId = p.id;
    } else {
      addPerson({ ...payload, parentId, relation });
    }
  }

  save();
  closeModal();
  refresh();
});

document.getElementById('photoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert('Ảnh nên nhỏ hơn 2MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    photoBase64 = reader.result;
    const prev = document.getElementById('photoPreview');
    prev.src = photoBase64;
    prev.classList.remove('hidden');
    document.getElementById('btnRemovePhoto').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('btnRemovePhoto').addEventListener('click', () => {
  photoBase64 = null;
  document.getElementById('photoPreview').classList.add('hidden');
  document.getElementById('btnRemovePhoto').classList.add('hidden');
  document.getElementById('photoInput').value = '';
});

document.getElementById('contextMenu').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || !contextTargetId) return;
  const action = btn.dataset.action;
  const id = contextTargetId;
  hideContextMenu();

  if (action === 'edit') {
    openModal({ title: 'Sửa thông tin', personId: id });
  } else if (action === 'addChild') {
    openModal({ title: 'Thêm con (nhánh chính)', parentId: id, relation: 'child' });
  } else if (action === 'addSpouse') {
    openModal({ title: 'Thêm vợ / chồng', parentId: id, relation: 'spouse' });
  } else if (action === 'addSide') {
    openModal({ title: 'Thêm nhánh phụ / chi nhỏ', parentId: id, relation: 'side' });
  } else if (action === 'delete') {
    if (confirm('Xóa người này và toàn bộ con cháu?')) {
      deletePersonRecursive(id);
      save();
      refresh();
    }
  }
});

function deletePersonRecursive(id) {
  const p = data.people[id];
  if (!p) return;
  [...(p.children || []), ...(p.sideBranches || []), ...(p.spouses || [])].forEach(deletePersonRecursive);

  Object.values(data.people).forEach(parent => {
    parent.children = (parent.children || []).filter(c => c !== id);
    parent.sideBranches = (parent.sideBranches || []).filter(c => c !== id);
    parent.spouses = (parent.spouses || []).filter(c => c !== id);
  });

  delete data.people[id];
  if (data.rootId === id) data.rootId = null;
}

document.getElementById('btnToggleView').addEventListener('click', () => {
  currentView = currentView === 'tree' ? 'list' : 'tree';
  document.getElementById('treeView').classList.toggle('hidden', currentView !== 'tree');
  document.getElementById('listView').classList.toggle('hidden', currentView !== 'list');
  if (currentView === 'list') renderList();
});

document.getElementById('searchInput').addEventListener('input', renderList);
document.getElementById('filterGender').addEventListener('change', renderList);

document.getElementById('btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gia-pha-ho-nguyen.json';
  a.click();
});

document.getElementById('btnImport').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (imported.people && typeof imported.people === 'object') {
        if (confirm('Ghi đè dữ liệu hiện tại?')) {
          data = imported;
          save();
          refresh();
          alert('Nhập thành công!');
        }
      } else {
        alert('File không đúng định dạng');
      }
    } catch (err) {
      alert('Lỗi đọc file JSON');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#contextMenu') && !e.target.closest('.person-card') && !e.target.closest('.list-item')) {
    hideContextMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    hideContextMenu();
  }
});

function refresh() {
  if (currentView === 'tree') renderTree();
  else renderList();
}

load();
seedSampleIfEmpty();
renderTree();
