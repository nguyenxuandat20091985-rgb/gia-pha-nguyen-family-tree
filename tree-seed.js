/* Cây gia phả – bố cục 3 nhánh giống sơ đồ tay */
window.GIA_TREE_SEED = function(data, saveTree) {
  const SEED_VER_KEY = 'giaPhaSeedVersion';
  const SEED_VERSION = 12;
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
    name: 'Nguyễn Văn Mương', isRoot: true, generation: 6,
    deathAnniversary: '2/3', notes: 'Cụ Tổ 6 đời · Giỗ 2/3'
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
    notes: 'Đời 5 · Cụ 5 đời · Giỗ 26/12'
  });
  mk('ngoc', {
    name: 'Nguyễn Văn Ngọc', generation: 5,
    deathAnniversary: '15/1', branchLabel: 'Nhánh Ngọc',
    notes: 'Đời 5 · Giỗ 15/1'
  });
  link('root', 'coc');
  link('root', 'lach');
  link('root', 'ngoc');

  /* NHÁNH CỐC */
  mk('ap',   { name: 'Nguyễn Văn Ấp', generation: 4, notes: 'Đời 4' });
  mk('canh', {
    name: 'Nguyễn Văn Cảnh', generation: 4,
    deathAnniversary: '19/10', notes: 'Đời 4 · Giỗ 19/10'
  });
  link('coc', 'ap');
  link('coc', 'canh');
  mk('huy',  { name: 'Nguyễn Huy',  generation: 3, notes: 'Đời 3' });
  mk('ap2',  { name: 'Nguyễn Ấp',   generation: 3, notes: 'Đời 3' });
  mk('khay', { name: 'Nguyễn Khay', generation: 3, notes: 'Đời 3' });
  mk('cang', { name: 'Nguyễn Cang', generation: 3, notes: 'Đời 3' });
  ['huy','ap2','khay','cang'].forEach(id => link('ap', id));
  mk('hao',  { name: 'Nguyễn Hảo',  generation: 3, notes: 'Đời 3' });
  mk('oanh', { name: 'Nguyễn Oanh', generation: 3, notes: 'Đời 3' });
  link('canh', 'hao');
  link('canh', 'oanh');
  mk('truong', { name: 'Nguyễn Trường', generation: 2, notes: 'Đời 2' });
  mk('hoang',  { name: 'Nguyễn Hoàng',  generation: 2, notes: 'Đời 2' });
  mk('dat',    { name: 'Nguyễn Đạt',    generation: 2, notes: 'Đời 2' });
  mk('hungc',  { name: 'Nguyễn Hưng',   generation: 2, notes: 'Đời 2' });
  mk('minhc',  { name: 'Nguyễn Minh',   generation: 2, notes: 'Đời 2' });
  mk('nghiac', { name: 'Nguyễn Nghĩa',  generation: 2, notes: 'Đời 2' });
  mk('huongc', { name: 'Nguyễn Hưởng',  generation: 2, notes: 'Đời 2' });
  mk('uong',   { name: 'Nguyễn Uông',   generation: 2, notes: 'Đời 2' });
  mk('quy1',   { name: 'Nguyễn Quý',    generation: 2, notes: 'Đời 2' });
  mk('hoai',   { name: 'Nguyễn Hoài',   generation: 2, notes: 'Đời 2' });
  mk('quy2',   { name: 'Nguyễn Quý',    generation: 2, notes: 'Đời 2' });
  mk('congc',  { name: 'Nguyễn Công',   generation: 2, notes: 'Đời 2' });
  mk('nhat',   { name: 'Nguyễn Nhật',   generation: 2, notes: 'Đời 2' });
  mk('haoc',   { name: 'Nguyễn Hảo',    generation: 2, notes: 'Đời 2' });
  mk('giao',   { name: 'Nguyễn Giao',   generation: 2, notes: 'Đời 2' });
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
  mk('tutai', { name: 'Tư Tại', gender: 'female', generation: 4, notes: 'Đời 4 · Bên Cụ Lạch' });
  mk('giang', { name: 'Nguyễn Văn Giang', generation: 4, notes: 'Đời 4 · Còn viết Giông' });
  mk('lang',  {
    name: 'Nguyễn Văn Láng', generation: 4,
    deathAnniversary: '24/6', notes: 'Đời 4 · Giỗ 24/6'
  });
  mk('conon', { name: 'Cô Nón', gender: 'female', generation: 4, notes: 'Đời 4 · Bên Cụ Lạch' });
  spouse('lach', 'tutai');
  spouse('lach', 'conon');
  link('lach', 'giang');
  link('lach', 'lang');
  mk('hop',  { name: 'Nguyễn Hợp', generation: 3, notes: 'Đời 3' });
  mk('gioi', { name: 'Nguyễn Giỗ', generation: 3, notes: 'Đời 3' });
  mk('gio',  { name: 'Nguyễn Giò', generation: 3, notes: 'Đời 3' });
  link('giang', 'hop');
  link('giang', 'gioi');
  link('giang', 'gio');
  mk('nhan', {
    name: 'Nguyễn Văn Nhận', generation: 3,
    deathAnniversary: '30/1', notes: 'Đời 3 · Giỗ 30/1'
  });
  mk('nhac',  { name: 'Nguyễn Nhạc',  generation: 3, notes: 'Đời 3' });
  mk('ty',    { name: 'Nguyễn Tý',    generation: 3, notes: 'Đời 3' });
  mk('huong', { name: 'Nguyễn Hướng', generation: 3, notes: 'Đời 3' });
  link('lang', 'nhan');
  link('lang', 'nhac');
  link('lang', 'ty');
  link('lang', 'huong');
  mk('xo',   { name: 'Nguyễn Xô', generation: 2, notes: 'Đời 2' });
  mk('toai', { name: 'Nguyễn Toại', generation: 2, notes: 'Đời 2' });
  mk('nha',  { name: 'Nguyễn Thế Nhà', generation: 2, notes: 'Đời 2' });
  link('nhan', 'xo');
  link('nhan', 'toai');
  link('nhan', 'nha');
  mk('thuy', { name: 'Nguyễn Thủy', gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('dien2',{ name: 'Nguyễn Diễn', generation: 2, notes: 'Đời 2' });
  mk('nhu',  { name: 'Nguyễn Nhu',  generation: 2, notes: 'Đời 2' });
  mk('tiem', { name: 'Nguyễn Tiệm', generation: 2, notes: 'Đời 2' });
  mk('my',   { name: 'Nguyễn Mỹ', gender: 'female', generation: 2, notes: 'Đời 2' });
  mk('hinh', { name: 'Nguyễn Hình', generation: 2, notes: 'Đời 2' });
  ['thuy','dien2','nhu','tiem','my','hinh'].forEach(id => link('ty', id));
  mk('khoi',   { name: 'Nguyễn Khởi', generation: 1, notes: 'Đời 1' });
  mk('thanh1', { name: 'Nguyễn Thành', generation: 1, notes: 'Đời 1' });
  mk('thanh2', { name: 'Nguyễn Thành', generation: 1, notes: 'Đời 1' });
  mk('phuong', { name: 'Nguyễn Hoàng Phương', gender: 'female', generation: 1, notes: 'Đời 1' });
  mk('duc',    { name: 'Nguyễn Đức', generation: 1, notes: 'Đời 1' });
  mk('vuminh', { name: 'Nguyễn Vũ Minh', generation: 1, notes: 'Đời 1' });
  mk('anhduy', { name: 'Nguyễn Anh Duy Trung', generation: 1, notes: 'Đời 1' });
  mk('thai',   { name: 'Nguyễn Thái', generation: 1, notes: 'Đời 1' });
  link('xo', 'khoi');
  link('xo', 'thanh1');
  link('toai', 'thanh2');
  link('toai', 'phuong');
  link('nha', 'duc');
  link('nha', 'thai');
  link('dien2', 'vuminh');
  link('hinh', 'anhduy');

  /* NHÁNH NGỌC */
  mk('nghiec', { name: 'Nguyễn Văn Nghĩa', generation: 4, notes: 'Đời 4 · Còn gọi Nghềc' });
  mk('the', {
    name: 'Nguyễn Văn The', generation: 4,
    deathAnniversary: '8/8', notes: 'Đời 4 · Giỗ 8/8'
  });
  link('ngoc', 'nghiec');
  link('ngoc', 'the');
  mk('dien', { name: 'Nguyễn Văn Điền', generation: 3, notes: 'Đời 3' });
  link('nghiec', 'dien');
  mk('thiet', { name: 'Nguyễn Văn Thiết', generation: 3, notes: 'Đời 3' });
  mk('giang2',{ name: 'Nguyễn Giang', generation: 3, notes: 'Đời 3' });
  link('the', 'thiet');
  link('the', 'giang2');
  mk('luat',  { name: 'Nguyễn Luật',  generation: 2, notes: 'Đời 2' });
  mk('dao',   { name: 'Nguyễn Đạo',   generation: 2, notes: 'Đời 2' });
  mk('duong', { name: 'Nguyễn Dưỡng', generation: 2, notes: 'Đời 2' });
  mk('cong',  { name: 'Nguyễn Công',  generation: 2, notes: 'Đời 2' });
  mk('thap',  { name: 'Nguyễn Tháp',  generation: 2, notes: 'Đời 2' });
  mk('anh',   { name: 'Nguyễn Anh',   generation: 2, notes: 'Đời 2' });
  mk('ninh',  { name: 'Nguyễn Ninh',  generation: 2, notes: 'Đời 2' });
  mk('thuan', { name: 'Nguyễn Thuận', generation: 2, notes: 'Đời 2' });
  ['luat','dao','duong','cong','thap','anh','ninh','thuan'].forEach(id => link('thiet', id));

  localStorage.setItem(SEED_VER_KEY, String(SEED_VERSION));
  if (typeof saveTree === 'function') saveTree();
  return data;
};
