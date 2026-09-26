/* Cây gia phả – Đời 1 = Cụ Tổ Mương → Đời 6 = nay */
window.GIA_TREE_SEED = function(data, saveTree) {
  const SEED_VER_KEY = 'giaPhaSeedVersion';
  const SEED_VERSION = 13;
  const ver = parseInt(localStorage.getItem(SEED_VER_KEY) || '0', 10);
  if (ver >= SEED_VERSION && data && data.people && Object.keys(data.people).length) {
    return data;
  }
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
    name: 'Nguyễn Văn Mương', isRoot: true, generation: 1,
    deathAnniversary: '2/3',
    notes: 'Cụ Tổ 6 đời · Đời 1 · Giỗ 2/3'
  });
  data.rootId = 'root';

  mk('coc', {
    name: 'Nguyễn Văn Cốc', generation: 2,
    deathAnniversary: '19/3', branchLabel: 'Nhánh Cốc',
    notes: 'Đời 2 · Giỗ 19/3'
  });
  mk('lach', {
    name: 'Nguyễn Văn Lạch', generation: 2,
    deathAnniversary: '26/12', branchLabel: 'Nhánh Lạch',
    notes: 'Đời 2 · Cụ 5 đời · Giỗ 26/12'
  });
  mk('ngoc', {
    name: 'Nguyễn Văn Ngọc', generation: 2,
    deathAnniversary: '15/1', branchLabel: 'Nhánh Ngọc',
    notes: 'Đời 2 · Giỗ 15/1'
  });
  link('root', 'coc');
  link('root', 'lach');
  link('root', 'ngoc');

  /* NHÁNH CỐC */
  mk('ap',   { name: 'Nguyễn Văn Ấp', generation: 3, notes: 'Đời 3' });
  mk('canh', {
    name: 'Nguyễn Văn Cảnh', generation: 3,
    deathAnniversary: '19/10', notes: 'Đời 3 · Giỗ 19/10'
  });
  link('coc', 'ap');
  link('coc', 'canh');
  mk('huy',  { name: 'Nguyễn Huy',  generation: 4, notes: 'Đời 4' });
  mk('ap2',  { name: 'Nguyễn Ấp',   generation: 4, notes: 'Đời 4' });
  mk('khay', { name: 'Nguyễn Khay', generation: 4, notes: 'Đời 4' });
  mk('cang', { name: 'Nguyễn Cang', generation: 4, notes: 'Đời 4' });
  ['huy','ap2','khay','cang'].forEach(id => link('ap', id));
  mk('hao',  { name: 'Nguyễn Hảo',  generation: 4, notes: 'Đời 4' });
  mk('oanh', { name: 'Nguyễn Oanh', generation: 4, notes: 'Đời 4' });
  link('canh', 'hao');
  link('canh', 'oanh');
  mk('truong', { name: 'Nguyễn Trường', generation: 5, notes: 'Đời 5' });
  mk('hoang',  { name: 'Nguyễn Hoàng',  generation: 5, notes: 'Đời 5' });
  mk('dat',    { name: 'Nguyễn Đạt',    generation: 5, notes: 'Đời 5' });
  mk('hungc',  { name: 'Nguyễn Hưng',   generation: 5, notes: 'Đời 5' });
  mk('minhc',  { name: 'Nguyễn Minh',   generation: 5, notes: 'Đời 5' });
  mk('nghiac', { name: 'Nguyễn Nghĩa',  generation: 5, notes: 'Đời 5' });
  mk('huongc', { name: 'Nguyễn Hưởng',  generation: 5, notes: 'Đời 5' });
  mk('uong',   { name: 'Nguyễn Uông',   generation: 5, notes: 'Đời 5' });
  mk('quy1',   { name: 'Nguyễn Quý',    generation: 5, notes: 'Đời 5' });
  mk('hoai',   { name: 'Nguyễn Hoài',   generation: 5, notes: 'Đời 5' });
  mk('quy2',   { name: 'Nguyễn Quý',    generation: 5, notes: 'Đời 5' });
  mk('congc',  { name: 'Nguyễn Công',   generation: 5, notes: 'Đời 5' });
  mk('nhat',   { name: 'Nguyễn Nhật',   generation: 5, notes: 'Đời 5' });
  mk('haoc',   { name: 'Nguyễn Hảo',    generation: 5, notes: 'Đời 5' });
  mk('giao',   { name: 'Nguyễn Giao',   generation: 5, notes: 'Đời 5' });
  link('huy', 'truong');
  link('huy', 'hoang');
  link('ap2', 'dat');
  link('ap2', 'hungc');
  link('khay', 'minhc');
  link('khay', 'nghiac');
  link('cang', 'huongc');
  link('cang', 'uong');
  link('hao', 'quy1');
  link('hao', 'hoai');
  link('oanh', 'quy2');
  link('oanh', 'congc');
  link('oanh', 'nhat');
  link('oanh', 'haoc');
  link('oanh', 'giao');

  /* NHÁNH LẠCH */
  mk('tutai', { name: 'Tư Tại', gender: 'female', generation: 3, notes: 'Đời 3 · Bên Cụ Lạch' });
  mk('giang', { name: 'Nguyễn Văn Giang', generation: 3, notes: 'Đời 3 · Còn viết Giông' });
  mk('lang',  {
    name: 'Nguyễn Văn Láng', generation: 3,
    deathAnniversary: '24/6', notes: 'Đời 3 · Giỗ 24/6'
  });
  mk('conon', { name: 'Cô Nón', gender: 'female', generation: 3, notes: 'Đời 3 · Bên Cụ Lạch' });
  spouse('lach', 'tutai');
  spouse('lach', 'conon');
  link('lach', 'giang');
  link('lach', 'lang');
  mk('hop',  { name: 'Nguyễn Hợp', generation: 4, notes: 'Đời 4' });
  mk('gioi', { name: 'Nguyễn Giỗ', generation: 4, notes: 'Đời 4' });
  mk('gio',  { name: 'Nguyễn Giò', generation: 4, notes: 'Đời 4' });
  link('giang', 'hop');
  link('giang', 'gioi');
  link('giang', 'gio');
  mk('nhan', {
    name: 'Nguyễn Văn Nhận', generation: 4,
    deathAnniversary: '30/1', notes: 'Đời 4 · Giỗ 30/1'
  });
  mk('nhac',  { name: 'Nguyễn Nhạc',  generation: 4, notes: 'Đời 4' });
  mk('ty',    { name: 'Nguyễn Tý',    generation: 4, notes: 'Đời 4' });
  mk('huong', { name: 'Nguyễn Hướng', generation: 4, notes: 'Đời 4' });
  link('lang', 'nhan');
  link('lang', 'nhac');
  link('lang', 'ty');
  link('lang', 'huong');
  mk('xo',   { name: 'Nguyễn Xô', generation: 5, notes: 'Đời 5' });
  mk('toai', { name: 'Nguyễn Toại', generation: 5, notes: 'Đời 5' });
  mk('nha',  { name: 'Nguyễn Thế Nhà', generation: 5, notes: 'Đời 5' });
  link('nhan', 'xo');
  link('nhan', 'toai');
  link('nhan', 'nha');
  mk('thuy', { name: 'Nguyễn Thủy', gender: 'female', generation: 5, notes: 'Đời 5' });
  mk('dien2',{ name: 'Nguyễn Diễn', generation: 5, notes: 'Đời 5' });
  mk('nhu',  { name: 'Nguyễn Nhu',  generation: 5, notes: 'Đời 5' });
  mk('tiem', { name: 'Nguyễn Tiệm', generation: 5, notes: 'Đời 5' });
  mk('my',   { name: 'Nguyễn Mỹ', gender: 'female', generation: 5, notes: 'Đời 5' });
  mk('hinh', { name: 'Nguyễn Hình', generation: 5, notes: 'Đời 5' });
  ['thuy','dien2','nhu','tiem','my','hinh'].forEach(id => link('ty', id));
  mk('khoi',   { name: 'Nguyễn Khởi', generation: 6, notes: 'Đời 6' });
  mk('thanh1', { name: 'Nguyễn Thành', generation: 6, notes: 'Đời 6' });
  mk('thanh2', { name: 'Nguyễn Thành', generation: 6, notes: 'Đời 6' });
  mk('phuong', { name: 'Nguyễn Hoàng Phương', gender: 'female', generation: 6, notes: 'Đời 6' });
  mk('duc',    { name: 'Nguyễn Đức', generation: 6, notes: 'Đời 6' });
  mk('vuminh', { name: 'Nguyễn Vũ Minh', generation: 6, notes: 'Đời 6' });
  mk('anhduy', { name: 'Nguyễn Anh Duy Trung', generation: 6, notes: 'Đời 6' });
  mk('thai',   { name: 'Nguyễn Thái', generation: 6, notes: 'Đời 6' });
  link('xo', 'khoi');
  link('xo', 'thanh1');
  link('toai', 'thanh2');
  link('toai', 'phuong');
  link('nha', 'duc');
  link('nha', 'thai');
  link('dien2', 'vuminh');
  link('hinh', 'anhduy');

  /* NHÁNH NGỌC */
  mk('nghiec', { name: 'Nguyễn Văn Nghĩa', generation: 3, notes: 'Đời 3 · Còn gọi Nghềc' });
  mk('the', {
    name: 'Nguyễn Văn The', generation: 3,
    deathAnniversary: '8/8', notes: 'Đời 3 · Giỗ 8/8'
  });
  link('ngoc', 'nghiec');
  link('ngoc', 'the');
  mk('dien', { name: 'Nguyễn Văn Điền', generation: 4, notes: 'Đời 4' });
  link('nghiec', 'dien');
  mk('thiet', { name: 'Nguyễn Văn Thiết', generation: 4, notes: 'Đời 4' });
  mk('giang2',{ name: 'Nguyễn Giang', generation: 4, notes: 'Đời 4' });
  link('the', 'thiet');
  link('the', 'giang2');
  mk('luat',  { name: 'Nguyễn Luật',  generation: 5, notes: 'Đời 5' });
  mk('dao',   { name: 'Nguyễn Đạo',   generation: 5, notes: 'Đời 5' });
  mk('duong', { name: 'Nguyễn Dưỡng', generation: 5, notes: 'Đời 5' });
  mk('cong',  { name: 'Nguyễn Công',  generation: 5, notes: 'Đời 5' });
  mk('thap',  { name: 'Nguyễn Tháp',  generation: 5, notes: 'Đời 5' });
  mk('anh',   { name: 'Nguyễn Anh',   generation: 5, notes: 'Đời 5' });
  mk('ninh',  { name: 'Nguyễn Ninh',  generation: 5, notes: 'Đời 5' });
  mk('thuan', { name: 'Nguyễn Thuận', generation: 5, notes: 'Đời 5' });
  ['luat','dao','duong','cong','thap','anh','ninh','thuan'].forEach(id => link('thiet', id));

  localStorage.setItem(SEED_VER_KEY, String(SEED_VERSION));
  if (typeof saveTree === 'function') saveTree();
  return data;
};
