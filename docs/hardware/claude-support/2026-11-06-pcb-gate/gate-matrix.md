# Gate matrix: lease KiCad và pre-KiCad · MoBot V2 (06/11/2026)

Chỉ đọc. **CHỐT**: giá trị khóa và có nguồn. **CHƯA CHỐT**: chưa có hoặc chưa đủ bằng chứng. **MÂU THUẪN**: các nguồn nói khác nhau. Theo ràng buộc: `tasks.json` và `runs/` là trạng thái quy trình; config r7 và founder-decision r7 là trạng thái thiết kế.

## Tổng

| Phạm vi | CHỐT | CHƯA CHỐT | MÂU THUẪN | Tổng | % CHỐT |
|---|---|---|---|---|---|
| Tay cầm (gồm dòng chung) | 4 | 21 | 7 | 32 | 12% |
| Robot (gồm dòng chung) | 4 | 24 | 4 | 32 | 12% |
| Mọi dòng riêng biệt | 6 | 34 | 8 | 48 | 12% |

Dòng 'Cả hai' được tính cho cả hai board.

## Chú giải nguồn

| Mã | Tệp |
|---|---|
| TJ | `D:/StartupOS/docs/agents/tasks.json` |
| VM | `D:/StartupOS/docs/agents/validate.mjs` |
| PBP | `electronics-learning-demo/docs/mission-control/parallel-build-policy.md` |
| EV | `docs/hardware/evidence/esp32-devkit-v1-type-c-sample.md` (và 2 ảnh .png cùng thư mục) |
| CP | `docs/hardware/mobot-v2-typec-ch340-conditional-interface-proposal.md` |
| AV1 | `docs/hardware/mobot-v2-handset-b01-architecture-v1.md` |
| DB | `docs/hardware/mobot-next-revision-doit-board-decision.md` |
| CS | `docs/hardware/mobot-v2-handset-component-selection-v1-approval.md` |
| AA | `docs/hardware/mobot-v2-handset-ps3-aa-pre-kicad-v1.md` |
| GR | `docs/hardware/mobot-v2-handset-final-gates-review.md` |
| B01C | `docs/hardware/mobot-v2-handset-b01-pre-kicad-closeout.md` |
| QD, RD, R7, R6, FD, KH, BOM1, BOM2 | như `prev-v1/gate-matrix.md` |
| KS6, FDEC, BT, RB | `claude-support/2026-11-05-mobot-r6/`: kicad-input-spec.md, founder-decisions.md, bench-test-plan.md, robot.md |
| KS7, FV, AR | `claude-support/2026-11-06-pcb-status/final/`: kicad-input-spec-r7.md, final-values.md, r7-approval-record.md |

## Ma trận

| Board | Hạng mục | Trạng thái | Bằng chứng file:line | Hành động | Owner role |
|---|---|---|---|---|---|
| Tay cầm | LEASE REMOTE: task in_progress + authorization | CHƯA CHỐT | TJ:2436 `scoped`; TJ:2423 authorization 'No KiCad lease'; `validate.mjs --dispatch-task` → `dispatch needs active task authorization` | Lead chuyển trạng thái sau khi đóng gate dưới | codex_lead |
| Tay cầm | LEASE REMOTE: execution_mode=builder, write_lease active, lane hardware | CHƯA CHỐT | VM:20-23,37; dispatch → `dispatch builder mode missing`; path cho phép TJ:2453 (hardware/mobot-v2/handset-carrier/**) | Lead tạo lease đúng path | codex_lead |
| Tay cầm | LEASE REMOTE: snapshot file-hashes, base_snapshot trùng reference | CHƯA CHỐT | TJ:2429 snapshot `pending`; VM:24-26 | Lead tính hash file, ghi snapshot | codex_lead |
| Tay cầm | LEASE REMOTE: MM-HW-MOBOT-IF-001 hoàn tất | CHƯA CHỐT | TJ:2438 depends_on; TJ:2298 IF-001 `waiting`; TJ:2345-2355 6 mục thiếu | Đóng 6 mục readiness của IF-001 | codex_lead |
| Tay cầm | LEASE REMOTE: không chồng lease khác (≤2 writer, path rời) | CHỐT | PBP:14; VM:94-98; ROBOT dùng robot-carrier/** (TJ:2559) | Giữ | codex_lead |
| Robot | LEASE ROBOT: task in_progress + authorization | CHƯA CHỐT | TJ:2541 `scoped`; TJ:2528; dispatch → cùng 2 lỗi như REMOTE | Như trên | codex_lead |
| Robot | LEASE ROBOT: builder mode + write_lease + snapshot file-hashes | CHƯA CHỐT | TJ:2534 `pending`; VM:20-26 | Lead tạo lease | codex_lead |
| Robot | LEASE ROBOT: IF-001 và REMOTE-KICAD-001 hoàn tất, schematic tay cầm có trước | CHƯA CHỐT | TJ:2543 depends_on; TJ:2582-2596 'Handset schematic prerequisite' | Chờ tay cầm; xem Q6 | codex_lead |
| Robot | LEASE ROBOT: BT-R1a và đầu vào R1–R6 của robot | CHƯA CHỐT | TJ:2586-2596; box08 packet:49 (BT-R1a trước lease robot hoặc bằng chứng tương đương); BT:99-104 | Founder hoặc bench operator đo L, R motor #992 | user |
| Cả hai | Hash cấu hình MỚI cho mẫu Type-C CH340 được user duyệt | CHƯA CHỐT | TJ:2330-2331 acceptance IF-001: bytes r7 'do not authorize this board'; TJ:2623-2624 r7 approved_by null; PBP:32-34 | HQ lập cấu hình mới, Box08 review đúng bytes, user duyệt đúng hash | codex_lead |
| Cả hai | Trạng thái duyệt r7 | MÂU THUẪN | AR:3-7 ghi user duyệt hash 9ef75eb9…; TJ:2620,2623 vẫn `proposed`, approved_by null; AR không nằm trong input_refs của IF-001 (TJ:2301-2316) | HQ ghi nhận hoặc bác biên bản. Dù sao r7 không đủ cho board mới | codex_lead |
| Cả hai | Cấu hình phải là proposal JSON trong mission-control, status approved | CHƯA CHỐT | VM:142-151 regex `mission-control/hardware-config-*.json`; r7 trỏ tới tệp .md (TJ:2619); box08 packet:45 đã nêu | HQ tạo JSON cho cấu hình mới | codex_lead |
| Cả hai | blocking_unknowns của cấu hình phải rỗng lúc duyệt | CHƯA CHỐT | VM:42,151; r7 còn 5 nhóm (TJ:2624-2632) gồm đo bench và hồ sơ NCC; KS7:15 (Claude) nói bench không chặn schematic, trái validator | Founder quyết cách xử lý (Q4) | user |
| Cả hai | Box08 review đúng bytes cấu hình tích hợp | CHƯA CHỐT | TJ:2381-2395 chỉ `pass_conditional_note` cho bản nháp CP (hash E102B964…); TJ:2276-2282 `changes_requested` thuộc snapshot DOIT cũ | Box08 review sau khi có cấu hình mới | qa_safety_reviewer |
| Cả hai | Suffix CH340 lắp thực tế trên mẫu | CHƯA CHỐT | EV:5; CP:11,62 chưa xác nhận; ảnh front: U2 là IC vuông có chân nhiều phía (dạng QFN), không đọc được mã | Founder gửi ảnh macro U2 hoặc VID:PID; EF đối chiếu | electronics_firmware_engineer |
| Cả hai | Kích thước board đo từ mẫu (outline, hàng chân, lỗ, pin-1, chiều cao) | CHƯA CHỐT | EV:14; CP:72-79; ảnh không có thước | Founder đo bằng thước kẹp hoặc ảnh có thước; HK ghi | hardware_kit_designer |
| Cả hai | Nhãn silkscreen 30 chân | CHỐT | EV:23-24; ảnh esp32-devkit-v1-type-c-front.png: trái EN,VP,VN,D34…VIN; phải D23,D22,TX0,RX0…3V3 khớp | Giữ (chỉ là nhãn) | hardware_kit_designer |
| Cả hai | Chức năng GPIO, pin-1, đánh số pad, kết nối điện | CHƯA CHỐT | EV:26 nói chưa xác minh; CP:81 cần net map | EF lập net map từ ảnh macro hoặc thông mạch | electronics_firmware_engineer |
| Cả hai | Topology USB-C: CC, VBUS, VIN, 3V3, regulator, bridge | CHƯA CHỐT | TJ:2345-2355; CP:20,81; ảnh front thấy regulator SOT-223 và U2 cạnh USB-C, chưa đủ để suy ra net | EF net map | electronics_firmware_engineer |
| Cả hai | Dòng USB: attach, boot, flash, inrush, điều khoản USB-IF | CHƯA CHỐT | CP:66; TJ:2350 | EF đo trên mẫu khi được phép; HQ tải điều khoản USB-IF | electronics_firmware_engineer |
| Cả hai | Quyết định founder H3/R1/R5 và UVLO robot 6,40–6,60 V | CHỐT | R7:7-9; FD:5-6; FV:132; chỉ thị trong prompt | Không mở lại | user |
| Cả hai | Mẫu board dùng cho từng carrier | MÂU THUẪN | TJ:2423 + EV + DB:10-12 chọn mẫu Type-C CH340; CS:7 (mtime 14:43) duyệt WRL-20168; AV1:7 SKU Beetrona 02030089 (12:57); BOM2:9 HH004223; KS7:23 BrijModi | Founder xác nhận (Q1) | user |
| Cả hai | Hàng đợi tasks.json theo kịp doc mới | MÂU THUẪN | TJ mtime 12:24; AV1 12:57; run decision 12:58; CS 14:43; GR 14:57; AA 15:19. TJ:2423 không nhắc kiến trúc v1, WRL hay AA | Lead cập nhật tasks.json hoặc ghi doc nào thay doc nào | codex_lead |
| Cả hai | File thiết kế MoBot (.kicad_sch/.kicad_pro) tồn tại | CHƯA CHỐT | Tìm D:/StartupOS: không có tệp tên chứa mobot; .tmp/*.kicad_pcb là tệp thử viewer. Không chạy kicad-cli | Chỉ tạo sau lease | hardware_kit_designer |
| Cả hai | kicad-cli 10.0.7 sẵn sàng | CHƯA CHỐT | Tệp tồn tại (2,7 MB, ls). KH:10 chỉ kiểm `version`, sandbox không ghi được HKCU; ERC/DRC chưa kiểm | Lead chạy thử ERC trên project mẫu sau lease | codex_lead |
| Tay cầm | Power tree | MÂU THUẪN | AV1:7-9 (carrier không cấp VIN/3V3; cáp RUN OUT; TPS61023 + TPS25810 ứng viên) vs CP:31 (pack→boost→eFuse→Q_ISO→VIN) vs R6 (LM66100 → VIN, KS6:45) | Founder và EF chốt một kiến trúc (Q2) | electronics_firmware_engineer |
| Tay cầm | Pack | MÂU THUẪN | CS:7 Jauch 250832; RD:15 LK37478; AA:10 AA thay Jauch/H3; QD:15; hồ sơ B15 thiếu (B01C:19) | Founder chọn (Q3) | user |
| Tay cầm | UVLO 1S (TPS3808G01, 3,266–3,417 V) | CHỐT | QD:10 (PASS tĩnh); tính lại 3,268–3,417 V (prev-v1/resolutions.md §4). Động chưa chứng minh | Giữ nếu còn dùng pack 1S | electronics_firmware_engineer |
| Tay cầm | Pinout / pin map GPIO | CHƯA CHỐT | Không có bảng chân Codex chấp nhận; KS6:9 ghi TBD; map của Claude (KS7:113-123) khớp nhãn D34/D35/D32/D33/D25 trên ảnh nhưng chưa có net map | EF lập, Box08 duyệt | electronics_firmware_engineer |
| Tay cầm | Connector / harness | MÂU THUẪN | B01C:7 JST GH 12 cực, 11 dây; AV1:7 bó dây ngắn + cáp RUN OUT; GR:7 JST XH 3 cực cho pack WRL/Jauch; KS7:42 JST PH 2 chân | HK chốt một họ (Q3) | hardware_kit_designer |
| Tay cầm | Footprint / symbol | CHƯA CHỐT | DB:14 CAD DOIT chỉ là tham chiếu; EV:14 hình học chưa đo; footprint IC box03 chưa chọn | Chờ đo mẫu; HK đối chiếu land pattern | hardware_kit_designer |
| Tay cầm | Cơ khí, kích thước board | CHƯA CHỐT | EV:14; BOM1:55 trần 100×100 mm; B01C:17 gá RUN chưa đo | Chờ đo; Q5 | hardware_kit_designer |
| Tay cầm | Stackup | CHƯA CHỐT | Không có doc Codex; BOM1:55 'layer count/stackup TBD'; R7:7 dùng nhiệt bo 4 lớp | Founder chọn số lớp (Q5) | user |
| Tay cầm | Quy tắc DRC | CHƯA CHỐT | Không có netclass, clearance hay fab capability trong docs/hardware | HK soạn sau khi chọn fab | hardware_kit_designer |
| Tay cầm | BOM variant (MM-BOM-001) | MÂU THUẪN | TJ:570 `waiting`; TJ:626-634 thiếu hash r7, hồ sơ B15/B04; B01 có 4 mã: 02030089 (AV1:7), EP000723 (EV:30), HH004223 (BOM2:9), WRL-20168 (CS:7) | Chờ chốt Q1 rồi lập BOM | hardware_kit_designer |
| Tay cầm | Bench test | CHƯA CHỐT | BT:5 (kế hoạch của Claude, chạy sau PCB); BT:68,90-91 ngưỡng [TBD]; box08 packet:28-38 chưa có verdict; RD:28 mọi kết quả UNKNOWN | Box08 duyệt ngưỡng; bench operator | qa_safety_reviewer |
| Robot | Power tree | MÂU THUẪN | R6:20-26 (Micro-USB, interposer, LM66100) vs mẫu Type-C CH340 (TJ:2423); chưa có kiến trúc robot cho Type-C (CP:5 chỉ nêu handset/Q_ISO) | EF lập; Box08 review | electronics_firmware_engineer |
| Robot | UVLO 2S 6,40–6,60 V | CHỐT | Quyết định founder (prompt; FV:132); TLV6700 FAIL (FV:133). IC thay thế TLV6710 ở KS7:169-172 chưa được Box08 duyệt | Không mở lại cửa sổ; Box08 duyệt IC | qa_safety_reviewer |
| Robot | Motor R1 0,62 Ω và sạc R5 (TUSB320LAI, 1,24 kΩ) | CHỐT | R7:8-9; FD:5-6; FDEC:8-9 | Giữ | user |
| Robot | Pack B04 | CHƯA CHỐT | R6:11 chỉ số nhà bán; RB:136; TJ:626-634 | Founder lấy hồ sơ NCC | user |
| Robot | Pinout / pin map GPIO | CHƯA CHỐT | Cùng lý do với tay cầm; chân ADC1 cho ISEN chưa gắn chân thật | EF lập | electronics_firmware_engineer |
| Robot | Connector / harness | CHƯA CHỐT | KS7:167 ghi JST XH 2,54 mm trong khi pitch JST XH là 2,50 mm (RD:22); chưa có doc Codex chốt connector motor/pack | HK chốt | hardware_kit_designer |
| Robot | Footprint / symbol | CHƯA CHỐT | Như tay cầm; footprint TI RGE, RNM, PWP, RWB do box03 | HK | hardware_kit_designer |
| Robot | Cơ khí, kích thước board | CHƯA CHỐT | BOM1:55 trần 100×100 mm; không có outline, lỗ gá, khe motor và bánh | HK | hardware_kit_designer |
| Robot | Stackup | CHƯA CHỐT | Không có doc Codex; KS7:259 giả định 2 lớp; RB:147 TPS63070 TJ 125 °C cận trên | Founder chọn (Q5) | user |
| Robot | Quy tắc DRC | CHƯA CHỐT | Không có | HK | hardware_kit_designer |
| Robot | BOM variant (MM-BOM-001) | CHƯA CHỐT | TJ:570; B04, B05–B08 có; dòng B01 xem hàng chung | Chờ Q1 | hardware_kit_designer |
| Robot | Bench test | CHƯA CHỐT | BT:97-186; BT:192; RD:28 | Bench operator sau PCB | qa_safety_reviewer |

Ghi chú: 'TJ:n' là số dòng trong tasks.json lúc 06/11/2026 chiều. Lỗi `dispatch` là kết quả thật của `node docs/agents/validate.mjs --dispatch-task <id>` (chỉ đọc, exit 1).


## Delta 06/11b

Chưa có câu trả lời Q1–Q7, ảnh macro U2 hay số đo mẫu, nên **không gate nào chuyển CHỐT** trong lượt này. Kết quả tính lại:

| Phạm vi | CHỐT | % |
|---|---|---|
| Tay cầm (gồm dòng chung) | 4/32 | 12,5 % |
| Robot (gồm dòng chung) | 4/32 | 12,5 % |

Đã có thêm (không đổi trạng thái gate): datasheet ESP32-WROOM-32 cho kích thước mô-đun 18,00 × 25,50 × 3,10 mm và keep-out anten ( tr.3, 8, 36, 37). Đây không phải kích thước bo DevKit, nên gate "Kích thước board đo từ mẫu" vẫn CHƯA CHỐT. Gate "Suffix CH340" vẫn CHƯA CHỐT (u2-identification.md). Verdict lease: REMOTE CHƯA, ROBOT CHƯA.
