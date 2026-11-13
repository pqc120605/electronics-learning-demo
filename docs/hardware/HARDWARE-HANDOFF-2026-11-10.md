# Mạch Mở — bàn giao Hardware khi Founder tạm dừng

Ngày 10/11/2026, Asia/Bangkok. Chỉ thị: **“Tạm dừng và đóng gói lại tiến độ Hardware hiện tại”.** Hardware đã dừng triển khai; chỉ hoàn tất đóng gói. **B1 vẫn NOT_READY.** Không tự khởi động lại.

## Trạng thái phải giữ

- P0-12 chuyển sang `waiting`, lý do `USER_PAUSED`, `execution_requested=false`. Queue có ghi phạm vi tạm dừng Hardware; phần mềm không liên quan giữ nguyên.
- Cấu hình hiện hành: `MOBOT-V2-CONFIG-r12-HANDSET`, `proposed`, chưa duyệt hash/MPN/BOM.
- SHA256 r12: `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`.
- Chưa tạo r13, gán GPIO, tạo schematic/KiCad/CAD/FE hoặc cấp lease mới.
- Bốn cổng trước schematic vẫn OPEN; giữ đủ 14 verification items và các cổng mốc muộn.
- Không có quyền mua hàng, sản xuất, flash, cấp điện pin/motor hoặc liên hệ vendor từ gói này.

## Quyết định Founder đã chốt

| Mục | Quyết định |
|---|---|
| Charger H3 | BQ25170 family là ứng viên; suffix J/non-J, MPN, strap/setpoint và BOM chưa duyệt. BQ25186 là lịch sử. |
| Bảo vệ | Giữ trần pack 4,200 V và cách ly toàn bộ I/O trong CHARGE/PROGRAM. |
| G-B | 16 vai trò, ưu tiên quan sát khóa thứ hai; không xuất H3 status riêng về MCU. Giữ đủ E1–E4 và bảo vệ độc lập. |
| M-A | Chấp nhận hướng phân tích: đang giữ nút thì phải thả rồi nhấn lại sau OFF; actuator nhỏ không phải thắng lực tay 100 N. |
| Hai envelope lực | Retention 100 N vận hành / 200 N proof mỗi đường độc lập; khác với lực tay tối đa 100 N mỗi nút, không dụng cụ. |

Không hỏi lại những quyết định này. Duyệt hướng G-B/M-A không phải duyệt cấu hình/hash hoặc cho phép CAD/FE/chế tạo.

## Hồ sơ theo từng lượt

| Lượt | Đã có | Giới hạn |
|---|---|---|
| P0-10 | Hợp nhất C11/r12, receipt, nguồn TI, canonical mechanical proposal và DISPOSITION | Không đóng gate; chưa có geometry/FE proof |
| P0-11 | H3/OFF worksheets, G-B/M-A, hợp đồng pha, QA và receipt | Error/timing/geometry còn thiếu; r12 giữ nguyên |
| C12 intake | Lưu review C12, ghim PDF ADR45, phân biệt TYP/MAX, tính hysteresis/bleed | Chỉ thiếu sót nguồn F3 đã xử lý; không H3 PASS |
| P0-12 đang dở | Hai nghiên cứu comparator, ma trận GPIO, ngân sách bleed, đối chiếu preflight và fresh checks | **Chưa QA snapshot P0-12; chưa đồng bộ trạng thái preflight; chưa có REPORT/RELAY cuối lượt trước khi Founder ngắt** |

Báo cáo hai lượt trước: `docs/hardware/mobot-v2-p0-10-p0-11-consolidated-report-2026-11-10.md`. Phần dưới cập nhật tiến độ mới hơn.

## P0-12 đã viết đến đâu

Các tệp dưới `docs/hardware/`:

1. `mobot-v2-p0-12-gpio-constraints.md`: đủ 16 vai trò G-B; pool 11 chân tham chiếu cùng reset/domain/boot/JTAG. Mọi assignment là UNASSIGNED. GPIO4 có pull-down nhưng không phải strap; GPIO13 cần xét MTCK/JTAG; GPIO36/39 input-only không pull nội; GPIO16/17 vẫn conditional.
2. `mobot-v2-p0-12-h3-candidate-verdict.md`: TLV9031 không hysteresis nội nhưng thiếu bias/timing MAX. LTC6702H có hysteresis MAX nhưng rising-only interval với reference/divider rộng 31,362294 mV, không vừa cửa sổ 27,6 mV. Chưa chọn MPN.
3. `mobot-v2-p0-12-mode-power-budget.md`: bleed thụ động nối thường trực theo proposal. RUN MAX 1,060606 mA; JOY MAX 0,330579 mA. Reserve bleed bên trong tổng RUN 500 mA; không cộng lặp JOY qua B01. Aux/H3/actuator và ngân sách toàn hệ thống còn TBD.
4. `mobot-v2-p0-12-preflight-disposition.md`: đã đọc C03/C08/C10 và đối chiếu code hiện tại khớp C10. Đề xuất supersede 001/002 bằng 003 rồi đóng task phần mềm sau kiểm chứng. **Chưa áp dụng đề xuất này vào queue.**

Run hiện tại ở `docs/agents/runs/MM-HW-P0-12/`: scripts, calculations.json, before-tasks.json, logs, nguồn và pause record. Hai advisory Sol `c12_h3_bound` và `c12_gpio_constraints` đã trả kết quả, không ghi file và đã hoàn tất. Nội dung đã được tích hợp vào các tài liệu trên. Chưa có QA P0-12 mới.

Snapshot app trước khi đóng gói báo các chat 01/02/03/08/09 đều `notLoaded`. Chi tiết ở `pause-chat-status.json`. Không gửi prompt mới để đánh thức họ trong lúc tạm dừng.

## Nguồn và số liệu quan trọng

- ADR45 Rev G, 41 trang: `docs/research/downloads/p0-11/adr4520_4525_4530_4533_4540_4550.pdf`.
- SHA256 ADR45: `de2dca59e24477c2e186440e3d768cc06b7e3742448929a9f5721d5817247b34`.
- Ảnh trang 4 xác nhận solder shift ±0,02% chỉ là TYP; thermal hysteresis/aging cũng chưa có MAX áp dụng toàn đời. Bằng chứng ở `docs/agents/runs/MM-HW-P0-11/c12-follow-up/source-verification.json`.
- TLV90xx SNOSDA3H đã ghim PDF/ảnh trong `docs/research/downloads/p0-12/`. TLV9031 không internal hysteresis, nhưng bias 5 pA và delay/startup chỉ TYP. CMRR tại 5 V và PSRR tới 5 V không bao trọn dải worksheet 4,75–5,25 V.
- LTC6702 Rev A đọc được nguồn hãng qua web; tải PDF timeout một lần, nên ghi NOT_RUN. Không yêu cầu Founder tải thêm một ứng viên đã bị loại trong worksheet hiện tại.
- Timing H3 55,922 µs / 51,734 µs, khoảng trip partial và các kết quả RC đều có điều kiện, chưa là MAX toàn mạch. Không dùng lại 59,06 µs cho K mới.

## Kiểm tra đã chạy trước lúc tạm dừng

| Kiểm tra | Kết quả |
|---|---|
| P0-12 calculate.py | Exit 0; calculations.json đã ghi, self-check toán học đạt; chưa QA độc lập |
| Queue validator | Lần gần nhất exit 0, 58 task, errors=[], warnings=[]; validate-before-reconcile.json |
| Test validator | 61/61, exit 0; validate-tests.txt |
| Dispatch KiCad thật | dispatch_eligible=false, exit 1 đúng mong đợi vì thiếu authorization/builder mode; không có lease |

Lần validator đầu phát hiện wildcard file-prefix của allowed_paths không hợp lệ; đã sửa thành danh sách file cụ thể rồi chạy lại exit 0. Không sửa validator để làm xanh. Sau khi ghi USER_PAUSED, chỉ kiểm lại queue cho đóng gói, không chạy tiếp nghiên cứu hoặc suite phần cứng.

## Việc còn dở khi được phép tiếp tục

1. Đọc gói và queue hiện tại; chỉ bật execution_requested khi Founder thực sự resume Hardware. Không chạy các helper scripts chỉ vì chúng nằm trong gói.
2. QA độc lập bốn hồ sơ P0-12, calculate.py và nguồn theo snapshot. Không lấy QA P0-11 làm review P0-12.
3. Hoàn tất closure hành chính preflight. Metadata 003 có deliverable r10 configuration sao chép sai cần sửa; xem lại C03/C08/C10 và DISPOSITION, rồi mới quyết supersession 001/002, closure 003. Lưu lịch sử thực. Các thay đổi này chưa thực hiện.
4. H3 cần topology/candidate có full error, timing/bias, aging, startup và fault bounds. Hai ứng viên mới chưa đủ; không ép chọn MPN hoặc đổi C/trip MAX chỉ để có revision.
5. Khép interface GPIO/OFF/reset, giữ hardware veto thắng retained HIGH/mất bias. Chưa được gán GPIO.
6. Khép geometry M-A, stop/neutral interlock/commit, dung sai/bao quét, lực hồi, actuator và chi phí. CAD/FE cần phạm vi/cấu hình được phép riêng.
7. Chỉ hợp nhất revision kế tiếp khi đủ nhất quán để review đúng bytes. Validator hiện trust baseline tới r11; cấu hình mới phải có bước tích hợp baseline được review trước dispatch, không bỏ trust check.

## Câu lệnh để Founder tiếp tục sau này

> Tiếp tục Hardware từ `docs/hardware/HARDWARE-HANDOFF-2026-11-10.md`. Đọc queue chuẩn và manifest trước khi làm. Khôi phục đúng task P0-12 đang USER_PAUSED, giữ quyết định G-B/M-A, không hỏi lại. Bắt đầu bằng QA tài liệu P0-12 và đối chiếu preflight. Chưa tạo r13, gán GPIO, mở lease, CAD/FE hoặc KiCad nếu chưa đủ điều kiện. Không gọi Claude/vendor hoặc thực hiện thiết bị.

Câu lệnh chỉ có hiệu lực khi Founder thực sự gửi để resume. Việc nó nằm trong tệp không cấp quyền chạy.

## Gói snapshot

`docs/hardware/handoffs/2026-11-10/` chứa ZIP, manifest bất biến và queue snapshot. Đây là gói Hardware có chọn lọc, không phải toàn project. Không chứa secrets, dependency cache hoặc sibling app. Manifest kiểm bytes trong ZIP, không buộc queue sống tương lai giữ nguyên hash.

Ưu tiên tiếp tục trên workspace hiện có. Chỉ khôi phục ZIP khi cần; không trích đè queue/source hiện tại một cách mù quáng. Gói không đánh dấu task done hoặc chứng nhận phần cứng đạt.
