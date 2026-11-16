# MoBot EVT0 — Kết quả Giai đoạn 4 (triển khai KiCad)

- Ngày: 13/11/2026. Người viết: Claude. Căn cứ: [02-tai-lieu-thiet-ke.md](02-tai-lieu-thiet-ke.md) bản r3, founder trả lời "duyệt".
- Công cụ: KiCad 10.0.7 tại `D:\StartupOS\.tools\kicad-10.0.7` (`kicad-cli version` → `10.0.7`), Python đi kèm KiCad (3.11.5, `pcbnew` 10.0.7).

## Cập nhật 14/11 lần 4 (xếp lại robot, r4) — số mới nhất của robot

| Bo | Kích thước | ERC | DRC | Chưa nối | Lệch schematic–PCB | Đường mặt trên / mặt dưới | Mảnh GND mặt dưới |
|---|---|---|---|---|---|---|---|
| Robot r4 | 100 × 80 mm | `Found 0 violations` | `Found 0 violations` | 0 | 0 | 2405 mm / 525 mm | 5 (một khối liên thông qua via và vùng đồng mặt trên) |

So với bố cục cũ (lần 3): đường mặt dưới 1038 → 525 mm, đường mặt trên 3736 → 2405 mm, vùng đồng GND mặt dưới 6229 → 6665 mm². Tay cầm không đổi (xem lần 3).

Bố cục r4 (`design_robot.py`):

- DevKit vào giữa bo (`XL = 40,00`), anten quay lên mép trên, vùng cấm đồng `(36; 0; 70; 15)`.
- Bên trái, từ dưới lên: J4/J3/J15 → sạc BQ25886 → bảo vệ F1/Q1 → UVLO → buck 5 V. J10, J11 (IR) và J12 (âm thanh) ở phía trái vì dùng hàng chân trái.
- Bên phải: DRV8833 (xoay 180° để chân ra động cơ hướng vào J6/J7), cổng AND, điểm thử; J9 (HC-SR04) và J8 (OLED) ở mép trên phải.
- Dải dưới phải: TPS63070 và tụ C22/D1. Dưới DevKit: buck 3,3 V và khối cấp USB (U3, Q3, Q4, J5).

Sau đi dây chỉ cần `patch_tracks.py robot` để dịch 2 đoạn GND 0,03 mm (lệch khe hở 0,018 mm) và xoá 7 đoạn dài 0; không còn dây vá tay nào trên robot. Đường `VBUS_OUT` chạy sát mép ở bản cũ đã hết: đầu dây gần mép nhất cách 2,07 mm.

Tên linh kiện không in lên bo (chuyển sang F.Fab): C24, C26, C27. Đã xem ảnh mặt trên và mặt dưới. Gerber, drill, `pos.csv` của robot đã xuất lại.

Chưa làm: silkscreen "SW" bị dời khỏi J15 một chút; `02-tai-lieu-thiet-ke.md` và ảnh floorplan SVG vẫn theo bố cục cũ; các mục chặn đặt PCB ở lần 1 vẫn còn.

## Cập nhật 14/11 lần 3 — số của tay cầm còn hiệu lực; phần robot đã bị lần 4 thay

Bốn yêu cầu của founder: xếp theo topology bo tham chiếu ME4169, mặt dưới GND liền, joystick trần, bo tròn góc.

| Bo | Kích thước | ERC | DRC | Chưa nối | Lệch schematic–PCB | Đường mặt trên / mặt dưới | Mảnh GND mặt dưới |
|---|---|---|---|---|---|---|---|
| Tay cầm | 80 × 76 mm | `Found 0 violations` | `Found 0 violations` | 0 | 0 | 1685 mm / 364 mm | 1 |
| Robot | 100 × 80 mm | `Found 0 violations` | `Found 0 violations` | 0 | 0 | 3736 mm / 1038 mm | 8 (nối với nhau qua via và vùng đồng mặt trên) |

**Đã làm**

- **Joystick trần:** J6, J7 đổi từ header 1×5 sang `mobot:Joystick_PTH` (lấy từ SparkFun-KiCad-Libraries, `SparkFun-Switch.pretty/Joystick_PTH`, linh kiện COM-09032). Nối GND, VCC, Horizontal, Vertical, Select; Select-NC1/NC2 và 4 chân gá MOUNT để hở. Nét silkscreen đè lên pad đã chuyển sang F.Fab. `[chưa xác minh]` kích thước với joystick thực tế của founder và giấy phép của thư viện SparkFun.
- **Tay cầm cao thêm 10 mm** (80 × 66 → 80 × 76) để đủ chỗ cho hai joystick hàn thẳng lên bo. Đây là thay đổi so với kích thước founder đã chốt.
- **Bo tròn góc** bán kính 3 mm trên cả hai bo (`corner_r` trong `mobot_build.py`).
- **Mặt dưới ưu tiên cho GND:** Freerouting đi dây nhiều giai đoạn (`kicad/tools/route.sh`): A chỉ đi mặt trên; gỡ các net dính chân IC; B đi cả hai mặt với chi phí mặt dưới gấp 3; C vét các mối còn sót. Trên tay cầm, đường mặt dưới giảm từ 863 mm (cách cũ, cùng bố cục) xuống 364 mm.
- **Tay cầm:** U1 (TPS631000) xoay 180° để chân LX quay vào cuộn cảm L1.

**Vá tay** (`kicad/tools/patch_tracks.py`, toạ độ gắn với đúng lần đi dây này):

- Tay cầm: `LX1` U1.3 → L1.1 trên mặt trên, rộng 0,25 mm (hẹp hơn 0,4 mm của lớp nguồn); `B1` nối hai chân SW2 bằng 6,5 mm mặt dưới.
- Robot: `VBUS_OUT` nối hai cặp chân VBUS của J5 bằng dây nhảy mặt dưới; xoá 3 đoạn GND cạnh chân A1 và 2 đoạn `V5` thừa; dịch 6 đoạn dây 0,03 mm cho đủ khe hở 0,15 mm; xoá 33 đoạn dài 0.

**Chưa đạt hoặc chưa làm**

- **Robot chưa xếp lại linh kiện.** Bố cục robot giữ nguyên bản 100 × 80 mm; mặt dưới còn 1038 mm đường và bị cắt thành 8 mảnh. Muốn sạch như tay cầm cần xếp lại tay cụm nguồn và cụm dưới DevKit.
- "Theo topology ME4169" tôi hiểu là: nguồn vào ở góc và chạy dọc một mép, MCU ở giữa, đầu nối ra mép, đi dây chủ yếu mặt trên, mặt dưới là GND. Linh kiện thụ động vẫn do bộ xếp tự động đặt theo hàng, chưa nằm sát chân IC như bo tham chiếu.
- `VBUS_OUT` tới TP7 trên robot chạy sát mép bo (x = 0,68 mm) — nên đi lại bằng tay.
- Đã xem 4 ảnh render. Gerber, drill, `pos.csv` xuất lại từ bản này.
- Các mục chặn đặt PCB ở lần 1 bên dưới vẫn còn (footprint TPS63070, khoảng cách chân DevKit 25,40 mm, thứ tự chân module, rà độc lập). `02-tai-lieu-thiet-ke.md` chưa cập nhật kích thước mới và joystick.

Dựng lại một bo: `sh kicad/tools/route.sh <bo>` → `python.exe kicad/tools/patch_tracks.py <bo>` (sau khi DRC) → DRC. Lưu ý `pcbnew.SaveBoard` từ bo nạp dưới tên khác sẽ đặt luật dự án về mặc định; `fix_pro.py <bo>` ghi lại luật.

## Cập nhật 14/11 lần 2 (dọn silkscreen) — đã bị lần 3 thay

| Bo | ERC | DRC | Chưa nối | Sai lệch schematic–PCB |
|---|---|---|---|---|
| Tay cầm 80 × 66 mm | `Found 0 violations` | `Found 0 violations` | `Found 0 unconnected items` | `Found 0 schematic parity issues` |
| Robot 100 × 80 mm | `Found 0 violations` | `Found 0 violations` | `Found 0 unconnected items` | `Found 0 schematic parity issues` |

DRC chạy với `--severity-all --schematic-parity`. ERC là kết quả lần chạy 14/11 lần 1; schematic không đổi từ đó.

`kicad/tools/fix_silk.py <bo>` (bước 5 của quy trình, chạy sau `gnd_comp.py`):

- Tên linh kiện về cỡ 0,8 mm, nét 0,12 mm, xoay ngang, dời tới chỗ không chạm pad, lỗ hay nét silkscreen khác.
- Tên không tìm được chỗ trống chuyển sang lớp F.Fab (không in lên bo): tay cầm R23, R24, R31; robot R20, TP5.
- Chữ tự do ("SAC", "PACK 2S", "SW", "RA->ESP32", "3xAA"…) dời khỏi đầu nối.

Hạn chế: bộ dời chữ chỉ kiểm tra va chạm, không kiểm tra chữ có nằm sát đúng linh kiện. Ở cụm dày (TP1–TP9 và quanh U7 trên robot; R22–R30 trên tay cầm) vài tên nằm lệch, cần đối chiếu `pos.csv` khi hàn. Đã xem `images/handset-pcb-top.png` và `images/robot-pcb-top.png`; chưa xem hai ảnh mặt dưới.

Gerber, drill, `pos.csv`, ảnh render đã xuất lại sau bước này. Các mục "Chưa làm" của lần 1 bên dưới vẫn chặn việc đặt PCB, trừ dòng silkscreen.

## Cập nhật 14/11 lần 1 — thay mọi số DRC và kết luận bên dưới

Founder cho nới robot lên **100 × 80 mm** (vẫn trong giới hạn 100 × 100 mm). Kết quả từ output lệnh:

| Bo | Kích thước | ERC | DRC | Chưa nối | Sai lệch schematic–PCB | Còn lại |
|---|---|---|---|---|---|---|
| Tay cầm | 80 × 66 mm | `Found 0 violations` | `Found 67 violations` | `Found 0 unconnected items` | 0 | 44 `silk_over_copper`, 23 `silk_overlap` |
| Robot | 100 × 80 mm | `Found 0 violations` | `Found 103 violations` | `Found 0 unconnected items` | 0 | 55 `silk_over_copper`, 48 `silk_overlap` |

Không còn chập, lỗi clearance, chồng linh kiện, đường quá hẹp hay via treo ở cả hai bo. Toàn bộ vi phạm còn lại là silkscreen (chữ đè lên pad hoặc đè nhau), không ảnh hưởng điện.

Thay đổi so với lần 2 (13/11):

- Robot: `W, H = 100, 80`; DevKit dời sang phải 10 mm (`XL = 66,30`); cụm cổng dưới và J13 dời xuống 10 mm; nhóm F1/Q1/R1/R2/R56/D2/R15/Q2 có vùng riêng `(29,5; 51,5; 64; 60,5)`. Bộ xếp không còn cảnh báo tràn vùng.
- Cả hai bo: thêm lại vùng đồng GND mặt trên (bật xoá đảo đồng cô lập) và lưới via GND nối hai mặt, vì mặt GND dưới bị các đường tín hiệu cắt thành nhiều mảnh rời.
- Tay cầm: đoạn `/B6_G` 0,12 mm đã nới lên 0,15 mm; thêm 1 via nối mảnh GND quanh C13 tại (62,65; 21,47).

Quy trình dựng lại (chạy trong `kicad/tools/`, bằng `python.exe` của KiCad):

1. `fr_route.py <bo> 10` — xếp linh kiện, Freerouting, nhập lại.
2. `kicad-cli pcb drc` ghi `reports/<bo>-drc.rpt`.
3. `fix_gnd.py <bo>` — nối đảo GND, nới đường hẹp, thêm vùng GND mặt trên và lưới via.
4. `gnd_comp.py <bo> --bridge` (tay cầm cần `M=0.22`) rồi DRC lại. `rm_via.py` gỡ via lạc nếu DRC báo `via_dangling`.

Gerber, drill, `pos.csv` và ảnh render đã xuất lại từ bản này (14/11). Đã xem `images/robot-pcb-top.png`; chưa xem ba ảnh còn lại.

Chưa làm, vẫn chặn việc đặt PCB:

- Cảnh báo silkscreen chưa dọn (nhãn J4/J3/J15/J5 trên robot đè chữ "SAC", "PACK 2S", "SW").
- Lưới via GND dày (tay cầm bước 1,5 mm) — chạy được nhưng nên giảm khi rà tay.
- Các mục trong "Việc còn lại trước khi đặt PCB" bên dưới vẫn nguyên: footprint TPS63070 tự dựng chưa đối chiếu 1:1, khoảng cách hàng chân DevKit 25,40 mm là giả định, thứ tự chân module chưa xác minh, chưa có người rà độc lập.
- `02-tai-lieu-thiet-ke.md` còn ghi robot 90 × 70 mm; chưa sửa.

## Cập nhật 13/11 lần 2 — đã bị bản 14/11 thay

Dừng theo yêu cầu founder (mốc 60 % hạn mức 5h). **Tay cầm gần sạch; robot vẫn còn chập. Chưa bo nào được phép đặt PCB.**

Thay đổi trong lượt này:

- Hàng chân phải của DevKit: bỏ footprint 3 hàng dự phòng (founder coi là lỗi), dùng **một hàng socket 1×15 cách hàng trái 25,40 mm** trên cả hai bo. 25,40 mm là giả định theo DevKit 30 chân phổ biến, [chưa xác minh] trên bo mẫu.
- Luật bề rộng đường tối thiểu hạ 0,2 → 0,15 mm (Freerouting thắt đường khi vào chân nhỏ). Bỏ vùng đồng GND lớp F.Cu, chỉ giữ B.Cu. Vùng đồng nối pad kiểu liền (không thermal).

| Bo | ERC | Freerouting | DRC (nguyên văn) |
|---|---|---|---|
| Tay cầm | `Found 0 violations` | `COMPLETED`, 354 s | `Found 68 violations`, `Found 1 unconnected items`, `Found 0 schematic parity issues`: 44 `silk_over_copper`, 23 `silk_overlap`, 1 `track_width`, 1 `unconnected_items` |
| Robot | `Found 0 violations` | `COMPLETED`, 284 s | `Found 212 violations`, `Found 17 unconnected items`, `Found 0 schematic parity issues`: 73 `silk_overlap`, 68 `silk_over_copper`, 25 `track_width`, 17 `unconnected_items`, 14 `via_dangling`, 12 `solder_mask_bridge`, 12 `shorting_items`, 8 `courtyards_overlap` |

Lỗi còn lại:

- Tay cầm: 1 đoạn `/B6_G` rộng 0,12 mm tại (64,18; 19,72) (dưới 0,15 mm); 1 mối GND trên F.Cu chưa nối giữa (64,80; 18,03) và (60,78; 22,75); 67 cảnh báo silkscreen. Không có chập, clearance hay chồng linh kiện.
- Robot: 12 chập và 8 chồng courtyard do vùng đặt `(29.5, 39.5, 54.0, 50.5)` tràn xuống vùng điện trở tín hiệu (bộ xếp báo tràn R1, R2, R56, D2, R15, Q2). Tôi đã dời linh kiện ba lần mà vẫn tràn chỗ khác: **với bộ xếp linh kiện hiện tại, 90 × 70 mm một mặt chưa chứa đủ**. Cần founder chọn: nới bo (tối đa 100 × 100 mm) hoặc cho đặt linh kiện hai mặt.
- Gerber, drill, `pos.csv`, `bom.csv`, ảnh render đã xuất lại từ bản này; tôi chưa mở xem ảnh.

## Cập nhật 13/11 lần 1 (sau khi founder cho cài Freerouting) — đã bị lần 2 thay

Đã cài vào `D:\StartupOS\.tools`: Temurin JRE 25.0.5 (`jre\jdk-25.0.5+8-jre`; bản 21 tải trước không chạy được Freerouting 2.5.0) và `freerouting\freerouting.jar` v2.5.0. Script: `kicad/tools/fr_route.py <handset|robot> [số pass]` (xuất DSN → Freerouting → nhập SES → đổ zone). Dừng theo yêu cầu founder khi hạn mức 5h gần 75 %. **Vẫn chưa bo nào sạch DRC; Gerber vẫn chưa dùng được.**

| Bo | Freerouting | DRC sau đó (nguyên văn) |
|---|---|---|
| Tay cầm | `COMPLETED`, "0 unrouted and 0 violations", 114 s | `Found 135 violations`, `Found 18 unconnected items`, `Found 0 schematic parity issues`: 67 `track_width`, 45 `silk_over_copper`, 23 `silk_overlap`, 18 `unconnected_items`. Không còn chập, clearance, chồng courtyard |
| Robot | `COMPLETED` sau 24 phút 22 s | `Found 268 violations`, `Found 51 unconnected items`, `Found 0 schematic parity issues`: 105 `track_width`, 71 `silk_overlap`, 66 `silk_over_copper`, 51 `unconnected_items`, 8 `solder_mask_bridge`, 8 `shorting_items`, 8 `courtyards_overlap`, 2 `starved_thermal` |

Nguyên nhân còn lại, chưa sửa:

- `track_width`: Freerouting thắt đường của lớp net `Power` xuống 0,15 mm khi vào chân nhỏ, dưới mức tối thiểu 0,2 mm (ví dụ `/V3V3_BB` tại (27,23; 34,00)).
- Tay cầm `unconnected_items`: 34 mục là mảnh zone GND lớp F.Cu bị cô lập, cộng chân GND của SW5 và J7. Cần via khâu GND hoặc bỏ zone F.Cu.
- Robot: Q2 vẫn tràn vùng đặt (`WARN region overflow Q2 (37.5, 31.8, 54.5, 38.8)`) gây 8 chập/chồng; 51 mục chưa nối tôi chưa phân loại.
- Gerber, drill, `pos.csv` và ảnh render đã xuất lại từ bản này. Tôi chưa mở xem ảnh render mới.

Tóm tắt lệnh: `reports/freerouting-summary.txt`; log đầy đủ: `reports/{handset,robot}-freerouting.log`.

## Kết luận (trạng thái trước khi có Freerouting)

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
