Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c44a-39e6-7e32-a630-4361633a42b9
Read-only integration refinement; no implementation/approval.

**Có thể bỏ phích RUN USB nội bộ và cấp B01 qua role nguồn5 V trên cùng cầu captive double-break.** Không có lý do kiến trúc bắt buộc phải giữ thêm phích USB, **nếu B01 có power-entry function phù hợp và mọi đường liên đảo đều đi qua cầu**.

Đây là refinement trong hướng B đã cho phép nghiên cứu, chưa duyệt header/MPN/hash. Quy tắc “không cấp VIN/3V3” của r12 vẫn giữ nguyên ở hồ sơ lịch sử; proposal AA mới phải ghi rõ delta power-entry, không sửa ngầm r12.

**1. Proposal điện hợp nhất**

```text
Cassette3AA → fuse/polarity/input protection → converter5V → RUN veto
                                              │
                         cầu captive: break A → break B
                                              │
                              B01_EXTERNAL_5V + RETURN

Mọi I/O, diagnostic, sense và ground liên đảo:
                         break A → break B → đảo B01

USB-C PC: chỉ tiếp cận sau khi toàn bộ cầu đã tách
```

Role `B01_EXTERNAL_5V` chỉ được sử dụng khi:

- Là chức năng đầu vào5 V phù hợp của board được chọn; không suy từ nhãn “VIN”, không cấp vào3V3.
- Converter cung cấp envelope tại đầu vào B01 sau sụt áp hai breakpoint, dây và veto.
- Không có nguồn carrier khác nối trực tiếp B01, USB shell hoặc regulator/USB-UART.
- PC chỉ có thể tiếp xúc sau **khoảng hở thật ở cả hai đầu cầu**, không chỉ sau vị trí cam.
- Khi PC còn tiếp xúc, cầu và cassette bị chặn nối lại.

Tính phù hợp của power-header, đường USB-VBUS/regulator/CH340 và continuity clone vẫn thuộc **D10 verification hiện có**. Trước schematic cần xác lập chức năng mong muốn, envelope và acceptance; không khẳng định clone đã được xác minh.

**2. Reverse/bypass obligations vẫn còn**

Cấp qua header có thể cấp cả USB VBUS nội bộ, regulator và CH340 tùy board. Điều đó chưa tự làm proposal không phù hợp: trong RUN, receptacle PC bị che; trong PROGRAM, carrier đã tách. Nhưng phải bao các trường hợp:

| Trạng thái | Nghĩa vụ |
|---|---|
| RUN | PC không thể tiếp xúc; header không nhận nguồn song song |
| Đang mở cầu | PC vẫn bị che; tụ carrier có thể còn điện |
| Một contact/breakpoint bị giữ dẫn | Breakpoint còn lại phải tách đường đó trước PC-access |
| PROGRAM | PC có thể cấp ngược header **trên đảo B01**, nhưng không tới carrier/cell |
| Trở về RUN | PC hết tiếp xúc trước khi bất kỳ đường cầu nào được nối lại |
| Contact kéo theo dây hoặc shield | Không được vượt cả hai khoảng hở |
| Một đầu cầu mới tách | Không coi là PROGRAM-ready chỉ vì một số rail đã mất |

Không dựa vào converter reverse blocking hoặc GPIO high-impedance để thay các khoảng hở.

**3. Tụ B01: giữ đúng boundary D10**

Đồng ý refinement của HQ: **mọi tụ carrier, kể cả tụ module5 V, bulk capacitor, bleed và tụ lọc ngoài, ở phía carrier của cầu**.

Sau khi cầu mở hoàn toàn:

- B01 nhận USB như board-alone, với linh kiện onboard và phụ kiện đảo B01 đã khai báo.
- Không đặt yêu cầu Cmax mới cho toàn bộ B01 chỉ để chứng minh lại USB attach trước schematic.
- D10 tiếp tục kiểm hành vi board/USB/clone; không chuyển các mục đó thành một gate Cmax mới.

Phần thực sự mới cần khai báo nếu tồn tại:

- Tụ/TVS/LED/divider, pull-up hoặc bộ đệm lắp thêm **phía B01 của breakpoint cuối**.
- Dây adapter/header và conductor của cầu vẫn nối B01: có parasitic C/L, năng lượng và khả năng tiếp xúc khi chuyển chặng.
- Mạch external-reset/boot hoặc test connector trên đảo B01.
- Shield hoặc bracket dẫn điện kéo sang carrier.

Nếu không thêm các mạch trên, chỉ cần ghi “không có external bulk capacitance trên đảo B01”; không bịa một bound tổng cho tụ onboard. Năng lượng carrier vẫn phải được phân tích để xử lý contact-short/khả năng chạm ở cầu, nhưng **không cần xả carrier xuống0 V chỉ để PC cấp B01 sau khoảng hở đầy đủ**.

**4. Double-break và cell taps**

Một **single break** mở có thể cắt dòng trong vận hành bình thường; proposal double-break nhằm chịu một breakpoint bị giữ dẫn. Không được gọi một công tắc hai cực hoặc hai contact trong cùng vị trí là hai breakpoint độc lập.

Với mỗi conductor liên đảo, đường vật lý phải là:

`carrier → break A → bridge → break B → B01`

Bao gồm power return, ground phụ, diagnostic và shield nếu có. Hai breakpoint phải không có dây/traces song song.

Đối với cassette:

- Ba cell series có bốn node `BAT0…BAT3`; nếu theo dõi từng cell, cả bốn conductor ra carrier phải được tách khi tháo cassette.
- Không chỉ tách pack+ và pack− rồi để tap giữa nối qua sense/ESD.
- Sense taps phải có giới hạn dòng tại nguồn tap; fuse đầu pack không bảo vệ mọi short giữa các tap.
- Fuse hở hoặc pack contact hở không được để tap trở thành đường cấp tải thay thế.
- Không đưa taps tới đảo B01. Nếu có thêm Kelvin/reference conductors, chúng là conductor bổ sung phải liệt kê, không được gộp bằng tên “sense”.

**5. Miền input rộng có thể tránh yêu cầu cell OCV MAX giả**

Có thể dùng **protected input domain** rộng hơn miền vận hành NiMH dự kiến. Đây là hướng hợp lý hơn việc tuyên bố “3×1,2 V bảo đảm không vượtX”.

Phân biệt ba miền:

1. **Normal RUN:** miền input tại đó module đạt5 V/tải/nhiệt đã định nghĩa.
2. **Protected fault:** miền đầu vào mà bảo vệ không hỏng hoặc cấp điện áp nguy hiểm xuống tải; có thể inhibit RUN.
3. **Unsupported source:** cell/hóa học/adapter không được công bố hỗ trợ, dù điện áp có thể lọt trong miền vận hành.

Ví dụ thiết kế có thể đặt front-end chịu0…16 V và chặn converter trước giới hạn input của nó. **16 V là yêu cầu thiết kế giả định**, không phải guarantee của cell, protection đã chọn hoặc module.

Input rộng không giải quyết:

- Cell yếu bị đảo cực trong chuỗi.
- Một cell lắp ngược.
- Short giữa contact/taps.
- Nhận diện NiMH với alkaline hoặc14500.
- Fuse/contact/thermal coordination.

Không cần guaranteed cell OCV MAX để bắt đầu chọn miền bảo vệ rộng; vẫn cần bound và rating thực của front-end trước khi nhận kiến trúc điện cuối.

**Verdict để tích hợp:** bỏ phích RUN USB riêng là simplification điện hợp lệ ở mức proposal. Cần03 sửa phase/invariant thành **“PC-access ⇒ cassette/taps tách và toàn cầu A/B tách”**. Remaining design requirements là power-entry contract, contact envelope/double-break coverage, danh sách bypass, phụ kiện thật trên đảo B01, input protection và weakest-cell/tap protection. Không cần thêm một vòng chứng minh B01 Cmax ngoài D10 nếu đảo B01 không được thêm mạch tích năng mới.
