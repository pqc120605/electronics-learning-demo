# MM-SIM-S3B — CircuitDocV2, cổng G1–G4 và mount resolver

## Kết quả

Đã thêm kiểu tài liệu mạch và validator thuần trong `src/lib/circuitDocV2.ts`, cùng bộ giải hình học/kiểm tra gắn chân trong `src/lib/mountResolve.ts`. Các bài học, UI, manifest, `circuitNets.ts`, `assemblyLayout.ts` và `package.json` không bị sửa; không thêm dependency.

Validator trả chẩn đoán có mã G1–G4 và thông báo tiếng Việt. G2a chặn thiếu dữ liệu chân phù hợp mount; G2b đưa cảnh báo khi hình học là `parametric` hoặc `unknown`. G3 kiểm tra chân registry và dữ liệu hình học cần thiết. G4 kiểm tra endpoint lỗ, chân trùng lỗ và chân cùng dải nối; ngoại lệ chỉ được chấp nhận khi có `intentionalShort`. `footprintHoles`, `canMount` và `occupancy` được xuất riêng để dùng ở các lát cắt sau.

G5 phát hiện footprint chồng lấn chưa triển khai trong lát cắt này; theo task, được hoãn sang S4a.

## Kiểm chứng

- Tài liệu `blink` theo ví dụ trong spec được chấp nhận.
- Tài liệu sai kiểu/mount bị từ chối G2; pin không tồn tại bị từ chối G3; endpoint/short không hợp lệ bị từ chối G4.
- Kiểm tra occupancy, gắn footprint và ngoại lệ `intentionalShort` có test.
- `node --test tests/breadboard-grid.test.mjs tests/circuit-doc-v2.test.mjs`: exit 0, 14/14.
- `npm.cmd run typecheck`: exit 0.
- `npm.cmd test`: exit 0, 423/423; 0 failed, 0 skipped.

## Dữ liệu chân còn thiếu

- Không có loại nào trong manifest có `mount: "breadboard"` bị thiếu `legsMm` không rỗng.
- Các model bench dưới đây có `legsMm` rỗng theo thiết kế mount hiện tại; chúng dùng `pinsMm` khi có hình học đầu nối: `battery`, `boost-converter`, `buck-converter`, `dc-motor`, `h-bridge`, `ir-sensor`, `limit-switch`, `relay`, `servo`.
- Board ESP32 dùng dữ liệu chân riêng của model board thay cho `legsMm`; breadboard là nền lắp, không phải linh kiện cắm lên chính nó.
- `ultrasonic` và `tb6612` được xử lý theo mount breadboard trong manifest hiện tại.

## Giới hạn và review

- Hình học `parametric`/`unknown` chỉ phát cảnh báo; không được xem là hình học đã đo hoặc đã xác minh.
- Bộ giải mặc định dùng mô hình ESP32 DevKit hiện tại khi cần board, do CircuitDocV2 chưa mang định danh board. Cần chốt cách truyền board identity trước khi nối vào luồng hỗ trợ nhiều board.
- Task card ghi “Claude review: CÓ”, nhưng hướng dẫn `AGENTS.md` đang hiệu lực nêu founder đã chọn không dùng Claude và cấm gửi nội dung dự án hoặc yêu cầu review cho Claude. Vì vậy không gửi review bên ngoài; báo cáo này ghi nhận xung đột chính sách để người dùng xử lý nếu muốn thay đổi lựa chọn đó.

## Tệp

- `src/lib/circuitDocV2.ts` — mới.
- `src/lib/mountResolve.ts` — mới.
- `tests/circuit-doc-v2.test.mjs` — mới.
- `docs/agents/runs/MM-SIM-S3B/report.md` — báo cáo này.
