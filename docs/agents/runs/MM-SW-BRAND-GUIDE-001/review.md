# QA độc lập — MM-SW-BRAND-GUIDE-001

Ngày 15/11/2026. Reviewer: Codex `/root/ui12_final_review`, read-only; lead ghi lại phản hồi, reviewer không sửa file hoặc chạy test/server.

Snapshot: `final-snapshot.json`, 26/26 hash được reviewer đối chiếu. Scope: logo/mascot/guide/knowledge mới và các hook ngữ cảnh, không phải toàn bộ thay đổi Git từ những phiên trước.

## Lượt đầu: changes_requested

1. **P2 — link ADC sai mã bài:** `analog-pot` không tồn tại, làm liên kết rơi về workspace thường thay vì bài biến trở có hướng dẫn.
2. **P2 — fallback board bị ghi như board đã chọn:** bài nút nhấn có `boardNotice` cho board chưa biết/tham chiếu nhưng guide vẫn ghi tên target fallback là board đang chọn.

## Disposition của lead

- ACCEPT 1: sửa link thành `analog-potentiometer`; kiểm tra unit cho href và e2e mở đúng tên bài/URL app.
- ACCEPT 2: bổ sung cờ `reference` vào metadata tạm thời của guide; phân biệt “Board tham chiếu đang hiển thị” và giữ nguyên warning. Áp dụng cả fallback unknown-link ở thư viện board. Thêm assert unit cho nhãn tham chiếu và ca e2e unknown-clone. Không đổi schema dữ liệu lưu.
- Hai assert đã tái hiện RED trước khi sửa, rồi GREEN 5/5 trong `qa-green.log`.

## Xác nhận lại: PASS

Reviewer xác nhận hai P2 đã được sửa và 26/26 hash khớp snapshot mới; không có finding mới trong phạm vi. Nội dung phản hồi: “PASS for reviewed scope. Both P2 findings are corrected: ADC opens the valid guided lesson, and unknown-board fallbacks are explicitly labeled as reference boards with their warning preserved.”

Giới hạn: reviewer đọc source, ảnh 375px và log browser tập trung sáu ca trước sửa; đối chiếu log unit tập trung 5/5 sau sửa. Reviewer không tự chạy kiểm tra. Hai ca browser mới cùng hồi quy toàn bộ do lead thực thi sau đó và được báo riêng trong report, không suy ra từ verdict review.

## Xác nhận delta cuối

Hồi quy toàn bộ phát hiện `label-content-name-mismatch` ở nút nổi. Lead bỏ `aria-label` thừa để tên truy cập được lấy trực tiếp từ chữ hiện trên nút; bổ sung ca axe ở `/app/classroom-kits` 375px. Mạch LED tham chiếu cố định cũng được gắn `reference:true`. Reviewer xác nhận PASS cho hai delta này.

Helper mới ban đầu dùng regex “Hỏi Mở” ở toàn trang nên khớp cả launcher và menu. Lead chỉ giới hạn selector vào `.help-menu-panel`, giữ toàn bộ assertion; reviewer xác nhận PASS vẫn áp dụng, 26/26 hash khớp. Ba ca browser hồi quy cuối sau đó đạt 3/3, exit 0 (`qa-browser-final.log`), do lead chạy.

## Tương phản trong hiệu ứng tour

Lượt e2e tiếp theo dừng ở ca tour mobile cũ với `color-contrast`. Probe độc lập có thể không tái hiện ở mọi lượt; ca kiểm tra trực tiếp bốn frame đầu đã xác nhận opacity của card/chữ chưa bằng 1 (RED). Lead bổ sung đúng stylesheet tour vào lease và giữ hash trước sửa; đổi ba animation của card, tiêu đề và đoạn hướng dẫn sang `mm-enter` chỉ dịch chuyển. Backdrop và nhánh reduced-motion được giữ.

Ca opacity mới cùng hai ca tour cũ tại 375/1440 đạt 3/3, exit 0. Reviewer xác nhận PASS cho delta này, 27/27 hash khớp, không có finding mới. Reviewer không tự chạy các ca kiểm tra; bằng chứng thực thi do lead ghi. Hồi quy toàn bộ cuối được ghi trong report.
