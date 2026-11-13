# MCU-RESET-VETO-RESOURCES · P0-08

PROPOSED / OPEN. Không MPN/hash/pin approval, không lease, không bench. Datasheet chỉ chứng minh đúng hàng/điều kiện; mọi cận không có nguồn là TBD.

Tiêu chí nguyên văn: PASS only after independent review of resource feasibility and bounded default isolation/reset/panic/watchdog veto, including retained driven GPIO and loss of bias; FAIL if any path is unbounded or can re-enable without fresh permission. Missing design evidence remains OPEN, not PASS.

Nguồn đầy đủ file/revision/hash: [source-bounds](mobot-v2-p0-08-source-bounds.md), [manifest](../research/downloads/p0-08-2026-11-09/source-manifest.json).

## Baseline nhu cầu và STOP

Bảngcận theo vai ở r11:6out/bidir+2inputbắtbuộc=8; statusH3riêng0…1,feedbackthứhai0…1,E1–E4=0…4 theo giảđịnh→upper14. Poolchắc11/cóđiềukiện13: không đủ. Không giải phóng strap/r7, khôngexpander, không tự bỏkênh. Exact GPIO/net **UNASSIGNED**.

Founder đãcho phép đềxuất kiếntrúc mới đểduyệt; chưa chọn. ProposalA sốhọc5out/bidir+4E+2input=11, giữfeedbacksafety vàđọcH3quaI2C. Mộtchânchallengebidirectional vàtổnghợpstatus chưa cócircuitproof; nếu thêmchallengepin thành12>11 thìSTOP. Xemarchitecture-proposal, không sửabaseline thành phươngánđãchọn.

## Chân tham chiếu và boot/default

ESP32Seriesv5.3PDF hash trongmanifest; p14–15Table2-1,p20–21memory,p22strap,p52DC,p69AppendixA.4:

| Poolnhãn | Reset/boot cần giữ rõ |
|---|---|
| GPIO4 | AtResetie1,wpd; không straptrongTable3-1, vẫn khôngsuy bootwaveform antoàn |
| GPIO13 | JTAGMTCK;AtResetoe0,ie0;AfterResetie1,wpd; cấm coi pull nội làbound45kΩMAX |
| 18,19,23 | AtResetoe0,ie0;AfterResetie1; không làLOWdriven |
| 21,22 | AtResetoe0/ie0 theoA.4; chức năngI/O, ROM/application vàboardpull vẫnTBD |
| 26,27 | AtReset/AfterResetoe0,ie0; không coi outputLOW |
| 36,39 | input-only,khôngpullnội; chỉfeedbackcandidate |
| 16,17 | cóđiềukiện module/flash/PSRAM; khôngtính vàoassuredpool |

p52 chỉ3,3V/25°C: VIHmin0,75VDD,VILmax0,25VDD;IinputMAX50nA;VOHmin0,8VDD,VOLmax0,1VDD. Pull45kΩ vàdrive40/28mA làTYP. Không mởrộngleak/pulldefaulttới mọireset/fulltemp/clone. Chính sáchr7 tiếp tục loại1,2,3,5,12,14,15 (GPIO0strap cũngkhôngđưa vào pool).

## Linh kiện và thời gian có cận

TPS3808G01DBVR supervisor: CTopen resetrelease12…28ms, nhưngfaultassert20µsTYP khôngMAX. SN74LVC1G74DCTR: CLR→QMAX7,9ns tại3,3V/tảiFigure7-1/−40…125°C;PRE/CLRsimultaneousLOW phải đượcexternalgating tránh.

Windowcandidate TPS3430DRCR: p6 CWD10k→VDD,SET0=SET1=1 cho lower1,48…2,22ms,upper9,35…12,65ms; heartbeatperiod đủmargin giữa2,22 và9,35ms chỉ làwindowliveness. WDOreset8,5…11,5ms khiCRST10k→VDD. tWD-del50ns chỉTYP. Hardwiremode đểkhôngMCUdisable, faultmodepins/sharedbias cònTBD.

Screening bỏqua cácdelaychưacóMAX:12,65mswindow +7,9nslatch +4,5mssource=17,1500079ms, còn2,8499921ms so với20ms. Đây **không là t_fault_to_isolationMAX**: watchdogassertprop chưaMAX, source4,5mschỉCL1µF, peripheralcontinuespulsing không bịwindowpháthiện, biasfaultdelaykhácTBD. t_safe_to_release cònraildecay/qualification100ms/mechanicalMAX chưa có.

## Retained-HIGH/bias và counterexamples

Permissionresetdominant→WAIT_LOW; bắtbuộcLOWqualified sauPOR/fault vàcạnhmới sauREADY; requestgiữHIGH khôngfresharm. Sense/bias/watchdogfault trực tiếpchặnRUNvànhả, khôngquaMCU. Tạibấtkỳ raildeepUV màICoutputundefined, gatepulldefault vàcơgiữphải duytrìOFF; chưa cóproof.

| Ca | Nếu dùng shortcut thì FAIL | Còn cần |
|---|---|---|
| RequestHIGHquaPOR/brownout | Dflipflop nhậnpowerupedge→tựRUN | LowqualifierMAX/resetrecoveryproof |
| GPIOperipheralPWMkhiCPUtreo | Windowwatchdogvẫnbịfeed | Challengeprotocol độc lập,khôngđượchạfaultmodel |
| Đồngthờifault/freshedge | Cạnh nhớlại saureset | Externalresetdominance/recovery |
| Chungbias/GND/reset | Tấtcảoutputfloatcùnglúc | Defaults/mixedpower/commoncauseFMEA |
| Onefeedbackfalse-safe | StatusaggregatecheloạiFault | Independentveto vàdetect/coverage |

Nguồn cósố liệu nhưng chưađủ đóngcổng. Khôngfirmware,khôngpinassignment,khôngMPNapproval,NOT_RUN.
