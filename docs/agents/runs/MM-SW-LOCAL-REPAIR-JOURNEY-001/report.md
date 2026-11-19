# Bản local · Nhập môn, thử thách sửa mạch và dự án

- Đưa sơ đồ lên trước phần danh sách hoạt động và lưu trữ. Thanh trên mobile dành chỗ cho tên trang. Board và Dự án hiển thị lần lượt 8 hồ sơ và 3 bài mẫu ở lượt đầu, có tìm kiếm hoặc mở thêm.
- Thêm ba tình huống có gợi ý từng bước. Người học phải dự đoán đúng và chạy ở cả trạng thái lỗi và trạng thái đã sửa. Bằng chứng và thao tác cuối được giữ khi quay lại.
- Mini-project nối bài nút nhấn, bài ánh sáng và đèn cảnh báo. Nút chuẩn bị phép thử đặt đầu vào cho trường hợp tiếp theo. Bằng chứng được tính theo board và ngưỡng. Đổi ngưỡng giữ các lần thử trước đó trong hồ sơ.

## Bản kiểm chứng

Bản local tại `http://127.0.0.1:5320/app` phục vụ `index-DR-wjR03.js` với SHA-256 `c9826e6b42ee1588c16a325fd55cfc3b457b4358c9c06a477d750e420688b09a`. [Danh sách tệp và SHA-256](snapshot-reviewed.json)

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0 |
| `npm.cmd run build:local -- --outDir .tmp/repair-journey-build-check` | Exit 0, SHA-256 trùng bản local |
| `node --test --test-concurrency=1` trên 6 tệp unit của khóa nền tảng và mini-project | 25 đạt |
| `npm.cmd run test:e2e --` trên 8 tệp E2E liên quan | Exit 0, 44 đạt, 0 bỏ qua |

[Lệnh đầy đủ và nhật ký](verification.json)

Lượt đầu phát hiện lỗi tên truy cập của liên kết thương hiệu ở hai trang desktop. Đã đồng bộ tên truy cập với nhãn hiển thị. Ca tìm board dùng bộ chọn quá rộng, trong khi ứng dụng tìm đúng bốn mẫu NUCLEO. Ca mới kiểm đúng tên F401RE và số kết quả.

## Tester độc lập

- 22 nhóm thao tác đạt ở 375 × 812 và 1440 × 900. Không phát hiện lỗi chặn trong các luồng kiểm. Hai lượt axe ở trang sửa mạch không phát hiện vi phạm theo bộ quy tắc áp dụng. [Báo cáo tester](tester/independent-tester-report.md)
- [Dữ liệu kiểm thử](tester/independent-browser-results.json)
- [Ảnh mạch đầu ở 375 px](tester/375-first-circuit.png)
- [Ảnh sau ba thử thách ở 375 px](tester/375-repairs-complete.png)
- [Ảnh tiến độ dự án ở 1440 px](tester/1440-capstone-complete.png)

Thử thách dạy cách khoanh vùng lỗi với hai lựa chọn cấu hình trên mô hình. Kết quả kỹ năng ghi những gì đã làm trong mô hình. Tỷ lệ giữ chân cần lượt quan sát người học tự nguyện qua nhiều ngày. Nghiệm thu thiết bị thật, các trình duyệt khác, luồng online và Mini PC được để sau.
