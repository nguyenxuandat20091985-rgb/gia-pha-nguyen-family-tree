/* Google sign-in wiring — scoped to the account screen only. */
(function () {
  'use strict';
  const button = document.getElementById('btnGoogle');
  if (!button || button.dataset.googleBound) return;
  button.dataset.googleBound = '1';

  button.addEventListener('click', async function () {
    const status = document.getElementById('authStatus');
    if (button.disabled) return;
    button.disabled = true;
    const oldLabel = button.textContent;
    button.textContent = 'Đang kết nối Google…';
    if (status) status.textContent = 'Đang chuyển đến Google để xác thực…';

    try {
      const cloud = window.GiaCloud;
      if (!cloud || typeof cloud.signInGoogle !== 'function') {
        throw new Error('Dịch vụ đăng nhập chưa sẵn sàng. Vui lòng tải lại trang.');
      }
      const result = await cloud.signInGoogle();
      if (result?.error) throw result.error;
    } catch (error) {
      if (status) status.textContent = 'Không thể đăng nhập Google: ' + (error?.message || 'Lỗi không xác định.');
      button.disabled = false;
      button.textContent = oldLabel;
    }
  });
})();