# SIM v2 — trạng thái sau rà soát và triển khai

Date: 2026-11-10

## Đã có trước lượt này

- S1, S2r, S3a, S3b, S3b-fix, S3c: artifacts/mã/test đã có trong repo.
- Lượt này thêm S3d (helper migration), S3e (net adapter), S4a (layout 2D), S4b (A* wire router). Từng lát có báo cáo riêng trong thư mục run tương ứng.

## Còn thiếu theo `plan.md` mục 8 / `spec-v2.md`

| Lát | Trạng thái | Việc còn thiếu |
|---|---|---|
| S3d | Một phần | Chưa tích hợp vào luồng mở workspace; bốn preset cũ bị chặn bởi hình học/mount, không tự sửa dữ liệu. |
| S3e | Một phần | Bridge topology đã có; bài `analog-potentiometer` chưa thể nạp SPICE vì compiler hiện không có model potentiometer. |
| S4a/S4b | Lõi thuần có | Chưa chạy G5/G6 trên corpus v2 hoặc đưa layout/router vào view sản phẩm; test router 16 dây chưa dùng ảnh/dữ liệu 7 đoạn thật. |
| S4c | Chưa làm | Cổng G1–G10 chạy fail-fast trên toàn corpus, gồm kiểm bố cục/route/SPICE/parity. |
| S5a–S5e | Chưa làm | Bộ chọn view; SVG breadboard top view; ba view dùng chung layout/router; e2e G11/G12 ở 375/768/1440; đổi nhãn/vị trí “PCB board (tham chiếu)” theo Q-SIM-8(a). |
| S6a–S6b | Chưa làm | Sáu CircuitDoc v2 đầu tiên: blink/source-led/button-led/analog-potentiometer/analog-ldr/ir-alert và index. |
| S6c-n | Chưa làm | Bổ sung footprint/chân cho catalog 28 loại, mỗi loại có nguồn đủ điều kiện và G2. |
| S6d | Chưa làm | ultrasonic-distance, seven-segment-counter và ba bài bench dưới schema v2. |
| S7 | Chưa làm | Chạy lại browser audit trên mọi bài/view và so baseline bằng ảnh riêng. |

## Blocker cần xử lý trước khi tuyên bố SIM v2 hoàn tất

1. Manifest nút nhấn có chân cách 6,5 × 4,5 mm, không khớp lưới lỗ 2,54 mm trong dung sai hiện tại; nút `button-led` không thể tự đặt hợp lệ.
2. Ba bài bench cũ có LED/điện trở chỉ được registry/manifest cho mount breadboard, trong khi CircuitDoc v2 không có breadboard ở bài đó và G2 không cho bench mount. Cần sửa contract/catalog có nguồn, không thể giải bằng tọa độ cũ.
3. `workspaceSpice.ts` hiện không mô hình potentiometer và cũng không nhận dây tới GPIO như hành vi firmware. S3e giữ nguyên API như yêu cầu; G9 cho `analog-potentiometer` chưa thể đạt nếu chưa có quyết định/mô hình được chấp thuận.
4. `CircuitBuilderPage` vẫn đang dùng luồng v1; chưa có migration UI, chưa có bài v2 trong app và chưa có view mới. Các phần code ở lượt này chưa thay đổi trải nghiệm người học.

## Trạng thái queue

Đã kiểm `D:/StartupOS/docs/agents/tasks.json`: hiện không có task `MM-SIM-*`. Lượt này chưa ghi queue bên ngoài checkout; các báo cáo code/test nằm ở `docs/agents/runs/`. Do đó các lát trên chưa có trạng thái canonical/lease trong queue.

## Xác minh lượt này

- `npm.cmd run typecheck` — exit 0.
- `npm.cmd test` — exit 0; 448/448 pass, 0 fail, 0 skipped.
- Browser/e2e: NOT_RUN; UI chưa được nối với các module mới.
