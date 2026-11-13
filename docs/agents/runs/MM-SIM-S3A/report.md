# MM-SIM-S3A — Breadboard grid

## Kết quả

Đã thêm mô hình lưới thuần trong `src/lib/breadboardGrid.ts` và bộ kiểm tra trong `tests/breadboard-grid.test.mjs`. Không sửa giao diện, `assemblyLayout.ts`, manifest hay thêm dependency.

Các hàm được cung cấp: `parseHole`, `formatHole`, `holeToMm`, `holeNet`, `stripHoles`, `railHoles`, `snapNearest`; cùng `BreadboardElectricalSpec`, `BREADBOARD_ELECTRICAL_SPEC`, `railX` và `railVerified`.

## Kiểm chứng

- 400 lỗ `bb1:<1..30><a..j>` parse→format chính xác.
- Kiểm tra nhóm 5 lỗ theo cột/nửa breadboard; hai nửa, hai cột và hai ray khác nhau không bị nối nhầm.
- Tọa độ của các lỗ mẫu khớp công thức `holePoint` trong `assemblyLayout.ts` với sai số tối đa `1e-9`.
- `bb1:31a`, `bb1:5k` và chuỗi rỗng trả `null`, không ném lỗi.
- `node --test tests/breadboard-grid.test.mjs tests/circuit-doc-v2.test.mjs`: exit 0 (14/14 ở lần chạy tập trung).
- `npm.cmd run typecheck`: exit 0.
- `npm.cmd test`: exit 0, 423/423; 0 failed, 0 skipped.

## Giả định và giới hạn

- Manifest chỉ cho biết bốn giá trị Z của ray; không cho biết số lỗ hay hình học lỗ ray. `railHoles: 25` và nhóm 5 là giả định `assumption-400-tie`, chưa đối chiếu ảnh hoặc bản vẽ. `railVerified` luôn là `false`.
- Đặt 25 vị trí ray cân giữa theo trục X của lưới và suy ra nhóm ray theo từng 5 vị trí là quy ước mô hình tạm thời; chưa được xác minh bằng hình học bo thực tế.
- `railSplit: true` chia ray tại điểm giữa 12/13 theo quy ước số thứ tự lỗ; vị trí đứt thật của bo chưa xác minh. Mặc định ray liên tục.
- Tọa độ lỗ breadboard chính khớp công thức hiện có; đây không phải xác nhận hình học vật lý của một breadboard cụ thể.

## Tệp

- `src/lib/breadboardGrid.ts` — mới.
- `tests/breadboard-grid.test.mjs` — mới.
- `docs/agents/runs/MM-SIM-S3A/report.md` — báo cáo này.
