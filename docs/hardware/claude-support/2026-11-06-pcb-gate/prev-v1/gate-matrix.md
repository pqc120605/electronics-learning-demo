# Ma trận gate pre-KiCad · MoBot V2 r7 (06/11/2026)

Chỉ đọc. Trạng thái: **CHỐT** (giá trị đã khóa và có nguồn; có thể còn đo bench, vì KS7:15 nói bench không chặn schematic), **CHƯA CHỐT**, **MÂU THUẪN GIỮA CÁC DOC**. Số dòng lấy từ tệp tại thời điểm đọc.

## Tổng

| Nhóm | CHỐT | CHƯA CHỐT | MÂU THUẪN | Tổng |
|---|---|---|---|---|
| Cả hai | 2 | 5 | 2 | 9 |
| Tay cầm | 3 | 15 | 5 | 23 |
| Robot | 4 | 16 | 3 | 23 |
| Tất cả | 9 | 36 | 10 | 55 |

Tỷ lệ gate CHỐT: **9/55 = 16%**. Hạng mục MÂU THUẪN: 10/55 = 18%.

## Chú giải nguồn

| Mã | Tệp (tính từ `docs/hardware/`) |
|---|---|
| RD | mobot-pcb-readiness-2026-11-06.md |
| R7 / R6 | mobot-v2-config-2026-11-05-r7.md / -r6.md |
| FD | mobot-v2-r7-founder-decision.md |
| CB | mobot-v2-r7-handset-closure-brief.md |
| QD | mobot-v2-r7-handset-qa-disposition.md |
| TM | mobot-v2-r7-handset-transition-matrix.md |
| KH | mobot-v2-r6-kicad-handoff.md |
| PF | mobot-v2-r5-kicad-preflight.md |
| B01C | mobot-v2-handset-b01-pre-kicad-closeout.md |
| AA | mobot-v2-handset-ps3-aa-pre-kicad-v1.md |
| CS | mobot-v2-handset-component-selection-v1-approval.md |
| GR | mobot-v2-handset-final-gates-review.md |
| WR | mobot-v2-handset-wrl20168-jauch250832-review.md |
| DB | mobot-next-revision-doit-board-decision.md |
| BOM1 / BOM2 | mobot-v2-bom-review-2026-11-05-r1.md / -r2-handoff.md |
| HO | mobot-handset-claude-review-handoff-2026-11-06.md |
| KS6, FDEC, BT, HS, RB | claude-support/2026-11-05-mobot-r6/: kicad-input-spec.md, founder-decisions.md, bench-test-plan.md, handset.md, robot.md |
| KS7, FB, FV, DS, DL, TY, AR | claude-support/2026-11-06-pcb-status/final/: kicad-input-spec-r7.md, final-bom.md, final-values.md, datasheet-checks.md, delta-handset-2026-11-07.md, thiet-ke-va-y-do.md, r7-approval-record.md |
| tasks.json | `StartupOS/docs/agents/tasks.json` (ngoài thư mục dự án) |

## Ma trận

| Board | Hạng mục | Trạng thái | Bằng chứng file:line | Hành động |
|---|---|---|---|---|
| Cả hai | Cấu hình r7 (hash duyệt) | MÂU THUẪN | AR:3-7 ghi user duyệt hash 9ef75eb9…; RD:5 và tasks.json:642,1642 vẫn `proposed`; FD:21 duyệt bytes là bước riêng. mtime: AR 06/11 02:43 sớm hơn RD 10:08 (RD vẫn `proposed`); nội dung AR ghi ngày 07/11 nhưng mtime 06/11 | HQ ghi record, tính lại SHA-256, cập nhật tasks.json. Xem lưu ý ngày tháng ở README |
| Cả hai | Quyết định founder H3/R1/R5 | CHỐT | R7:7-9; FD:5-6; FDEC:5-9 | Không mở lại |
| Cả hai | Lease KiCad | CHƯA CHỐT | RD:5; QD:3; B01C:26 (`dispatch_eligible: false`) | HQ cấp sau khi các gate dưới đóng |
| Cả hai | Box08 review spec/BOM | CHƯA CHỐT | QD:5 `changes_requested`; FB:261 (50 dòng 'Đề xuất'); KS7:13; DL:156-165 chờ tái review | Box08 review đúng snapshot DL:156-165 |
| Cả hai | Preflight validator | CHƯA CHỐT | B01C:26; KH:14 | Chạy `node ../docs/agents/validate.mjs --dispatch-task …` sau khi có lease và hash |
| Cả hai | File KiCad MoBot (.kicad_sch/.pcb/.pro) | CHƯA CHỐT | Tìm toàn repo: chỉ có board tham chiếu trong assets/boards/ và .tmp/; KH:16 'chưa tạo schematic hoặc PCB' | Không có gì để đọc. Chỉ tạo sau lease |
| Cả hai | Toolchain ERC/DRC | CHƯA CHỐT | KH:10 kicad-cli 10.0.7 chỉ kiểm `version`; sandbox không ghi được HKCU | Chạy `kicad-cli sch erc` trên project thử ở máy HQ |
| Cả hai | Checklist ERC (13 mục) | CHỐT | KS7:263-277 | Giữ; thêm mục kiểm footprint DNP và rule DRC (xem dưới) |
| Cả hai | Nhận dạng board B01 (DevKit) | MÂU THUẪN | KS7:23 BrijModi CP2102 Micro-USB; BOM2:9 HH004223 CP2102 USB-C; DB:10-12 mẫu Type-C CH340 chưa rõ; CS:7 + GR:7 WRL-20168; B01C:16 Beetrona 02030089; RD:11 lỗi nguồn CP2102 trên BrijModi. Thứ tự mtime 06/11: KS7 09:47 < DB 11:40 < CS 14:43, nên spec đứng trước hai lựa chọn board của user | Founder chốt 1 board (Q1). Interposer, pin map, footprint đều phụ thuộc |
| Tay cầm | Pin map GPIO | MÂU THUẪN | KS7:113-123 dùng DevKit 30 chân; WR:7 WRL-20168 có outline riêng 59,69 mm (Thing Plus) | Vẽ lại pin map sau khi chốt B01 |
| Tay cầm | Pack (nguồn tay cầm) | MÂU THUẪN | RD:15 LK37478; QD:15 'Jauch vẫn là ứng viên'; CS:7 Jauch 250832 đã duyệt làm cơ sở; AA:10 3×AA thay Jauch/H3 | Founder chốt 1 nguồn (Q2) |
| Tay cầm | Hồ sơ pack (cell/PCM/NTC/xung) | CHƯA CHỐT | QD:15; B01C:19; RD:15 | Xin NCC hoặc đổi pack (resolutions §7) |
| Tay cầm | Sạc H3 (MCP73833-FCI/MF, 2,49 kΩ) | CHỐT | R7:7; FDEC:7; tính lại 0,358–0,446 A, nom 0,402 A | Giữ |
| Tay cầm | H3 timer, NTC hở/ngắn, pack vắng, LDO test | CHƯA CHỐT | QD:13; DL:122-124 | Đo BT-H3; cần profile B15/Jauch |
| Tay cầm | UVLO tĩnh TPS3808G01 (3,266–3,417 V) | CHỐT | QD:10 'PASS phép tính tĩnh'; FB:36; tính lại 3,268–3,417 V | Giữ. Dùng biên 62 mV (DL:121) làm số thiết kế |
| Tay cầm | UVLO động và ngưỡng re-arm | CHƯA CHỐT | QD:10 'OPEN đáp ứng động'; DL:121 | Cần sụt áp xung B15 và trễ ngắt (BT-H2) |
| Tay cầm | Boost TPS61023 (FB 732k/100k, 1 µH, 10+2×22 µF) | CHỐT | KS7:71-75; FV:15 (CHỐT CÓ ĐIỀU KIỆN) | Giữ. ĐK: BT-H2 |
| Tay cầm | eFuse U6/U9 TPS259474L (ILIM, PG, ITIMER) | CHƯA CHỐT | QD:9 'chấp nhận làm ứng viên'; FB 'Đề xuất'; DL:119 | Box08 duyệt; EF cần giới hạn dòng ngược |
| Tay cầm | VBUS có kiểm soát: interposer, pass, veto | CHƯA CHỐT | QD:11 OPEN; DL:112 Claude chưa có bản vẽ interposer; DL:126-138; RD:12 | HQ đính kèm bản vẽ eLabGuy đúng revision; box08 duyệt |
| Tay cầm | Latch SW4 Q6/Q7, PG-timeout | CHƯA CHỐT | RD:13; DL:84-100 (đề xuất), DL:130; DL:145 thiếu Ciss max | Box08 duyệt; BT-H4b đo thời gian nhả |
| Tay cầm | Cách ly I/O + USB data (TMUX, TS3USB221) | MÂU THUẪN | QD:12 TMUX1574 4 kênh; TM:23 2×TMUX1511 cho 5 đường; HO:32 sáu đường gồm JOY_VCC; FV:19 '3 SEL dư' vs DL:106 '2 SEL dư' | Dùng DL:104-111 (mới nhất). Sửa FV:19. Box08 duyệt |
| Tay cầm | Ngân sách dòng USB | CHƯA CHỐT | RD:14; DL:118-120 (Micro-USB chỉ nạp, founder 07/11) | Ghi vào hướng dẫn; BT-H3 đo 0,466 A |
| Tay cầm | Connector pack | MÂU THUẪN | KS7:42 JST PH 2,0 mm 2 chân; TY:154; GR:7 JST XH 3 cực 2,50 mm (cho WRL-20168/Jauch) | Theo pack chốt ở Q2 |
| Tay cầm | MPN thụ động, USB-C suffix, LED, L, PTC | CHƯA CHỐT | FB:15-116 ghi [box03]; KS7:21; B01C:7 | Box03 chọn MPN sau lease |
| Tay cầm | BOM (58 dòng) | CHƯA CHỐT | FB:15-116: 18 Chốt, 10 Chốt-ĐK, 26 Đề xuất, 4 Giữ r6 | Chờ box08; chốt MPN |
| Tay cầm | Footprint | CHƯA CHỐT | KS7:21; PF:7 chỉ có hình học header BrijModi; DB:27 outline mẫu Type-C chưa đo | Box03 đối chiếu land pattern; cần B01 chốt |
| Tay cầm | Cơ khí / kích thước board | CHƯA CHỐT | BOM1:55 trần 100×100 mm; WR:7; B01C:17 gá RUN chưa đo | Chốt outline sau B01; đo gá (Q5) |
| Tay cầm | Stackup | MÂU THUẪN | KS7:259 giả định 2 lớp 1 oz; KS7:135 và R7:7 dùng TJ 83 °C theo bo 4 lớp; BOM1:55 stackup TBD | Founder chọn số lớp (Q4) |
| Tay cầm | Quy tắc DRC (netclass, clearance, fab) | CHƯA CHỐT | KS7:263-277 chỉ có ERC; FB:246 không có clearance/via/fab | Soạn rule sau khi chọn fab và stackup (resolutions §6) |
| Tay cầm | Bề rộng trace | CHƯA CHỐT | FB:250; KS7:129-133; tính lại 0,386/1,005 mm @1,2 A | Giữ sàng lọc; khóa sau stackup |
| Tay cầm | Netlist spec (schematic input) | CHƯA CHỐT | KS7:29-123; DL:156-165 snapshot mới chờ box08; HO:7-15 | Chờ box08 tái review |
| Tay cầm | Bench test | CHƯA CHỐT | BT:5 chạy sau khi có PCB; BT:68,90-91 tiêu chí [TBD]; RD:28 mọi kết quả UNKNOWN | Chốt tiêu chí TBD trước; đo sau mẫu |
| Robot | Pin map GPIO | CHƯA CHỐT | KS7:233-246 dựa vào DevKit 30 chân; phụ thuộc B01 | Xác nhận sau B01 |
| Robot | Pack B04 + hồ sơ | CHƯA CHỐT | R6:11 chỉ có số nhà bán; RB:136; RD:22 | Xin NCC; không chặn schematic (KS7:281). Founder Q6 |
| Robot | UVLO 6,40–6,60 V (TLV6710) | MÂU THUẪN | FV:133,135 nói TLV6710 'chưa tra datasheet' và 0,75 % sát ±0,73 %; TY:91 + DS:123 + KS7:169-172 đã tra; tính lại 6,435–6,565 V | Mâu thuẫn tài liệu, giải được (resolutions §1). Box08 duyệt FB:160 |
| Robot | BQ25886 ICHGSET | MÂU THUẪN | KS6:81 7,68 kΩ; KS7:159 1,91 kΩ; DS:77 ICHG = R/3810 Ω/A | Dùng 1,91 kΩ (resolutions §3). Xác minh PDF §8.3 |
| Robot | Chính sách sạc R5 (1,5 A/3 A, RILIM 1,24 kΩ) | CHỐT | R7:9; FDEC:9; tính lại IINDPM nom 0,895 A | Giữ |
| Robot | TS/NTC robot (0–45 °C) | CHƯA CHỐT | TY:101 đánh đổi 30–35 °C; DL:152; TY:217 chờ NCC | Founder chọn cửa sổ (Q7) |
| Robot | Motor R1 0,62 Ω ±1 % | CHỐT | R7:8; FDEC:8; tính lại ITRIP 0,256/0,323/0,391 A | Giữ. ĐK BT-R1a L ≥ 0,39 mH |
| Robot | xISEN vượt abs max khi ngắn mạch | CHƯA CHỐT | FV:28 (1,25–2,07 V > 0,5 V); TY:153 founder chấp nhận rủi ro; FB:262 | BT-ISEN và hỏi TI trước loạt |
| Robot | Phát hiện kẹt motor R2 | CHƯA CHỐT | RB:94-126; BT:120-133 ngưỡng [TBD] | Đo BT-R2; không chặn layout |
| Robot | Tụ VM + kẹp (≥220 µF hiệu dụng) | CHỐT | KS7:202; FV:29,163-169 | Giữ. ĐK BT-R1a, BT-R4 |
| Robot | TPS63070 PS/SYNC | CHƯA CHỐT | FV:145-149 CẦN FOUNDER; KS7:197 + TY:207 có R66/R67 chọn sau | Không chặn layout. Quyết sau BT-R4 |
| Robot | Latch EN_NODE, AND3 MOTOR_EN, Q_por | CHƯA CHỐT | DL:151; FB:261 'Đề xuất cần box08' | Box08 duyệt |
| Robot | VBUS pass + U16 TPS259474L DevKit | CHƯA CHỐT | DL:151; QD:11 (bản vẽ interposer) | Như tay cầm |
| Robot | Level shifter, I²C, MAX98357A, buck 5 V | CHỐT | KS7:190-213; FV:179-184 | Giữ. ĐK box08 |
| Robot | Connector pack XH (pitch) | MÂU THUẪN | KS7:167 và TY:154 ghi 'JST XH 2,54 mm'; RD:22 ghi 2,50 mm | Dùng 2,50 mm (resolutions §2) |
| Robot | BOM (77 dòng) | CHƯA CHỐT | FB:117-243: 33 Chốt, 13 Chốt-ĐK, 24 Đề xuất, 7 Giữ r6 | Chờ box08; chốt MPN |
| Robot | Footprint (RGE, RNM, PWP, RWB…) | CHƯA CHỐT | KS7:21; KS7:149 [box03] | Box03 đối chiếu land pattern TI |
| Robot | Cơ khí / kích thước board | CHƯA CHỐT | BOM1:55 trần 100×100 mm; motor/bánh BOM1:57 | Chốt outline, lỗ gá, khe motor (Q5) |
| Robot | Stackup | CHƯA CHỐT | KS7:259 2 lớp 1 oz, 'nếu box03 chọn 4 lớp, tính lại'; RB:147 TPS63070 125 °C cận trên | Founder chọn số lớp (Q4) |
| Robot | Quy tắc DRC | CHƯA CHỐT | KS7:263-277 chỉ ERC | Như tay cầm |
| Robot | Bề rộng trace | CHƯA CHỐT | FB:252-255; tính lại 1,063/2,765 mm @2,5 A | Giữ sàng lọc; khóa sau stackup |
| Robot | Netlist spec (schematic input) | CHƯA CHỐT | KS7:141-246; robot đứng sau tay cầm (CB:9) | Chờ tay cầm xong |
| Robot | Bench test | CHƯA CHỐT | BT:97-186; BT:192; RD:28 | Như tay cầm |

Ghi chú: ô 'tính lại' là phép tính độc lập của reviewer này (Python, 06/11/2026), không trích từ doc. Chi tiết ở resolutions.md.
