# REVIEW_RESULT · A9 `MM-HW-GATE-PREFLIGHT-001` · 09/11/2026 · Leader Claude

Đối tượng (hai hash đúng request R-20261109-01; tôi tính lại bằng `sha256sum`, cả hai khớp, và khớp `snapshot.json`):
- `D:/StartupOS/docs/agents/validate.mjs` (214 dòng) SHA256 `69540e83846431968bed418ec0953500121fd57cb370d8794ec17fc68947816c`
- `D:/StartupOS/docs/agents/validate.test.mjs` (146 dòng) SHA256 `a4fcc857a968531e938320effe69d5fb7ec745e94a9c68d537cb806fd66ddb1b`
- Proposal đầu vào `hardware-config-mobot-v2-typec-r8-handset.json` SHA256 `c5d342db0db6c3cb419078bd9342c1766b7f537df87f590077aef73f083dc626` (khớp snapshot; vẫn `proposed`, chưa duyệt).

## Kết luận
**NHẬN ở mức "done_when đạt", không có bypass nào của 4 cổng schematic hiện tại.** Có 2 finding Medium (làm cứng trước khi cấp lease B1), 2 Low, 3 quan sát. Review này không duyệt hash, không đóng cổng nào, không mở lease.

## Đã kiểm (kết quả)
- Hash 2 file + proposal khớp.
- `node D:/StartupOS/docs/agents/validate.mjs` chạy lại: exit 0, 39 tasks, 143 capabilities, `warnings: []`, `errors: []`.
- `node --test D:/StartupOS/docs/agents/validate.test.mjs` chạy lại: 32/32 pass. Đếm cấu trúc: 8 test mới (dòng 102, 107, 113, 117, 124, 130, 135, 141), 24 test nền (7+11+6). Bốn ca bắt buộc của prompt A9 đều có: (a) dòng 102, (b) 113, (c) 117, (d) 107 và 124.
- Đọc toàn bộ `validate.mjs`. Đường chặn: `validateLease` (64-99) chỉ chạy cổng khi `t.status==='in_progress'` và `lease.lane==='hardware'`; `validateDispatch` (158-168) bắt buộc `in_progress`+builder rồi gọi lại `validateLease`. `readHardwareProposal` (20-29): regex khóa tham chiếu vào `electronics-learning-demo/docs/mission-control/hardware-config-[a-z0-9-]+.json`, kiểm path không thoát repo, SHA-256 phải bằng cả `configuration_sha256` lẫn `approved_sha256`; file thiếu hoặc JSON hỏng đều rơi vào `catch` (94) thành lỗi "treated as OPEN". Chỉ chuỗi `PASS` chính xác đóng cổng (41): thử `pass`, `PASS `, `Pass`, `true` đều bị coi OPEN.
- Phân loại 7 cổng thật trong proposal (đọc chuỗi `milestone`, đối chiếu regex dòng 32-40): `D17-OFF-DESIGN`, `D17-ACTUATOR-PRODUCT`, `D17-H3-CV-PROTECTION`, `MCU-RESET-VETO-RESOURCES` → mốc schematic (chặn); `D17-B01-TRACEABILITY` → BOM, `D17-OFF-ASSEMBLY` → mode (cảnh báo); `D15B-FAB-LAYOUT` → layout. Đúng mốc.
- Thử trực tiếp bằng script ở scratchpad ngoài repo (gọi `validateHardwareLeaseGates`, không sửa file nào): thiếu/sai kiểu mảng cổng → lỗi; `milestone` lạ như "Trước lease KiCad" → lỗi (fail-closed); cổng layout OPEN không chặn lease schematic nhưng sinh cảnh báo; lease `layout` bị cổng layout OPEN chặn; lease `Schematic` (hoa) hay `undefined` → lỗi.
- Task kind `implementation` writer `codex_lead` không builder: `validateQueue` trả "builder lease missing or unsupported owner", nên hai task KiCad hiện tại (`MM-HW-MOBOT-REMOTE-KICAD-001`, `MM-HW-MOBOT-ROBOT-KICAD-001`, đều kind `implementation`) không chạy được ngoài lease.

## Không kiểm
- 24 test nền "còn nguyên": thư mục `docs/agents/` chưa được git theo dõi và run không lưu bản trước, nên tôi không so được với bản cũ. Báo cáo nói một fixture cũ bị đổi (nay là test dòng 39); 23 test còn lại tôi không chứng minh được là không đổi.
- Không chạy `validate.mjs --dispatch-task <id>` trên task thật (không có task phần cứng `in_progress`).
- Không kiểm thiết kế điện hay nội dung gate, chỉ cơ chế chặn.

## Findings

**F1 · Medium · Phân loại mốc bằng regex trên chuỗi tự do có thể xếp cổng schematic sang mốc muộn.**
`validate.mjs:32-40`. Dòng 38 gộp `mode|operation|operat|packag|certif|chuyển mode|sử dụng` thành mốc 4; `mode` khớp cả "model". Cổng ghi mốc bằng tiếng Việt không có chữ `schematic` hoặc `layout` sẽ rơi vào mốc 4 hoặc 3.
Repro: `validateHardwareLeaseGates({milestone_gates:[{id:'G',milestone:'Trước lease sơ đồ nguyên lý (chốt model pin)',status:'OPEN'}],external_design_gates:[{id:'M',milestone:'Before applicable schematic lease',status:'PASS'}]},'schematic')` → `errors: []`, 1 cảnh báo. Cổng OPEN trước lease schematic không chặn. Tương tự `'Before BOM freeze, needed for layout'`.
Impact: 7 cổng hiện tại phân loại đúng nên chưa gây hại. Nhưng A10 sẽ sửa hoặc thêm cổng; một chuỗi mốc viết tự do có thể đổi cách xếp mốc mà không ai thấy, vì hash được duyệt không bao phủ ngữ nghĩa của regex.
Fix tối thiểu: thêm trường có kiểu `stage` (`schematic|layout|bom|operation`) vào từng cổng và so khớp chính xác; thiếu hoặc lạ → OPEN (đã có logic này). Giữ regex chỉ để cảnh báo lệch. Sửa JSON thuộc Codex/Sol, nên gộp vào đợt A10 hoặc ghi DISPOSITION.

**F2 · Medium · Preflight tin hoàn toàn vào tập cổng và trạng thái do chính proposal khai; xóa cổng hoặc đổi sang PASS không có bằng chứng vẫn xanh.**
`validate.mjs:46-60`. Chỉ yêu cầu hai mảng tồn tại và tổng số cổng >0.
Repro: `{milestone_gates:[],external_design_gates:[{id:'M',milestone:'Before applicable schematic lease',status:'PASS'}]}`, lease `schematic` → `errors: []`. Cổng `PASS` kèm `pass_criteria:'TBD', evidence:null` cũng được chấp nhận.
Impact: xóa 3 cổng schematic khỏi JSON làm preflight xanh. Hash đổi, nhưng founder chỉ được dặn "duyệt hash này không đóng gate nào" và không có máy nào kiểm câu đó. Đây là rủi ro F1 của R-20261108-C02 ở dạng xóa cổng.
Fix tối thiểu: ghim `required_gate_ids` theo mốc (trong validator hoặc trong registry `hardware_configurations` của `tasks.json`): schematic = bốn ID trên; layout = thêm `D15B-FAB-LAYOUT`; thiếu ID → lỗi. Cổng `PASS` bắt buộc có tham chiếu review (ví dụ `review_ref` trỏ tới REVIEW_RESULT Box 08).

**F3 · Low · Lease milestone dạng tên thuộc tính prototype lọt qua kiểm "milestone lạ".**
`validate.mjs:31,44`. `leaseStageRank` là object thường; `leaseStageRank['toString']` truthy.
Repro: `validateHardwareLeaseGates(<proposal toàn PASS>,'toString')` (cũng `constructor`, `__proto__`) → `errors: []`. Khi có cổng OPEN vẫn bị chặn (so sánh `rank>stage` ra false nên mọi cổng OPEN đều tính là chặn), nên không phải bypass cổng, chỉ là lỗ hổng của guard.
Fix tối thiểu: `Object.hasOwn(leaseStageRank, leaseMilestone)` hoặc dùng `Map`.

**F4 · Low · Một test rỗng nghĩa và các test gắn vào trạng thái sống của proposal.**
`validate.test.mjs:45` ("a builder needs a matching owner, lane and active lease") khẳng định `/lease/i`. Fixture không sửa gì vẫn có lỗi chứa "lease" từ cổng phần cứng ("…before schematic lease…"). Tôi chạy fixture nguyên bản: `/lease/i` khớp = true, và không có lỗi tiền tố `SW:`. Test vẫn xanh dù kiểm tra lease phần mềm bị phá.
Cũng: `validate.test.mjs:8-9,102-110` đọc file proposal thật. Khi A10/Box 08 đóng `D17-OFF-DESIGN` hợp lệ, test 102 sẽ đỏ vì lý do đúng. Không có test dương đầu-cuối qua `validateDispatch` với proposal toàn PASS; không có test riêng cho hash lệch, tham chiếu ngoài thư mục, JSON hỏng hoặc lease milestone lạ ở mức `validateDispatch`.
Fix tối thiểu: cho `validateLease` nhận `options.readProposal` (hoặc truyền proposal) để test bơm fixture; đổi regex test 45 thành `/^SW:.*lease/`; thêm các ca trên.

**O1 · Quan sát · Preflight chỉ chặn đường builder lease.**
`validate.mjs:108`. Task `codex_lead` không builder, kind khác `implementation` (ví dụ `design`), `in_progress`, `execution_requested` → `validateQueue` trả `[]` dù `allowed_paths` trỏ vào `hardware/**` (repro: fixture kind `design` → `[]`; đổi sang `implementation` → "builder lease missing"). Phù hợp chính sách trong `tasks.json` (`write_scope_enforcement: lead preflight … not per-agent isolation`), không phải hồi quy. Gợi ý: cấm task `in_progress` có `allowed_paths` chạm `hardware/**` hoặc KiCad mà không có builder lease.

**O2 · Quan sát · B1 sẽ cần đăng ký cấu hình tay cầm.**
`tasks.json` `hardware_configurations` hiện chỉ có `MOBOT-V2-CONFIG-r7` (tham chiếu `.md`, `proposed`). Preflight đọc `.json` theo tham chiếu nên với r7 sẽ fail-closed. Trước B1 cần một mục registry trỏ đúng JSON tay cầm, sau khi founder duyệt hash (sau A10).

**O3 · Quan sát · Cảnh báo cổng muộn chỉ hiện khi dispatch.**
`validate.mjs:196`: chạy không `--dispatch-task` thì `warnings` luôn `[]` (đúng thiết kế, nhưng "warnings: []" trong REPORT.md không có nghĩa hết cổng OPEN muộn). Ngoài ra, khi có task phần cứng `in_progress` với cổng OPEN, `validateQueue` trả lỗi toàn hàng đợi nên dispatch task phần mềm cũng bị chặn: fail-closed, chấp nhận được.

## Câu hỏi
1. Codex có định đưa `stage` có kiểu vào JSON ở A10 (F1) và `required_gate_ids` (F2), hay giữ regex và nhận rủi ro?
2. Có bản trước của `validate.test.mjs` ở đâu để so 24 test nền không?

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C03
reply_to: R-20261109-01
type: REVIEW_RESULT
verdict: NHẬN done_when A9; hash validate.mjs 69540e83…7816c, validate.test.mjs a4fcc857…b1b, proposal c5d342db…dc626 khớp; không bypass cổng schematic hiện tại; không phải duyệt hash hay mở lease
findings: F1 Medium (phân loại mốc bằng regex chuỗi tự do, validate.mjs:32-40, repro "sơ đồ nguyên lý (chốt model pin)" không bị chặn); F2 Medium (không ghim required_gate_ids; xóa cổng hoặc PASS không bằng chứng vẫn xanh, validate.mjs:46-60); F3 Low (lease milestone 'toString'/'constructor' lọt, :31,44); F4 Low (validate.test.mjs:45 rỗng nghĩa, test gắn proposal thật, thiếu ca dương đầu-cuối); O1 (chỉ chặn đường builder lease); O2 (cần đăng ký cấu hình tay cầm cho B1); O3 (cảnh báo muộn chỉ khi dispatch)
checks_run: sha256 3 file; chạy lại validate.mjs exit 0 và node --test 32/32; đọc toàn validate.mjs; phân loại 7 cổng thật; repro bằng script ngoài repo cho F1/F2/F3/O1; fixture nguyên bản khớp /lease/i (F4)
checks_not_run: so 24 test nền với bản cũ (không có baseline); --dispatch-task trên task thật; nội dung thiết kế của cổng
done_when: Codex ghi DISPOSITION cho F1-F4; F1/F2 xử lý trước khi cấp lease B1 (có thể gộp vào A10); không duyệt hash cho tới khi A10 xong
=== END RELAY ===
```
