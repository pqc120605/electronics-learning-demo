# MM-SIM-S3D — Chuyển bản nháp workspace v4 sang tài liệu mạch v2

Date: 2026-11-10

## Kết quả

- Thêm `src/lib/migrateV1toV2.ts`: chuyển workspace cũ sang `CircuitDocV2`, giữ nguyên workspace v4 và tất cả trường code/project/library trong bản mới; ID/type/value/wire identity được giữ. Tọa độ `%` cũ không bị diễn giải thành lỗ breadboard. Vị trí linh kiện được tìm tất định trên lưới chỉ khi có thể; kiểm cả footprint để tránh chồng thân.
- Hàm ghi chỉ tạo `machmo-circuit-v2-<lesson>` nếu khóa đó chưa tồn tại; khóa v1 không bị ghi/xóa. Các khóa drafts/branch cũ được giữ nguyên.
- Phát cảnh báo cho chân chưa nối và từ chối JSON hỏng, schema tương lai, wire trỏ pin không tồn tại, hoặc footprint không thể đặt.

## Giới hạn đã tái hiện

- `button-led` bị chặn: hình học 4 chân nút trong manifest không khớp dung sai lỗ 2,54 mm của bộ đặt v2. Không tự sửa manifest hoặc đoán vị trí.
- `buck-boost-concept`, `dc-motor-driver`, `mosfet-switch` có part breadboard-mount nhưng không khai breadboard; schema v2 hiện không biểu diễn được chúng ở bench mà vẫn qua G2. Cần sửa hợp đồng mount/catalog trước khi chuyển các bài này.
- Đây là helper chuyển đổi; chưa được nối vào khởi động `CircuitBuilderPage`, nên chưa tự di chuyển dữ liệu người dùng khi mở app.

## Kiểm chứng

- `node --test --test-concurrency=1 tests/migrate-v1-v2.test.mjs tests/layout-2d.test.mjs` — 8 test, dự kiến chạy trong suite đầy đủ.
- `npm.cmd run typecheck` — exit 0.
- `npm.cmd test` — toàn suite đang được xác minh trong run tổng hợp.

## SHA-256

- `src/lib/migrateV1toV2.ts`: `1565f56359cb44c77786db17d17626fafcd05f9909d8bfda5acf5c36fbefe3fa`
- `tests/migrate-v1-v2.test.mjs`: `eea07fb016ae9a0ccea8ba557418d5bff6e64c802e18b1364da00bc57c57437f`
