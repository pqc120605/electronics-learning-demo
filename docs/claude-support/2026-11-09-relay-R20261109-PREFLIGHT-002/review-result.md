# REVIEW_RESULT · `MM-HW-GATE-PREFLIGHT-002` validator thực thi stage, gate bắt buộc, bằng chứng PASS · 09/11/2026 · Leader Claude

Đối tượng (request R-20261109-PREFLIGHT-002; tôi tính lại bằng `sha256sum`, khớp request và REPORT):
- `D:/StartupOS/docs/agents/validate.mjs` (264 dòng) SHA256 `a0da4cdfbc486f54e3d077145c60c74f5823fe80018b8bb762a65d8c448b28ed`
- `D:/StartupOS/docs/agents/validate.test.mjs` (71 dòng) SHA256 `dfe4a696cff3f4886177dce960fcb53c9cbe31ed725ba33953c06985027a7d08`
- Bản trước trong `MM-HW-P0-07/before-validate.mjs` có hash `69540e83…`, đúng bản tôi đã review ở C03; hai file `proposed-*` của run giống canonical từng byte (`diff`).

## Kết luận
**NHẬN.** Cả 4 finding Medium/Low và quan sát O1 của C03 đều được sửa và tôi tái hiện lại được từng ca đã sửa. Không có finding High. Có 1 Medium (bằng chứng PASS có thể do chính người ghi repo tự tạo và không được ghim byte), 2 Low, 3 quan sát. Đây là review mã preflight: không duyệt hash, không đóng cổng, không mở lease; validator xanh không phải hardware readiness.

## Đã kiểm (kết quả)
- Hash 2 file khớp. `node D:/StartupOS/docs/agents/validate.mjs`: exit 0, 47 tasks, 143 capabilities, `warnings: []`, `errors: []`. `node --test D:/StartupOS/docs/agents/validate.test.mjs` chạy lại: **51/51** pass, 0 fail (trước 32). Đọc toàn bộ `validate.mjs`.
- `node validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` (task KiCad thật): `dispatch_eligible: false`, lỗi "dispatch needs active task authorization" và "dispatch builder mode missing". Không có lease nào được cấp để làm xanh.
- **C03 F1 (mốc bằng regex) sửa:** mốc cổng nay đọc từ `gate.stage` có kiểu, so khớp `Object.hasOwn` với `schematic|layout|bom|operation` (`validate.mjs:47,88`). Thử: cổng không có hoặc lạ `stage` → "missing/unknown typed stage; treated as OPEN". Cổng `D17-B01-TRACEABILITY` bị gắn `schematic` mà còn OPEN → chặn đúng (không lọt như bản trước).
- **C03 F2 (xóa cổng) sửa:** `requiredGateStages` nằm trong validator, độc lập proposal (`:20-23`): schematic = 4 ID; layout = 4 ID + `D15B-FAB-LAYOUT`. Thử bằng script ở scratchpad (gọi `validateHardwareLeaseGates`): xóa `D17-OFF-DESIGN` → "required gate … missing"; đổi stage sang `bom` → "wrong stage; expected schematic, got bom"; trùng ID → "duplicate gate id"; `status:'pass'` (chữ thường) → OPEN; PASS không có `review_ref` → "PASS lacks review provenance". Danh sách tin cậy chỉ nhận id proposal `…r8-HANDSET` và `…r10-HANDSET` (`:24,41`); id khác fail-closed.
- **C03 F3 (prototype key) sửa:** `Object.hasOwn` ở `:77`. `toString`, `constructor`, `__proto__` và `bom` làm milestone lease đều → "hardware lease milestone missing or unknown".
- **C03 F4 (test) sửa:** test 45 cũ thay bằng `/^SW:.*lease/m` (`validate.test.mjs:32`), nên lỗi phần cứng không còn làm test xanh giả. Có thêm test dương đầu-cuối ("hardware dispatch passes end to end…", "…through default loader with structured review files") và các ca riêng cho hash lệch, tham chiếu ngoài thư mục, JSON hỏng, PASS thiếu hoặc lệch `review_ref`, envelope thiếu ID cổng, `readProposal` không qua mặt tham chiếu/hash.
- **C03 O1 (kind không phải implementation) sửa:** `validateQueue` (`:148-159`) chuẩn hóa `allowed_paths` của task `in_progress` bằng cùng `leasePath` rồi yêu cầu builder hardware lease khi dính `hardware/**` (cả cha chung `electronics-learning-demo/**`) hoặc `.kicad_*`, không phụ thuộc `kind` hay policy. Thử với `kind:'design'`, `in_progress`: `hardware/mobot-v2/**`, `HARDWARE/x`, `electronics-learning-demo/**`, `hardware./x`, `electronics-learning-demo/hardware/x/board.kicad_sch`, `x/Board.KiCad_Pcb` đều bị chặn; `docs/hardware/x.md` được phép (đúng thiết kế, `docs/hardware` là tài liệu).
- Cơ chế PASS (`parseReviewEnvelope`, `validateProposalProvenance`, `:48-73`): mỗi cổng `PASS` cần `review_ref` khớp `electronics-learning-demo/docs/hardware/reviews/<slug>.md`; front matter JSON phải có `type:REVIEW_RESULT`, `verdict:PASS`, `configuration_sha256` bằng đúng hash cấu hình được duyệt và `gate_ids` chứa ID cổng. Hash byte proposal phải bằng cả `configuration_sha256` và `approved_sha256`. `readProposal`/`readFile` chỉ qua tùy chọn mã, không có cờ dòng lệnh.
- Queue: so `MM-HW-P0-07/before-tasks.json` (41) với `tasks.json` (47): thêm đúng 6 mục (`MM-HW-GATE-PREFLIGHT-002`, `MM-HW-P0-07`, 4 gói `…-OFF/ACTUATOR/H3/MCU-001`); `MM-HW-MOBOT-REMOTE-KICAD-001` đổi `waiting`, `depends_on` (nay gồm PREFLIGHT-002, P0-07 và 4 gói) và `hardware_config_id` → r10; `hardware_configurations` thêm `MOBOT-V2-CONFIG-r10-HANDSET` ở `proposed`, hash `95abdd27…70a4`; `updated_on` đổi. Không thấy task cũ nào khác đổi.

## Không kiểm
- Không viết hay kiểm file envelope PASS thật (chưa có artifact nào; đúng như request).
- `DISPOSITION-C03-C04-C05-C07.md` (8,2 K), `INDEPENDENT-REVIEW.md`, `lead-checks.json`, `test-output.txt`: không đọc.
- Hành vi trên Windows với tên rút gọn 8.3 chỉ kiểm bằng một repro (F2); các kiểu alias khác của hệ tệp chưa kiểm.
- Tôi không viết test mới trong repo (chỉ đọc quyền); các script thử nằm ở scratchpad ngoài repo.

## Findings

**F1 · Medium · Bằng chứng PASS do chính Codex có thể tạo ra và byte file review không được ghim.**
`validate.mjs:59-73`. Điều kiện chấp nhận một cổng PASS chỉ là: file nằm dưới `electronics-learning-demo/docs/hardware/reviews/`, front matter JSON ghi đúng hash cấu hình và có ID cổng, `verdict: PASS`. Thư mục này nằm trong `docs/hardware` (phạm vi Codex ghi); Claude chỉ ghi được `docs/claude-support/**` và `docs/hardware/claude-support/**`, nên REVIEW_RESULT thật của tôi không thể nằm đúng đường dẫn whitelist, và một envelope do Codex tự viết (hoặc chép lại) đáp ứng mọi điều kiện validator. Thêm nữa, `review_ref` nằm trong proposal nhưng **hash của file review không nằm trong proposal**, nên hash được duyệt không bao phủ nội dung review: file review có thể thay sau khi duyệt mà vẫn qua (miễn còn đúng hash cấu hình và ID).
Impact: tiêu chí "review độc lập" của mọi cổng trở thành quy ước quy trình, không phải điều máy kiểm; PASS có thể được tự gắn. Chấp nhận được trước B1 nếu founder biết điều đó, nhưng đây là điểm yếu duy nhất còn lại của chuỗi C03 F2.
Fix tối thiểu: (a) thêm `review_sha256` vào mỗi cổng PASS và so với hash byte file review, để hash cấu hình bao phủ review; (b) bắt buộc envelope có `reviewer` và `relay_id` (dạng `R-<ngày>-C<số>`), và cho phép `review_ref` trỏ vào `electronics-learning-demo/docs/hardware/claude-support/reviews/<slug>.md` (nơi Claude được ghi), không chỉ `docs/hardware/reviews/`.

**F2 · Low · Tên rút gọn Windows 8.3 qua được bộ chặn đường dẫn phần cứng.**
`validate.mjs:11-16,150`. `leasePath` từ chối chấm hoặc khoảng trắng cuối đoạn nhưng không từ chối `~`. Repro: task `kind:'design'`, `in_progress`, `allowed_paths:['hardwa~1/x']` → không bị chặn (`hasHardwareOutput` sai). Chỉ có hại trên máy bật tên 8.3 và nếu đường dẫn đó thực sự trỏ tới thư mục `hardware`. Fix: từ chối đoạn có `~\d`.

**F3 · Low · `validateHardwareLeaseGates` gọi trực tiếp chỉ kiểm `review_ref` là chuỗi.**
`validate.mjs:91`. Việc kiểm envelope nằm ở `readHardwareProposal`, không ở hàm này; đường dispatch đi qua loader nên an toàn, nhưng hàm được export và có test trực tiếp. Ai gọi nó với proposal tự dựng sẽ thấy PASS với `review_ref` bất kỳ. Fix: ghi chú trong comment hàm "chỉ dùng sau readHardwareProposal", hoặc đổi tên.

**O1 · Quan sát · `approved_by: 'user'` vẫn là chuỗi do người ghi `tasks.json` điền.**
`validate.mjs:127`. Không có bằng chứng nào ghim bản duyệt của founder (không `approval_ref` hay hash). Tồn tại từ trước, không phải hồi quy; khi founder "duyệt hash một lần" nên có một file biên bản có hash được ghi vào mục cấu hình.

**O2 · Quan sát · `blocking_unknowns` của r10 chứa các cổng OPEN.**
`tasks.json` mục r10: bốn chuỗi "…OPEN before schematic lease" nằm trong `blocking_unknowns`. Quy tắc dòng 129 đòi mảng rỗng để lease. Khi cổng PASS thật, proposal đổi và hash đổi nên phải duyệt lại; nhất quán với "duyệt sau cùng một lần" nhưng cần làm đúng thứ tự: đóng cổng, tạo hash cuối, mới duyệt.

**O3 · Quan sát · Chỉ nhận id r8/r10 trong `trustedHandsetProposalIds`.**
`validate.mjs:24`. r8 không có `stage` nên luôn fail-closed; chỉ r10 dùng được. Cấu hình robot chưa có baseline tin cậy: lease robot sẽ fail-closed tới khi thêm (hợp lý).

## Câu hỏi
1. Founder/Codex muốn envelope PASS nằm ở `docs/hardware/reviews/` (Codex ghi) hay ở nơi Claude ghi được (F1)?
2. Bản duyệt hash của founder sẽ được lưu ở đâu và ghim bằng gì (O1)?

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C08
reply_to: R-20261109-PREFLIGHT-002
type: REVIEW_RESULT
verdict: NHẬN validator preflight-002 (validate.mjs a0da4cdf…b28ed, validate.test.mjs dfe4a696…7d08). C03 F1-F4 và O1 đã sửa, tôi tái hiện từng ca; test 51/51, validate exit 0 (47 tasks); dispatch KiCad thật vẫn bị từ chối. Không duyệt hash, không đóng cổng, không lease
findings: F1 Medium (bằng chứng PASS tự tạo được và byte review không ghim; validate.mjs:59-73); F2 Low (tên 8.3 'hardwa~1' qua bộ chặn hardware output, :11-16,150); F3 Low (validateHardwareLeaseGates chỉ kiểm review_ref là chuỗi, :91); O1 (approved_by 'user' không có bằng chứng ghim); O2 (blocking_unknowns r10 chứa 4 cổng OPEN, hash đổi khi đóng cổng); O3 (allowlist id r8/r10)
checks_run: sha256 2 file + before-validate; validate.mjs exit 0; node --test 51/51; dispatch KiCad thật dispatch_eligible false; đọc toàn validate.mjs; script repro stage/required IDs/trùng ID/status/review_ref/hasOwn/kind=design allowed_paths; diff tasks.json trước/sau (6 mục mới, 1 mục KiCad đổi, r10 đăng ký proposed)
checks_not_run: file envelope PASS thật (chưa có); DISPOSITION, INDEPENDENT-REVIEW, lead-checks, test-output; alias hệ tệp khác ngoài 8.3
done_when: Codex ghi DISPOSITION F1-F3; F1 xử lý trước khi dùng PASS để cấp lease B1 (review_sha256, reviewer/relay_id, đường dẫn nơi Claude ghi được)
=== END RELAY ===
```
