# MM-SIM-S4A — Bố cục 2D tất định

Date: 2026-11-10

## Kết quả

- Thêm `layout2D(doc)` với tọa độ mm: board/breadboard thành nhóm trung tâm, part breadboard theo chân neo và `footprintHoles`, part bench xếp theo làn và order, khoảng hở bench tối thiểu 4 mm.
- Vị trí không đủ hình học được trả trong `unplaced`, không được tự đoán. Bộ di trú chỉ nhận vị trí sau khi cổng mount và khoảng chồng footprint đều đạt.
- Test 11 preset builder cũ: các preset có thể biểu diễn được được bố trí không chồng thân; 4 trường hợp bị chặn rõ trong báo cáo S3D (nút nhấn, và ba bài bench không có biểu diễn mount nhất quán).

## Kiểm chứng

- `node --test --test-concurrency=1 tests/layout-2d.test.mjs` — 5/5 pass.
- `npm.cmd run typecheck` — exit 0.

## SHA-256

- `src/lib/layout2D.ts`: `4c1264e17f0881508809baa7210691b27e2ca1e1d8188778064c387a02b07cef`
- `tests/layout-2d.test.mjs`: `d1d301913e6d9fc29a254e967ed0418e95d1cc6ed6d36e63cc7dea3240ebc84f`
