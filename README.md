# Chặn popup Shopee / TikTok Shop khi đọc truyện trên điện thoại

Bộ này chặn các kiểu bẫy sau:
- Bấm **"Chương sau"** lần đầu thì bị đẩy sang Shopee hoặc TikTok Shop
- Popup quảng cáo có nút **X / Close giả**, bấm vào vẫn bị nhảy trang
- Lớp phủ trong suốt che cả màn hình, chạm vào đâu cũng mở shop
- Tab mới tự bật, hoặc web tự mở app Shopee/TikTok (`intent://`)

Gồm 2 file:
| File | Dùng để làm gì |
|---|---|
| `chan-popup.user.js` | Script chặn chính: chặn từ gốc lúc web định chuyển trang và dọn popup |
| `bo-loc-ublock.txt` | Lớp dự phòng: nếu script để lọt thì trang Shopee/TikTok vẫn không tải được |

## Android (khuyên dùng): Firefox + Violentmonkey + uBlock Origin
1. Cài **Firefox** từ CH Play.
2. Firefox → Menu (⋮) → **Tiện ích bổ sung** → cài **Violentmonkey** và **uBlock Origin**.
3. Cài script: mở link raw của `chan-popup.user.js` trên GitHub → Violentmonkey hỏi cài → bấm **Cài đặt**.
   (Nếu repo đang để riêng tư: mở Violentmonkey → **+** → **Mới** → dán toàn bộ nội dung file → **Lưu**.)
4. Thêm bộ lọc: uBlock Origin → **Bảng điều khiển** → tab **Bộ lọc của tôi** → dán nội dung `bo-loc-ublock.txt` → **Áp dụng**.
5. Tắt tính năng tự mở app: Cài đặt điện thoại → Ứng dụng → **Shopee** → *Mở theo mặc định* → tắt **Mở các liên kết được hỗ trợ**. Làm tương tự với **TikTok** và **Lazada**.

## iPhone: Safari + app Userscripts
1. Cài app **Userscripts** (miễn phí, App Store).
2. Cài đặt → Safari → **Tiện ích** → Userscripts → bật, chọn **Cho phép trên mọi trang web**.
3. Mở app Userscripts, chọn thư mục lưu script → lưu file `chan-popup.user.js` vào đó
   (hoặc trong Safari bấm biểu tượng 🧩 → Userscripts → **+** → **New JS** → dán nội dung → Lưu).

## Brave (không cài được script)
- Trên web truyện: bấm biểu tượng 🦁 → bật **Chặn script** (Block scripts). Nhiều web truyện vẫn hiện chữ bình thường khi tắt JavaScript, còn popup thì mất hết.
- Có thể dán `bo-loc-ublock.txt` vào phần **Bộ lọc tuỳ chỉnh** (Settings → Shields & privacy → Content filtering), nếu bản Brave của bạn có mục này.

## Gặp domain mới chưa bị chặn?
Mở `chan-popup.user.js`, thêm 1 dòng vào danh sách `BLOCKED`, ví dụ `/(^|\.)tenmien\.com$/i,`. Thêm dòng tương ứng vào `bo-loc-ublock.txt`: `||tenmien.com^$document`.
