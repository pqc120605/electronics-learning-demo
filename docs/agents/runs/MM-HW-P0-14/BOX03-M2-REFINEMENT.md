Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c44a-5bd5-78e3-8727-d8ead389335b
Read-only integration refinement; no implementation/approval.

**Đề xuất sửa thành P0‑14‑M2: bỏ phích USB‑C RUN nội bộ, đưa vai trò EXT5V và return qua cùng cầu double-break với toàn bộ I/O.** Khi đó chuỗi còn:

**tháo cassette → nâng/park cầu → mở cổng PC.**

Điều này **chỉ áp dụng nếu Box02 xác nhận được cách cấp EXT5V cho B01**. Kết quả Box02 hiện vẫn dùng RUN USB; chưa xác nhận topology EXT5V. Không gán EXT5V vào VIN, 5V hay chân vật lý nào ở lượt này.

Đã đọc ba tài liệu tích hợp. Không sửa file, cấu hình hoặc tạo CAD/FE.

**1. Ranh giới điện sửa đổi**

```text
Carrier: pin/protection/converter/Ccarrier
       ↕ đầu ngắt A
Cầu captive cứng: toàn bộ conductor liên đảo
       ↕ đầu ngắt B
Đảo B01: B01 + các linh kiện thực sự thuộc đảo này

PC → USB-C onboard B01, chỉ tiếp cận được khi cầu đã park
```

Cầu mang EXT5V, return, toàn I/O và mọi đường phụ đã kiểm kê. Không có RUN USB, cáp Y hoặc nguồn ngoài song song.

Dùng **cầu PCB cứng**, không dùng bó dây mềm nối qua hai đảo. Các đường trên cầu chỉ nối hai đầu A/B; không có dây đuôi có thể kéo dài qua khoảng ngắt.

Ccarrier ở carrier. Tụ B01 vẫn ở đảo B01. Ngắt cầu không được dùng làm bằng chứng tụ đã xả; Box02 phải khép năng lượng dư và điều kiện PC attach riêng.

**2. Một chuỗi b/q/h sửa đổi**

`b`: độ rút cassette; `q`: hành trình tay cam; `hA/hB`: độ nâng thực của từng đầu cầu.

| Vị trí | Hành vi bắt buộc |
|---|---|
| Cassette còn lắp hoặc `b<12 mm` | Tab liền cassette chặn q tại 0 |
| `b≥12 mm` và cassette đã ra khỏi đường cam | Cho q bắt đầu; cam chiếm ngay đường lắp lại cassette |
| `q=0…14 mm` | Nâng A/B tới h=12 mm; hai cửa USB vẫn bị chốt cơ riêng giữ đóng |
| `q=14…22 mm` | Cầu đi vào park; các khóa endpoint chỉ nhả khi **cả hA và hB** đạt điều kiện tách |
| `q=22…30 mm` | Cho phép mở lần lượt hai cửa PROGRAM |
| PROGRAM | Cầu bị giữ ở park; đường cassette bị chặn; PC có thể cắm |
| Trở về | Hai cửa phải đóng hết trước q<22; cầu chỉ hạ tại q<14; cassette lắp cuối tại q=0 |

Các khoảng q là **allocation cơ**, không phải travel connector đã xác nhận.

Yêu cầu cassette: mọi contact nguồn và cell-tap phải tách hoàn toàn trước `b≤6 mm`; tab vẫn chặn q tới `b≥12 mm`. Nếu cassette có tap mới, phải đưa chúng vào cùng kiểm tra, không để dây sense ở lại.

**3. Điều kiện khoảng ngắt thực**

Cho mỗi đầu A/B:

\[
g_{\min}=h_{\min}-L_{\rm conductive,max}
-\delta_{\rm relative,max}\ge2,0\ {\rm mm}
\]

Trong đó `Lconductive,max` bao toàn bộ phần kim loại có thể còn tiếp xúc, không chỉ chiều cao housing.

Một contract kích thước hữu hạn để sàng lọc:

| Tham số | Yêu cầu proposal |
|---|---:|
| Nâng nominal | 12,0 mm |
| Nâng thực MIN sau tolerance/park play | 11,8 mm |
| Biến dạng tương đối MAX | 0,20 mm |
| Chiều dài conductive overlap MAX cho phép | **9,6 mm** |
| Khoảng ngắt còn lại | **≥2,0 mm** |

Không có nguồn chứng minh candidate đã đáp ứng `Lconductive,max≤9,6 mm`. Vì vậy đây là **điều kiện chọn mating pair**, chưa là gap thực đã đạt.

Hai đầu có guide riêng chống nghiêng. Một đầu đứng yên trong khi đầu kia nâng phải giữ cửa đóng; không suy từ q hoặc chiều cao thanh ngang chung.

**4. Xác nhận endpoint và lỗi cam**

Mỗi đầu cầu có một tongue kết cấu gắn trực tiếp vào carrier giữ housing, không gắn vào tay cam:

- Housing chưa rời vị trí conductive → tongue vẫn chiếm đường mở cửa.
- Chỉ tại vị trí endpoint thực đạt gap mới xuất hiện cửa sổ cho khóa cửa đi qua.
- Mỗi cửa USB có bộ chặn riêng, đòi điều kiện từ **cả A và B**.
- Tay cam chỉ tạo chuyển động; không tự rút chốt cửa bằng một thanh kéo bỏ qua endpoint.

Như vậy, **cam gãy nhưng một đầu còn thấp** vẫn không mở được cửa theo mô hình động học. Cần kiểm khả năng gãy tongue/housing và đi vòng; chưa tuyên bố mọi dạng gãy đều fail-closed.

**Retained contact:** một contact ở A bị kéo theo có thể làm A chưa tách điện dù housing đã lên. Tongue housing không phát hiện được lỗi này. Đầu B bình thường phải vẫn tạo khoảng ngắt cho chính conductor đó.

Để lập luận lỗi đơn này có hiệu lực, cần:

- A/B là hai tiếp điểm nối tiếp trên **mọi** conductor;
- cầu cứng, không có dây mềm vượt qua gap;
- một contact bật khỏi housing A không thể kéo cả đầu B hoặc một sợi dẫn qua hai gap;
- hai đầu không dùng chung phần terminal có thể biến dạng thành một cầu nối liên tục.

**Phản ví dụ còn phải loại:** một conductor mềm hoặc shield nối liền carrier–B01 đi ngoài cầu. Khi đó cả A/B đều park nhưng vẫn còn continuity; endpoint cơ không sửa được lỗi kiến trúc này.

**5. Hai cửa và PC đang cắm**

Giữ hai cửa độc lập; mỗi cửa tự che được đường cắm tới USB‑C. Cửa mở đưa khóa kết cấu vào đường hạ cầu và đường lắp cassette.

Không cho phép phương án “đóng cửa ép trực tiếp vào plug PC để plug chịu 100 N”.

Contract geometry cần là:

- Phần kiểm tra plug chỉ thao tác một phần tử cảm nhận lực nhỏ.
- Khi plug còn chiếm vùng kiểm, một **stop tựa frame** chặn chuyển động nối lại.
- Lực tay 100 N đi vào stop/frame; không qua phần cảm nhận, shell cáp hoặc receptacle.
- Cửa chỉ được coi đóng khi lá che và khóa kết cấu đã về endpoint, không theo vị trí tay cam.

**Phần này chưa có geometry chứng minh.** Đặc biệt, nếu nút/handle nối cứng tới lá cửa thì phản ví dụ vẫn là 100 N truyền vào plug/receptacle. Không được gọi “hai cửa” là đã giải quyết lỗi đó.

Phần cảm nhận phải xét plug cắm hờ từ trước thời điểm contact đầu tiên có thể nối, plug metal shell biến dạng và loại cáp nằm trong phạm vi hỗ trợ. Vỏ nhựa/cáp mảnh không được làm chuẩn kích thước.

**6. Candidate mating pair và source contract**

Giữ một family để đánh giá:

- Receptacle **Hirose DF11‑30DS‑2DSA(05)**.
- Header đối chiếu **DF11‑30DP‑2DSA(08)**, được hãng liệt kê trong mating connectors. Cần kiểm plating và drawing của cả cặp trước khi khóa.

Trang hãng công bố receptacle: 30 vị trí, bao 32×5×6,6 mm, contact resistance MAX 30 mΩ và **30 mating/unmating cycles**. Đây là giới hạn đáng kể cho thao tác PROGRAM lặp lại; chưa đủ cơ sở nhận làm connector sản phẩm. [Hirose — specifications và mating list](https://www.hirose.com/product/p/CL0543-0565-8-05)

Các trường bắt buộc từ drawing/specification của mating pair:

| Trường cần khóa | Mục đích |
|---|---|
| Contact engagement và conductive-overlap MAX | Chứng minh gap ≥2 mm |
| Chiều cao ghép MAX/MIN, lead projection | Khóa h và khoang park |
| Lực mating/unmating MAX cho 30 vị trí | Tính cam, guide và tải housing |
| Terminal retention / housing strength | Phân tích trailing contact |
| Misalignment cho phép | Không tự coi DF11 là blind-mate |
| Cycle rating theo điều kiện thử | Xác định phù hợp PROGRAM/service |
| Contact current/temperature rise và plating | Kiểm EXT5V/return, không lấy rating riêng chân làm rating cả cụm |

Không mở thêm shortlist ở lượt này. Nếu DF11 không đạt cycle/travel/retention contract, phải thay candidate có dữ liệu, không đổi acceptance âm thầm.

**7. Disposition để HQ ghép**

| Nội dung | Mức kết luận |
|---|---|
| Bỏ đoạn rút RUN USB | **Đơn giản hóa kiến trúc có điều kiện**, chờ Box02 xác nhận EXT5V role |
| Cassette absent + double-break trước PC | Invariant kiến trúc xác định được |
| Một đầu connector kẹt | Có giải pháp endpoint cơ để giữ cửa đóng; còn phải kiểm geometry |
| Một terminal kéo theo | Chỉ bao được nếu đầu ngắt còn lại độc lập và không có conductor bypass |
| Cam gãy | Không dùng vị trí cam làm proof; endpoint blockers là proposal sửa |
| PC còn cắm, không truyền 100 N vào USB | **Chưa khép geometry**; cần stop/frame và cơ cấu kiểm plug tách lực |
| Năng lượng dư / B01 backfeed | Box02 phải khép; không tự chuyển sang D10 |
| Fit/chi phí | Chưa xác nhận; giữ PCB ≤100×100 mm, target 90×90 mm và tổng bộ <1 triệu đồng |

Proposal M2 không cần nạp lò xo mạnh, actuator hoặc timeout mất bias. Điểm tiếp theo hữu hạn là Box02 trả disposition EXT5V và conductor matrix; Box08 review topology endpoint/cover trap cùng các phản ví dụ còn mở. Chưa có gate PASS hoặc cấu hình được chọn.
