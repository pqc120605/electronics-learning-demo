# CP-06 hồi tố · WA-07 codec project (P1-X01)

Ngày 09/11/2026 00:21 · Leader Claude · chỉ đọc. Hồi tố vì codec đã có trong code mà không có `review-request.md` nào (tìm `*review-request*` trong project: không thấy). Project nằm trong repo cha nên không có `git diff`; phạm vi lấy từ bốn file được giao, không có danh sách file kèm hash của Luna/Codex để đối chiếu.

## Kết luận

Không có lỗi mức Cao hoặc Trung bình được xác minh. Không bump version (`PROJECT_BUNDLE_VERSION = 1`, `CURRENT_WORKSPACE_VERSION = 4`, `src/lib/projectBundle.ts:8-9`). Codec đạt phần lớn contract K-ID/K-STORE §1 (`docs/product/2026-11-05-mach-mo-final-contracts.md`). Ba phát hiện mức Thấp và một khoảng trống kiểm thử. Đề nghị: **chấp nhận có điều kiện**; Codex ghi disposition cho F1–F4.

## Lệnh đã chạy (kết quả thật)

| Lệnh | Kết quả |
|---|---|
| `node --test --test-concurrency=1 tests/project-codec.test.mjs` | exit 0, 12/12 pass |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` (toàn bộ) | exit 0, 406/406 pass (baseline 06/11 là 367) |
| Probe tạm bằng `vite.ssrLoadModule` (một tệp tạm ở thư mục project, đã xóa sau khi chạy; không sửa file nào của Codex) | số liệu F1–F3 bên dưới |

**Không chạy:** `npm.cmd run test:e2e` (cần trình duyệt; prompt 07 đòi e2e `:134` xanh, nên chưa có bằng chứng cho điều kiện này), `build:local`, `check:public-release`. Không đọc `docs/agents/tasks.json` ở phiên này.

## Đã xác minh là đúng (đọc code + probe)

- Mục thư viện không đọc được bị giữ nguyên: bundle có trường lạ vào `unreadable` (`savedProjects.ts:40-45`) và vẫn được ghi lại cùng `projects` ở `savedProjects.ts:61`. Probe P6: sau `addSavedProject`, mục `u` còn nguyên.
- Thư viện hỏng được sao lưu trước khi ghi đè (`savedProjects.ts:56-60`); nếu sao lưu lỗi thì không ghi đè. Khóa `machmo-saved-projects-damaged-<ts>` được liệt kê vào dữ liệu phục hồi nhờ bộ lọc `'-damaged-'` ở `workspaceStorage.ts:77`, và `ProjectsPage.tsx:95,208` hiện số mục chưa đọc được kèm nút tải bản sao.
- `rawBackup` giữ đúng chuỗi vào (`projectBundle.ts:97-98`); import không hợp lệ không nạp vào workspace và cho tải bản gốc (`ProjectsPage.tsx:39-47`, `:59`).
- `normalizeProjectBundle` thuần, idempotent, không xóa draft trùng template, báo xung đột thay vì ghi đè (`projectBundle.ts:45-56`); alias board chỉ bốn khóa công bố (`:11`); board lạ ở `simBoard` hay `board` đều bị từ chối (`:112-117`); `projectId` và `layout` được giữ (test dòng 42-43).
- Builder chỉ ghi các trường nằm trong `WORKSPACE_FIELDS` (`CircuitBuilderPage.tsx:674-675`, `:694`, `:749` đối chiếu với `projectBundle.ts:12`), nên xuất rồi nhập lại không bị chặn vì trường lạ ở trạng thái hiện tại.
- Kiểm tra kích thước 5 MiB đo trên chuỗi gọn (`projectBundle.ts:99`) trong khi xuất ra có thụt lề (`ProjectsPage.tsx:119`): probe với bundle sát giới hạn (5 240 860 so với 5 241 158 byte, giới hạn 5 242 880) vẫn decode `valid`. Vì dung lượng gần giới hạn chỉ đến từ draft, độ chênh nhỏ; **không phải phát hiện**.

## Phát hiện

**F1 · Thấp · JSON bất kỳ bị phân loại "unsupported" với thông báo sai** · `src/lib/projectBundle.ts:104-109`. Trường lạ được quét trước khi kiểm `format`. Probe: `decode('{"foo":1}')` trả `status: unsupported`, issue "Project có trường mở rộng chưa được hỗ trợ."; `decode('{}')` trả "Phiên bản bundle không được hỗ trợ." Tác động: người nhập tệp JSON không phải project thấy lời giải thích sai (không có rủi ro dữ liệu, `rawBackup` vẫn giữ). Sửa tối thiểu: nếu `value.format !== PROJECT_BUNDLE_FORMAT` thì trả `invalid` "Tệp không phải project Mạch Mở." trước khi quét trường lạ, kèm một test.

**F2 · Thấp · Quét trường lạ chỉ phủ ba cấp, và danh sách trắng dễ lệch với builder** · `projectBundle.ts:105-107` và `src/types/circuitWorkspace.ts:23`. Probe P2: `workspace.placed[0].vendorX` được nhận `valid` và giữ nguyên (không bị xóa), trong khi contract §1 nói trường lạ phải bị từ chối kèm danh sách. Không mất dữ liệu nên là khoảng cách so với contract, không phải lỗi; Codex cần chọn: ghi rõ phạm vi quét vào contract, hoặc mở rộng. Rủi ro tiềm ẩn kèm theo: kiểu `CircuitWorkspaceDocument` có chữ ký mở `[extension: string]: unknown`, nên nếu builder thêm trường mới mà quên thêm vào `WORKSPACE_FIELDS` thì `backupCurrentWorkspace` gọi `parseProjectBundle(recovery)` (`savedProjects.ts:152`) sẽ ném lỗi, chặn mở mọi project (hiện chưa xảy ra, đã đối chiếu ở trên). Sửa tối thiểu: một test khẳng định các khóa builder ghi nằm trong tập `WORKSPACE_FIELDS`.

**F3 · Thấp · Sao lưu thư viện hỏng không khử trùng lặp** · `src/lib/savedProjects.ts:58`. Mỗi lần ghi thất bại (ví dụ đầy bộ nhớ, đúng tình huống gây lỗi ở `:61`) lại tạo thêm một bản `-damaged-<Date.now()>`. Probe P4/P5: ba lần ghi thất bại tạo 3 bản sao; sau lần ghi thành công vẫn còn cả 3 cộng thêm bản thứ tư, không dọn. Khi thư viện hỏng lớn, mỗi lần thử lại nhân đôi dung lượng và làm bộ nhớ đầy nhanh hơn. `workspaceStorage.ts:52-56` có `backupDamagedValue` khử trùng lặp theo giá trị nhưng dùng tiền tố `-recovery-` (`workspaceStorage.ts:3`), không dùng ở đây. Sửa tối thiểu: trước khi `setItem`, bỏ qua nếu đã có khóa `-damaged-` cùng nội dung.

**F4 · Thấp · Test chưa phủ hết fixture bắt buộc của contract** · `tests/project-codec.test.mjs`. Đã đọc cả 12 test. Chưa có: (a) `branchSession.order` và `branchDrafts` sau `decode` (chỉ thấy trong dữ liệu vào, không có assert trên đầu ra); (b) `projectId` và `layout` qua vòng decode → lưu → xuất, test chỉ kiểm qua `normalizeProjectBundle` (dòng 42-43); (c) lỗi ghi ở section thứ nhất hoặc thứ hai, và nhánh khôi phục thất bại (`savedProjects.ts:194-196`) — test chỉ làm hỏng khóa thứ ba (dòng 101); (d) đường `writeProjects` với thư viện hỏng (`savedProjects.ts:57-60`) — test chỉ kiểm đọc (dòng 122-127); (e) giới hạn dung lượng nhập. Mỗi mục là một test nhỏ, không cần đổi mã sản phẩm.

## Câu hỏi (chưa phải lỗi)

1. Điều kiện `done_when` của prompt 07 gồm e2e `:134`; ai chạy và kết quả thế nào? Tôi chưa có bằng chứng.
2. Codec đổi **cách đọc** dữ liệu lưu: bundle có trường lạ nay bị ẩn khỏi danh sách và đếm vào "chưa đọc được" thay vì nạp. Đúng ý contract và dữ liệu không mất, nhưng founder biết hành vi này chưa? (Người dùng cũ có trường mở rộng sẽ thấy dự án "biến mất" khỏi danh sách, chỉ còn nút tải bản sao.)
3. `luna-p1-review.md` ghi P1-X01 là "CẦN SOL, prompt chưa viết" nhưng code đã có; ai làm và theo task id nào? Ghi lại để `tasks.json` khớp.
