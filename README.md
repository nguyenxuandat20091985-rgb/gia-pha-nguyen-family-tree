# Gia Phả Họ Nguyễn – Trung tâm sinh hoạt dòng họ

**Production:** https://gia-pha-nguyen-hazel.vercel.app/

**Repo:** https://github.com/nguyenxuandat20091985-rgb/gia-pha-nguyen-family-tree

---

## Đã làm (Phase 1 – hoạt động thật trên máy)

| Chức năng | Trạng thái |
|-----------|------------|
| Cây gia phả (thêm/sửa/xóa, nhánh, ảnh, ngày giỗ) | ✅ |
| Giữ dữ liệu cũ `giaPhaNguyenData_v4` (không xóa khi nâng cấp) | ✅ |
| Trang chủ: việc họ, thông báo, bản tin AI từ dữ liệu thật | ✅ |
| Đám / Hiếu Hỉ + địa chỉ + nút **DẪN ĐƯỜNG** (Google Maps) | ✅ |
| Lịch tháng + sự kiện theo ngày | ✅ (ngày âm chi tiết Phase 3) |
| Thư viện văn khấn + Sao chép + Đọc TTS | ✅ |
| Bảng tin + ghim (lưu máy) | ✅ offline |
| Chat dòng họ (lưu máy) | ✅ offline |
| Quản lý dữ liệu: Xuất/Nhập JSON, Reset 2 bước (gõ RESET) | ✅ |
| PWA / Cài app, sửa "Uống nước nhớ nguồn" | ✅ |
| Thanh điều hướng mobile dưới | ✅ |
| Schema Supabase (`supabase/schema.sql`) | ✅ chuẩn bị |

## Chưa làm (cần Supabase + cấu hình của anh)

| Chức năng | Lý do |
|-----------|--------|
| Đăng ký / Đăng nhập | Cần project Supabase + Auth |
| Bảng tin & chat **realtime nhiều máy** | Cần Supabase Realtime |
| Phân quyền admin/member trên server | Cần RLS + profiles |
| AI bản tin hằng ngày tự chạy (cron) | Cần Edge Function + API key server-side |
| Push notification | Chưa triển khai |
| APK native | Có thể dùng TWA/Capacitor sau |

**Database hiện tại:** `localStorage` trên trình duyệt (tree, events, posts, chat).  
**Authentication:** Chưa.  
**Realtime:** Chưa (chỉ local).  
**AI:** Bản tin tạo **trên máy** từ sự kiện + ngày giỗ trong dữ liệu – **không bịa**, không gọi API ngoài.  
**Cron:** Chưa.

## Cách xem bản mới

1. Mở https://gia-pha-nguyen-hazel.vercel.app/?v=7  
2. Nếu còn giao diện cũ → xóa cache site hoặc F5 mạnh.  
3. Cây gia phả cũ vẫn còn (đọc key v4/v3…).

## Phase 2 (khi anh có Supabase)

1. Tạo project Supabase riêng cho Họ Nguyễn.  
2. Chạy file `supabase/schema.sql`.  
3. Bật Auth (email/phone).  
4. Đưa **anon key** vào cấu hình frontend (không đưa service_role).  
5. Migration JSON export → bảng `family_members`.

## Commit gần nhất

Xem history GitHub `main` – các commit `feat: Phase 1...`, `feat: mobile shell...`, `feat: ritual texts...`.
