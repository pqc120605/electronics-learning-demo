# P0-11 — H3 và OFF: phân tích sau r12

Phạm vi là proposal trên giấy. r12 SHA256 `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b` giữ nguyên. Không chọn MPN, gán GPIO, sửa cổng hoặc tạo schematic/CAD/FE/lease. Phép tính tái lập trong `docs/agents/runs/MM-HW-P0-11/calculate.py`, kết quả ở `calculations.json`.

## H3: reference chính xác hơn, nhưng chưa có full error budget

REF33 SBOS392I p6 có initial error ±0,15% và drift MAX 30 ppm/°C. Với excursion 165°C bảo thủ, riêng reference tại 4,0962 V đã có sai số ±26,42049 mV, vượt nửa cửa sổ 13,8 mV. Không tiếp tục khép detector bằng REF33 dưới yêu cầu toàn nhiệt hiện tại; đây là kết luận sàng lọc, chưa thay r12.

Phương án nghiên cứu dùng reference 2,500 V thuộc lớp ADR4525B, với TLV3201 làm comparator minh họa. Nguồn hãng ADR45 Rev G, tháng 07/2025, p4/p33 đã đọc qua web:
https://www.analog.com/media/en/technical-documentation/data-sheets/adr4520_4525_4530_4533_4540_4550.pdf

Tải PDF cục bộ hai lần bị timeout, nên đã dừng retry. **ADR45 chưa được ghim bytes, không dùng làm bằng chứng đóng cổng.** Cột TYP/MAX của solder shift ±0,02% chưa xác minh được bằng ảnh; dùng một allowance giả định riêng, không gọi là guarantee.

Worksheet reference dùng initial 200 ppm, box drift 330 ppm, line 120 ppm bảo thủ trên toàn 3–15 V và load 1,2 ppm nếu dòng có dấu không quá 10 µA. Mỗi kênh cần reference/sense/cutoff độc lập; nguồn chung vẫn phải phân tích lỗi chung.

Divider nominal Rt = 6384,8 Ω và Rb = 10000 Ω chỉ là tỷ số phân tích. Yêu cầu từng điện trở: initial ±0,005%, |TC| ≤1 ppm/°C và displacement ≤100°C, cho tổng ±150 ppm. Chưa có part/network và dữ liệu tuổi thọ chứng minh đáp ứng. Kmin = 1,638288485; Kmax = 1,638671573.

TLV3201 SBOS561C p5 có offset toàn nhiệt ±4 mV và bias 5 nA; thêm sense leakage 100 nA là allocation. Nguồn comparator 4,75–5,25 V là yêu cầu đề xuất. CMRR 60 dB và PSRR 65 dB trong bảng mặc định 25°C chỉ được dùng có điều kiện, chưa được chứng minh toàn nhiệt. Hysteresis 1,2 mV là TYP, không phải MAX. Không cộng thêm offset drift vào giới hạn offset toàn nhiệt một cách máy móc.

`Tripmax = Kmax × (Vrefmax + Vosmax + CMRRerror + PSRRerror) + Rtmax × 105 nA`

| Worksheet, chưa phải full bound | Trip MIN/MAX xấp xỉ | Biên còn lại mỗi phía |
|---|---:|---:|
| Chưa thêm solder shift | 4,085393–4,107010 V | 2,99 mV |
| Thêm provisional reference allowance 200 ppm | 4,084572–4,107830 V | 2,17 mV |

Các số chính xác nằm trong script. Hysteresis, aging, thermal history, ground error, ripple và các sai số còn thiếu phải nằm trong biên còn lại. **Chưa có detector đáp ứng đầy đủ.** Không dùng typical aging hoặc calibration một lần làm bảo đảm toàn đời.

Thay K cũng thay timing: với trip MAX 4,110 V, input overdrive 20 mV, Ipeak 2,387511478 A, Cmin 10 mF, ESRmax 10 mΩ và parasitic 20 mV, yêu cầu cắt giảm từ 59,060915 µs cũ xuống **55,922051 µs**. Trừ thêm 1 mV guard còn **51,733589 µs**. Không dùng lại 59,06 µs cho divider mới.

Energy proof còn cần: Cmin thực sự nằm ở đầu cực cell-side sau các cutoff; capacitor open/ESR/ESL/nhiệt/tuổi thọ; mọi đường OUT, tải và reverse/bypass; dòng fault sau lỗi đơn; sai số sense tới đầu cực cell; timing từ threshold crossing hay khi đủ overdrive; đáp ứng slow ramp và chatter. Delay với step 20 mV không tự bao mọi ramp. Reference-ready veto phải giữ cutoff tắt suốt startup/brownout; reference và charger chung nguồn không tự chứng minh độc lập.

## OFF: tính theo từng rail, không gộp dòng tùy ý

Dùng `C*dV/dt = Iinjection − V/Rbleed`, không trừ tải hữu ích chưa bảo đảm. Plateau là `Imax*Rmax`; nếu target thấp hơn hoặc bằng plateau thì không có thời gian xả hữu hạn. Chỉ quy dòng qua B01 về RUN_OUT khi đã chứng minh đường thực.

| Một bleed bị hở | RUN_OUT | JOY_VCC_P, phương án chưa chọn |
|---|---:|---:|
| V0 MAX | 5,25 V | 3,60 V |
| Hai bleed độc lập | 2 × 10 kΩ ±1% | 2 × 22 kΩ ±1% |
| Rmax khi còn một bleed | 10,1 kΩ | 22,22 kΩ |
| Cmax hữu hiệu | 100 µF, yêu cầu hiện tại | 10 µF, yêu cầu đề xuất |
| Iinjection allocation | 30 µA = Source 10 + khác 20 | 20 µA, worksheet rail riêng |
| Plateau | 0,303 V | 0,4444 V |
| Target bảo thủ | 0,643404 V | 0,643404 V, detector JOY chưa chọn |
| Thời gian tới target | 2,703167 s | 0,614074 s |

Target RUN lấy falling MIN 0,693404 V trừ guard 50 mV. Nếu giả sử qualification thực sự chỉ mất 100 ms và source-cut mất 20 ms thì tổng là 2,823167 s, còn 1,176833 s trong 4 s; dòng sensitivity khoảng 53,701 µA cũng chỉ đúng với giả sử đó. **100 ms trong r12 là MIN, không phải MAX**, nên các số trên không chứng minh deadline. Không được tự nâng allowance hiện hành 30 µA. Đề xuất qualifier có dải 100–250 ms để phân tích tiếp: nếu đạt MAX 250 ms và giữ các giả thiết khác thì tổng RC/cut/qualifier là 2,973167 s, còn 1,026833 s cho các độ trễ còn lại. Chưa chọn linh kiện chứng minh dải này; sense/logic/source-cut và dòng thực đều cần cận. Bleed short, connector/GND đứt và shared-track open cần phân tích riêng.

Bleed JOY 100 kΩ với dòng bơm 12 µA có plateau 1,2 V, không đạt target 0,8 V. Hai bleed 22 kΩ đề xuất tiêu thụ tổng 0,300 mA nominal khi chạy ở 3,3 V, cao hơn trước. Chưa tính lại toàn ngân sách r12 nên không tự thay BOM. Dòng inrush cần Cmax, dV/dt và giới hạn trở kháng/dòng nguồn; average nạp tụ không phải peak MAX. Không dùng leakage TMUX cho đường công suất JOY.

## Mixed-bias và isolation proof

| Nhóm đường | Nghĩa vụ |
|---|---|
| JOY_X/Y, JOY_SW, BTN1/2 | Hai tầng, chia rõ node D/P, pull-up và clamp tới đúng rail. TMUX1511 SCDS390B p6 chỉ đặc tả powered-off ±2 µA ở VDD=0, VS≤3,6 V, VD=0; ±100 nA khi powered-on/off chỉ tại các tổ hợp 0,2/0,8 VDD. Không kéo sang arbitrary bias hoặc 5 V. |
| JOY_VCC_P | Inrush, short, reverse, off leakage và bleed khi một tầng stuck ON. ISD của TPS22916 không là forward output leakage; RCB phải áp đúng chiều/điều kiện. |
| RUN, FRESH_ARM, RELEASE, WDI | D→S default inactive, không back-power S; retained HIGH không tạo fresh-arm. Chưa có interface/pull-up/MAX toàn mạch phù hợp. |
| LOCK_POSITION, SAFETY_STATUS và diagnostic tùy chọn | S→D phải invalid khi S mất nguồn. Bit MCU không thay hai quan sát và veto phần cứng độc lập. |
| E1–E4 | Vẫn là reserve, chưa chọn hướng/đầu nối. Không gọi là measured leakage, nhưng giữ capacity worst case. |

Mỗi đường cần bốn ca: D sống/S chết; D chết/S sống; ramp/undersupply; một tầng lỗi. Nguồn ngoài phải nằm trong miền datasheet hoặc có mạch bảo vệ có cận. Cắm nhầm 5 V vượt miền powered-off 3,6 V của TMUX chưa được bao phủ. Receiver LOW hoặc EN=OFF không tự chứng minh switch thực sự mở.

Worksheet 20 µA cũ chưa đóng: năm signal ×2 µA đã dùng 10 µA; sáu crossing bắt buộc và 0–2 optional cần budget theo mạch thật. Với allocation 1 µA mỗi crossing và 1 µA PCB chỉ còn 1–3 µA cho JOY power và đường khác. Một rail nhận có clamp/bypass vượt budget thì phải sửa interface, không tự tăng tiêu chí cổng.

## Watchdog, qualifier và khảo sát load switch

TPS3430 SBVS366A p6 có fast preset upper MAX 12,65 ms; phần 7,35 ms còn lại trong deadline 20 ms chưa được khép. Fault xóa LOW_SEEN; RUN/RELEASE chỉ nhận cạnh mới sau LOW qualification và READY; WDO recovery không cấp quyền. Qualifier phải có MIN/MAX, reset dominance và kiểm race. PRE/CLR của SN74LVC1G74 không được đồng thời LOW.

TPS3808 SBVS050N p7 có CT-open reset release 12–28 ms. Các số assertion 20 µs/150 ns không tự thành MAX khi cột MAX trống; reset-release delay không thay cả qualifier logic.

Đã khảo sát TPS22919 SLVSEN5B p5 và TPS22990 SLVSDK1C p7–8. PDF, ảnh trang và hash nằm ở `docs/research/downloads/p0-11/`. Switching tables chỉ có TYP dưới tải thử; đổi từ TPS22916 sang hai loại này không đóng được MAX hệ thống. Không chọn substitute.

## Phần đã tiến thêm và phần còn thiếu

Đã có lớp reference/tỷ số/error worksheet, cận RC/KCL theo rail và phản ví dụ cho các ngõ isolation. H3 full error/cutoff, OFF mixed-bias/actual-isolation proof và W whole-path MAX vẫn OPEN. Đường tiếp theo là hoàn thiện interface và topology có cận trước khi hỏi hãng đúng điều kiện. Chưa cần yêu cầu Founder nâng trần 4,200 V; ưu tiên phương án giữ nguyên yêu cầu.
