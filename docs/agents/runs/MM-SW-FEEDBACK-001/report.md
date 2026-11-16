# Góp ý, báo lỗi và người phát triển

Ngày 16/11/2026 · MM-SW-FEEDBACK-001 · Đã hoàn tất phạm vi; QA nguồn và hồi quy cuối PASS.

## Kết quả

- Có `/feedback` và `/app/feedback`, truy cập từ Trợ giúp và chân trang; có liên kết thẳng tới Người phát triển.
- Chọn báo lỗi/góp ý tính năng/góp ý bài học; nhập nội dung, xem lại, sao chép hoặc tải file Markdown. Form chưa tự gửi và luôn ghi rõ trạng thái này. Không thêm tài khoản bắt buộc, dịch vụ gửi hay dependency.
- Chỉ công khai Chiến Phan, Gmail `chienpq12.work@gmail.com`, Facebook `https://www.facebook.com/phan.chien.789760/?locale=vi_VN`, portfolio `https://phanquocchien.vercel.app/`. Không thêm link repo GitHub vào phần người phát triển.
- Nháp ở sessionStorage riêng trong tab; nếu quyền truy cập hoặc ghi bị chặn, giữ RAM và thông báo đúng giới hạn. Nháp không đọc được được giữ nguyên và tải lại bytes gốc; không ghi đè.
- Không tự đính kèm email người dùng, danh tính, mã nguồn, mạch, query/fragment hoặc dữ liệu thiết bị. Không đụng dữ liệu dự án. Preview là văn bản thuần; file dùng code fence phù hợp và filename an toàn.
- Desktop có form và preview song song; mobile chuyển hai chế độ, giữ nội dung; dùng token sáng/tối hiện có và hỗ trợ bàn phím.

## File và hash

Mười file nguồn/test đã đóng băng trong `review-snapshot.json`; mỗi file có SHA-256 đầy đủ. Thiết kế/phạm vi ở `task.md`, QA độc lập ở `review.md`. Canonical queue là `D:/StartupOS/docs/agents/tasks.json`, không tạo registry thứ hai.

## Kiểm chứng hiện có

| Lệnh / kiểm tra | Kết quả |
|---|---|
| `node --test tests/feedback-draft.test.mjs` | exit 0, 5/5; đã kiểm đỏ trước triển khai |
| `node scripts/run-browser-tests.mjs test --config .tmp/pw-redesign.config.mjs e2e/feedback.spec.mjs --workers=1` | exit 0, 11/11 |
| QA nguồn độc lập | PASS, 10/10 hash khớp; đã đóng P2 về độ bền nháp |
| Kiểm a11y tự động | Không có serious/critical trong bốn tổ hợp 375/1440px, sáng/tối |
| `npm.cmd test` trên bộ nguồn cuối | exit 0, 647/647, không skip/todo |
| Hồi quy trình duyệt toàn bộ | exit 0, 170/170; không retry, không bỏ qua ca |

Ca browser gồm: đúng ba liên kết liên hệ, không repo/kênh gửi; help mang pathname sạch; nhãn lỗi không đổi accessible name; validation/focus; tải bytes đúng preview; không có request gửi form; clipboard bị từ chối; nháp reload; giữ/tải raw phiên bản lạ; quota; getter sessionStorage bị chặn; mobile chuyển view; bàn phím; dark/light và không tràn ngang.

Cấu hình kiểm thử chỉ đổi cổng preview sang 5311 vì 5196 đang có tiến trình khác; kế thừa cấu hình và toàn bộ assertions hiện hành, một worker, không retry. Không gọi đây là kết quả lệnh mặc định không tham số. Build local chỉ là kiểm tra kỹ thuật nội bộ; không publish/deploy.

## Xử lý phát hiện

- Lượt browser đầu: 5/10. Nhãn bọc cả input và lỗi khiến tên truy cập thay đổi; đã tách label/input/error, giữ assertion bàn phím. Lượt sau 10/10.
- QA P2: helper storage trả RAM khi native getter bị từ chối nhưng trang báo đã lưu trong tab. Đã dùng native getter có catch, thêm ca denied-getter; 11/11 và QA đóng finding.
- Một lệnh queue bị lỗi định dạng module Node trước khi ghi; lead đã đối soát ngay, ghi lịch sử canonical. Không có writer nguồn đồng thời.
- Lượt full E2E đầu của đợt cuối được dừng sau QA finding, không tính PASS; log superseded được giữ.

## Ảnh đã kiểm trực quan

![Form desktop](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FEEDBACK-001/screenshots/overview-1440.png)

![Form mobile và người phát triển](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FEEDBACK-001/screenshots/overview-375.png)

![Mobile xem trước](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FEEDBACK-001/screenshots/mobile-preview.png)

Các ảnh `feedback-<width>-<theme>.png` được chụp sau ca bàn phím nên full-page có thể giữ header sticky ở vị trí cuộn hiện tại; ảnh overview đã đưa về đầu trang. Đây là khác biệt chụp ảnh, không phải bằng chứng header sai vị trí khi mở trang.

Giới hạn: chưa có kênh gửi tự động đúng theo founder; đóng tab/xóa dữ liệu trình duyệt có thể mất nháp, file tải riêng là cách giữ lâu hơn. Không kiểm screen reader hay bàn phím điện thoại vật lý; không có claim thu thập/gửi dữ liệu hoặc hỗ trợ từ xa.

## Bàn giao cuối

Cả bốn lệnh trong verification.json đều exit 0: typecheck, 647 Node tests, build local và 170 browser tests. Bản mã vẫn khớp toàn bộ hash reviewer đã kiểm. Log cuối, bản cấu hình browser đã dùng và hash bằng chứng được giữ trong thư mục này. Kiểm trực quan ảnh desktop/mobile và các view đã thực hiện; không có lỗi hình ảnh chặn phạm vi nghiệm thu. Kiểm screen reader và bàn phím điện thoại vật lý: NOT_RUN. Cổng 5196 giữ nguyên; preview cho người dùng tại http://127.0.0.1:5320. Chưa publish/deploy hoặc đẩy GitHub.
