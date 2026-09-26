/* Sơ đồ gia phả – theo bản vẽ sạch: Đời 1 = Nguyễn Mường */
window.GIA_TREE_SEED = function(data, saveTree) {
  const SEED_VER_KEY = 'giaPhaSeedVersion';
  const SEED_VERSION = 14;
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

  mk('root', {
    name: 'Nguyễn Mường', isRoot: true, generation: 1,
    deathAnniversary: '2/3',
    notes: 'Cụ tổ đời 1 · Giỗ 2/3'
  });
  data.rootId = 'root';

  mk('coc', {
    name: 'Nguyễn Văn Cốc', generation: 2,
    deathAnniversary: '10/3', branchLabel: 'Nhánh Cốc',
    notes: 'Đời 2 · Giỗ 10/3'
  });
  mk('lach', {
    name: 'Nguyễn Văn Lạch', generation: 2,
    deathAnniversary: '26/12', branchLabel: 'Nhánh Lạch',
    notes: 'Đời 2 · Giỗ 26/12'
  });
  mk('ngoc', {
    name: 'Nguyễn Văn Ngọc', generation: 2,
    deathAnniversary: '15/1', branchLabel: 'Nhánh Ngọc',
    notes: 'Đời 2 · Giỗ 15/1'
  });
  link('root', 'coc');
  link('root', 'lach');
  link('root', 'ngoc');

  mk('ap',   { name: 'Nguyễn Văn Ấp',  generation: 3, notes: 'Đời 3' });
  mk('canh', { name: 'Nguyễn Văn Canh', generation: 3, notes: 'Đời 3' });
  link('coc', 'ap');
  link('coc', 'canh');
  mk('huy0', { name: 'Huy', generation: 4, notes: 'Đời 4 · Con Ấp' });
  mk('nam',  { name: 'Năm', generation: 4, notes: 'Đời 4 · Con Canh' });
  link('ap', 'huy0');
  link('canh', 'nam');

  mk('huy',   { name: 'Huy', generation: 5, notes: 'Đời 5' });
  mk('ap2',   { name: 'Nguyễn Ấp', generation: 5, notes: 'Đời 5' });
  mk('hoang', { name: 'Hoàng', generation: 5, notes: 'Đời 5' });
  mk('cang',  { name: 'N. Cang', generation: 5, notes: 'Đời 5' });
  mk('hoi',   { name: 'N. Hợi', generation: 5, notes: 'Đời 5' });
  mk('sanh',  { name: 'N. Sanh', generation: 5, notes: 'Đời 5' });
  mk('tho',   { name: 'Ng. Thọ', generation: 5, notes: 'Đời 5' });
  mk('gioi',  { name: 'Ng. Giỗ', generation: 5, notes: 'Đời 5' });
  mk('gio',   { name: 'N. Giò', generation: 5, notes: 'Đời 5' });
  ['huy','ap2','hoang','cang','hoi','sanh'].forEach(id => link('huy0', id));
  ['tho','gioi','gio'].forEach(id => link('nam', id));

  mk('hop',   { name: 'Hợp', generation: 6, notes: 'Đời 6' });
  mk('thinh', { name: 'Thịnh', generation: 6, notes: 'Đời 6' });
  mk('nhan2', { name: 'Nhân', generation: 6, notes: 'Đời 6' });
  mk('huy2',  { name: 'Huy', generation: 6, notes: 'Đời 6' });
  mk('hanh',  { name: 'Hành', generation: 6, notes: 'Đời 6' });
  mk('huan',  { name: 'Huân', generation: 6, notes: 'Đời 6' });
  mk('hoa',   { name: 'Hòa', generation: 6, notes: 'Đời 6' });
  mk('ho',    { name: 'Hồ', generation: 6, notes: 'Đời 6' });
  mk('than',  { name: 'Thần', generation: 6, notes: 'Đời 6' });
  mk('tho2',  { name: 'Thọ', generation: 6, notes: 'Đời 6' });
  link('huy', 'hop');
  link('ap2', 'thinh');
  link('ap2', 'nhan2');
  link('hoang', 'huy2');
  link('cang', 'hanh');
  link('hoi', 'huan');
  link('sanh', 'hoa');
  link('tho', 'ho');
  link('gioi', 'than');
  link('gio', 'tho2');

  mk('pvtan', { name: 'P.V. Tân', generation: 7, notes: 'Đời 7' });
  mk('pvto',  { name: 'P.V. Tơ', generation: 7, notes: 'Đời 7' });
  link('thinh', 'pvtan');
  link('nhan2', 'pvto');

  mk('lydai',  { name: 'Lý Đại', generation: 3, notes: 'Đời 3' });
  mk('giong',  { name: 'Nguyễn Giồng', generation: 3, notes: 'Đời 3' });
  mk('khang',  { name: 'Nguyễn Khang', generation: 3, notes: 'Đời 3' });
  mk('comon',  { name: 'Cố Môn', gender: 'female', generation: 3, notes: 'Đời 3' });
  link('lach', 'lydai');
  link('lach', 'giong');
  link('lach', 'khang');
  link('lach', 'comon');

  mk('nhan',  { name: 'Nguyễn Văn Nhân', generation: 5, notes: 'Đời 5' });
  mk('nhanb', { name: 'Nguyễn Nhân', generation: 5, notes: 'Đời 5' });
  mk('ty',    { name: 'Ng. Tý', generation: 5, notes: 'Đời 5' });
  mk('huong', { name: 'N. Hướng', generation: 5, notes: 'Đời 5' });
  link('giong', 'nhan');
  link('khang', 'nhanb');
  link('khang', 'ty');
  link('khang', 'huong');

  mk('to',    { name: 'Tơ', generation: 6, notes: 'Đời 6' });
  mk('nha',   { name: 'Nguyễn Văn Nha', generation: 6, notes: 'Đời 6' });
  mk('thi',   { name: 'Thị', gender: 'female', generation: 6, notes: 'Đời 6' });
  mk('hoi2',  { name: 'Hợi', generation: 6, notes: 'Đời 6' });
  mk('hinh',  { name: 'Hình', generation: 6, notes: 'Đời 6' });
  link('nhan', 'to');
  link('nhan', 'nha');
  link('nhanb', 'thi');
  link('nhanb', 'hoi2');
  link('ty', 'hinh');

  mk('te',     { name: 'Tế', generation: 7, notes: 'Đời 7' });
  mk('thanh1', { name: 'Thành', generation: 7, notes: 'Đời 7' });
  mk('thanh2', { name: 'Thanh', generation: 7, notes: 'Đời 7' });
  mk('hung',   { name: 'Ng. Hưng', generation: 7, notes: 'Đời 7' });
  mk('phuong', { name: 'Phương', gender: 'female', generation: 7, notes: 'Đời 7' });
  mk('duc2',   { name: 'Đức', generation: 7, notes: 'Đời 7' });
  mk('vu',     { name: 'Vũ', generation: 7, notes: 'Đời 7' });
  mk('tinh',   { name: 'Tịnh', generation: 7, notes: 'Đời 7' });
  mk('duy',    { name: 'Duy', generation: 7, notes: 'Đời 7' });
  mk('tuong',  { name: 'Tường', generation: 7, notes: 'Đời 7' });
  link('to', 'te');
  link('nha', 'thanh1');
  link('nha', 'thanh2');
  link('nha', 'hung');
  link('nha', 'phuong');
  link('thi', 'duc2');
  link('hoi2', 'vu');
  link('hoi2', 'tinh');
  link('hinh', 'duy');
  link('hinh', 'tuong');

  mk('nghia', { name: 'Nguyễn Nghĩa', generation: 3, notes: 'Đời 3' });
  mk('tho3',  { name: 'Nguyễn Thơ', generation: 3, notes: 'Đời 3' });
  link('ngoc', 'nghia');
  link('ngoc', 'tho3');
  mk('duc',   { name: 'Nguyễn Đức', generation: 4, notes: 'Đời 4' });
  mk('that',  { name: 'Nguyễn Thất', generation: 4, notes: 'Đời 4' });
  link('tho3', 'duc');
  link('tho3', 'that');

  mk('dien',  { name: 'Nguyễn Diễn', generation: 5, notes: 'Đời 5' });
  mk('that2', { name: 'Nguyễn Văn Thất', generation: 5, notes: 'Đời 5' });
  mk('chuong',{ name: 'N. Chương', generation: 5, notes: 'Đời 5' });
  link('duc', 'dien');
  link('that', 'that2');
  link('that', 'chuong');

  mk('lang',  { name: 'Lạng', generation: 6, notes: 'Đời 6' });
  mk('dao',   { name: 'Đào', generation: 6, notes: 'Đời 6' });
  mk('truong',{ name: 'Trường', generation: 6, notes: 'Đời 6' });
  mk('tuyen', { name: 'Tuyến', generation: 6, notes: 'Đời 6' });
  mk('tanh',  { name: 'Tánh', generation: 6, notes: 'Đời 6' });
  mk('thanh3',{ name: 'Thanh', generation: 6, notes: 'Đời 6' });
  link('dien', 'lang');
  link('dien', 'dao');
  link('dien', 'truong');
  link('that2', 'tuyen');
  link('that2', 'tanh');
  link('chuong', 'thanh3');

  localStorage.setItem(SEED_VER_KEY, String(SEED_VERSION));
  if (typeof saveTree === 'function') saveTree();
  return data;
};
