# Các mục tự giải được · MoBot V2 r7 (06/11/2026)

Chỉ đọc. Mã nguồn như `gate-matrix.md`. Mỗi mục có giá trị, cơ sở và cách kiểm chứng. "Tính lại" là phép tính độc lập bằng Python của reviewer này, không phải trích từ doc. Mọi thông số datasheet lấy qua doc của repo, tôi chưa mở PDF gốc: ghi `[chưa kiểm chứng PDF]`.

## 1. UVLO robot 6,40–6,60 V (mâu thuẫn FV:135 và TY:91)

- **Mâu thuẫn:** FV:135 nói TLV6710 "chưa được tra datasheet" và 0,75 % "sát giới hạn ±0,73 %". TY:91, DS:123 và KS7:169-172 đã dùng TLV6710 INA với VIT− 397/400/403 mV.
- **Giá trị:** R3 180 kΩ, R4 11,1 kΩ, R5x 2,84 MΩ song song R3 khi cho phép (tất cả 0,1 %). Tỉ số danh nghĩa 16,25. Tính lại V_fall **6,435–6,565 V** (VIT− 397–403 mV, ISENSE ±25 nA). Doc ghi 6,418–6,582 V, rộng hơn vì tính thêm sai số khác. Cả hai nằm trong 6,40–6,60 V.
- **Cơ sở:** ±0,73 % ở FV:134 được suy cho TLV6700 với Thevenin tới 100 kΩ. Với Thevenin 10,5 kΩ, sai số điện trở khoảng 0,19 % và dòng rò khoảng 0,07 %. Cửa sổ founder ±1,55 % còn lại cho IC khoảng ±1,29 %, nên ±0,75 % của TLV6710 đạt. TLV6700 vẫn FAIL. Không mở lại quyết định founder.
- **Kiểm chứng:** (a) mở SNVSAV4B §7.5, xác nhận VIT− INA 397/400/403 mV; (b) chạy `calc_r7.py` hàm `r2_uvlo`; (c) box08 duyệt FB:160; (d) bench: hạ nguồn pack 8,4 V xuống 6,0 V, đo EN_NODE. Sửa FV:135 ở lần cập nhật tới.

## 2. Pitch JST XH là 2,50 mm, không phải 2,54 mm

- **Lỗi:** KS7:167 và TY:154 ghi "JST XH 2,54 mm". RD:22 ghi đúng 2,50 mm.
- **Giá trị:** footprint pack robot là JST XH 2,50 mm, 2 chân (ví dụ B2B-XH-A). Dùng 2,54 mm sẽ lệch khoảng cách lỗ so với đầu cắm thật. Tay cầm PH 2,0 mm giữ nguyên nếu pack là LK37478 (KS7:42). Nếu chọn Jauch thì GR:7 yêu cầu XH 3 cực 2,50 mm.
- **Kiểm chứng:** đối chiếu bản vẽ JST XH; ghép thử với đầu cắm thật của pack B04; tên footprint trong thư viện KiCad 10 `[chưa kiểm chứng]`.

## 3. BQ25886 ICHGSET: dùng 1,91 kΩ, bỏ 7,68 kΩ

- **Mâu thuẫn:** KS6:81 ghi 7,68 kΩ. KS7:159 ghi 1,91 kΩ. DS:77: `ICHG = RICHGSET / 3810 Ω/A`, dải 114 Ω (30 mA) đến 8 kΩ (2,2 A).
- **Giá trị:** 1910 / 3810 = 0,501 A. Với IC ±15 % và R ±1 %: **0,422–0,582 A**. Theo cùng công thức, 7,68 kΩ cho 2,02 A, nên KS6:81 sai. 114 Ω ra 29,9 mA, khớp dải. 8 kΩ ra 2,10 A trong khi doc ghi 2,2 A: chênh 5 %, `[chưa kiểm chứng PDF]`.
- **RILIM:** 1110 / 1240 = 0,895 A danh nghĩa (KILIM 1110 A·Ω ở RB:236). Khớp R7:9.
- **Kiểm chứng:** SLUSD88A §8.3 và SLUUC11 §4.3 BOM (RICHGSET); bench BT-R5 đo ICHG.

## 4. Biên UVLO tay cầm: dùng 62 mV

- **Mâu thuẫn nhỏ:** QD:10 ghi 3,266 V và 65,8 mV. DL:121, HO:40, RD:15 ghi 3,262 V và 62 mV.
- **Tính lại:** R7 72,3 kΩ, R8 9,20 kΩ, R9 866 kΩ (0,1 %), VIT 0,405 V ±2 %, ISENSE ±25 nA cho **3,268–3,417 V**. Biên tới 3,20 V là 68 mV khi chưa tính sai số phụ.
- **Chọn:** lấy số nhỏ nhất của doc (62 mV) làm biên thiết kế. Biên này chỉ còn lại cho sụt áp xung của B15 và trễ ngắt. Chưa chứng minh được cutoff động ≥ 3,20 V (QD:10).
- **Kiểm chứng:** chạy `calc_r7.py`; BT-H2 đo sụt áp pack lúc phát Wi-Fi.

## 5. Số liệu H3: hai khoảng khác nhau đều hợp lệ

- R7:7 ghi 0,361–0,442 A (IC ±10 %, chưa tính RPROG). KS7 và FV ghi 0,358–0,446 A (thêm RPROG ±1 %). Tính lại: nom 401,6 mA, min 357,9 mA, max 446,2 mA.
- Lượng nạp theo timer: 0,358 × 5,4 h = **1,93 Ah** (QD:13). HS:157 ghi 1,95 Ah vì dùng 0,361 A. Không mâu thuẫn, chỉ khác chồng dung sai.
- **Chọn:** dùng 0,358–0,446 A và 1,93 Ah làm cận thiết kế. Khi lập r8, ghi rõ chồng dung sai.
- **Kiểm chứng:** BT-H3. Cần profile sạc của pack (founder Q2).

## 6. Quy tắc DRC và stackup: giá trị đề xuất, chờ chọn fab

- **Trace (tính lại, IPC-2221, 1 oz, ΔT 10 °C):** 1,2 A ngoài/trong 0,386/1,005 mm; 2,5 A 1,063/2,765 mm; 1,0 A 0,300/0,781 mm; 0,6 A 0,148/0,386 mm. Khớp FB:250-255. Hằng số k 0,048 (ngoài), 0,024 (trong) và hai số mũ 0,44, 0,725 là công thức IPC-2221 quen thuộc. Tôi chưa đối chiếu bản gốc (FB:246 cũng ghi vậy). Giữ vẽ ≥ 1,5 lần mức tính như FB:246.
- **Netclass đề xuất:** `Default` track 0,25 mm, clearance 0,2 mm. `Pwr_1A` ≥ 0,6 mm (VPACK, VBUS_C). `Pwr_2A5` ≥ 1,6 mm hoặc đổ đồng (VPACK2, KS7:252). USB D+/D− đối xứng, 90 Ω nếu stackup cho phép (KS7:111).
- **Via và khoan đề xuất:** via 0,6/0,3 mm, vòng khuyên ≥ 0,15 mm. Đây là mức phổ biến của fab mẫu nhỏ. **Fab chưa chọn nên chưa kiểm chứng.** Footprint pitch 0,4–0,5 mm (TUSB320LAI X2QFN-12, BQ25886 VQFN, TPS63070 VQFN) có thể cần rule cục bộ.
- **Điện áp:** cao nhất trên board là 8,4 V, nên clearance 0,2 mm đủ về cách điện. Không cần creepage đặc biệt `[chưa kiểm chứng chuẩn an toàn]`.
- **Kiểm chứng:** nạp file custom rules vào KiCad rồi chạy `kicad-cli pcb drc`; gửi DFM check cho fab đã chọn.
- **Stackup:** không tự chốt được vì liên quan chi phí. Xem founder Q4. TJ 83 °C của MCP73833 (R7:7) chỉ đúng với bo 4 lớp JEDEC (HS:171). Bo 2 lớp nóng hơn, chưa có số `[chưa kiểm chứng]`.

## 7. Phần tôi không tự giải được

- **Interposer eLabGuy Rev. 1.1:** DL:112 xác nhận Codex đã kiểm vị trí jumper, nhưng Claude chưa có bản vẽ. HQ cần đính kèm; không suy được từ datasheet.
- **Hồ sơ pack B15/Jauch/B04:** danh sách 7 mục cần xin ở HS:44-54.
- **Đo motor #992 (L, R):** BT-R1a, chạy được ngay, không cần PCB (BT:5).

## 8. Dọn tài liệu để khỏi vẽ nhầm

| Việc | Chỗ sai | Sửa |
|---|---|---|
| Trỏ về spec r6 | `claude-support/2026-11-05-mobot-r6/codex-handoff.md:57,72` vẫn dùng `kicad-input-spec.md` §1 và §2 | Trỏ sang `kicad-input-spec-r7.md` (KS7:3 đã ghi thay thế) |
| "3 SEL dư" | FV:19 | 2 SEL dư (DL:106) |
| Tay cầm dùng TLV6700, robot 1,5 MΩ/97,6 kΩ | KS6:31, KS6:87-88 | TPS3808 (KS7:44) và TLV6710 180k/11,1k (KS7:169-172) |
| Số đường I/O | QD:12 (TMUX1574, bốn đường), TM:5 (năm đường) | Sáu đường gồm JOY_VCC, 2× TMUX1511 (DL:104-111, HO:32) |
| Ngày tháng | Nội dung AR, DL, KS7 ghi 07/11; mtime tệp là 06/11 (09:47–09:50, AR 02:43); giờ hệ thống 06/11 16:08 | HQ kiểm lại nhãn ngày trước khi dùng AR làm bằng chứng duyệt |

## 9. Không chặn layout, chỉ cần ghi nhận

- **TPS63070 PS/SYNC:** KS7:197 chừa R66 (power-save, lắp) và R67 (forced PWM, DNP). BT-R4 quyết sau mà không phải làm lại PCB. Datasheet không nói rõ dòng âm ở power-save (TY:113) `[chưa kiểm chứng]`.
- **xISEN:** founder chấp nhận rủi ro mẫu đầu (TY:153). Footprint Schottky D3/D4 DNP (KS7:207). BT-ISEN và câu hỏi gửi TI trước khi sản xuất loạt.
- **Micro-USB chỉ để nạp firmware:** founder chốt (DL:118). Ghi vào hướng dẫn người dùng.
