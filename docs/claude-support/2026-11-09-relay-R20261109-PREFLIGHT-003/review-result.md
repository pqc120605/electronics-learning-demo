# REVIEW_RESULT · `MM-HW-GATE-PREFLIGHT-003` ghim review ngoài proposal, reviewer/relay_id, tên 8.3, r11 · 09/11/2026 · Leader Claude

Đối tượng (request R-20261109-PREFLIGHT-003; tôi tính lại bằng `sha256sum`, khớp request):
- `D:/StartupOS/docs/agents/validate.mjs` (269 dòng) SHA256 `c03af0c170eb1eb894852921b6899331a8434e4c1b833ff089d479e4fe064bd7`
- `D:/StartupOS/docs/agents/validate.test.mjs` (84 dòng) SHA256 `dd380346fe4140870d186aadc7d6aae1481240f921eeead5d345d9ef2845f2c6`
- Baseline đúng bản tôi đã review ở C08: `runs/MM-HW-GATE-PREFLIGHT-002/validate.mjs` (`a0da4cdf…b28ed`); `proposed-validate.mjs` của run 003 giống canonical hiện tại.

## Kết luận
**NHẬN.** Bảy thay đổi (diff từng dòng) đúng với mô tả 003a-f và đủ để xử lý C08 F1-F3. Không có finding High hay Medium. Có 1 Low, 3 quan sát. Review này không duyệt hash, không đóng cổng, không mở lease; validator xanh không phải hardware readiness.

## Đã kiểm (kết quả)
- Hash 2 file khớp request. `node D:/StartupOS/docs/agents/validate.mjs`: exit 0, 55 tasks, 143 capabilities, `warnings: []`, `errors: []`. `node --test D:/StartupOS/docs/agents/validate.test.mjs` chạy lại: **61/61** pass, 0 fail (trước 51; 10 test mới, 51 test cũ giữ nguyên tên).
- `node validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001`: `dispatch_eligible: false`; lỗi "dispatch needs active task authorization" và "dispatch builder mode missing". Không có lease nào được cấp.
- **Diff `a0da4cdf` → `c03af0c1`** (`diff` trên bản đã bỏ `\r`): đúng 7 hunk và không hơn:
  1. `:14` `leasePath` thêm `/~\d/.test(s)` → tên Windows 8.3 bị từ chối (C08 F2).
  2. `:24` thêm id `MOBOT-V2-CONFIG-r11-HANDSET` vào danh sách tin cậy (r8, r10, r11). Cấu hình robot vẫn fail-closed.
  3. `:56` envelope bắt buộc `reviewer` (chuỗi không rỗng, đã trim) và `relay_id` khớp `^R-\d{8}-C\d+$` (C08 F1b). Ví dụ `R-20261109-C08` đạt.
  4. `:66-69` `review_ref` được phép ở hai thư mục: `electronics-learning-demo/docs/hardware/reviews/` và `…/hardware/claude-support/reviews/` (C08 F1c).
  5. Thêm bản ghi `gate_reviews` ở registry `tasks.json` (ngoài proposal): `review_ref` phải bằng `review_ref` trong proposal, `review_sha256` là 64 hex.
  6. `:73-74` hash byte thô của file review phải bằng `review_sha256` ở registry; sau đó mới parse envelope.
  7. `:79` chú thích "Call only after readHardwareProposal has validated…" cho `validateHardwareLeaseGates` (C08 F3).
- Tái hiện bằng script ở scratchpad (không sửa repo): `allowed_paths:['hardwa~1/x']` của task `kind:'design'` giờ **BLOCKED** (trước: allowed). Các ca C03 vẫn chặn đúng: xóa cổng bắt buộc, đổi stage, lease milestone `toString/constructor/__proto__/bom`, PASS không `review_ref`.
- Test mới (đọc tên): "tampered review file fails its out-of-proposal review_sha256"; "review from Claude-support path is accepted only with registered review SHA"; "review envelope requires reviewer", "reviewer identity must be trimmed and nonempty", "requires relay_id", "relay_id requires R-YYYYMMDD-Cnumber form"; "PASS review_ref must match the out-of-proposal registry record"; "PASS review_sha256 registry field is required"; "reviewed path outside both approved review directories is rejected"; "r11 handset proposal is trusted and robot identity remains fail-closed". Có test dương đầu-cuối qua loader mặc định với file review thật.
- Thiết kế ngoài proposal: `DESIGN-NOTES.md` giải thích đúng vòng phụ thuộc mật mã: nếu `review_sha256` nằm trong proposal thì hash proposal bao hash review, hash review bao envelope, envelope lại bao hash proposal (không có điểm bất động tính được). Đặt hash ở `tasks.json` (không nằm trong `configuration_sha256`) phá vòng này. **Đề xuất C08 F1(a) của tôi (đặt `review_sha256` trong proposal) là sai về mặt này; thiết kế ngoài proposal là cách đúng.**

## Không kiểm
- Chưa có file envelope PASS thật (đúng như request); tôi không viết file nào vào `docs/hardware/claude-support/reviews/`.
- `INDEPENDENT-REVIEW.md`, `lead-checks.json`, `test-output.txt`, `checks.json` của run 003: không đọc. `b1-dispatch-refused.txt` đã xem (kết quả khớp lần chạy của tôi).
- Mục `gate_reviews` trong `tasks.json` hiện chưa có (chưa có PASS); tôi chỉ kiểm mã, không kiểm bản ghi thực.
- Alias hệ tệp khác ngoài 8.3.

## Findings

**F1 · Low · Thư mục `docs/hardware/reviews/` vẫn cho phép envelope do Codex tự viết.**
`validate.mjs:66`. Cho phép `claude-support/reviews/` là đúng, nhưng thư mục cũ vẫn hợp lệ, nên một PASS mà Codex tự tạo (envelope, rồi `gate_reviews` ở `tasks.json`) vẫn qua. Mã không thể chứng minh người viết là Claude hay Box 08; `reviewer` và `relay_id` là chuỗi tự khai, không đối chiếu sổ relay nào.
Impact: tiêu chí "review độc lập" vẫn dựa vào quy trình. Chấp nhận được trước B1 nếu founder biết; thấp hơn Medium vì mọi thay đổi review nay phải kèm sửa `tasks.json` và để lại dấu vết.
Fix tối thiểu: với cổng thiết kế, chỉ nhận `claude-support/reviews/` (đúng quy tắc "Claude chỉ ghi vào docs/hardware/claude-support/**"), hoặc ghi rõ trong biên bản duyệt rằng thư mục `reviews/` là ngoại lệ do founder cho phép.

**O1 · Quan sát · `gate_reviews` không nằm trong hash cấu hình.**
Hash được founder duyệt (`approved_sha256`) chỉ bao phủ proposal, không bao phủ `gate_reviews`. Thay review sau khi duyệt đòi cả file mới lẫn hash mới ở `tasks.json`; không có gì khác ghim nó. Gợi ý: chép khối `gate_reviews` (hoặc hash của nó) vào biên bản duyệt của founder khi duyệt hash.

**O2 · Quan sát · Bước duyệt phải theo đúng thứ tự.**
Theo thông báo của chính request: sau khi cổng có thể PASS, cần một review mới gắn hash cuối của proposal, rồi mới đến duyệt hash của founder; không dùng lại review gắn byte cũ. Khớp với thiết kế (envelope phải mang đúng `configuration_sha256`).

**O3 · Quan sát · Biểu thức `/~\d/` cũng chặn tên hợp lệ chứa `~1`.**
Chấp nhận (fail-closed); lưu ý nếu có file thật tên như `a~1.md` trong phạm vi lease.

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C10
reply_to: R-20261109-PREFLIGHT-003
type: REVIEW_RESULT
verdict: NHẬN validator preflight-003 (validate.mjs c03af0c1…64bd7, validate.test.mjs dd380346…2c6). Diff 7 hunk đúng 003a-f; C08 F1-F3 xử lý; test 61/61 (51 giữ, 10 mới); validate exit 0 (55 tasks); dispatch KiCad thật bị từ chối. Thiết kế gate_reviews ngoài proposal đúng; đề xuất review_sha256 trong proposal của C08 F1(a) là vòng phụ thuộc, tôi rút lại. Không duyệt hash, không đóng cổng, không lease
findings: F1 Low (thư mục docs/hardware/reviews/ vẫn cho Codex tự viết envelope; reviewer/relay_id tự khai; validate.mjs:66); O1 (gate_reviews không nằm trong hash cấu hình); O2 (cần review mới gắn hash cuối trước khi founder duyệt); O3 (/~\d/ chặn cả tên hợp lệ chứa ~1)
checks_run: sha256 2 file + baseline 002; diff baseline→canonical (7 hunk); validate.mjs exit 0; node --test 61/61; dispatch KiCad thật dispatch_eligible false; script repro hardwa~1, xóa cổng, stage, hasOwn, PASS thiếu review_ref; đọc tên 10 test mới và DESIGN-NOTES
checks_not_run: file envelope PASS thật (chưa có); INDEPENDENT-REVIEW, lead-checks, test-output; bản ghi gate_reviews thực trong tasks.json (chưa có); alias hệ tệp khác ngoài 8.3
done_when: Codex ghi DISPOSITION F1/O1-O3; khi cổng có thể PASS thì xin review mới gắn đúng hash cuối; founder duyệt hash kèm khối gate_reviews
=== END RELAY ===
```
