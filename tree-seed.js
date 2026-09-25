/* Family tree seed – theo sơ đồ tay Cụ Tổ 6 đời Nguyễn Văn Mương */
window.GIA_TREE_SEED = function(data, saveTree) {
  const SEED_VER_KEY = 'giaPhaSeedVersion';
  const SEED_VERSION = 7;
  const ver = parseInt(localStorage.getItem(SEED_VER_KEY) || '0', 10);
  const ids = Object.keys(data.people || {});
  const known = new Set([
    'root','coc','hach','ngoc','ap','canh','giang','lang','tuthai','comanh',
    'nghia','thu','nhan','gioi','hop','ty','nhac','huong','dien','the','giang2',
    'xoai','tam','thue','nha','thuy','danh','nhom','tam2','hinh','hung',
    'quang','dung','hao','oanh','thuan','thanhminh','huy','khanh','bao',
    'thanhngan','manh','cuong','hung2','phuong','duc','vuminh','manhduy',
    'thanh','thai','truong','tuyet'
  ]);
  if (ids.length && !ids.every(id => known.has(id))) return data;
  if (ids.length && ver >= SEED_VERSION) return data;

  data = { people: {}, rootId: null };

  const mk = (id, o) => {
    data.people[id] = {
      id, name: o.name, gender: o.gender || 'male',
      birthDate: o.birthDate || '', deathDate: o.deathDate || '',
      deathAnniversary: o.deathAnniversary || '', notes: o.notes || '',
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

  /* ===== Cụ Tổ 6 đời ===== */
  mk('root', {
    name: 'Nguyễn Văn Mương',
    isRoot: true,
    notes: 'Cụ Tổ 6 đời · Họ Nguyễn',
    birthDate: ''
  });
  data.rootId = 'root';

  /* ===== Cụ 5 đời – 3 con: Cốc · Hạch · Ngọc (theo sơ đồ tay) ===== */
  mk('coc',  { name: 'Nguyễn Văn Cốc',  birthDate: '1913', branchLabel: 'Nhánh Cốc' });
  mk('hach', { name: 'Nguyễn Văn Hạch', birthDate: '1912', branchLabel: 'Nhánh Hạch (Lạch)', notes: 'Còn gọi Nguyễn Văn Lạch · Cụ 5 đời' });
  mk('ngoc', { name: 'Nguyễn Văn Ngọc', birthDate: '1914', branchLabel: 'Nhánh Ngọc' });
  link('root', 'coc');
  link('root', 'hach');
  link('root', 'ngoc');

  /* ===== Nhánh Cốc ===== */
  mk('ap',   { name: 'Nguyễn Văn Ấp' });
  mk('canh', { name: 'Nguyễn Văn Cảnh', birthDate: '1918' });
  link('coc', 'ap');
  link('coc', 'canh');

  /* Con Ấp: Huy · Khánh · Bảo · Thuận · Thanh Minh (sơ đồ tay) */
  mk('huy',       { name: 'Nguyễn Huy', notes: 'Huy Ấp' });
  mk('khanh',     { name: 'Nguyễn Khánh' });
  mk('bao',       { name: 'Nguyễn Bảo' });
  mk('thuan',     { name: 'Nguyễn Bá Thuận' });
  mk('thanhminh', { name: 'Nguyễn Thanh Minh' });
  ['huy','khanh','bao','thuan','thanhminh'].forEach(id => link('ap', id));

  /* Cháu Ấp */
  mk('truong', { name: 'Nguyễn Trường' }); link('huy', 'truong');
  mk('tuyet',  { name: 'Nguyễn Tuyết', gender: 'female' }); link('khanh', 'tuyet');
  mk('thanh',  { name: 'Nguyễn Thanh' }); link('thuan', 'thanh');
  mk('thai',   { name: 'Nguyễn Thái' }); link('thanhminh', 'thai');

  /* Con Cảnh */
  mk('thanhngan', { name: 'Nguyễn Thanh Ngân' });
  mk('manh',      { name: 'Nguyễn Mạnh' });
  mk('cuong',     { name: 'Nguyễn Cương' });
  link('canh', 'thanhngan');
  link('canh', 'manh');
  link('canh', 'cuong');

  /* ===== Nhánh Hạch (Lạch) ===== */
  mk('tuthai', { name: 'Từ Thái', gender: 'female', notes: 'Vợ Cụ Hạch' });
  mk('comanh', { name: 'Cô Mạnh', gender: 'female', notes: 'Vợ Cụ Hạch' });
  spouse('hach', 'tuthai');
  spouse('hach', 'comanh');

  mk('giang', { name: 'Nguyễn Văn Giang' });
  mk('lang',  { name: 'Nguyễn Văn Láng', notes: 'ty 24/6' });
  link('hach', 'giang');
  link('hach', 'lang');

  /* Con Giang: Tý · Nhạc */
  mk('ty',   { name: 'Nguyễn Tý' });
  mk('nhac', { name: 'Nguyễn Nhạc' });
  link('giang', 'ty');
  link('giang', 'nhac');

  /* Con Tý: Hình · Hùng */
  mk('hinh', { name: 'Nguyễn Hình' });
  mk('hung', { name: 'Nguyễn Hùng' });
  link('ty', 'hinh');
  link('ty', 'hung');

  /* Con Nhạc: Quang · Dũng */
  mk('quang', { name: 'Nguyễn Quang' });
  mk('dung',  { name: 'Nguyễn Dũng' });
  link('nhac', 'quang');
  link('nhac', 'dung');

  /* Con Láng: Nhẫn · Giỏi · Hợp */
  mk('nhan', { name: 'Nguyễn Văn Nhẫn', birthDate: '1971', notes: 'ty 30/1' });
  mk('gioi', { name: 'Nguyễn Giỏi' });
  mk('hop',  { name: 'Nguyễn Hợp' });
  link('lang', 'nhan');
  link('lang', 'gioi');
  link('lang', 'hop');

  /* Con Nhẫn: Xoài · Tám · Thuế · Nhà */
  mk('xoai', { name: 'Nguyễn Xoài' });
  mk('tam',  { name: 'Nguyễn Tám' });
  mk('thue', { name: 'Nguyễn Thuế' });
  mk('nha',  { name: 'Nguyễn Nhà' });
  ['xoai','tam','thue','nha'].forEach(id => link('nhan', id));

  /* Cháu Nhẫn */
  mk('hung2',   { name: 'Nguyễn Hùng' });
  mk('phuong',  { name: 'Nguyễn Phương', gender: 'female' });
  link('xoai', 'hung2');
  link('xoai', 'phuong');
  mk('duc',     { name: 'Nguyễn Đức' }); link('tam', 'duc');
  mk('vuminh',  { name: 'Nguyễn Vũ Minh' }); link('thue', 'vuminh');
  mk('manhduy', { name: 'Nguyễn Mạnh Duy Trung' }); link('nha', 'manhduy');

  /* Con Giỏi: Thủy · Đảnh */
  mk('thuy', { name: 'Nguyễn Thủy', gender: 'female' });
  mk('danh', { name: 'Nguyễn Đảnh' });
  link('gioi', 'thuy');
  link('gioi', 'danh');

  /* Con Hợp: Nhóm · Tâm */
  mk('nhom', { name: 'Nguyễn Nhóm' });
  mk('tam2', { name: 'Nguyễn Tâm' });
  link('hop', 'nhom');
  link('hop', 'tam2');

  /* ===== Nhánh Ngọc ===== */
  mk('nghia', { name: 'Nguyễn Văn Nghĩa', notes: 'Còn gọi Nghềc (viết tắt trên sơ đồ: Ng.văn Nghềc)' });
  mk('thu',   { name: 'Nguyễn Văn Thu', notes: 'Còn gọi Thư' });
  link('ngoc', 'nghia');
  link('ngoc', 'thu');

  /* Con Nghĩa: Hưởng · Điền */
  mk('huong', { name: 'Nguyễn Hưởng' });
  mk('dien',  { name: 'Nguyễn Điền' });
  link('nghia', 'huong');
  link('nghia', 'dien');

  mk('hao',  { name: 'Nguyễn Hào' }); link('huong', 'hao');
  mk('oanh', { name: 'Nguyễn Oanh', gender: 'female' }); link('dien', 'oanh');

  /* Con Thu: Thế · Giang */
  mk('the',    { name: 'Nguyễn Văn Thế' });
  mk('giang2', { name: 'Nguyễn Giang' });
  link('thu', 'the');
  link('thu', 'giang2');

  /* Con Thế – trên sơ đồ có nhiều nhánh bên phải (chữ nhỏ, viết tắt).
     Giữ các tên đã đọc được; anh bổ sung thêm nếu còn thiếu. */

  localStorage.setItem(SEED_VER_KEY, String(SEED_VERSION));
  if (typeof saveTree === 'function') saveTree();
  return data;
};
