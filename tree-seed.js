/* Cây gia phả Họ Nguyễn – theo sơ đồ tay + ngày giỗ */
window.GIA_TREE_SEED = function(data, saveTree) {
  const SEED_VER_KEY = 'giaPhaSeedVersion';
  const SEED_VERSION = 9;
  const ver = parseInt(localStorage.getItem(SEED_VER_KEY) || '0', 10);
  const ids = Object.keys(data.people || {});
  const known = new Set([
    'root','coc','lach','ngoc','ap','oanh4','tutai','giang','lang','conon',
    'nghiec','the4','huy','huu','ap3','khay','cang','hao3','oanh3',
    'hop','gioi','gio','nhan','nhuon','ty','huong','dien','thiet','giang3',
    'luat','dao','duong','cong','giang_t','thap','anh','minh_t','thuan_t',
    'truong','hoang','dat','hung_a','minh_a','nghia_a','huong_a','uong',
    'quy','hoai','cong_a','nhat','hao_a','giao','xo','toai',
    'thang','dien2','nhu','tiem','my','hinh','thai',
    'khoi','thanh1','thanh2','phuong','duc','vu','minh1','anh_d','duy','tung'
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
      generation: o.generation != null ? o.generation : null,
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

  mk('root', {
    name: 'Nguyễn Văn Mương', isRoot: true, generation: 6,
    deathAnniversary: '2/3',
    notes: 'Cụ Tổ 6 đời · Giỗ 2/3'
  });
  data.rootId = 'root';

  mk('coc', {
    name: 'Nguyễn Văn Cốc', generation: 5,
    deathAnniversary: '19/3', branchLabel: 'Nhánh Cốc',
    notes: 'Đời 5 · Giỗ 19/3'
  });
  mk('lach', {
    name: 'Nguyễn Văn Lạch', generation: 5,
    deathAnniversary: '26/12', branchLabel: 'Nhánh Lạch',
    notes: 'Đời 5 · Cụ 5 đời · Giỗ 26/12 · Còn gọi Hạch'
  });
  mk('ngoc', {
    name: 'Nguyễn Văn Ngọc', generation: 5,
    deathAnniversary: '15/1', branchLabel: 'Nhánh Ngọc',
    notes: 'Đời 5 · Giỗ 15/1 · Trên sơ đồ còn viết Ngốc'
  });
  link('root', 'coc');
  link('root', 'lach');
  link('root', 'ngoc');

  mk('ap', {
    name: 'Nguyễn Văn Ấp', generation: 4, notes: 'Đời 4 · Nhánh Cốc'
  });
  mk('oanh4', {
    name: 'Nguyễn Văn Oanh', generation: 4, gender: 'male',
    deathAnniversary: '19/10',
    notes: 'Đời 4 · Nhánh Cốc · Giỗ 19/10 · (còn gọi Cảnh)'
  });
  link('coc', 'ap');
  link('coc', 'oanh4');

  mk('tutai', {
    name: 'Tư Tại', generation: 4, gender: 'female',
    notes: 'Đời 4 · Vợ/con nhánh Lạch · Còn viết Từ Thái'
  });
  mk('giang', {
    name: 'Nguyễn Văn Giang', generation: 4,
    notes: 'Đời 4 · Nhánh Lạch · Còn viết Ngữ Giông'
  });
  mk('lang', {
    name: 'Nguyễn Văn Láng', generation: 4,
    deathAnniversary: '24/4',
    notes: 'Đời 4 · Nhánh Lạch · Giỗ 24/4'
  });
  mk('conon', {
    name: 'Cố Nón', generation: 4, gender: 'female',
    notes: 'Đời 4 · Vợ/con nhánh Lạch · Còn viết Cô Mạnh'
  });
  spouse('lach', 'tutai');
  spouse('lach', 'conon');
  link('lach', 'giang');
  link('lach', 'lang');

  mk('nghiec', {
    name: 'Nguyễn Văn Nghĩa', generation: 4,
    notes: 'Đời 4 · Nhánh Ngọc · Còn gọi Nghềc / Nghiếc'
  });
  mk('the4', {
    name: 'Nguyễn Văn The', generation: 4,
    deathAnniversary: '8/8',
    notes: 'Đời 4 · Nhánh Ngọc · Giỗ 8/8 · Còn gọi Thu / Thế'
  });
  link('ngoc', 'nghiec');
  link('ngoc', 'the4');

  mk('huy',  { name: 'Nguyễn Huy',  generation: 3, notes: 'Đời 3' });
  mk('huu',  { name: 'Nguyễn Hựu',  generation: 3, notes: 'Đời 3' });
  mk('ap3',  { name: 'Nguyễn Ấp',   generation: 3, notes: 'Đời 3' });
  mk('khay', { name: 'Nguyễn Khay', generation: 3, notes: 'Đời 3 · Còn viết Khánh' });
  ['huy','huu','ap3','khay'].forEach(id => link('ap', id));

  mk('cang',  { name: 'Nguyễn Cang',  generation: 3, notes: 'Đời 3' });
  mk('hao3',  { name: 'Nguyễn Hảo',   generation: 3, notes: 'Đời 3' });
  mk('oanh3', { name: 'Nguyễn Oanh',  generation: 3, notes: 'Đời 3' });
  link('oanh4', 'cang');
  link('oanh4', 'hao3');
  link('oanh4', 'oanh3');

  mk('hop',   { name: 'Nguyễn Hợp',      generation: 3, notes: 'Đời 3 · Còn viết Ngữ Huệ/Hợp' });
  mk('gioi',  { name: 'Nguyễn Giỗ',      generation: 3, notes: 'Đời 3 · Còn viết Giỏi' });
  mk('gio',   { name: 'Nguyễn Giò',      generation: 3, notes: 'Đời 3' });
  mk('nhan',  { name: 'Nguyễn Văn Nhẫn', generation: 3, deathAnniversary: '30/1', notes: 'Đời 3 · Giỗ 30/1 · Còn viết Nhận' });
  mk('nhuon', { name: 'Thị Nhướn',       generation: 3, gender: 'female', notes: 'Đời 3' });
  mk('ty',    { name: 'Nguyễn Tỵ',       generation: 3, notes: 'Đời 3 · Còn viết Tý' });
  mk('huong', { name: 'Nguyễn Hướng',    generation: 3, notes: 'Đời 3 · Còn viết Hưởng' });
  mk('dien',  { name: 'Nguyễn Văn Điền', generation: 3, notes: 'Đời 3' });
  mk('thiet', { name: 'Nguyễn Văn Thiết',generation: 3, notes: 'Đời 3 · Còn viết Thế' });
  mk('giang3',{ name: 'Nguyễn Giang',    generation: 3, notes: 'Đời 3' });
  link('giang', 'hop');
  link('giang', 'gioi');
  link('giang', 'gio');
  link('lang', 'nhan');
  link('lang', 'nhuon');
  link('lang', 'ty');
  link('nghiec', 'huong');
  link('nghiec', 'dien');
  link('the4', 'thiet');
  link('the4', 'giang3');

  mk('luat',    { name: 'Nguyễn Luật',   generation: 3, notes: 'Đời 3' });
  mk('dao',     { name: 'Nguyễn Đạo',    generation: 3, notes: 'Đời 3' });
  mk('duong',   { name: 'Nguyễn Dưỡng',  generation: 3, notes: 'Đời 3' });
  mk('cong',    { name: 'Nguyễn Công',   generation: 3, notes: 'Đời 3' });
  mk('giang_t', { name: 'Nguyễn Giang',  generation: 3, notes: 'Đời 3 · con The' });
  mk('thap',    { name: 'Nguyễn Tháp',   generation: 3, notes: 'Đời 3' });
  mk('anh',     { name: 'Nguyễn Anh',    generation: 3, notes: 'Đời 3' });
  mk('minh_t',  { name: 'Nguyễn Minh',   generation: 3, notes: 'Đời 3' });
  mk('thuan_t', { name: 'Nguyễn Thuận',  generation: 3, notes: 'Đời 3' });
  ['luat','dao','duong','cong','giang_t','thap','anh','minh_t','thuan_t'].forEach(id => link('the4', id));

  mk('truong', { name: 'Nguyễn Trường', generation: 2, notes: 'Đời 2' });
  mk('hoang',  { name: 'Nguyễn Hoàng',  generation: 2, notes: 'Đời 2' });
  mk('dat',    { name: 'Nguyễn Đạt',    generation: 2, notes: 'Đời 2' });
  mk('hung_a', { name: 'Nguyễn Hưng',   generation: 2, notes: 'Đời 2' });
  mk('minh_a', { name: 'Nguyễn Minh',   generation: 2, notes: 'Đời 2' });
  mk('nghia_a',{ name: 'Nguyễn Nghĩa',  generation: 2, notes: 'Đời 2' });
  mk('huong_a',{ name: 'Nguyễn Hưởng',  generation: 2, notes: 'Đời 2' });
  mk('uong',   { name: 'Nguyễn Uông',   generation: 2, notes: 'Đời 2' });
  mk('quy',    { name: 'Nguyễn Quý',    generation: 2, notes: 'Đời 2' });
  mk('hoai',   { name: 'Nguyễn Hoài',   generation: 2, notes: 'Đời 2' });
  mk('cong_a', { name: 'Nguyễn Công',   generation: 2, notes: 'Đời 2' });
  mk('nhat',   { name: 'Nguyễn Nhật',   generation: 2, notes: 'Đời 2' });
  mk('hao_a',  { name: 'Nguyễn Hảo',    generation: 2, notes: 'Đời 2' });
  mk('giao',   { name: 'Nguyễn Giao',   generation: 2, notes: 'Đời 2' });
  link('huy', 'truong');
  link('huy', 'hoang');
  link('huu', 'dat');
  link('ap3', 'hung_a');
  link('ap3', 'minh_a');
  link('khay', 'nghia_a');
  link('khay', 'huong_a');
  link('cang', 'uong');
  link('cang', 'quy');
  link('hao3', 'hoai');
  link('hao3', 'cong_a');
  link('oanh3', 'nhat');
  link('oanh3', 'hao_a');
  link('oanh3', 'giao');

  mk('xo',   { name: 'Nguyễn Xô',   generation: 2, notes: 'Đời 2 · Còn viết Xoài' });
  mk('toai', { name: 'Nguyễn Toại', generation: 2, notes: 'Đời 2' });
  link('nhan', 'xo');
  link('nhan', 'toai');

  mk('thang', { name: 'Nguyễn Thắng', generation: 2, notes: 'Đời 2' });
  mk('dien2', { name: 'Nguyễn Diễn',  generation: 2, notes: 'Đời 2' });
  mk('nhu',   { name: 'Nguyễn Nhu',   generation: 2, notes: 'Đời 2' });
  mk('tiem',  { name: 'Nguyễn Tiệm',  generation: 2, notes: 'Đời 2' });
  mk('my',    { name: 'Nguyễn Mỹ',    generation: 2, gender: 'female', notes: 'Đời 2' });
  mk('hinh',  { name: 'Nguyễn Hinh',  generation: 2, notes: 'Đời 2 · Còn viết Hình' });
  mk('thai',  { name: 'Nguyễn Thái',  generation: 2, notes: 'Đời 2' });
  link('ty', 'hinh');
  link('ty', 'thai');
  link('hop', 'thang');
  link('hop', 'dien2');
  link('gioi', 'nhu');
  link('gio', 'tiem');
  link('gio', 'my');

  mk('khoi',    { name: 'Nguyễn Khởi', generation: 1, notes: 'Đời 1' });
  mk('thanh1',  { name: 'Nguyễn Thành', generation: 1, notes: 'Đời 1' });
  mk('thanh2',  { name: 'Nguyễn Thành', generation: 1, notes: 'Đời 1' });
  mk('phuong',  { name: 'Nguyễn Hoàng Phương', generation: 1, gender: 'female', notes: 'Đời 1' });
  mk('duc',     { name: 'Nguyễn Đức', generation: 1, notes: 'Đời 1' });
  mk('vu',      { name: 'Nguyễn Vũ', generation: 1, notes: 'Đời 1' });
  mk('minh1',   { name: 'Nguyễn Minh', generation: 1, notes: 'Đời 1' });
  mk('anh_d',   { name: 'Nguyễn Anh', generation: 1, notes: 'Đời 1' });
  mk('duy',     { name: 'Nguyễn Duy', generation: 1, notes: 'Đời 1' });
  mk('tung',    { name: 'Nguyễn Tùng', generation: 1, notes: 'Đời 1' });
  link('xo', 'khoi');
  link('xo', 'thanh1');
  link('toai', 'thanh2');
  link('toai', 'phuong');
  link('thang', 'duc');
  link('dien2', 'vu');
  link('nhu', 'minh1');
  link('tiem', 'anh_d');
  link('my', 'duy');
  link('hinh', 'tung');

  localStorage.setItem(SEED_VER_KEY, String(SEED_VERSION));
  if (typeof saveTree === 'function') saveTree();
  return data;
};
