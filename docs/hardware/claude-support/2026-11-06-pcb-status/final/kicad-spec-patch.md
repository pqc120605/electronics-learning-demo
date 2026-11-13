# Đề xuất vá `kicad-input-spec.md` (chưa áp dụng)

> **Đã bị thay (07/11/2026).** File này chỉ vá `kicad-input-spec.md` r6 cho 4 mục ban đầu. Đầu vào KiCad hiện hành là [kicad-input-spec-r7.md](kicad-input-spec-r7.md).

File gốc: `../../2026-11-05-mobot-r6/kicad-input-spec.md`. Tôi không sửa file gốc. Bản vá chỉ gồm các mục có nhãn CHỐT CÓ ĐIỀU KIỆN trong [final-values.md](final-values.md): H-1, H-5, H-8, R-7. Mọi mục BÁC, CẦN FOUNDER và CHƯA XÁC MINH vẫn giữ `[TBD]`. Mỗi dòng đề xuất còn ghi điều kiện bench. Box08 duyệt trước khi box03 áp dụng, và r7 phải được duyệt đúng hash trước.

## H-1 · TPS61023 (dòng 42–44)

Dòng hiện tại (42):
```
| L1 | [TBD: H2, theo SLVUBP5 §3] | [TBD: H2] (dải L hiệu dụng 0,37–2,9 µH) | [TBD] | SW_BST–VPACK |
```
Đề xuất:
```
| L1 | [TBD: box03 MPN, ví dụ họ XEL4030-102ME theo SLVSF14B Bảng 8-2] | 1,0 µH ±20 %, Isat ≥ 4,5 A, DCR ≤ 20 mΩ (đỉnh tính 2,16 A ở L −30 %, VIN 3,0 V) | 4×4 mm [box03 khóa] | SW_BST–VPACK |
```

Dòng hiện tại (43):
```
| R15, R16 | [TBD: H2] | Chia áp FB cho 5,0 V [TBD: H2, VREF theo SLVSF14B §6.5] | R_0603 | V5_BST–FB_BST; FB_BST–GND |
```
Đề xuất:
```
| R15, R16 | [TBD: box03 MPN] | R15 = 732 kΩ ±1 %, R16 = 100 kΩ ±1 % → VOUT 4,742/4,950/5,165 V (VREF 580/595/610 mV, SLVSF14B §6.5) [điều kiện: BT-H2 đo V5 tại DevKit] | R_0603 | V5_BST–FB_BST; FB_BST–GND |
```

Dòng hiện tại (44):
```
| C3, C4 | [TBD: H2] | Cin, Cout theo EVM | C_0805 | VPACK–GND; V5_BST–GND |
```
Đề xuất:
```
| C3, C4 | [TBD: box03 MPN] | C3 = 10 µF 10 V X7R; C4 = 2 × 22 µF 10 V X7R (COUT hiệu dụng ≥ 4 µF sau derating, SLVSF14B §6.3) | C_0805 | VPACK–GND; V5_BST–GND |
```

## H-5 · TMUX1511 (chưa có dòng trong spec)

Spec hiện vẽ một miền I/O, không có mux. Đề xuất thêm sau dòng 51, chỉ áp dụng khi box08 chấp nhận kiến trúc 2× TMUX1511 của Codex và H-4 đã được thiết kế lại:
```
| U5, U6 | TMUX1511 [TBD: box03 package] | 4 × SPST, VDD 3,3 V | [TBD] | S/D: JOY_X, JOY_Y, JOY_SW, BTN1, BTN2 (5 kênh); SEL dư → GND; SELx ← EN_SW |
| R19–R21 | [TBD] | 10 kΩ ±1 % pull-up nút | R_0603 | JOY_SW/BTN1/BTN2 → rail miền carrier |
| R22 | [TBD] | 100 kΩ ±1 % pull-down | R_0603 | EN_SW–GND |
```
Điều kiện: BT-H4 đo SEL khi ramp/reset và rò IPOFF ≤ 10 µA tổng.

## H-8 · Net VBUS_C tay cầm (dòng 63)

Dòng hiện tại:
```
| VBUS_C | 0,5 A | IREG max 0,442 A + ISS 3 mA | 0,12 mm | 0,30 mm | ≥ 0,4 mm |
```
Đề xuất:
```
| VBUS_C | 0,5 A | IREG max 0,446 A (2,49 kΩ −1 %, +10 %) + ISS 3 mA + 2 LED ≤ 15,6 mA + detector ≤ 0,1 mA = 0,465 A [điều kiện: BT-H3 đo dòng + inrush] | 0,12 mm | 0,30 mm | ≥ 0,4 mm |
```

## R-7 · Tụ bulk VM (dòng 97)

Dòng hiện tại:
```
| C7 | [TBD: R4] | **220 µF 16 V low-ESR** | [TBD] | VM_6V–GND |
```
Đề xuất:
```
| C7 | [TBD: box03 MPN polymer/điện phân] | ≥ 220 µF **hiệu dụng** 16 V low-ESR, ESR [TBD]; Vpeak 7,38–7,61 V với L ≤ 10 mH, 0,45 A, 2 kênh [điều kiện: BT-R1a đo L, BT-R4 đo đỉnh VM] | [TBD] | VM_6V–GND |
```
Không thêm kẹp chủ động (TLV6700 + DMP3098L + 22 Ω). Đó là ĐỀ XUẤT THAY ĐỔI và đang chờ box08.

## Không vá (giữ [TBD])

H-2, H-3, H-4, H-6, H-7, R-1 đến R-6, R-8, R-9, R-10. Riêng R2 (dòng 81) vẫn ghi 7,68 kΩ là sai. Giá trị 1,91 kΩ đã được script xác nhận, nhưng R-1 bị BÁC ở mạng TS và CE. Nếu box08 muốn tách riêng RICHGSET, dòng đề xuất là:
```
| R2 | | 1,91 kΩ ±1 % → ICHG 0,422/0,501/0,582 A (ICHG = R/3810 Ω/A, ±15 %, SLUSD88A §6.5) | R_0603 | ICHGSET–GND |
```
