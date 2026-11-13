# Kế hoạch triển khai thiết kế PCB MoBot V2 · hướng dẫn chia việc cho Codex

Ngày 06/11/2026 · tác giả: Leader Claude (chỉ đọc, đề xuất) · người quyết định: Codex lead + founder.
Thay `plan.md` ở §3–§4 (hướng giải quyết, thứ tự); `plan.md` vẫn là phân tích nền. Đề xuất này không có hiệu lực nếu Codex chưa tự kiểm chứng.

## 0. Tóm tắt một đoạn

Mục tiêu: có schematic tay cầm đã qua ERC và Box 08 (rồi PCB layout), sau đó robot. Hiện chưa mở được lease KiCad (gate 4/32 CHỐT). Founder đã chọn Q1–Q5 = A, A, A, B, B (`founder-answers-q1-q5.md`). Việc còn lại chia thành 4 đợt, mỗi đợt tối đa 2 writer với path rời, đúng `parallel-build-policy.md` (policy v3). Đường găng: **dữ kiện vật lý của mẫu → cấu hình JSON mới → Box 08 → user duyệt hash → lease → schematic**.

## 1. Đầu vào đã chốt (không mở lại)

| Mục | Giá trị | Nguồn |
|---|---|---|
| UVLO robot | falling 6,40–6,60 V, TLV6700 FAIL | memory founder; `final-values.md` D-R2 |
| Motor R1 0,62 Ω; sạc R5 (TUSB320LAI 1,24 kΩ); H3 | CHỐT | `gate-matrix.md:76` |
| Board | mẫu 30 chân USB-C họ CH340 đã chụp (suffix chưa biết) | `gate-matrix.md:52-54` |
| Q8 (06/11) | Giữ 30 chân. Founder không đo được mẫu; sẽ mua đúng một listing; dùng tài liệu web + kiểm tra không cần dụng cụ (WP 1.1) | tin nhắn founder "Giữ 30 chân" |
| Q1 | A: mẫu đã chụp cho cả hai carrier | `founder-answers-q1-q5.md` |
| Q2 | A: kiến trúc nguồn tay cầm v1 (carrier không cấp VIN; cáp RUN OUT) | nt |
| Q3 | A: pack Jauch 250832 Rev. 1.2 | nt |
| Q4 | B: tách `verification_items` khỏi `blocking_unknowns` | nt |
| Q5 | B: 4 lớp cả hai board | nt |
| Chưa quyết | Q6 (robot song song trên giấy), Q7 (pack B04, NTC 0–45 °C) | khuyến nghị B, A |

Điều kiện treo: Rd 5,1 kΩ trên cả hai CC chưa biết (Q2-A phụ thuộc; theo Q8 sẽ kiểm bằng thử chức năng ở WP 1.1, không bằng đồng hồ) và clone 30 chân không có sơ đồ/bản vẽ chính thức (tìm web 06/11: kích thước mỗi nguồn một kiểu, thư viện KiCad cộng đồng hay sai số chân); datasheet Jauch đúng lô chưa có; văn bản chấp nhận rủi ro Q4-B chưa có; BOM B01 còn 4 mã; spec robot giả định 2 lớp.

## 2. Vai trò, quyền ghi (theo policy v3)

| Vai trò | Được ghi | Ghi chú |
|---|---|---|
| Codex lead | `tasks.json`, cấu hình, quyết định, lease, tích hợp | Duy nhất ghi approval; không sửa path đang bị lease |
| hardware_kit_designer (HK) | `hardware/**`, `docs/hardware/**` khi có lease active | Writer chính của PCB; không tự duyệt cấu hình |
| electronics_firmware_engineer (EF) | mặc định advisory; chỉ ghi nếu lease `hardware/firmware`/`hardware/electronics` | Net map, pin map, hợp đồng MCU, lỗi đơn |
| qa_safety_reviewer (Box 08) | review độc lập | Review đúng bytes + hash |
| tester | chạy check có scope, không sửa nguồn | ERC/DRC/validator |
| research_scout | chỉ đọc/tra cứu | Datasheet từ trang hãng, ghi SOURCES |
| product_system_architect (PSA) | advisory | Hợp đồng liên module |

Ràng buộc: tối đa 2 writer cùng lúc, path rời (so sánh không phân biệt hoa thường); không đệ quy dispatch; không gọi Claude; không mua, flash, bench, đụng motor khi chưa có phép; review/test đóng băng scope bị ảnh hưởng. Preflight trước mỗi lần spawn: `node D:/StartupOS/docs/agents/validate.mjs --dispatch-task <task-id>`.

## 3. Gói việc

Ký hiệu: **W** = writer, **R** = chỉ đọc/advisory. Path chỉ là đề xuất; Codex chọn theo cấu trúc repo.

### Đợt 0 · Gỡ quy trình (lead, không cần founder, làm ngay)

| WP | Việc | Vai trò | Output | Done when |
|---|---|---|---|---|
| 0.1 | Tài liệu phân xử: doc nào thay doc nào (AV1 → CS → GR → AA so với `tasks.json`) | lead (W) | `docs/hardware/supersession.md` | Mỗi doc hardware có trạng thái hiện hành/bị thay, kèm mtime |
| 0.2 | Cập nhật `tasks.json` theo 0.1 và Q1–Q5; ghi Q1–Q5 vào `*founder-decision*.md` | lead (W) | `tasks.json`, file quyết định | Q1–Q5 có biên bản chính thức; không còn MÂU THUẪN ở `gate-matrix.md:59-60` |
| 0.3 | Xử lý `r7-approval-record.md` (ghi nhận hoặc bác) | lead (W) | ghi chú trong queue | `gate-matrix.md:48` không còn MÂU THUẪN |
| 0.4 | Đóng 6 mục readiness của `MM-HW-MOBOT-IF-001` (`tasks.json:2345-2355`) | lead + HK (R) | cập nhật task | IF-001 không còn `waiting` vì readiness |

### Đợt 1 · Giấy và dữ kiện (2 writer song song)

Làn A, **HK (W)** trong `docs/hardware/pcb-handset/`; làn B, **lead** trong `docs/agents/**` và mission-control. Path rời.

| WP | Việc | Vai trò | Input | Done when |
|---|---|---|---|---|
| 1.1 | **Chốt đúng một listing và kiểm tra không cần dụng cụ** (thay đo bằng đồng hồ/caliper, theo Q8). (a) Founder mua 2–3 board cùng một listing; lưu URL, ảnh chụp listing, ngày. (b) Chụp mặt trước/sau có vật tham chiếu kích thước đã biết (ví dụ thẻ ISO/IEC 7810 ID-1 85,60 × 53,98 mm) đặt phẳng cạnh board. (c) Cắm vào PC, đọc VID:PID trong Device Manager để biết cầu USB (đối chiếu datasheet hãng chip, ví dụ CH340 và CP2102 dùng VID:PID khác nhau; Codex tra từ trang hãng, không ghi nhớ). (d) Cắm cáp C-to-C vào nguồn sạc: LED nguồn sáng hay không (gợi ý có/không có Rd trên CC; chỉ là dấu hiệu, không thay phép đo). (e) Codex đối chiếu ảnh với thư viện web (DOIT 30 chân) và đánh dấu mọi giá trị là "ước lượng từ ảnh/web" | founder + research_scout | listing đã mua | File `docs/hardware/evidence/<listing>.md` có URL, ảnh, VID:PID, kết quả (c)(d); mọi kích thước ghi rõ nguồn và độ tin cậy |
| 1.2 | **Net map 30 chân** từ 1.1. Clone không có sơ đồ chính thức nên net map chỉ ở mức nhãn silkscreen + chức năng GPIO theo datasheet ESP32; phần trong board (regulator, cầu USB, đường VBUS→VIN) ghi "không xác minh" và carrier không được dựa vào nó | EF (R) → HK (W) | 1.1 + datasheet ESP32 (đã có 2 PDF) | Bảng chân↔net; mỗi dòng có nhãn nguồn (ảnh, datasheet, web); carrier có phương án an toàn khi phần trong board khác giả định |
| 1.2b | **Thiết kế chịu bất định** (do Q8): footprint dùng header cái 2,54 mm với dung sai cơ khí đủ lớn (outline, lỗ gá, khoảng cách hai hàng được kiểm bằng ảnh có tỉ lệ, khóa cuối cùng khi board về); đường nguồn không được phụ thuộc Rd/VIN của clone. Đề xuất để EF/Box 08 xem xét: vị trí tùy chọn (DNP mặc định) cho đường cấp VIN qua cách ly, nhưng chỉ khi H2 (nguồn song song/backfeed) được xử lý | EF (R) + HK (W) | 1.1, 1.3 | Bảng lỗi đơn H2 cho cả hai cấu hình; Box 08 duyệt; Q2-A được xác nhận hoặc đổi |
| 1.3 | **Bảng lỗi đơn tay cầm** BT-H4a/b/c: lỗi dính U6/U9, đứt sense, rail dư, SW4 | EF (R) → HK (W) | `bench-additions.md:7-42`, `delta-handset-2026-11-07.md` | Mỗi lỗi có kết quả mong đợi; không đường nào nối hai nguồn 5 V hoặc backfeed vào CP2102/ESP32 |
| 1.4 | **Hợp đồng MCU `MM-ESP32-001`** (chưa cần mã) | EF (R) → lead | datasheet ESP32 | Có: module chính xác; trạng thái an toàn khi reset/brown-out (motor tắt mặc định, `MCU_MOT_EN` kéo xuống); thứ tự bật ngoại vi; chân cấm (strapping GPIO0/2/5/12/15; GPIO34–39 chỉ vào; GPIO25 ADC2 kiểm ESP-IDF); pin map đối chiếu net map |
| 1.5 | **SOURCES.md** cho datasheet: URL hãng, ngày tải, sha256 | research_scout (R) → HK (W) | PDF hãng | 3 nguồn [CHƯA XÁC MINH] (Littelfuse SMAJ, IPC-2221, CP2102 đầy đủ) được xử lý hoặc ghi rõ |
| 1.6 | **Pitch JST XH** và chốt một họ connector (PH/XH/GH) theo Q3-A | HK (W) | datasheet JST, Jauch | `kicad-input-spec-r7.md:167,228` khớp datasheet |
| 1.7 | **Datasheet Jauch 250832** đúng lô/đầu nối; dòng xung, nội trở, PCM | founder + research_scout | hãng | File trong SOURCES; UVLO động cập nhật |

### Đợt 2 · Cấu hình, ngân sách, quy tắc (chốt trước lease)

| WP | Việc | Vai trò | Done when |
|---|---|---|---|
| 2.1 | **Cấu hình JSON mới** `mission-control/hardware-config-<typec>.json`: Q1–Q5, `verification_items` (đo sau PCB) tách khỏi `blocking_unknowns` | lead (W) | `blocking_unknowns` rỗng; validator chấp nhận (`validate.mjs:142-151`) |
| 2.2 | **Văn bản chấp nhận rủi ro Q4-B** do founder ký | founder | Có file/record được lead ghi nhận |
| 2.3 | **Ngân sách dòng USB** (H3): chọn cơ chế giới hạn theo trạng thái USB; số attach/boot/flash chỉ ghi "đo sau PCB" nếu chưa đo | EF (R) → HK (W) | Có phương án + tiêu chí PASS/FAIL; không khẳng định tải hợp lệ khi chưa đo |
| 2.4 | **Stackup 4 lớp, DRC/netclass, nhiệt** MCP73833 (1,05 W, TJ 83 °C ở 40 °C theo r7) và TPS63070 trên đúng stackup; chọn fab | HK (W) + EF (R) | Bảng track/clearance/via có nguồn; tính nhiệt tái lập; spec robot `kicad-input-spec-r7.md:259` sửa theo 4 lớp |
| 2.5 | **BOM variant** (`MM-BOM-001`) theo Q1: một mã B01 duy nhất; thiếu B15/B04 ghi rõ | HK (W) | `tasks.json:626-634` hết thiếu hash r7 |
| 2.6 | **Box 08 review** đúng bytes cấu hình 2.1 + delta 07/11 (hash `delta-handset-2026-11-07.md` §7) + ngưỡng bench + TLV6710 | qa_safety_reviewer | Verdict ghi vào `runs/`; có hash |
| 2.7 | **User duyệt đúng hash** → lead ghi `approved_by=user`, `approved_sha256` | founder + lead | Queue có approval hợp lệ |

### Đợt 3 · Lease và schematic tay cầm

| WP | Việc | Vai trò | Done when |
|---|---|---|---|
| 3.1 | **Lease** `MM-HW-MOBOT-REMOTE-KICAD-001`: `in_progress`, builder mode, `write_lease` path `hardware/mobot-v2/handset-carrier/**`, snapshot hash | lead | `node docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` **thoát 0** |
| 3.2 | **Schematic** theo net map, kiến trúc v1, pin map đã chấp nhận | HK (W) | File `.kicad_sch/.kicad_pro` tồn tại trong path lease |
| 3.3 | **ERC** trên project thật (kicad-cli 10.0.7 hiện chỉ kiểm `version`) | tester | ERC 0 lỗi hoặc danh sách lỗi có chủ |
| 3.4 | Box 08 review schematic | qa_safety_reviewer | Verdict PASS/CONDITIONAL ghi vào `runs/` |

### Đợt 4 · Layout tay cầm và robot

| WP | Việc | Vai trò | Done when |
|---|---|---|---|
| 4.1 | **Layout** theo DRC/netclass 2.4, outline đã đo | HK (W) | DRC 0 lỗi (tester) |
| 4.2 | **Robot trên giấy** (Q6-B, làm song song từ Đợt 1): kiến trúc nguồn Type-C, pin map, kết cấu motor/pack; pack B04 chờ hồ sơ NCC (Q7) | EF (R) + HK (W, `docs/hardware/pcb-robot/`) | Doc kiến trúc robot Type-C; robot lease chỉ mở sau 3.4 và BT-R1a |
| 4.3 | **Bench** (sau PCB, cần phép founder) | founder / bench operator + tester | Bench thật thay mọi UNKNOWN (`bench-additions.md:5`) |

## 4. Đồ thị phụ thuộc

```
0.1 → 0.2 → 0.3 ─────────────────────────────┐
1.1 → 1.2 → 1.4 ─┐                            │
1.3, 1.5, 1.6, 1.7 ──────────────────────┐    │
                 └→ 2.1 → 2.6 → 2.7 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1
2.2, 2.3, 2.4, 2.5 ─────────────────→ 2.1/2.6
4.2 (giấy, song song) ───────────────────────────→ lease robot sau 3.4
```

Đường găng: **1.1 (founder đo) → 1.2 → 2.1 → 2.6 → 2.7 → 3.1**. Mọi việc khác chạy song song trong hạn mức 2 writer.

## 5. Mẫu gói dispatch cho từng agent (theo policy v3)

Mỗi dispatch phải nêu đủ: quyền hiện tại của user; task_id và vai trò; scope và độ sâu thoát; lease path và hash base; tiêu chí chấp nhận; lệnh/artefact được chạy; tham chiếu approval cấu hình hoặc "advisory-only"; cách bàn giao; không đệ quy, không gọi Claude; "bạn không đơn độc, giữ nguyên thay đổi của người khác".

```
task_id: <MM-...>        role: <hardware_kit_designer|electronics_firmware_engineer|...>
mode: builder|advisory   lease_paths: <path rời; không đụng path khác>
inputs: <file:line cụ thể>   hardware_config_id: <id đã duyệt | advisory-only>
acceptance: <điều kiện nhị phân>
cấm: mua hàng, flash, bench, đụng motor, mở .env, tự duyệt cấu hình, mở rộng lease
handoff: danh sách file đã đổi + lệnh đã chạy + kết quả; nêu rõ check chưa chạy
```

Chọn model theo bảng policy: EF/QA về an toàn điện dùng mức `high`; HK thiết kế có scope dùng `medium`.

## 6. Cổng và tiêu chí dừng

Dừng và báo lead nếu: scope vượt lease; phát hiện thông số điện không có datasheet/số đo; mẫu thật khác giả định (không có Rd 5,1 kΩ trên cả hai CC → Q2-A phải xem lại); hai lần thất bại cùng một cách; hoặc cần mua/flash/bench.

**Sẵn sàng lease khi đủ:** (a) `tasks.json` khớp doc hiện hành; (b) cấu hình JSON được user duyệt đúng hash; (c) `blocking_unknowns` rỗng; (d) Box 08 PASS đúng bytes; (e) net map + pin map + stackup + DRC có nguồn; (f) `validate.mjs --dispatch-task` thoát 0. Kiểm tra theo `gate-matrix.md:38-51`.

**Không được tuyên bố trước khi có số đo:** dòng USB hợp lệ, UVLO động, nhiệt thật, ADC ổn định ≤4 LSB sau 5 ms, hoặc "đã an toàn". Ảnh và model 3D không chứng minh thông số điện.

## 7. Việc cần founder (theo thứ tự)

1. Mua 2–3 board cùng một listing và làm kiểm tra không cần dụng cụ (WP 1.1): URL + ảnh listing, ảnh có vật tham chiếu, VID:PID trong Device Manager, thử LED với cáp C-to-C.
2. Văn bản chấp nhận rủi ro Q4-B (WP 2.2).
3. Datasheet Jauch đúng lô và đầu nối; chọn fab; Q6, Q7.
4. Duyệt đúng hash cấu hình mới (WP 2.7).

## 8. Chưa kiểm chứng

- Chưa chạy `validate.mjs`, `kicad-cli`, `calc_r7.py`; trạng thái lease lấy từ `gate-matrix.md` và `tasks.json` do reviewer đọc.
- Đường dẫn đề xuất (`docs/hardware/pcb-handset/`, `docs/hardware/supersession.md`) chưa đối chiếu cấu trúc repo; Codex chọn lại nếu khác.
- Datasheet IC ngoài ESP32 chưa mở lại; mục GPIO25/ADC2 chưa đối chiếu ESP-IDF.
- Q8 (giữ 30 chân, không đo): kích thước, outline, khoảng cách hai hàng và mọi giá trị điện bên trong board đều chỉ là ước lượng cho tới khi có số đo hoặc tài liệu hãng cho đúng listing. Mua nhiều board cùng listing không bảo đảm lô sau giống lô này.
- Cách tra VID:PID của từng cầu USB phải lấy từ trang hãng; tôi chưa mở tài liệu nào trong lượt này.
- Phiên review đối chiếu test/status chưa xong; có thể có task chưa xong khác chưa nằm trong kế hoạch này.
