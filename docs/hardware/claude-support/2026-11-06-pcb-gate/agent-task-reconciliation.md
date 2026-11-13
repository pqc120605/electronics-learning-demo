# Đối chiếu hệ agent và doc · MoBot V2 (06/11/2026 chiều)

Chỉ đọc. Số dòng `TJ:` là `D:/StartupOS/docs/agents/tasks.json` (mtime 06/11 12:24, `updated_on` 2026-11-06). `VM:` là `validate.mjs`. Quy ước theo yêu cầu: `tasks.json` và `runs/` là trạng thái quy trình; config r7 và founder-decision r7 là trạng thái thiết kế.

## Bảng task

| Task | Status tasks.json | Thực tế doc/run | Gate thiếu | Lệch | Bằng chứng |
|---|---|---|---|---|---|
| MM-HW-MOBOT-IF-001 | `waiting` (TJ:2298), execution_requested true; hardware gate `unknown` | Mẫu Type-C CH340 đã chọn; bản nháp kiến trúc có `pass_conditional_note` (TJ:2381-2395). Run dir chỉ có `decision-handset-b01-architecture-v1.md` (user "duyệt", hash 81A3DDDD…), không có review.md hay verification.md | 6 mục readiness (TJ:2345-2355): danh tính mẫu, hình học đo, Q_ISO và 2 cổng VBUS, dòng USB, hash cấu hình, blocker pack/bench | (1) Decision 12:57 duyệt kiến trúc v1 (carrier không cấp VIN, cáp RUN OUT) nhưng queue không nhắc, trong khi nháp CP vẫn mô tả carrier→Q_ISO→VIN. (2) `review` ở TJ:2276-2282 là `changes_requested` cũ, đã ghi "superseded" nhưng vẫn nằm trong trường review | TJ:2276-2295, 2345-2395; run decision:5-14; AV1:7-9; CP:31 |
| MM-HW-MOBOT-REMOTE-KICAD-001 | `scoped` (TJ:2436); review null; snapshot `pending` (TJ:2429); required_gates `[]` (TJ:2433); gates.hardware `unknown` | Chưa có file KiCad, chưa có lease. `dispatch-task` exit 1 | IF-001 xong, kích thước và pinout mẫu, hash cấu hình mới được duyệt, CH340 và đường nguồn/data, blocker kỹ thuật (TJ:2475-2487) | `required_gates` rỗng: validator không buộc hardware gate pass khi `done`, dù policy cần hardware approval | TJ:2400-2504; dispatch output |
| MM-HW-MOBOT-ROBOT-KICAD-001 | `scoped` (TJ:2541), depends_on IF-001 và REMOTE (TJ:2543) | Chưa có file KiCad | Như REMOTE, cộng schematic tay cầm và R1–R6 gồm BT-R1a (TJ:2582-2596) | Cùng `required_gates` rỗng (TJ:2538). Nền r6/r7 của robot giả định Micro-USB và interposer, chưa có kiến trúc robot cho mẫu Type-C | TJ:2505-2613; R6:20-26 |
| MM-BOM-001 | `waiting`, resume_state `ready` (TJ:570) | Doc BOM r2 và BOM của Claude tồn tại nhưng chưa có BOM variant | Hash r7, hồ sơ B15/B04, review H4/R6 (TJ:626-634) | `waiting.reason` ghi "r7 chưa duyệt hash" nhưng mẫu board đã đổi, nên việc "duyệt r7" không còn đủ. Dòng B01 có 4 mã khác nhau | TJ:566-687; BOM2:9; AV1:7; EV:30 |
| MM-BOM-002 | `backlog` (TJ:1025) | Chưa làm | Hợp đồng variant BOM từ BOM-001 | Không lệch | TJ:1024-1122 |
| MM-HW-001 | `waiting`, resume_state `scoped` (TJ:1571) | Intake mẫu vật lý chưa chạy; mẫu Type-C do user gửi qua Box03 chưa được ghi vào task này | Hash r7, hồ sơ pack, IF-001 đáp ứng review | `waiting.reason` còn dựa vào r6/r7, không nhắc mẫu mới | TJ:1567-1687 |
| MM-PARALLEL-SETUP-001 | `in_review` (TJ:2015), review null | `runs/.../review.md`: QA PASS ngày 05/11, 24/24 test, `validate.mjs` exit 0. Hardware "remains unapproved" | Lead chuyển trạng thái | Review PASS đã có nhưng queue vẫn `in_review` và `review: null`. Run ghi 15 task, hiện là 20 | run review.md:5-11; TJ:2011-2131 |
| MM-DEC-001 | `backlog` (TJ:333) | Không có việc phần cứng | Không | Không lệch | TJ:332-423 |

## Kết quả validate (chạy 06/11, chỉ đọc, `git status` không đổi)

- `node docs/agents/validate.mjs` từ `D:\StartupOS`: **exit 0**, `tasks: 20`, `capabilities: 143`, `errors: []`. Tôi đã grep `validate.mjs` không có lệnh ghi file (writeFile, appendFile, mkdir, unlink, rename) trước khi chạy.
- `--dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` và `--dispatch-task MM-HW-MOBOT-ROBOT-KICAD-001`: **exit 1**, `dispatch_eligible: false`, lỗi `dispatch needs active task authorization` và `dispatch builder mode missing`. Đây là kết quả mong đợi khi chưa có lease. Validator thoát sớm nên chưa liệt kê lỗi cấu hình (VM:37-42).
- Số 20 task so với 15 (run PARALLEL) và 12 (validation-final-2026-11-05.md:7): chỉ là số lịch sử, không mâu thuẫn.

## Điều kiện lease theo validator (VM:20-44, 107-109, 142-151)

1. Task `in_progress` có authorization; `execution_mode=builder`; `write_lease` có owner trùng writer, lane `hardware`, `status: active`, `paths` nằm trong `allowed_paths` và trong root của role (`hardware`, `docs/hardware`).
2. `snapshot.kind=file-hashes`, `base_snapshot` trùng `snapshot.reference`.
3. `hardware_configurations[hardware_config_id]`: `status=approved`, `approved_by=user`, `configuration_sha256 = approved_sha256`, `blocking_unknowns` **rỗng**.
4. `reference` phải khớp `electronics-learning-demo/docs/mission-control/hardware-config-*.json`, file tồn tại, hash khớp, JSON có `blocking_unknowns` rỗng.
5. Không chồng path với lease khác, tối đa 2 writer.

Hệ quả: r7 (`proposed`, trỏ tệp `.md`, 5 nhóm blocking, TJ:2619-2632) không thể làm cơ sở lease, và theo TJ:2330-2331 cũng không được dùng cho board mới.

## Chỗ lệch tổng hợp

1. **Queue cũ hơn doc.** `tasks.json` 12:24; kiến trúc B01 v1 12:57 (user duyệt); component selection WRL-20168 + Jauch 14:43 (user duyệt); final-gates 14:57; PS3-AA 15:19. Queue chỉ ghi mẫu Type-C CH340.
2. **Bốn hướng tay cầm trong một ngày:** mẫu Type-C (AV1, CP), WRL-20168 + Jauch (CS, WR, GR), 3×AA (AA), cộng LK37478 của r6. Không doc nào ghi rõ doc nào thay doc nào.
3. **Biên bản duyệt r7 do Claude lưu** (`claude-support/2026-11-06-pcb-status/final/r7-approval-record.md:3-7`) lệch với `approved_by: null` (TJ:2623). Thư mục `claude-support` bị cấm với REMOTE và ROBOT (forbidden_paths), và policy ghi `claude_communication_allowed: false`, nên Codex không dùng biên bản đó. Dù duyệt hay không, r7 không áp cho board mới.
4. **`review` của IF-001** còn mang `changes_requested` cũ (TJ:2276-2282) cùng với `conditional_advisory_review` mới. `review.verdict` hiện hành không phản ánh trạng thái thật.
5. **`required_gates` rỗng** cho cả hai task KiCad.
6. **Policy và vai trò:** `policy.claude_communication_allowed: false` (TJ:7-20) và các toml role ghi "user has opted out of Claude". Lượt review này do user yêu cầu trực tiếp; kết quả chỉ có hiệu lực khi user chuyển cho HQ.
