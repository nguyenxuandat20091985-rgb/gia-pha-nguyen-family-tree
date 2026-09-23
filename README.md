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

## Phase 2 đã tích hợp trong mã nguồn\n\n- Đăng nhập Google + số điện thoại OTP qua Supabase Auth.\n- Cầu nối đồng bộ cây gia phả / Hiếu hỉ / Bảng tin lên Supabase khi thành viên đăng nhập.\n- Realtime listener cho thành viên, sự kiện và bảng tin.\n- RLS nâng cấp cho member/admin, ownership và chat.\n- Trigger tự tạo `profiles` khi tài khoản mới đăng ký.\n\n> Lưu ý: website production chỉ bật cloud khi có `GIA_SUPABASE_URL` và `GIA_SUPABASE_ANON_KEY`. Hai giá trị này phải là Supabase project URL + publishable/anon key của **project riêng cho Họ Nguyễn**. Không đưa `service_role` key vào frontend.\n\n## Còn cần cấu hình ngoài GitHub

| Chức năng | Lý do |
|-----------|--------|
| Đăng ký / Đăng nhập | ✅ Mã đã tích hợp; cần project Supabase + bật Phone/Google OAuth |
| Bảng tin & dữ liệu chung **realtime nhiều máy** | ✅ Mã đã tích hợp; cần project Supabase + Realtime |
| Phân quyền admin/member trên server | ✅ Schema/RLS đã bổ sung |
| AI bản tin hằng ngày tự chạy (cron) | ⚠️ Cần Edge Function + API key server-side |
| Push notification | ⚠️ Chưa triển khai native push |
| APK native | Có thể dùng TWA/Capacitor sau |

**Database hiện tại:** `localStorage` trên trình duyệt (tree, events, posts, chat).  
**Authentication:** Supabase Auth (Google + Phone OTP), chờ cấu hình project.  
**Realtime:** Có cầu nối Supabase; production cần cấu hình project.  
**AI:** Bản tin tạo **trên máy** từ sự kiện + ngày giỗ trong dữ liệu – **không bịa**, không gọi API ngoài.  
**Cron:** Chưa.

## Cách xem bản mới

1. Mở https://gia-pha-nguyen-hazel.vercel.app/?v=7  
2. Nếu còn giao diện cũ → xóa cache site hoặc F5 mạnh.  
3. Cây gia phả cũ vẫn còn (đọc key v4/v3…).

## Phase 2 (khi anh có Supabase)

1. Tạo project Supabase riêng cho Họ Nguyễn.  
2. Chạy file `supabase/schema.sql`.  
3. Bật Auth: Phone OTP + Google OAuth.  
4. Đưa **project URL + publishable/anon key** vào cấu hình frontend (không đưa service_role).  
5. Chạy `supabase/schema.sql`, bật Realtime cho `family_members`, `family_events`, `posts`, rồi migration JSON export → `family_members`.

## Commit gần nhất

Xem history GitHub `main` – các commit `feat: Phase 1...`, `feat: mobile shell...`, `feat: ritual texts...`.
