/* tree-ui: inject context menu + person modal */
(function(){
  function ensure(){
    if(!document.getElementById('contextMenu')){
      var m=document.createElement('div');
      m.id='contextMenu';
      m.className='context-menu hidden';
      m.innerHTML='<button type="button" data-action="edit">✏️ Sửa</button><button type="button" data-action="addChild">➕ Thêm con</button><button type="button" data-action="addSpouse">💍 Vợ/Chồng</button><button type="button" data-action="addSide">🌿 Nhánh phụ</button><button type="button" data-action="delete" class="danger">🗑️ Xóa</button>';
      document.body.appendChild(m);
    }
    if(!document.getElementById('personModal')){
      var modal=document.createElement('div');
      modal.id='personModal';
      modal.className='modal hidden';
      modal.innerHTML='<div class="modal-content"><div class="modal-header"><h2 id="modalTitle">Thành viên</h2><button type="button" class="modal-close" id="btnCloseModal">×</button></div><form id="personForm"><input type="hidden" id="personId"/><input type="hidden" id="parentId"/><input type="hidden" id="relationType"/><div class="form-row"><label>Họ và tên *</label><input type="text" id="fullName" required/></div><div class="form-row two-cols"><div><label>Giới tính</label><select id="gender"><option value="male">Nam</option><option value="female">Nữ</option></select></div><div><label>Quan hệ</label><select id="relationSelect"><option value="child">Con</option><option value="spouse">Vợ/Chồng</option><option value="side">Nhánh phụ</option></select></div></div><div class="form-row two-cols"><div><label>Ngày sinh</label><input type="text" id="birthDate"/></div><div><label>Ngày mất</label><input type="text" id="deathDate"/></div></div><div class="form-row"><label>📅 Ngày giỗ</label><input type="text" id="deathAnniversary"/></div><div class="form-row"><label>Ghi chú</label><textarea id="notes" rows="2"></textarea></div><div class="form-row"><label>Ảnh</label><div class="photo-upload"><img id="photoPreview" class="photo-preview hidden" alt=""/><input type="file" id="photoInput" accept="image/*"/><button type="button" id="btnRemovePhoto" class="btn btn-small hidden">Xóa ảnh</button></div></div><div class="form-actions"><button type="button" class="btn btn-secondary" id="btnCancel">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form></div>';
      document.body.appendChild(modal);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
})();
