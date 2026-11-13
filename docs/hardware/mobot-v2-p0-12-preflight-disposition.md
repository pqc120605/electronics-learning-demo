# P0-12 — đối chiếu preflight C03 → C08 → C10

Phạm vi là phần mềm kiểm queue/dispatch và metadata task. Không phải review hoặc đóng cổng thiết kế phần cứng. Không gọi Claude; dùng các REVIEW_RESULT đã được Founder cung cấp/lưu trong project.

## Chuỗi bằng chứng

| Task / review | Snapshot lịch sử | Kết luận và successor |
|---|---|---|
| PREFLIGHT-001 / C03|validate69540e83…7816c,tests a4fcc857…b1b|Đạt done_when cũ nhưng có Medium: regex stage, không ghim gateIDs/provenance; hardening chuyển sang002|
| PREFLIGHT-002 / C08|validate a0da4cdf…b28ed,tests dfe4a696…7d08|C03 F1–F4/O1 đã xử lý; phát sinh review-byte/provenance/8.3/call-contract, chuyển sang003|
| PREFLIGHT-003 / C10|validate c03af0c1…64bd7,tests dd380346…2c6|Review NHẬN; không High/Medium; C08 F1–F3 đã xử lý, một Low về xác thực danh tính reviewer bằng quy trình|

Hash hiện tại trùng đúng C10:

- `validate.mjs`: `c03af0c170eb1eb894852921b6899331a8434e4c1b833ff089d479e4fe064bd7`.
- `validate.test.mjs`: `dd380346fe4140870d186aadc7d6aae1481240f921eeead5d345d9ef2845f2c6`.

Đã đọc toàn văn ba review; kiểm source hiện tại, scope và internal review của003. Queue cũ giữ001scoped,002waiting và003waiting dù review đã về; không phải ba lần triển khai validator còn chưa chạy.

## DISPOSITION

| Finding | Phân xử theo source/review |
|---|---|
| C03 F1 regex-stage | ACCEPT, đã được successor002/003 thay bằng enum stage chính xác, fail-closed khi thiếu/lạ |
| C03 F2 requiredIDs/provenance | ACCEPT, required IDs ngoài proposal; missing/duplicate/wrongstage bị chặn, PASS cần review envelope |
| C03 F3 prototype milestone | ACCEPT, Object.hasOwn chống prototype keys |
| C03 F4 test fixture/positive path | ACCEPT, fixture và ca dương/default loader đã được C08 kiểm, suite hiện61 ca |
| C03 O1 hardware output theo kind | ACCEPT, đường hardware/KiCad cần lease kể cả task design; docs/hardware là tài liệu |
| C03 O2/O3 | Cấu hình/allowlist mới vẫn phải qua trust baseline riêng; cảnh báo mốc muộn không phải PASS |
| C08 F1 byte/provenance | ACCEPT,003 ghim review_sha256 ởregistry ngoài proposal để tránh vòng hash; kiểm reviewer/relay_id/path/envelope |
| C08 F2 tên8.3 | ACCEPT,003 chặn đoạn~số, fail-closed cả tên thường có dạng đó |
| C08 F3 helper trực tiếp | ACCEPT, source có contract chỉ dùng sau loader; không xem helper độc lập là authorization |
| C10 F1 Low reviewer tự khai | ACCEPT như giới hạn còn lại; không sửa whitelist/authentication ngoài scope. Code ghim byte, không chứng minh danh tính con người. Trước gatePASS, lead phải có kết quả độc lập thực sự trả về hoặc bản Founder chuyển, lưu nguồn/receipt/hash rồi mới mirror envelope. Không được tự tạo verdictPASS. Giữ hiện diện Low trong closure record; phần mềm test xanh không thay quy trình này. |
| C10 O1 | Chép/ghim gate_reviews và nguồn phê duyệt trong packet Founder khi duyệt hash cuối; không tạo phê duyệt trong lượt này |
| C10 O2 | Review gắn đúng hash cuối trước duyệt Founder; thaygate/blocker/reviewbytes cần xét lại phần ảnh hưởng |
| C10 O3 | Chặn~1 có thể overblock tên hợp lệ; chấp nhận fail-closed, không nới để qua preflight |

## Hướng đồng bộ queue

Đề xuất giữ001/002 như các snapshot lịch sử được **superseded bởi003**, kết thúc công việc trùng lặp bằng trạng thái cancelled có lý do, thay vì giả hai bản cũ vẫn là code hiện hành hoặc tự ký gate.003 có thể đóng task phần mềm sau fresh tests và QA kiểm đúng scope; không biến Low quy trình thành finding đã biến mất.

Record003 có deliverable r10 configuration sao chép từ scope khác, trong khi allowed_paths/task card thực là validator và run003. Sửa metadata này thành đường source/tests và run artifacts đã review; lưu record trước thay đổi. Không sửa bytes code để làm queue xanh.

Đồng bộ trạng thái không mở B1: KiCad task vẫn waiting/no lease và đã phụ thuộc003. Các cổng thiết kế, hash approval và stage của chúng giữ nguyên. Validator hiện tin các baseline cũ qua r11; r12/r13 chưa tự trở thành trusted execution target. Khi có cấu hình cuối đủ điều kiện, cần scoped review/hardening cho baseline đó trước dispatch; không tự thêm ID hoặc bỏ trust check trong lượt này.
