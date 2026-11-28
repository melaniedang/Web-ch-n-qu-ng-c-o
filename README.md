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

## iPhone — thêm lớp chặn AdGuard (khuyên dùng, chặn triệt để)
Userscript trên Safari thường chạy MUỘN hơn quảng cáo → lúc chặn được lúc không. AdGuard chặn ngay từ cấp mạng nên quảng cáo không tải được.
1. Cài **AdGuard** (App Store, miễn phí) → mở app, làm theo hướng dẫn bật các bộ chặn trong Cài đặt → Safari → Tiện ích mở rộng.
2. AdGuard → **Bảo vệ** → **Bảo vệ Safari** → **Bộ lọc** → **Bộ lọc tuỳ chỉnh** → **Thêm bộ lọc** → dán link raw của `bo-loc-adguard-ios.txt`.
   (Nếu không thêm được: mở file, copy toàn bộ → **Quy tắc người dùng** → dán.)
3. Giữ nguyên userscript — hai lớp bổ trợ nhau.

## Brave (không cài được script)
- Trên web truyện: bấm biểu tượng 🦁 → bật **Chặn script** (Block scripts). Nhiều web truyện vẫn hiện chữ bình thường khi tắt JavaScript, còn popup thì mất hết.
- Có thể dán `bo-loc-ublock.txt` vào phần **Bộ lọc tuỳ chỉnh** (Settings → Shields & privacy → Content filtering), nếu bản Brave của bạn có mục này.

## Gặp domain mới chưa bị chặn?
Mở `chan-popup.user.js`, thêm 1 dòng vào danh sách `BLOCKED`, ví dụ `/(^|\.)tenmien\.com$/i,`. Thêm dòng tương ứng vào `bo-loc-ublock.txt`: `||tenmien.com^$document`.

## Script chặn những gì (v1.3.0) — áp dụng cho MỌI web
1. Chuyển hướng / tab mới sang Shopee, TikTok Shop, Lazada, Tiki, kể cả mở thẳng app.
2. Popup, nút X giả, lớp phủ trong suốt, nút "Chương sau" bị gài link.
3. Hình nổi (bóng, vợt...) đè lên trang truyện.
4. Quảng cáo Google (banner dính đầu/cuối trang, quảng cáo che màn hình khi chuyển trang).
5. Popup lừa đảo giả làm ô xác minh "Tôi là con người" / đăng nhập.
6. Mọi chuyển hướng / tab mới sang web khác không do bạn tự bấm link (web cá độ, nhà cái...). Link thật bạn tự bấm vẫn mở bình thường; lỡ chặn nhầm thì bấm "Vẫn mở".
7. Script của mạng quảng cáo popunder: danh sách đã biết + tự nhận diện domain rác (đuôi `.online`, `.xyz`, `.top`..., tên kiểu `aj1559`), script gắn `data-cfasync="false"`.

## Lịch sử cập nhật
- 1.7.0: KHOÁ NÚT CHUYỂN CHƯƠNG — bấm link nội bộ là đi thẳng, quảng cáo không chen vào được. Đổi lại link bị tráo, chặn link trong suốt phủ lên nút, vá window.open lấy từ iframe ẩn. Dòng xanh hiển thị Safari có hỗ trợ chặn chuyển trang hay không.
- 1.6.0: bắt popup quảng cáo giấu nội dung trong iframe / shadow DOM (popup "Tôi là con người" trên Safari). Hiện dòng xanh khi script chạy, dòng đỏ khi lỗi.
- 1.5.0: CHẾ ĐỘ CHẶT — chặn mọi chuyển hướng/tab mới sang web khác mà bạn không tự bấm link thật (web cá độ new88, f8bet..., quảng cáo đổi domain). Iframe quảng cáo bị khoá không cho kéo cả trang đi. Lỡ chặn nhầm → bấm "Vẫn mở" trên thông báo.
- 1.4.0: ẩn popup lừa đảo giả làm ô xác minh/đăng nhập ("Tôi là con người", "xác minh bạn là người thật", "I'm not a robot", "bấm Cho phép").
- 1.3.0: chặn script quảng cáo của sangchanhteam.com (`browpotware`, `aj1559.online`) + luật nhận diện chung cho domain quảng cáo đổi liên tục.
- 1.2.0: chặn quảng cáo Google, banner dính đầu/cuối trang.
- 1.1.0: ẩn hình nổi đè lên trang.
- 1.0.0: chặn chuyển hướng Shopee/TikTok Shop.
