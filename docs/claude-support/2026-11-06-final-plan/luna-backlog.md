# Backlog cho Luna · các việc phần mềm có thể giao (07/11/2026)

Nguyên tắc: tối đa 2 writer cùng lúc, `allowed_paths` không chồng; slice ≤5 file, một kết quả kiểm chứng; không thêm dependency khi chưa duyệt; local-first. Các prompt nháp `01…12` nằm ở `docs/claude-support/2026-11-06-software-depth/luna-prompts/` (viết từ phiên review web trước, chưa gửi); tôi dùng lại chúng, không viết lại. Số bên dưới là số trong thư mục đó.

## Đã xong (không gửi lại)
01 nền xanh → P1-01, P1-05; 02 báo lỗi lưu nháp → P1-02; 03 nối chân bàn phím → P1-03; 11 phần phiên bản/dọn cache → P1-04.

## Thứ tự gửi cho Luna

| # | Việc | Prompt | Claude review | Ghi chú |
|---|---|---|---|---|
| 1 | Vá điều kiện P1-02/P1-03 | `codex-prompts/luna/P1-06-draft-warning-pin-bubble-fixes.md` | KHÔNG | gửi trước, rẻ |
| 2a | Workspace→SPICE đa analysis (.tran/.dc) | `luna-prompts/04-workspace-spice-analyses.md` | KHÔNG | chạy song song với 2b (path không chồng) |
| 2b | Cursor + phép đo trên waveform | `luna-prompts/05-waveform-cursors-measurements.md` | KHÔNG | hàm đo thuần, test độc lập |
| 3 | Codec project (decode/normalize thuần, idempotent) | `luna-prompts/07-project-codec-contract.md` | **CÓ (CP-06, đổi cách đọc dữ liệu lưu)** | Luna được làm vì ≤5 file và không bump version; dừng nếu cần đổi schema |
| 4 | BOM theo biến thể (giá trị thiếu = `unknown`) | `luna-prompts/06-bom-variant-identity.md` | KHÔNG | không điền 220 Ω; giá trị cần EF xác nhận nên để `unknown` |
| 5 | e2e offline thật cho service worker | `luna-prompts/11-service-worker-offline.md` (chỉ phần e2e + chunk lazy; phần phiên bản đã xong) | KHÔNG | nêu rõ "route lazy bản cũ" |

Gợi ý ghép: (1) rồi (2a)+(2b), sau đó (3), rồi (4)+(5).

## Việc Luna có thể nhận thêm (chưa có prompt, viết khi tới lượt)
- **Xuất sơ đồ SVG/PNG từ SchematicView** (P20 hiện L0): thuần phía client, không dependency. ≤4 file. Claude review: KHÔNG.
- **Bài học robot ở chế độ mô phỏng**, chưa cần phần cứng (P12/P13 hiện L0–L1): chỉ nội dung/curriculum và e2e; không điều khiển robot thật. D4 đã chốt (Web Serial để kiểm chứng) nên dùng làm hợp đồng; Claude review: CÓ nếu chạm dữ liệu trẻ em.
- **Trang QR theo bài** (P4-L01): chờ D12 (thư viện hay tự viết).
- **Tích hợp dữ liệu từ nghiên cứu ngoài** (kho linh kiện/mô hình 3D): chỉ sau khi Claude lọc license và nguồn từ kết quả `research-prompts.md`; mỗi nguồn một slice riêng.
- **Hạ tầng lint** (eslint/oxlint với `react-hooks/exhaustive-deps`): cần duyệt dependency, xin founder trước.

## Không giao cho Luna (CẦN SOL)
08 K-RUN, 09 rubric/assessment (đổi schema + ≥7 file), 10 chiến lược ESP32 (tài liệu quyết định, chờ D13), 12 cổng phát hành ngspice (chờ D5). Prompt cho các việc này chưa viết.

## Rủi ro khi chạy Luna nhiều việc liên tiếp
- Báo cáo Luna phải ghi lệnh + exit code thật; từng có một lần "28/28" lệch thời điểm vì slice sau thêm ca mới. Yêu cầu ghi số test trước/sau.
- Hai slice cùng chạm `e2e/journeys.spec.mjs` thì không chạy song song.
- Không có `git diff` (project untracked trong repo cha): yêu cầu mỗi slice liệt kê file đã đổi kèm hash.
