# 🌳 Gia Phả Họ Nguyễn – Cây phả hệ đẹp

Ứng dụng **web** (dùng được như app trên Android & iOS) để xây dựng **gia phả Họ Nguyễn**.

## Tính năng

- ✅ **Thêm nhánh chính** (con cháu)
- ✅ **Thêm nhánh phụ / chi nhỏ** (side branches)
- ✅ Thêm **vợ / chồng**
- ✅ Thêm **ảnh** đại diện cho từng người
- ✅ Chi tiết: ngày sinh, ngày mất, ghi chú
- ✅ Cây phả hệ trực quan + chế độ danh sách
- ✅ Xuất / Nhập file JSON (backup)
- ✅ Dữ liệu lưu trên trình duyệt (localStorage)
- ✅ Giao diện tiếng Việt, đẹp, responsive (điện thoại + máy tính)
- ✅ Có sẵn dữ liệu mẫu Họ Nguyễn (Cụ Tổ → Nguyễn Văn A → …)

## Cách dùng nhanh

### 1. Dùng online (GitHub Pages)
Mở link:
**https://nguyenxuandat20091985-rgb.github.io/gia-pha-nguyen-family-tree/**

### 2. Cài như App trên điện thoại (PWA)
- **Android (Chrome)**: Mở link → menu ⋮ → **Cài đặt ứng dụng** / **Thêm vào màn hình chính**
- **iOS (Safari)**: Mở link → nút Chia sẻ → **Thêm vào Màn hình chính**

Sau khi thêm, icon xuất hiện như app thật, mở fullscreen.

### 3. Thêm nhánh phụ
1. Bấm vào một người trong cây
2. Chọn **🌿 Thêm nhánh phụ**
3. Điền thông tin → Lưu  
   → Người đó sẽ có viền đứt + badge “Nhánh phụ”

### 4. Thêm ảnh
Khi thêm/sửa người → chọn ảnh từ máy → ảnh được lưu cùng dữ liệu (base64).

### 5. Backup
Bấm **Xuất JSON** để tải file backup. Có thể **Nhập** lại sau.

## Cấu trúc code

```
index.html      – Giao diện
style.css       – Giao diện đẹp
app.js          – Logic cây phả hệ, localStorage
manifest.json   – PWA (cài như app)
```

## Chạy local

Chỉ cần mở `index.html` bằng trình duyệt, hoặc:

```bash
npx serve .
```

## Lưu ý

- Dữ liệu lưu **trên trình duyệt** của máy bạn. Xóa cache / dùng chế độ ẩn danh sẽ mất dữ liệu → nên **Xuất JSON** thường xuyên.
- Ảnh nên dưới 2MB để lưu tốt.
- Muốn dùng nhiều thiết bị: Xuất JSON từ máy này → Nhập vào máy kia.

## APK Android

Hiện tại đây là **Web App (PWA)**.  
Để có file **.apk** thật:

1. Dùng tool miễn phí: [PWA Builder](https://www.pwabuilder.com/) → dán link GitHub Pages → Generate → Android package
2. Hoặc dùng Capacitor / Cordova bọc project này thành APK (cần Node.js + Android Studio)

---

**Repo:** https://github.com/nguyenxuandat20091985-rgb/gia-pha-nguyen-family-tree  

Chúc anh xây dựng gia phả Họ Nguyễn thật đầy đủ và đẹp!
