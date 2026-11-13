# MM-SIM-S3E — Cầu net v2 sang dây pin-pin cho SPICE

Date: 2026-11-10

## Kết quả

- Thêm `compileSpiceConnections(doc)`: chuyển từng net v2 thành cây dây pin-pin tất định, bỏ các net chỉ có một chân, giữ kết nối qua lỗ/dải/ray và tên endpoint ổn định.
- `src/lib/workspaceSpice.ts` và API SPICE không bị sửa.
- Test xác nhận phân hoạch net của `blink`, tài liệu pin-only và một mạch thụ động được compiler SPICE hiện tại nạp.

## Chưa đạt tiêu chí kế hoạch

- Compiler SPICE hiện tại từ chối part `potentiometer` vì chưa có model điện; test tái hiện trực tiếp ở `tests/compile-spice-connections.test.mjs`. Do ràng buộc S3e cấm sửa `workspaceSpice.ts`, không thể kết luận bài `analog-potentiometer` nạp được. Không thay biến trở bằng hai điện trở giả và không tự gán giá trị.
- Tài liệu `blink` v2 đầy đủ có GPIO board; SPICE hiện không thực thi GPIO/firmware, đúng giới hạn hiện tại. Test adapter SPICE dùng một mạch thụ động tương đương riêng, không gọi nó là bài học blink thực.

## Kiểm chứng

- `node --test --test-concurrency=1 tests/compile-spice-connections.test.mjs` — 5/5 pass; ca tương thích SPICE của potentiometer ghi nhận giới hạn bằng assertion.
- `npm.cmd run typecheck` — exit 0.

## SHA-256

- `src/lib/compileSpiceConnections.ts`: `61d1f85fb54a8c67dcef7229042d271e9c847bb10aa2332e2a272d616445fe26`
- `tests/compile-spice-connections.test.mjs`: `b48058f2b0a7dce6b4aecc1ea97e76d41f478854e8381d00d81923403285f8de`
