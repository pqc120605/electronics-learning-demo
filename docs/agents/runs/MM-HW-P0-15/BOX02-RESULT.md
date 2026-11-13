Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c51e-f76d-75e2-b7e1-32a95135e4d4
Read-only advisory; no hardware gate or configuration approval.

**P0-15 / Box02: ưu tiên hướng A — detector riêng từng cell; chưa có candidate hoàn chỉnh đủ để nhận topology.** Hướng này giảm đáng kể tải giám sát và bỏ phép trừ điện áp tap dùng chung. Hai vấn đề còn thiếu là truyền trạng thái fail-off ở điện áp thấp và bảo vệ detector khi đảo cell. Hướng B chưa khép được reset/startup mà vẫn ngắt sạch mọi đường sense sau trip.

Đã đọc task card, BOX08-REVIEW và `BOX02-CELL-PROTECTION-REFINEMENT.md`. Không ghi file, gọi agent, gán chân hoặc tạo artifact phần cứng.

### 1. Hai hướng đã xét

| Hướng | Cấu trúc ở mức yêu cầu | Kết quả |
|---|---|---|
| **A — monitor cục bộ từng cell** | Mỗi detector lấy nguồn trực tiếp từ chính cell đó; chỉ trạng thái “healthy được xác nhận” mới cho phép tải. Detector ở cassette, tránh dây đo chung bị hở rồi tạo điện áp giả. Trip phải giữ OFF đến thao tác tay. | **Candidate tốt hơn để tiếp tục**, nhưng detector riêng lẻ chưa tạo thành bộ bảo vệ hoàn chỉnh. |
| **B — monitor 5 V được ngắt cùng mọi sense khi trip** | Startup phần cứng hữu hạn, tải bị inhibit; trong RUN tiếp tục giám sát. Khi lỗi, ngắt tải, monitor và mọi đường tap; chỉ thao tác tay mới mở phiên kiểm mới. | Chưa có chuỗi linh kiện cụ thể chứng minh được reset không lặp và ngắt sạch sense. Không nhận lại front-end 10 amplifier. |

**Phản ví dụ B:** nếu latch được cấp từ phía sau cutoff, trip làm mất trạng thái latch; nút START còn giữ có thể cấp nguồn lại và tạo vòng kiểm–trip–khởi động. Nếu chuyển latch lên trước cutoff, nó lại trở thành tải thường trực trên cả ba cell. Chỉ thêm monostable chưa giải quyết được việc ghi nhớ “đã dùng phiên START này” sau khi mất nguồn.

### 2. Candidate detector tốt nhất: ABLIC S-1009C11I-M5T1U

Nguồn hãng: **S-1009, Rev.5.1_03**, PDF; MPN/package ở tr. 5, điện ở tr. 9, startup ở tr. 11–13. Bản CMOS 1,1 V có ngưỡng **1,088–1,112 V tại 25°C**; hệ số nhiệt tối đa ±370 ppm/°C. Cận cộng bảo thủ cho −40…85°C là **1,061545–1,138455 V**. Hysteresis 4–6%; release tại 25°C **1,13152–1,17872 V**. Dòng 0,90 µA MAX áp dụng tại **25°C, VDD = release + 0,6 V**, không phải toàn miền sau trip. OUT không xác định dưới điện áp hoạt động tối thiểu 0,6 V. Delay được định nghĩa cho **release**, không phải MAX thời gian phát hiện sụt áp. CD hở có thể tạo double pulse; hãng yêu cầu CD ≥100 pF để tránh. [ABLIC S-1009 datasheet](https://www.ablic.com/en/doc/datasheet/voltage_detector/S1009_E.pdf)

Cửa sổ nghiên cứu 1,05–1,15 V **không loại detector này bằng sai số ngưỡng**. Tuy nhiên, nó chưa chứng minh rằng điện áp cell dưới tải RF luôn đủ cao hoặc cutoff đó tận dụng dung lượng phù hợp. Những điều này thuộc lựa chọn vận hành và qualification, không phải lý do tự đặt thêm gate.

**Dòng và nguồn:**

- Ba detector lấy nguồn **riêng từ cell 1, 2, 3**; không dồn toàn bộ dòng monitor vào cell đáy.
- Tại đúng điều kiện đo trên, tổng ba dòng là **≤2,70 µA**; mỗi cell chịu ≤0,90 µA.
- **Idle RUN tổng và off tổng của kiến trúc: TBD**, vì chưa chọn tầng truyền trạng thái, latch và switch, đồng thời chưa có cận detector cho toàn miền điện áp/nhiệt sau trip.
- Nếu *giả sử* 0,90 µA là cận liên tục, mỗi cell mất 21,6 µAh/ngày hoặc 0,648 mAh/30 ngày. Đây **chỉ là phép tính điều kiện**, chưa phải cận được hãng bảo đảm cho trạng thái OFF.
- Không có nhánh bias từ nguồn 5 V đưa vào tap trong cấu trúc đề xuất. Tầng truyền trạng thái vẫn phải chứng minh không tạo redistribution/backfeed.

### 3. Fault disposition của A

| Tình huống | Nghĩa vụ còn mở / phản ví dụ |
|---|---|
| Startup | Giữ tải OFF đến khi cả ba healthy ổn định. Không dùng xung release để tự cấp lại tải; không phụ thuộc MCU/WDI. |
| Cell yếu hữu hạn | Detector có ngưỡng phù hợp; **MAX tổng thời gian detector → latch → cutoff còn TBD**. Chưa chứng minh cận năng lượng tiếp tục rút từ cell yếu. |
| Cell xuống dưới 0,6 V / mất nguồn detector | Không được coi OUT là trạng thái lỗi bảo đảm. Tầng permit phải tự về OFF khi mất nguồn hoặc mất tín hiệu healthy. |
| Sense/power lead hở | Đặt detector tại cell giảm dây sense dài, nhưng mất một dây cấp detector phải làm mất permit. Output hở không được bị pull-up phía nhận biến thành healthy. |
| Đảo một cell | Cấp ngược trực tiếp cho detector chưa được bảo vệ. Bảo vệ đảo **cả pack** không giải quyết trường hợp tổng pack vẫn dương khi một cell lắp ngược. |
| Fuse mở | Không được để liên kết output giữa các detector trở thành đường vượt fuse. Phải lập đường dòng cho mọi liên kết. |
| Short tải | UVLO không thay fuse/current limiter. Chưa chọn fuse khi chưa có prospective short current và phối hợp holder–dây–switch. |
| Sau trip | Detector còn mắc trên từng cell; muốn tuyên bố hữu hạn phải có cận dòng theo miền lỗi và thời gian lưu pin, hoặc ngắt cục bộ thật sự. |

Điểm chưa đủ của **S-1009C11**: thông số source current của đầu ra CMOS không được bảo đảm tại mức nguồn cell 1,1 V như ở điều kiện đo cao hơn. Vì thế chưa thể tùy ý dùng OUT để lái transistor hoặc switch rồi gọi là fail-off đã chứng minh.

### 4. Reverse candidate bổ trợ

**LM66100DCKR**, SC-70-6, TI **SLVSEZ8A, June 2019**: candidate bảo vệ đảo **pack** cho miền nguồn nghiên cứu 3AA; operating 1,5–5,5 V, reverse VIN absolute maximum −6 V. Dòng tĩnh MAX 0,30 µA có điều kiện ở tr. 5. Rating 1,5 A không chứng minh khả năng chịu short hoặc nhiệt trong thiết kế này. Nó **không bảo vệ detector cục bộ trước một cell đảo**, và không phải công tắc cách ly mọi đường. [TI LM66100 PDF, tr. 4–5](https://www.ti.com/lit/ds/symlink/lm66100.pdf)

Không đề cử fuse MPN chỉ bằng dòng RUN tính toán; thiếu cận dòng ngắn mạch và đặc tính phối hợp.

### 5. Phần cần đóng ở từng mốc

| Trước schematic | Sau mẫu/config được duyệt |
|---|---|
| Tầng healthy fail-off với giới hạn điện áp/output thật; reverse từng cell; latch không autoretry; bảng đường dòng fuse-open/sense-open; MAX thời gian và dòng sau trip; phối hợp fuse–dây–holder. | RF sag, tiếp xúc/bounce holder, cell không đồng đều, nhiệt, dung lượng sử dụng, leakage thực và tuổi thọ thao tác. |

**Tradeoff thực cần quyết định nếu tiếp tục A:** chấp nhận detector còn tiêu thụ rất nhỏ trong thời gian lưu pin có giới hạn, hay yêu cầu cassette tự ngắt cả monitor từng cell sau trip. Phương án sau tăng switch/liên kết và độ phức tạp của cassette. Đây là delta vận hành/kiến trúc cụ thể; không cần Founder chọn lại hướng B.

Chưa đủ cơ sở chọn MPN bảo vệ tổng thể, ký dòng OFF tổng hoặc MAX cutoff. Không chuyển các thiếu sót này sang D10 và không kết luận bảo vệ zero-reversal tuyệt đối.
