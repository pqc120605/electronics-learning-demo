# P0-08 · nguồn ghim và cận điện

Đã tính lại SHA-256 từ bytes; PDF, text có phân trang, một số ảnh bảng và manifest ở ../research/downloads/p0-08-2026-11-09/. Cột MAX chỉ áp dụng đúng điều kiện ghi. Không dùng TYP, absolute maximum stress hoặc đồ thị typical làm bound vận hành. Các suffix trong baseline là ứng viên, chưa MPN approval.

| File/part | Tài liệu | SHA-256 |
|---|---|---|
| tps25810 | SLVSCR1C, July2017 | `ccc31e3ad8b7970005e23ba8b6a165694f712e86fd337b9ba2fe117a98a2e13e` |
| tps22916 | SLVSDO5F, Dec2021 | `a4d81b70556d5564aaee9baf455b7651375a94c629448f3f7e7ced2f5c41b33f` |
| tmux1511 | SCDS390B, Mar2025 | `04291b41a68347fedbbb0776aa44f500eaca65f2ca3af0e022ee60d41c7b1e9f` |
| tlv6710 | SNVSAV4B, Oct2018 | `f068d52942be7b00e5fb0f891f0cb022fdfe37c7971601334f7195ebe08e3600` |
| tps3808 | SBVS050N, Aug2026 | `74d889c0f68af88032f1633c26381817cc03e10d9fd3b4c177a044ad3ed86eed` |
| sn74lvc1g74 | SCES794G, Sep2021 | `e46a5a867fec742290000dca5ed3b291535f3c4418ef2ae267acc4ab51b26d8a` |
| tps61023 | SLVSF14B, Aug2020 | `1bfe4e5e4d284c752725fbcef7492b5f85449a7d537f24958cfcef7699d2899d` |
| jauch-250832-rev1.2 | Jauch250832 Rev1.2 | `f591005fb42722eb8f55aba91425e920c23a288cc4d897114968968e0609609a` |
| esp32-series-v5.3 | ESP32 Series v5.3 | `a7917e6b47528c9dcab06837a49d452e582751335797db879f1cf2d17cd29adf` |
| bq25186-slusf69a | SLUSF69A, Jan2025 | `96834a4566939677cf084cef87d88f1534b9369ae80171ee004a7ac6572791c9` |
| tps3430 | SBVS366A, Oct2021 | `f9887a28788bac6ae6743e211ae50dddd809e3ff7bf0d6a3447c8d71f62c6b4d` |
| dmp2035u | TBD | `NOT_DOWNLOADED` |
| csd25402q3a | SLPS454B, Jan2016 | `c012fd83328e7fae2186d13a13d9fe184ba7f00ec98f1061dca7118c39abdcd2` |

## Các cận đã đọc (trang PDF cũng là trang in cho các bảng dưới)

| Part / trang | MIN/MAX có điều kiện | Không đủ / cấm ngoại suy |
|---|---|---|
| TPS25810 p5,p7–8 | RON MAX55mΩ tới125°C; reverse OUT→IN MAX3µA tạiVOUT6,5V,IN1=EN=0 vàTJ≤85°C. OUTtoff MAX4,5ms, fallMAX0,75ms tạiVIN5V,CL1µF,RL100Ω. OCresponseMAX4µs; discharge window39…96ms | Không là forward OFF leakage; không ngoại suytoff sang100µF/cáp/faultbias. Currentlimit low1,58…1,82A không phải ceiling0,50A |
| TPS22916 p5–7 | RON5V MAX100mΩ tới85°C,120mΩ tới105°C. Reverse leakage magnitude≤300nA tại0≤VIN+VRCB≤VOUT≤5,5V,−40…85°C. ION±10nA. ISD MAX100nA B/C/CN hoặc300nA BL/CL/CNL vớiVOUT=GND | ISD không là forward output leakage. toff5µs5V và RCB10µs đềuTYP; không có MAX. CN/CNL không QOD; không dùng RQOD150ΩTYP cho chúng |
| TMUX1511 p6–7 | Powered-off VDD0,VS0…3,6V,VD0:±2µA toàntable−40…125°C; ±10nA chỉ25°C/VS≤3V. Powered switchOFF±100nA ở0,2/0,8VDD. RONMAX4,5Ω. ControltransitionMAX55ns tạiVDD≥2,5V hoặc80ns dưới2,5V; supplyOFFMAX4µs vớiVDDfall1µs,VS3,6V,RL200Ω,CL15pF | Không bảo đảm powered-off5,25V. Internalpulldown6MΩTYP. Cần đúng bias/ramp/tải; hai lớp chungnguồn/GND không tự độc lập |
| TLV6710 p5–6 | INA falling397…403mV,rising400…413mV; INB rising397…403mV,falling387…400mV. Hysteresis2…12mV. Inputcurrent±25nA tạiinput6,5V hoặc±15nA tại0,1V vớiVDDendpoints; IDDMAX11µA; outputleakMAX300nA tại25V | tpd9,9/28,1µs và startup155µs đềuTYP, không MAX. Không tự mở rộng IIN sang mọiinput0,4V. DướiUVLO OUTA LOW/OUTBHiZ; dướiPOR undefined. Threshold đã gộp sai số, không cộng offset giả thêm lần nữa |
| TPS3808 p6–7 | VDD1,7…6,5V,TJ−40…125°C; G01accuracy±2%,sense±25nA,RESETleakMAX300nA. CTopen release12…28ms; CTVDD180…420ms. POR0,8VMAX với điều kiện sink/ramp | MR→RESET150ns vàSENSE→RESET20µsTYP; không có assertionMAX. G01hysteresisMIN1,5%/TYP3%,khôngMAX. Không là watchdog |
| SN74LVC1G74 p6–7 | VCC3,3V,−40…125°C,tảiFigure7-1: asynchronousPRE/CLR→Q MAX7,9ns; CLK→QMAX7,9ns/Qbar8,2ns. Input±5µA;Ioff±10µA khiVCC0,VI/VO5,5V;ICCMAX10µA | PulseMIN2,7ns, setup1,3ns,hold1,2ns không là faultdelayMAX. PREvàCLR cùngLOW không tạo resetdominance; cần logic tránh tổ hợp không hợp lệ |
| TPS61023 p5 | VOUTleakMAX3µA ởVIN=SW=0,VOUT5,5V, chỉ25°C; shutdownVIN+SWMAX0,2µA cũng25°C. PWMref580…610mV | PFMref585/601mV khôngMAX; softstart700µs vàRON68/47mΩTYP. OVP5,5…6,0V không bảo vệ pack4,200V. Efficiencytyp không chứng minhη≥0,80 |
| TPS3430 p5–6 | −40…125°C,VDD1,6…6,5V. IDDMAX19µA,WDOleakMAX1µA. CWD10k→VDD,SET0=SET1=1: lower1,48…2,22ms,upper9,35…12,65ms. CRST10k→VDD reset8,5…11,5ms | tWD-del50ns,TINIT381µs và startup300µs ởcộtTYP. Không là challenge-response; peripheral còn phát xung có thể vượt qua watchdog. SETmode khác có thể disable; cần hardwire vàfaultcoverage |
| CSD25402Q3A p3 | TA25°C: leakage magnitude1µA tạiVGS0,VDS−16V; gateleak100nA tại±12V; RONMAX15,9mΩ tạiVGS−2,5V/ID−10A hoặc8,9mΩ tại−4,5V. CissMAX1790pF,Coss992pF,Crss51pF tạiVDS−10V/1MHz;QgMAX9,7nC tại−4,5V | Không mở rộng capacitance tới mọiVDS/bias hoặc25°C tới toànnhiệt. tdOFF25ns/fall12nsTYP. VGS±12V là stresslimit, không guarantee clamp. HaiMOS mắcđối phải tínhdriver/SOA/chargeinjection riêng |

BQ25186/Jauch/ESP32 được phân tích trong gói H3/MCU. DMP2035U không tải được do chứng chỉ TLS hết hạn; không bỏ kiểm TLS và không dùng làm nguồn. Lần tải đầu bị chặn DNS sandbox, tải lại có quyền đã thành công cho TI. Không liên hệ nhà cung cấp.
