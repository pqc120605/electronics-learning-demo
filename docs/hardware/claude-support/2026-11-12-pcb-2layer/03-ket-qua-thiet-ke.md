# MoBot EVT0 — Kết quả Giai đoạn 4 (triển khai KiCad)

- Ngày: 13/11/2026. Người viết: Claude. Căn cứ: [02-tai-lieu-thiet-ke.md](02-tai-lieu-thiet-ke.md) bản r3, founder trả lời "duyệt".
- Công cụ: KiCad 10.0.7 tại `D:\StartupOS\.tools\kicad-10.0.7` (`kicad-cli version` → `10.0.7`), Python đi kèm KiCad (3.11.5, `pcbnew` 10.0.7).

## Kết luận

**Chưa hoàn thành. Không bo nào sẵn sàng đặt PCB.**

| Bo | Schematic | ERC | Layout | DRC |
|---|---|---|---|---|
| Tay cầm 80 × 66 mm | Xong | 0 lỗi, 0 cảnh báo | Đặt xong; đi dây còn 6 pad chưa nối | **Còn lỗi** (1 chập, 2 clearance, 3 đường trong vùng cấm, 1 chồng courtyard…) |
| Robot 90 × 70 mm | Xong | 0 lỗi, 0 cảnh báo | Đặt còn chồng linh kiện; đi dây còn 37 pad chưa nối | **Còn nhiều lỗi** (27 chập, 34 clearance, 16 chồng courtyard…) |

Tôi dừng theo điều kiện "ERC/DRC còn lỗi sau 3 vòng sửa": tay cầm đã qua 6 lượt đi dây (vượt giới hạn 3 vòng — tôi đã chạy quá số vòng cho phép trước khi dừng), robot 1 lượt. **Gerber trong `gerber/` là của bản còn lỗi, không được gửi đi sản xuất.**

Nguyên nhân gốc: máy không có autorouter (không có Java/Freerouting, không được cài thêm), nên tôi viết một bộ đi dây lưới A* đơn giản trong `kicad/tools/mobot_build.py`. Nó không có rip-up/thử lại và bộ xếp linh kiện chỉ xếp theo hàng trong vùng; với IC chân 0,5 mm và mật độ của robot thì không đủ.

## File đã tạo

| Đường dẫn | Nội dung |
|---|---|
| `kicad/handset/mobot-handset.kicad_pro`, `.kicad_sch`, `.kicad_pcb` | Project tay cầm (89 linh kiện, 83 net kể cả net "unconnected") |
| `kicad/robot/mobot-robot.kicad_pro`, `.kicad_sch`, `.kicad_pcb` | Project robot (139 linh kiện, 114 net) |
| `kicad/*/mobot.kicad_sym`, `sym-lib-table`, `fp-lib-table` | Thư viện symbol sinh tự động và bảng thư viện của project |
| `kicad/*/bom.csv`, `pos.csv` | BOM gộp theo giá trị/footprint/MPN/DNP; file vị trí linh kiện (mm) |
| `kicad/lib/mobot.pretty/Texas_RNM0015A_VQFN-15_2.5x3mm.kicad_mod` | Footprint TPS63070, tự dựng theo bản vẽ TI 4222000/B trong SLVSC58B |
| `kicad/lib/mobot.pretty/PinSocket_1x15_Alt3Rows_22.86_25.40_27.94.kicad_mod` | Hàng socket phải của DevKit với 3 vị trí dự phòng |
| `kicad/tools/mobot_build.py`, `design_handset.py`, `design_robot.py` | Bộ sinh và netlist nguồn. Chạy: `python.exe mobot_build.py handset` (Python của KiCad) |
| `reports/{handset,robot}-erc.rpt`, `-drc.rpt`, `-build.log`, `-route-log.txt` | Báo cáo nguyên văn |
| `gerber/{handset,robot}/` | 8 lớp Gerber + `PTH.drl`, `NPTH.drl`, `.gbrjob` — **của bản còn lỗi** |
| `images/{handset,robot}-pcb-top.png`, `-pcb-bottom.png` | Render 3D hai mặt |

## Kết quả ERC (nguyên văn)

Lệnh: `kicad-cli sch erc --severity-all --format report`.

```
handset-erc.rpt: ** ERC messages: 0  Errors 0  Warnings 0
robot-erc.rpt:   ** ERC messages: 0  Errors 0  Warnings 0
```

Giới hạn của kết quả này: mọi chân trong symbol sinh tự động đều khai báo kiểu `passive`, nên ERC **không** kiểm được xung đột ngõ ra–ngõ ra hay chân nguồn không được cấp. ERC chỉ xác nhận không có chân hở chưa đánh dấu và không có nhãn treo. Schematic ở dạng "mỗi chân một nhãn net", đúng về kết nối nhưng không phải bản vẽ nguyên lý trình bày để đọc.

## Kết quả DRC (nguyên văn)

Lệnh: `kicad-cli pcb drc --severity-all --schematic-parity --format report --units mm`. Luật trong `.kicad_pro`: clearance 0,15 mm, đường tối thiểu 0,2 mm, via 0,6/0,3 mm, lỗ tối thiểu 0,3 mm, khoảng cách lỗ–đồng 0,15 mm.

### Tay cầm

```
** Found 92 DRC violations **
** Found 6 unconnected pads **
** Found 0 Footprint errors **
     51 [silk_over_copper]
     31 [silk_overlap]
      6 [unconnected_items]
      3 [items_not_allowed]
      2 [clearance]
      1 [track_dangling]
      1 [starved_thermal]
      1 [solder_mask_bridge]
      1 [shorting_items]
      1 [courtyards_overlap]
```

Nhật ký đi dây: `parts 89 nets 83 tracks 1048 vias 145 failed 5 time 134s` — không nối được `PG_L U4.7`, `EN_BB U1.5`, `VBAT_SW U1.4`, via GND cho `D1.1`, `C13.2`.

Các lỗi mức error và nguyên nhân:

| Lỗi | Vị trí | Nguyên nhân |
|---|---|---|
| `shorting_items` /V3V3_BB – /UV_HYS, 2 `clearance`, `courtyards_overlap`, `solder_mask_bridge` | R6 đè lên U1 tại (32,9; 33,7) | R6 và Q2 (đều DNP) bị tràn vùng đặt ở lượt cuối |
| 3 `items_not_allowed` | Đường /R3_G trên B.Cu tại y = 15,05 mm | Bộ đi dây thu nhỏ vùng cấm anten 0,3 mm thay vì nới ra; đường chạy sát mép vùng cấm |
| 6 `unconnected_items` | U1 chân 4 (VIN) và 5 (EN), U4 chân 7, cùng các đảo GND | Chân IC bước 0,5 mm bị vây kín; U1 chưa có nguồn vào nên **mạch không chạy được** ở trạng thái này |

82 cảnh báo silkscreen là chữ refdes/giá trị chồng lên pad hoặc lên nhau; chưa xử lý.

### Robot

```
** Found 267 DRC violations **
** Found 37 unconnected pads **
** Found 0 Footprint errors **
     82 [silk_over_copper]
     65 [silk_overlap]
     37 [unconnected_items]
     34 [clearance]
     27 [solder_mask_bridge]
     27 [shorting_items]
     16 [courtyards_overlap]
     12 [drill_out_of_range]
      2 [starved_thermal]
      1 [track_dangling]
      1 [items_not_allowed]
```

Nhật ký đi dây: `parts 139 nets 114 tracks 1592 vias 258 failed 34 time 460s`. Bộ xếp báo tràn vùng dưới DevKit: `Q2`, `R16`, `R17`, `C9`.

- 27 chập, 34 clearance, 16 chồng courtyard: phần lớn do linh kiện tràn vùng đặt đè lên nhau (vùng dưới DevKit) sau khi tôi thêm lề 1 mm quanh mỗi IC. Tôi chưa phân loại từng lỗi.
- 12 `drill_out_of_range`: via tản nhiệt 0,2 mm có sẵn trong footprint thư viện `HTSSOP-16…_ThermalVias` của DRV8833, nhỏ hơn mức 0,3 mm founder yêu cầu.
- 34 kết nối không đi được, gồm cả net nguồn (`VM_6V`, `V5`, `V3V3_C`, `VBUS_CHG`, `VAA2`) và các net của BQ25886.

**`Found 0 Footprint errors` ở cả hai bo** nghĩa là kiểm tra đối chiếu schematic–PCB (`--schematic-parity`) không còn sai lệch: mọi linh kiện, footprint và net trên bo khớp schematic.

## Sai lệch so với tài liệu đã duyệt (r3)

| Mục | r3 | Thực hiện | Lý do |
|---|---|---|---|
| Joystick tay cầm | Linh kiện Alps RKJXV hàn trực tiếp | Header 1×5 (J6, J7) cho module KY-023 | Thư viện KiCad không có footprint RKJXV và tôi không có bản vẽ hãng để dựng |
| Công tắc nguồn (cả hai bo) | Công tắc trượt hàn bo | Đầu JST XH 2 chân (J9 tay cầm, J15 robot) cho công tắc rời | Không có footprint công tắc ≥ 2 A đã kiểm chứng |
| LED pin yếu tay cầm | Q3 = 2N7002 | Q3 = DMG2305UX (P-MOSFET) | LED phải sáng khi EN thấp; N-MOSFET cho logic ngược |
| Cầu JP1 robot | Ép EN lên cao | Nối SRC_CC1 xuống GND (làm Q3 tắt → EN lên) | Cách đơn giản nhất với mạch 2 MOSFET nối tiếp |
| Loa robot | J14 + loa | Bỏ J14; loa nối vào cọc của module MAX98357A | Module có sẵn cọc loa |
| Cuộn cảm | Coilcraft XEL4030 / XFL4020, 10 µH 5 × 5 | Footprint `L_Changjiang_FNR4030S`, `FNR4020S`, `L_Taiyo-Yuden_NR-50xx` | Dùng footprint cùng cỡ có trong thư viện; MPN giữ như r3 |
| Clearance | ≥ 0,2 mm | 0,15 mm | Để thoát chân IC bước 0,5 mm |
| Via tản nhiệt DRV8833 | 0,3 mm | 0,2 mm (theo footprint thư viện) | Chưa đổi footprint |
| Q2, R6 tay cầm (DNP) | Cạnh U2 | Đặt ở vùng LiPo, xa U2 | Thiếu chỗ; hiện đang đè lên U1 |
| Chân UVLO robot | "tại pack" | Đo tại VBAT_SW (sau công tắc) | Để UVLO không tiêu dòng khi tắt công tắc |
| Tụ VM robot | 220 µF polymer 8 × 8 | Footprint `CP_Elec_8x10` | Footprint gần nhất trong thư viện |

Ba thông số r3 ghi "chưa trích" đã đọc thêm trong lượt này: ngưỡng EN của TPS63070 lên 0,77–0,83 V; chân TLV62569 vỏ DBV là 1 EN, 2 GND, 3 SW, 4 VIN, 5 FB; chân TPS63070 4 GND, 9 L2, 10 PGND, 11 L1. Chưa đọc: VFB của TLV62569 và TPS63070, ngưỡng T3 của BQ25886, ngưỡng EN/MODE của TPS631000.

## Việc còn lại trước khi đặt PCB

1. **Đi dây lại cả hai bo cho đến khi DRC sạch.** Cách thực tế nhất: mở project trong KiCad và đi dây tay, hoặc dùng Freerouting (cần founder cho phép cài Java + Freerouting). Bộ đi dây tự viết cần thêm rip-up và xếp linh kiện tốt hơn mới dùng được.
2. Robot: xếp lại vùng dưới DevKit (đang chồng); cân nhắc đặt linh kiện hai mặt hoặc nới bo. Chưa có bằng chứng 90 × 70 mm một mặt là đủ.
3. Sửa vùng cấm anten trong bộ đi dây (đang thu thay vì nới); dời Q2/R6 tay cầm.
4. Đối chiếu footprint tự dựng `Texas_RNM0015A` với bản vẽ TI trên giấy 1:1; kiểm footprint VQFN-24 (EP 2,45 mm) và VQFN-16 (EP 1,68 mm) với datasheet BQ25886/BQ24072.
5. Kiểm thứ tự chân các module (OLED, MAX98357A, HC-SR04, TCRT5000, KY-023) với hàng mua được; hiện theo thứ tự phổ biến, chưa xác minh.
6. Đọc nốt bốn thông số datasheet chưa trích (mục trên).
7. Vẽ lại schematic dạng đọc được (có dây nối, khối chức năng) nếu cần cho người học hoặc cho review; khai báo đúng kiểu chân để ERC có nghĩa.
8. Review độc lập (Codex/Box 08) trên netlist: `design_handset.py`, `design_robot.py` là nguồn dễ đọc nhất.
9. Bề rộng đường nguồn: bộ đi dây thu về 0,2 mm tại mọi chân nhỏ hơn bề rộng lớp; cần kiểm lại từng đoạn nguồn sau khi đi dây xong.
10. Đối chiếu khả năng của nhà sản xuất PCB (via 0,3/0,6, clearance 0,15) trước khi xuất Gerber cuối.

## Báo cáo Giai đoạn 4

- Đã làm: viết bộ sinh schematic + đặt + đi dây; sinh hai project KiCad; chạy ERC, DRC, xuất BOM, vị trí, Gerber, drill, render.
- Lệnh đã chạy và kết quả: `kicad-cli sch erc` (0 vi phạm cả hai); `kicad-cli pcb drc --schematic-parity` (tay cầm 92 vi phạm + 6 chưa nối; robot 267 + 37; parity 0 cả hai); `kicad-cli sch export bom`, `pcb export pos/gerbers/drill`, `pcb render` (đều báo thành công).
- Chưa kiểm chứng: tính đúng điện của netlist chưa được ai review; footprint tự dựng; mọi mục [chưa xác minh] của r3; ảnh render robot tôi chưa mở xem; Gerber chưa mở bằng trình xem Gerber.
- Không đặt hàng, không gửi file ra ngoài, không commit.
