# Kế hoạch triển khai — 5 slice

Ngày: 04/11/2026. Mỗi slice là một thay đổi có thể review riêng, không đổi `PROJECT_BUNDLE_VERSION` hay `CircuitWorkspaceDocument`, trừ chỗ ghi rõ. Slice 1–3 là sửa và gia cố trong luồng có sẵn. Slice 4–5 là tính năng hoặc engine mới, nên **chỉ là thiết kế và cần founder duyệt** trước khi làm.

Mã B và F tham chiếu [UPGRADE-BACKLOG.md](UPGRADE-BACKLOG.md).

## Slice 1 · Lưới an toàn: E2E, a11y, lỗi nội dung (F01, B02–B05)

- **Mục tiêu:** mỗi hành trình trong 7 hành trình có một test trình duyệt thật; sửa bốn lỗi đã xác minh.
- **Việc cần làm:**
  1. Thêm `@playwright/test@1.64.1` và `@axe-core/playwright` (cùng dòng axe-core 4.14.0) làm devDependency. Ghi version cố định; cache trình duyệt đặt ở `D:\StartupOS\.tools\mach-mo-review\playwright`.
  2. Tạo `e2e/journeys.spec.ts`:
     - Người mới học: `/learn` → blink → lab báo "Sẵn sàng chạy".
     - Tự lắp: kéo D13 → điện trở bằng `mouse.down` / `mouse.move(steps: 10)` / `mouse.up`; số dây +1; undo → số dây −1.
     - Board: XIAO S3 không có lỗi console.
     - Firmware: tick xác nhận → chạy mẫu → D13 có ≥ 4 chuyển trạng thái.
     - SPICE: ví dụ RC chạy, và handoff mạch nguồn + R + LED có `v(n003)`.
     - Project: lưu → đổi tên → xuất → nhập lại → so sánh JSON.
     - Kit: chọn 4 trạm → CSV có hàng jumper và USB.
  3. Chạy axe trên 8 route ở 375 và 1440.
  4. Sửa B02 (`boardCapabilityRegistry.ts:107`), B03 (`workspaceSpice.ts:170`), B04 (`workspaceSpice.ts:147,213`), B05 (`classroomKit.ts:29`), mỗi lỗi kèm unit test.
- **Tiêu chí xong:**
  - `npm.cmd run test:e2e` pass 7/7 hai lần liên tiếp.
  - axe: 0 vi phạm `critical` và `serious`, hoặc mỗi vi phạm còn lại có issue ghi lý do.
  - 349 + N unit test pass.
- **Rủi ro:** Playwright cần tải trình duyệt (~150 MB). Cần founder đồng ý tải.

## Slice 2 · Gỡ gate phát hành SPICE (F02, B06)

- **Mục tiêu:** `check:public-release` pass vì artifact đã được chứng minh nguồn gốc, không phải vì metadata bị sửa.
- **Việc cần làm:**
  1. Chọn phương án ở [TOOLING-SHORTLIST.md § ngspice](TOOLING-SHORTLIST.md#ngspice-provenance). Khuyến nghị: phương án A, build tái lập.
  2. Script `scripts/build-spice-engine.mjs` (hoặc Dockerfile) ghim:
     - EEcircuit-engine commit `be15b07abaf2`;
     - tarball ngspice 45.2 kèm SHA-256 lấy từ trang tải chính thức;
     - phiên bản Emscripten.
  3. Xuất `spice-engine-provenance.json`: hash nguồn, hash output, toolchain, lệnh build, và license các thành phần (ngspice BSD-3 cùng các phần có license khác trong cây nguồn, cần kiểm từng thư mục).
  4. Script gate đọc file provenance và đối chiếu SHA-256 của `public/vendor/eecircuit-engine/spice.wasm`.
- **Tiêu chí xong:**
  - Hai lần build sạch cho cùng hash.
  - `audit:spice-engine` cho `v(out)=2.5 V`.
  - `check:public-release` exit 0.
  - Inventory license không còn mục `unknown`.
- **Cần founder:** chọn phương án A, B hay C.

## Slice 3 · Nhãn khả năng một nguồn (F03, F04)

- **Mục tiêu:** mọi câu "chạy/không chạy firmware, mô phỏng gì" trên catalog, lab, kit và project được sinh từ một bảng capability.
- **Việc cần làm:**
  - Thêm `firmwareEngine?: 'avr8js'` và `simulationKinds: ('lesson-subset' | 'hex' | 'spice-equivalent')[]` vào capability.
  - Viết `describeBoardSimulation(boardId)` dùng chung.
  - Thêm "phụ kiện trạm" (USB, jumper) cho kit.
- **Tiêu chí xong:**
  - Grep `không chạy firmware` chỉ còn trong hàm sinh câu.
  - Test snapshot câu cho Uno, Nano, ESP32 và Pico.

## Slice 4 · Spike RP2040 và VCD (F07, F05) — cần duyệt

- **Mục tiêu:** chứng minh có thể chạy MCU thứ hai mà không đổi kiến trúc builder.
- **Việc cần làm:**
  - Vendor rp2040js v1.4.1 (MIT) vào Worker riêng, theo cùng mô hình với AVR8js.
  - Chạy UF2 blink chính thức của Pico.
  - Nối GPIO vào logic analyzer hiện có.
  - Thêm xuất VCD (định dạng IEEE 1364) cho cả AVR và RP2040.
- **Tiêu chí pass:**
  - GP25 chuyển trạng thái ≥ 4 lần trong 2 s mô phỏng.
  - VCD mở được trong PulseView, đúng số cạnh.
  - Bundle tăng ≤ 150 kB gzip, chỉ tải khi chọn Pico.
- **Tiêu chí fail và dừng:** UF2 chuẩn không boot được trong 2 ngày công.

## Slice 5 · Lớp học có tài khoản (F14) — cần quyết định sản phẩm

- **Mục tiêu:** giáo viên tạo mã lớp; học sinh nộp project; giáo viên thấy tiến độ theo bước.
- **Điều kiện trước khi làm:**
  - Quyết định backend; repo cha có Supabase CLI trong `.supabase-cli/`, chưa kiểm cấu hình.
  - Chính sách dữ liệu trẻ vị thành niên.
  - Có F08 (tiến độ theo bước).
- **Cách làm:** chỉ thiết kế, đặt trong `docs/superpowers/specs/`. Không viết code trước khi được duyệt.

## Thứ tự và ước lượng

| Slice | Phụ thuộc | Công sức (ngày công) | Có thể song song |
|---|---|---|---|
| 1 | — | 3–4 | Với slice 2 |
| 2 | Quyết định provenance | 2–4 | Với slice 1 |
| 3 | Slice 1 (lưới an toàn) | 2 | — |
| 4 | Duyệt spike | 3–5 | Sau slice 1 |
| 5 | Quyết định sản phẩm, slice 3 | Thiết kế 2 | — |
