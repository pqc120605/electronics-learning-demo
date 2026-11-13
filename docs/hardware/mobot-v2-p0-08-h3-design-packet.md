# D17-H3-CV-PROTECTION · P0-08

PROPOSED / OPEN. Không MPN/hash/pin approval, không lease, không bench. Datasheet chỉ chứng minh đúng hàng/điều kiện; mọi cận không có nguồn là TBD.

Tiêu chí nguyên văn: PASS khi phương án CV/bảo vệ có căn cứ và được review phù hợp giới hạn pack; FAIL nếu suy PCM là giới hạn sạc cho phép, thiếu cận hoặc chưa được review.

Nguồn đầy đủ file/revision/hash: [source-bounds](mobot-v2-p0-08-source-bounds.md), [manifest](../research/downloads/p0-08-2026-11-09/source-manifest.json).

## Trần và các điểm khả dĩ

Vpack_allowed,max=4,200V tuyệt đối tại đầu pack, mọi điều kiện, theo Founder09/11. Không hỏiJauch, Q3giữ nguyên; PCM4,23Vmin không là giới hạn sạc. BQ25186 là ứng viên chính, không suffix/setpointapproval; BQ25185 bị loại.

SLUSF69A p6 MIN/MAX±0,5% có điều kiện VIN5V; Figure5-1p10 typical không full line/load/transient guarantee. r11 có68 điểm3,50…4,17V bước10mV; không chọn điểm nào. Ví dụ margin còn lại:4,17→9,15mV;4,16→19,20mV;4,10→79,50mV;4,00→180mV. Mọi sai số chưa được spec bao phủ phải nằm trong margin.

| Thành phần ΔV ngoài MIN/MAX đãbao | Allocation |
|---|---|
| Line/load/temperature ngoàiđiềukiệnbảng | TBD; không đếm đôi thành phần đãbao |
| Sense/ground/drop/PCB tolerance | TBD |
| Ripple/noise/plugtransient | TBD |
| Comparator/driverdelay overshoot | TBD; không suy Cdynamic của cell từAh |
| Packimpedance/chargeacceptance/aging | TBD theoD10,NOT_RUN |

## Đường OV độc lập MCU đề xuất

TLV6710DDCR reference nội400mV + comparatorINB (rising397…403mV), SN74LVC1G74DCTR faultlatch với externalresetdominance và **hai P-MOS CSD25402Q3A mắcđối** ngắt đườngsạc. MOSgate default vềsource; driver, pulldefault, clamp vàgiới hạnfault cần circuit proof. Comparator/ref không dùng referencecharger; MCU/I2C không trực tiếp vượtđượcfaultlatch. Đây là linhkiệnứngviên đểscreening, chưa MPN/BOMapproval.

NguồnTLV p5–6 vàMOSp3/source-bounds: CSD RONMAX15,9mΩ ởVGS−2,5V/TA25°C, phép tính giả định RON trên vẫn áp dụng tại0,4A cho haiMOS sụt12,72mV vàdissipation5,088mW; đây là screening25°C, không cận được hãng đặc tả riêng tại0,4A; không dùngthresholdVGS(th) làm driveguarantee. Ioffleak1µA chỉ25°C; gateQMAX9,7nC ởVGS−4,5V/VDS−10V, không ngoại suy mọiVDS. Gatefall/tOFFTYP không đóng thời gianfault.

DividerOVscreen Rt93,7kΩ/Rb10kΩ±0,1%, dùngINBrising397…403mV và allocation±25nA: trip4,107112810…4,189014623V. |Iin|25nA tạiinput0,4V chưa được chứngminhtừhàngtest6,5V, nên đây chỉ là screening. TripMAX còn10,985377mV tới4,200V trướcground/transient/delay. NormalVmax phải<thresholdMIN: ví dụ4,10×1,005=4,1205V đãvượt4,1071V nên không có cửa sổ với phươngántripnày. Không mặc nhiênchọn4,17V hoặcdividernày.

TLV6710tpd chỉTYP; SN74lvcasyncMAX7,9ns không bù được thiếuMAXcomparator vàdriver. Điều kiện bắtbuộc: Vnormal,max<Vtrip,min; Vtrip,max+ΔVduringdetect/isolate,max≤4,200V. Hiện cảhai thiếuproof. OUTBHiZdướUVLO vàundefineddướiPOR phải bịbiasvaliddefaultOFF bao phủ; haiPRE/CLRLOW không phải resetdominant tựnhiên.

## Jauch và chế độ sạc

Jauch250832Rev1.2p2: typ2,6Ah/rated2,5Ah; charge4,2V, standard1,25A/max2,5A;0…45°C. Chỉ liệt kêNTC, khôngR25/B/R-T/lag hoặctermination spec. Không gán10k/B3435. H3target0,40A là requirement; BQp6 accuracy±10% tạiVIN5V/fastcharge≥40mA cho screening0,36…0,44A. Phép chia danh định2,5–2,6Ah/0,36A≈6,944…7,222h chỉ là planning nếu phải nạp lượng điện tích giả định đó, không phải thời lượng CC thực hoặc bằng chứng timer6h nhất định thiếu. Dung lượng xả không xác định charge-to-full/profile, nhất là khi giảmsetpoint; CV/derating/load cònTBD. Resetdefault6h chưa chứngminh phù hợp. Timer3/6/12h/disable ởp36: chưa chọn12h, không phêchuẩndisable.

Terminationdisable/5/10/20%ICHG theo p34; p7 accuracychỉ tại3mA/30mA/25°C không mởsang0,4A. NTC open/short/thermalwindow phải có cận+independence; TS_EN0 chỉ tắt autoTSchargeaction, monitoringvẫnON, không là bảo vệ độc lập.

| Fault | Yêu cầu còn mở |
|---|---|
| Registerwrong/defaultreload/watchdog/I2Cstuck | IndependentOV/thermal ngắt bấtkểsetting, đủMAXdelay;TBD |
| OVreference/sense/GND/bias commonfault | Không covertfalse-safe; topologyTBD |
| MộtMOSstuckON/driverstuck/PCMopen | Cònbarrier hoặc giữchargeOFF;coverageTBD |
| NTCopen/short/celltempgradient | Khôngsạc ngoài0…45°C;R-T vàlagTBD |

Giữ OPEN, NOT_RUN. Không dùng stressOVPboost hoặc PCM làm substitute.
