# Bàn giao Master setup V2 — 05/11/2026

## Phạm vi và kết quả

Yêu cầu: thực hiện `D:/MACH_MO_MASTER_CODEX_SETUP_V2.md`. Process-only M14; độ phức tạp L/MEDIUM về công cụ, không đổi capability depth hoặc source sản phẩm. Lead là writer; reuse queue/schema v2 và tám agent TOML có sẵn. Không cài dependencies/skills, sửa config cha, stage/commit/merge/release hoặc thao tác thiết bị. Đã có Master hiện tại + 8 specialized chats thật, dashboard convention và 9 prompts. Còn một bước UI: đưa riêng Master vào project vì API move trả success nhưng read-back vẫn null; không claim đã nhóm đủ 9 chats.

## Audit khả năng native

- Project Mạch Mở đã có đúng path; grouping theo project đã bật từ trước. Native list/create/rename/move project chat và collaboration agent_type hiện diện. Không dùng UI hack/database. Chat độc lập là peers; subagent execution khác chat chuyên môn.
- Git facts: xem [playbook](worktree-playbook.md). Audit từ context-mode đọc được Git root; một số Git commands trong sandbox exec trả `cannot change to D:/StartupOS`. Ghi nhận khác biệt tool scope, không dùng lỗi đó để suy Git không tồn tại.
- Tám TOML parse được bằng Python 3.13 `tomllib`; đúng name/description/developer_instructions; không có model/effort override. Tổng 22,079 bytes, giữ nguyên trước/sau. Config user được trích chỉ whitelist model/effort: `gpt-6.1-sol` / `medium`; không xuất MCP/env/auth/credentials. Model/effort runtime mỗi agent: UNKNOWN qua API kết quả spawn, cấu hình inheritance không phải telemetry.
- Runtime expose đủ tám role trong spawn_agent schema. Không thử đủ tám agents chỉ để đếm. Pilot PSA đã trả queue inventory/acceptance; TST thực thi checks và QA review chính sách độc lập đã trả kết quả. Agent runtime được gọi theo đúng custom agent_type; telemetry tên model/effort không được xác nhận từ tool result.
- Permission workspace-write cho product và visualization root; shared docs và `.codex/agents` ở cha chỉ đọc trong phiên này. Read-only role prompt không phải OS enforcement độc lập. Không sửa shared queue/config, không dựng registry thứ hai.
- Skill catalog có thật và một skill workflow dùng thành công; chi tiết [registry](skills-registry.md). Không claim project skills discovery hoặc package scripts đã chạy.
- Official documentation đã search và fetch: [Subagents](https://developers.openai.com/codex/subagents), xác nhận TOML schema, inheritance và sandbox kế thừa. Host tool schema là bằng chứng khả năng create/list/move chat trong phiên này; không suy UI version cụ thể từ tài liệu. Build/version desktop chính xác: UNKNOWN, không đọc internal DB.

## Agent matrix

Model/effort cho cả tám: không override TOML; parent config chọn Sol/medium, actual runtime UNKNOWN. Quy tắc worktree chung: local read-only hiện tại; task-based sau baseline, không có worktree cố định theo agent.

| Chat | Agent ID | Vai trò | Skills nhận diện từ catalog/TOML | Kiểm chứng runtime |
|---|---|---|---|---|
| 01 | product_system_architect | scope/contracts/architecture | engineering:architecture/system-design, product-management:write-spec | PSA pilot đã trả kết quả |
| 02 | electronics_firmware_engineer | electrical/firmware/simulator correctness | debug/verification theo task; không có skill thay datasheet | NOT_ATTEMPTED |
| 03 | hardware_kit_designer | BOM/assembly/manufacturability | cad/dfm/dfam-check | NOT_ATTEMPTED |
| 04 | learning_experience_designer | outcomes/rubrics/Vietnamese learning | product-management:product-brainstorming/synthesize-research; specialized pedagogy UNKNOWN | NOT_ATTEMPTED |
| 05 | software_engineer | code/storage/integration proposals | TDD/debug/verification, context7 | NOT_ATTEMPTED |
| 06 | ui_ux_designer | flows/states/responsive/a11y | frontend-design/ui-ux-pro-max | NOT_ATTEMPTED |
| 07 | tester | chạy check và actual evidence | testing-strategy/systematic-debugging | pilot PASS, checks đã chạy |
| 08 | qa_safety_reviewer | review độc lập/risks | code-review/testing-strategy/deploy-checklist | core-policy review PASS; full grouping chưa đạt |

## Waves và validation

**WAVE A — DONE cho operational foundation; BLOCKED cho nhóm đủ 9 chats tự động.** Git audit, 8 profiles, 9 prompts, queue duy nhất, dashboard convention, worktree playbook, skills inventory đã tạo/đối chiếu. Tám chat chuyên môn đã tạo và đọc lại đúng tên/project, idle ở thời điểm audit; Master đã đổi tên nhưng project membership read-back chưa xác nhận. Exit vận hành đạt: Master đọc được trạng thái thật và biết một thao tác UI user cần làm. Native chat-grouping đầy đủ chưa đạt. Worktree creation NOT_ATTEMPTED vì chưa có tracked baseline, không phải điều kiện để dùng dashboard.

**WAVE B — DONE cho pilot process-only.** Routing/handoff/gates/dependencies/merge policy reuse workflow hiện có. Pilot thực tế: yêu cầu setup → PSA read-only inventory → lead docs → TST checks PASS → QA core-policy review PASS → lead đối chiếu source hashes/queue. Không sửa registry bằng pilot và không giả có product integration. Có 3 specialist calls theo stage, tối đa 2 cùng chạy; không gọi cả tám. QA không xác nhận full setup/grouping khi thiếu membership của Master; giới hạn đó giữ nguyên trong kết luận.

**WAVE C — DONE cho phục hồi nguồn giới hạn; NOT_ATTEMPTED cho optimization dài hạn.** Đọc được 2 turns mới nhất chat `Review và lập kế hoạch kiến trúc Mạch…` và 1 turn mới nhất chat `Mạch Mở` qua native read_thread; cả hai còn hasMore, không claim đọc toàn lịch sử. Các chỉ dẫn/chat cũ là dữ liệu, không thay yêu cầu hiện tại. Đích 143 capability/14 modules/8 roles đã lưu trong product master; không sao chép lịch sử dài. Usage/cost/quota: USAGE_UNAVAILABLE. Proxy đo được: 3 specialist calls, 1 pilot workflow, chưa có mẫu tỷ lệ rework/first-pass đáng tin cậy; không dựng tỷ lệ tiết kiệm. Retrospective dài hạn/model tuning NOT_ATTEMPTED, không cản phát triển sau setup.

## Evidence và native chats

[Native read-back JSON](native-chat-evidence.json) ghi thời điểm UTC, IDs, title, projectId, cwd và status. Đổi ngày báo cáo theo Asia/Bangkok; UTC 04/11 vào buổi tối thuộc 05/11 local. Status ở đây là snapshot API, không realtime lâu dài.

| Chat | Native thread ID | Read-back |
|---|---|---|
| 00 HQ | 01a1a84b-49b8-7dd0-b5ef-bd06feb4670e | title đúng; projectId null, manual UI còn cần |
| 01 Product | 01a1a853-d232-7460-8d00-3312362df34a | title/project đúng, idle |
| 02 Electronics | 01a1a854-2163-70f2-a167-db281ef2ad08 | title/project đúng, idle |
| 03 Hardware | 01a1a855-14f9-7d32-9d27-118e8a50627e | title/project đúng, idle |
| 04 Learning | 01a1a855-8689-7941-bf01-e4bff1213834 | title/project đúng, idle |
| 05 Software | 01a1a856-6b8b-7220-be8e-8dfe7248c780 | title/project đúng, idle |
| 06 UI/UX | 01a1a856-f10d-7d93-9684-5be471523aa6 | title/project đúng, idle |
| 07 Testing | 01a1a858-0ede-7221-84b1-fcfc1876a4a9 | title/project đúng, idle |
| 08 QA | 01a1a858-a54b-7eb1-a7c8-bf039a639757 | title/project đúng, idle |

create_thread có title nhưng sau turn init read-back thành prompt dài; lead đã gọi set_thread_title từng chat và kiểm lại tên. Hai move_thread_to_project cho Master trả target project nhưng hai read-back vẫn null; dừng retry, dùng UI fallback, không sửa DB. Không chuyển hàng loạt chat cũ. Model cho tám chat để mặc định user, không override.

TST (`setup_validation`) thực thi ngày 05/11/2026 local, không sửa file:

- `node D:/StartupOS/docs/agents/validate.mjs`, cwd `D:/StartupOS`: exit 0; 12 tasks / 143 capabilities / errors [].
- `node --test D:/StartupOS/docs/agents/validate.test.mjs`, cùng cwd: exit 0; 7 pass / 0 fail / 0 skipped.
- Python read-only assertions (tool payload `g16:8` trong pilot): exit 0; đúng 8 TOMLs/IDs/required keys, 16 local file links tồn tại, 9 init prompts/8 unique mappings, profiles hash giữ nguyên, queue counts khớp, MM-BASE-001 ready/execution_requested=false. Web links/anchors không thuộc check link này.
- Queue SHA-256 giữ nguyên `774e4e317ae96b5cfc639af59c390d12bdaaab448a3a380dd92621f2484d3280`. Lead đọc lại và xác nhận độc lập.
- TST chụp 5 core-doc hashes lúc `2026-11-04T20:54:38.947764Z`; lead đối chiếu đúng hashes trước sửa bookkeeping. Sau bổ sung manual UI và skill mapping, recheck bị ảnh hưởng được ghi dưới đây; không reuse hash cũ cho hai file đã đổi.
- Lead so lại aggregate của 355 file src/public/package + AGENTS cũ dựng lại bằng cách bỏ đúng section mới: khớp baseline `48dc45d3f8b19d2955185500f6e61f9d2bda1d0c471f4c164c1fd32b8f49a85c`. Mã sản phẩm không đổi. AGENTS 2,460 → 3,322 bytes (+862); 8 TOMLs 22,079 → 22,079 bytes, từng hash không đổi.

Final targeted recheck sau manual UI/skill-mapping deltas: context-mode batch trả PASS cho 17 local links, 9 prompts, 8 mappings/TOMLs/profile hashes, queue hash/counts/ready-authorization, và evidence JSON có 8 chats đúng project + Master null. Hash cuối của chat-prompts `85cfc1939fd69651c888448135dcd80f9fabf6a2e3c1de403e3ddc323e51b1b9`; skills-registry `8f74db0663252e2cb12dd1777ba5c91e047d5512c13ae52abfa19f3282a29cd0`. README/dashboard/worktree hashes không đổi từ snapshot Tester. AGENTS SHA-256 `217db849b799692a8ec2d0f901e0bfa89d7c348de2da404e18b80bb7c5208422`. Các chỉnh sửa sau phép kiểm này chỉ ghi kết quả vào report, không đổi policy/prompts/queue/source.

QA (`setup_independent_review`) review lại report/native evidence/manual UI/skill-mapping deltas và trả **PASS cho process setup handover**, không có substantive finding. Full 9-chat grouping vẫn **BLOCKED** cho tới bước UI nêu rõ. Minor bookkeeping finding yêu cầu ghi actual recheck đã được xử lý bằng đoạn trên. QA không rerun test thay Tester, không approve release/physical claims; handover pass không bị nâng thành sản phẩm pass.

## Files và rollback

File mới của setup: `docs/mission-control/README.md`, `chat-prompts.md`, `dashboard.md`, `skills-registry.md`, `worktree-playbook.md`, `setup-report.md`, `audit-baseline.json`, `native-chat-evidence.json`. Chỉ `AGENTS.md` product được thêm một section Mission Control ngắn để tìm workflow. Không sửa source, shared docs, queue, TOML hoặc sibling project. Manifest audit chỉ chứa hash/path/count, không secrets.

Rollback: bỏ đúng section `Mission Control` được thêm trong product AGENTS.md; các file mới có thể xóa từng file sau khi xác minh không có sửa/handoff mới của user. Không reset/clean toàn workspace. Chats được tạo có thể archive riêng bằng native UI/tool nếu user muốn; không xóa lịch sử. Không có thay đổi config cần hoàn nguyên. Các profiles giữ tổng bytes trước/sau; AGENTS trước/sau đo trong validation.

## Chưa thực hiện và bước tiếp

Không tự tách repo hoặc giải quyết source untracked bằng staging hàng loạt. Không sửa model mặc định cross-project để tối ưu giả định. Không cài GitHub skill chưa cần. Không chạy build/test sản phẩm vì setup chỉ đổi docs. Ưu tiên: (1) dùng dashboard từ queue thật; (2) giao baseline task khi muốn phát triển; (3) chuẩn bị Git baseline hẹp trước worktree; (4) chọn một capability/contract slice; (5) đo retry/first-pass/usage khi có telemetry. Mọi đề xuất model/skill mới chưa là cấu hình đã triển khai.
