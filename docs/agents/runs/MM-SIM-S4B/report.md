# MM-SIM-S4B — Bộ định tuyến dây orthogonal A*

Date: 2026-11-10

## Kết quả

- Thêm `routeWires`: A* trên lưới 1,27 mm, kết quả tất định, cost rẽ/cắt, tránh footprint, cấm chạy trùng đoạn, ép endpoint vào lưới, có lead vuông góc và trả lỗi thay vì vẽ dây đoán khi không tìm được đường.
- Đầu dây nằm trong footprint chỉ được thoát qua footprint được khai báo đúng `fromObstacleId`/`toObstacleId`; router không đi xuyên part khác.
- Cảnh báo khi quá 3 góc rẽ; kiểm thử 16 dây cùng một footprint nhỏ chạy dưới 200 ms; lần chạy toàn bộ suite gần nhất ghi 36,02 ms.

## Giới hạn

- Chưa nối vào ba view, chưa có đường dẫn từ chân v2/layout sang router trong ứng dụng. Test 16 dây là hình stress có footprint nhỏ, chưa phải ảnh bài 7 đoạn thật.

## Kiểm chứng

- `node --test --test-concurrency=1 tests/wire-router.test.mjs` — 5/5 pass.
- `npm.cmd run typecheck` — exit 0.

## SHA-256

- `src/lib/wireRouter.ts`: `11096b450d3236b55c11b60d8e94cc2506a087092c8792c89f45fd9081483f45`
- `tests/wire-router.test.mjs`: `3bd015b77831a3b26542ce0bb93047ab940e178865cb39948e4b6a4412372dee`
