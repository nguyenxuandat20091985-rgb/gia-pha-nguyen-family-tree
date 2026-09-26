/* Family tree – theo sơ đồ tay, ghi rõ đời */
window.GIA_TREE_SEED = function(data, saveTree) {
  const SEED_VER_KEY = 'giaPhaSeedVersion';
  const SEED_VERSION = 8;
  const ver = parseInt(localStorage.getItem(SEED_VER_KEY) || '0', 10);
  const ids = Object.keys(data.people || {});
  const known = new Set([
    'root','coc','lach','ngoc','ap','canh','giang','lang','tuthai','comanh',
    'nghia','thu','huy','khanh','cuong_ap','hao','oanh_ap',
    'hop','gioi','gio','nhan','nhac','ty','huong','dien','the','giang2',
    'thanh','hung_l','minh','ngan','manh','quan','cuong2','hai','hung_a',
    'xoai','tam','thue','nha','thuy','danh','nhom','tam2','hinh','hung',
    'quang','dung','hao2','oanh','thuan','thanhminh','bao',
    'thanhngan','cuong','hung2','phuong','duc','vuminh','manhduy',
    'thai','truong','tuyet','lieu','dao','dieu','loan','thap','anh','ninh'
  ]);
  if (ids.length && !ids.every(id => known.has(id))) return data;
  if (ids.length && ver >= SEED_VERSION) return data;

  data = { people: {}, rootId: null };

  const mk = (id, o) => {
    data.people[id] = {
      id, name: o.name, gender: o.gender || 'male',
      birthDate: o.birthDate || '', deathDate: o.deathDate || '',
      deathAnniversary: o.deathAnniversary || '',
      notes: o.notes || '',
      generation: o.generation || null,
      photo: null, children: [], spouses: [], sideBranches: [],
      isSide: false, isRoot: !!o.isRoot, parentId: null,
      branchLabel: o.branchLabel || ''
    };
  };
  const link = (p, c) => {
    if (!data.people[p] || !data.people[c]) return;
    data.people[c].parentId = p;
    if (!data.people[p].children.includes(c)) data.people[p].children.push(c);
  };
  const spouse = (a, b) => {
    if (!data.people[a] || !data.people[b]) return;
    if (!data.people[a].spouses.includes(b)) data.people[a].spouses.push(b);
    if (!data.people[b].spouses.includes(a)) data.people[b].spouses.push(a);
  };

  /* ========== ĐỜI 6 – CỤ TỔ ========== */
  mk('root', {
    name: 'Nguyễn Văn Mương',
    isRoot: true,
    generation: 6,
    notes: 'Cụ Tổ 6 đời · Họ Nguyễn',
    birthDate: ''
  });
  data.rootId = 'root';

  /* ========== ĐỜI 5 – CỤ 5 ĐỜI (3 con) ========== */
  mk('coc', {
    name: 'Nguyễn Văn Cốc',
    generation: 5,
    branchLabel: 'Nhánh Cốc',
    notes: 'Đời 5'
  });
  mk('lach', {
    name: 'Nguyễn Văn Lạch',
    birthDate: '1912',
    generation: 5,
    branchLabel: 'Nhánh Lạch',
    notes: 'Đời 5 · Cụ 5 đời · Còn gọi Hạch'
  });
  mk('ngoc', {
    name: 'Nguyễn Văn Ngọc',
    birthDate: '1914',
    generation: 5,
    branchLabel: 'Nhánh Ngọc',
    notes: 'Đời 5'
  });
  link('root', 'coc');
  link('root', 'lach');
  link('root', 'ngoc');

  /* ========== ĐỜI 4 ========== */
  mk('ap',   { name: 'Nguyễn Văn Ấp',   generation: 4, notes: 'Đời 4' });
  mk('canh', { name: 'Nguyễn Văn Cảnh', generation: 4, notes: 'Đời 4' });
  link('coc', 'ap');
  link('coc', 'canh');

  mk('tuthai', { name: 'Từ Thái', gender: 'female', generation: 4, notes: 'Đời 4 · Vợ Cụ Lạch' });
  mk('comanh', { name: 'Cô Mạnh', gender: 'female', generation: 4, notes: 'Đời 4 · Vợ Cụ Lạch' });
  spouse('lach', 'tuthai');
  spouse('lach', 'comanh');
  mk('giang', { name: 'Nguyễn Văn Giang', generation: 4, notes: 'Đời 4' });
  mk('lang',  { name: 'Nguyễn Văn Láng', generation: 4, notes: 'Đời 4' });
  link('lach', 'giang');
  link('lach', 'lang');

  mk('nghia', { name: 'Nguyễn Văn Nghĩa', generation: 4, notes: 'Đời 4 · Còn gọi Nghềc (Ng.văn Nghềc)' });
  mk('thu',   { name: 'Nguyễn Văn Thu',   generation: 4, notes: 'Đời 4 · Còn gọi Thư' });
  link('ngoc', 'nghia');
  link('ngoc', 'thu');

  /* ========== ĐỜI 3 ========== */
  mk('huy',   { name: 'Nguyễn Huy',   generation: 3, notes: 'Đời 3 · Huy Ấp' });
  mk('khanh', { name: 'Nguyễn Khánh', generation: 3, notes: 'Đời 3' });
  mk('bao',   { name: 'Nguyễn Bảo',   generation: 3, notes: 'Đời 3' });
  mk('thuan', { name: 'Nguyễn Bá Thuận', generation: 3, notes: 'Đời 3' });
  mk('thanhminh', { name: 'Nguyễn Thanh Minh', generation: 3, notes: 'Đời 3' });
  ['huy','khanh','bao','thuan','thanhminh'].forEach(id => link('ap', id));

  mk('thanhngan', { name: 'Nguyễn Thanh Ngân', generation: 3, notes: 'Đời 3' });
  mk('manh',      { name: 'Nguyễn Mạnh',       generation: 3, notes: 'Đời 3' });
  mk('cuong',     { name: 'Nguyễn Cương',      generation: 3, notes: 'Đời 3' });
  link('canh', 'thanhngan');
  link('canh', 'manh');
  link('canh', 'cuong');

  mk('hop',  { name: 'Nguyễn Hợp',  generation: 3, notes: 'Đời 3' });
  mk('gioi', { name: 'Nguyễn Giỏi', generation: 3, notes: 'Đời 3' });
  link('giang', 'hop');
  link('giang', 'gioi');

  mk('nhan', { name: 'Nguyễn Văn Nhẫn', birthDate: '1971', generation: 3, notes: 'Đời 3 · ty 30/1' });
  mk('nhac', { name: 'Nguyễn Nhạc',     generation: 3, notes: 'Đời 3' });
  mk('ty',   { name: 'Nguyễn Tý',       generation: 3, notes: 'Đời 3' });
  link('lang', 'nhan');
  link('lang', 'nhac');
  link('lang', 'ty');

  mk('huong', { name: 'Nguyễn Hưởng', generation: 3, notes: 'Đời 3' });
  mk('dien',  { name: 'Nguyễn Điền',  generation: 3, notes: 'Đời 3' });
  link('nghia', 'huong');
  link('nghia', 'dien');

  mk('the',    { name: 'Nguyễn Văn Thế', generation: 3, notes: 'Đời 3' });
  mk('giang2', { name: 'Nguyễn Giang',   generation: 3, notes: 'Đời 3' });
  link('thu', 'the');
  link('thu', 'giang2');

  /* ========== ĐỜI 2 ========== */
  mk('thue', { name: 'Nguyễn Thuế', generation: 2, notes: 'Đời 2' });
  mk('nha',  { name: 'Nguyễn Nhà',  generation: 2, notes: 'Đời 2' });
  mk('thuy', { name: 'Nguyễn Thủy', gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('tam',  { name: 'Nguyễn Tám',  generation: 2, notes: 'Đời 2' });
  mk('nhom', { name: 'Nguyễn Nhóm', generation: 2, notes: 'Đời 2' });
  mk('tam2', { name: 'Nguyễn Tâm',  generation: 2, notes: 'Đời 2' });
  mk('hinh', { name: 'Nguyễn Hình', generation: 2, notes: 'Đời 2' });
  ['thue','nha','thuy','tam','nhom','tam2'].forEach(id => link('nhan', id));

  mk('hung', { name: 'Nguyễn Hùng', generation: 2, notes: 'Đời 2' });
  link('ty', 'hinh');
  link('ty', 'hung');

  mk('quang', { name: 'Nguyễn Quang', generation: 2, notes: 'Đời 2' });
  mk('dung',  { name: 'Nguyễn Dũng',  generation: 2, notes: 'Đời 2' });
  link('nhac', 'quang');
  link('nhac', 'dung');

  mk('danh', { name: 'Nguyễn Đảnh', generation: 2, notes: 'Đời 2' });
  link('gioi', 'danh');

  mk('hao2', { name: 'Nguyễn Hào', generation: 2, notes: 'Đời 2' });
  mk('oanh', { name: 'Nguyễn Oanh', gender: 'female', generation: 2, notes: 'Đời 2' });
  link('huong', 'hao2');
  link('dien', 'oanh');

  mk('lieu', { name: 'Nguyễn Liễu', gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('dao',  { name: 'Nguyễn Đào',  gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('dieu', { name: 'Nguyễn Diệu', gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('loan', { name: 'Nguyễn Loan', gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('thap', { name: 'Nguyễn Thập', generation: 2, notes: 'Đời 2' });
  mk('anh',  { name: 'Nguyễn Anh',  generation: 2, notes: 'Đời 2' });
  mk('ninh', { name: 'Nguyễn Ninh', generation: 2, notes: 'Đời 2' });
  ['lieu','dao','dieu','loan','thap','anh','ninh'].forEach(id => link('the', id));

  /* ========== ĐỜI 1 ========== */
  mk('truong', { name: 'Nguyễn Trường', generation: 1, notes: 'Đời 1' }); link('huy', 'truong');
  mk('tuyet',  { name: 'Nguyễn Tuyết', gender: 'female', generation: 1, notes: 'Đời 1' }); link('khanh', 'tuyet');
  mk('thanh',  { name: 'Nguyễn Thanh', generation: 1, notes: 'Đời 1' }); link('thuan', 'thanh');
  mk('thai',   { name: 'Nguyễn Thái',  generation: 1, notes: 'Đời 1' }); link('thanhminh', 'thai');

  mk('hung2',   { name: 'Nguyễn Hùng', generation: 1, notes: 'Đời 1' });
  mk('phuong',  { name: 'Nguyễn Phương', gender: 'female', generation: 1, notes: 'Đời 1' });
  link('thue', 'hung2');
  link('nha', 'phuong');
  mk('duc',     { name: 'Nguyễn Đức', generation: 1, notes: 'Đời 1' }); link('tam', 'duc');
  mk('vuminh',  { name: 'Nguyễn Vũ Minh', generation: 1, notes: 'Đời 1' });
  mk('manhduy', { name: 'Nguyễn Mạnh Duy Trung', generation: 1, notes: 'Đời 1' });
  link('nhom', 'vuminh');
  link('tam2', 'manhduy');

  localStorage.setItem(SEED_VER_KEY, String(SEED_VERSION));
  if (typeof saveTree === 'function') saveTree();
  return data;
};
