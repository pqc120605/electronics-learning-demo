Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c43b-9c32-75a1-a973-21ea54f00dbb
Read-only mechanical proposal under Founder B research direction; no configuration approval.

**Đề xuất P0‑14‑M1: cassette pin tháo rời + cầu nối RUN bị bắt giữ trong một cơ cấu cam thủ công + cửa USB có hai thanh khóa độc lập.** Người dùng không rút dây lẻ. Cơ cấu chỉ mở cửa PROGRAM sau khi đã tách pin, rút phích RUN và nhấc toàn bộ cầu giao diện carrier–B01.

Đây là proposal kiến trúc để Box08 review, **chưa chứng minh fit, fault coverage hoặc B1 ready**. Không áp lại deadline capture 1 ms, actuator hoặc năng lượng nạp lò xo của P0‑13. r12/P0‑13 giữ nguyên lịch sử.

Tôi dùng quy trình proposal của `brainstorming` và kiểm nguồn linh kiện theo `mach-mo-research-scout`; không sửa tệp, chọn MPN được duyệt hoặc liên hệ bên ngoài.

**1. Một topology, không có giắc người dùng phải tháo riêng**

B01 đứng cố định trên một **đảo điện B01**. Carrier điều khiển/joystick/nguồn là đảo còn lại.

Giữa hai đảo có một **cầu RUN tháo bằng cam nhưng captive trong vỏ**:

- Mọi đường carrier–B01 đi qua cầu: I/O, nguồn phụ, sense, pull-up, reset/boot nếu có, GND và shield liên đảo.
- Cầu có hai đầu nối phân cách A và B mắc nối tiếp theo từng đường. Nhấc cầu sẽ tách cả hai đầu.
- Phích USB‑C RUN cấp B01 là phích nội bộ captive, được cam rút trước khi cửa PROGRAM mở.
- Không có dây dự phòng, vít kim loại hoặc shield nối vòng qua cầu.
- Không cho người dùng tiếp cận các đầu cầu ở trạng thái PROGRAM.

Cassette 3 AA có hai tiếp điểm nguồn được che sâu, không có dây đuôi tự do. **Phần nhô cơ khí liền cassette** chiếm đường chạy cam PROGRAM khi cassette còn lắp. Tháo pin là bước cần, nhưng chưa đủ mở USB.

Khi đang PROGRAM, hai thanh khóa độc lập từ cửa USB chiếm đường lắp cassette và đường hạ cầu RUN. Cáp PC đang cắm phải giữ cửa ở trạng thái không thể đóng.

**2. Geometry tham số để kiểm thứ tự**

Dùng `b` là hành trình rút cassette; `q` là hành trình cam dịch vụ; `h` là chiều nâng cầu giao diện. Các giá trị dưới là allocation, chưa phải travel catalogue.

| Chặng | Allocation cơ khí | Điều kiện bắt buộc |
|---|---|---|
| Rút cassette | Hai tiếp điểm pin mở hoàn toàn trước `b=6 mm` | Tab cassette còn chặn cam đến `b≥12 mm` |
| Bắt đầu dịch vụ | Cam chỉ đi được khi cassette đã ra khỏi tab khóa | Đường lắp cassette bị cam chiếm ngay sau đó |
| `q=0…10 mm` | Rút phích USB‑C RUN theo đúng trục cắm | Full disconnect cả contact và shell phải xảy ra trước cuối đoạn |
| `q=10…24 mm` | Nâng cầu đồng thời ở hai đầu A/B, `h=12 mm` | Không mở cửa PC; guide chống nghiêng cầu |
| `q=24…32 mm` | Cầu nằm trong khoang park, hai thanh xác nhận hình học đi qua khoảng trống hai đầu | Một đầu chưa rời phải chặn tiến cam |
| `q=32…40 mm` | Mở hai lớp cửa PROGRAM | B01 USB‑C mới tiếp cận được từ bên ngoài |
| Trở về RUN | Trình tự ngược | Cửa đóng hết trước khi cầu/phích RUN có thể nối lại; cassette lắp cuối |

Các endpoint không được suy từ khoảng di chuyển cam. Cần bất đẳng thức với đầu nối được chọn:

\[
h_{\rm park,min}>L_{\rm conductive\ overlap,max}
+\Delta_{\rm tolerance}+\Delta_{\rm deflection}+g_{\rm required}
\]

Tương tự cho phích USB RUN, gồm **shell/ground**, không chỉ VBUS hoặc chân tín hiệu.

Giữ allocation khe vật lý sau tách **≥2 mm** giữa mọi phần dẫn tương ứng; đây là yêu cầu kiểm geometry, không phải tuyên bố khoảng cách tiêu chuẩn hoặc cận chống mọi dị vật.

Hai thanh xác nhận phải kiểm **vị trí thật của hai đầu cầu**, không chỉ vị trí tay cam. Cam/handle bị gãy không được tự mở hai cửa.

**3. Cover trap khi PC còn cắm**

Cửa PROGRAM có hai lá che độc lập, mỗi lá có thanh khóa riêng:

- Khi đóng, mỗi lá tự che đường tiếp cận trực tiếp tới receptacle B01.
- Khi mở, mỗi thanh khóa cản đường nối lại cầu RUN và lắp cassette.
- Khi PC cắm, phần kim loại của plug chiếm vùng quét đóng của cửa. Không dựa vào kích thước vỏ nhựa hoặc độ dày dây.
- Cơ cấu phải nhận biết “cửa đã đóng hết” bằng vị trí cơ khí của cả hai lá, rồi mới cho cam quay ngược.

**Điểm chưa chứng minh:** chưa có geometry trap tương thích đầy đủ plug USB‑C, biến dạng plug và receptacle thật. Không được coi cáp mảnh hoặc đầu nối góc là mặc nhiên được chặn. Cần kiểm riêng plug kim loại cắm hờ, plug méo và lá cửa gãy.

Lực cưỡng bức cửa phải kết thúc ở frame/stop, không đẩy 100 N vào receptacle hoặc PCB B01. Nếu geometry cuối chỉ dùng chính plug PC làm chốt chịu lực lớn, proposal đó không đạt.

**4. Phase và invariant điện**

| Phase | Pin | Cầu I/O/GND | RUN USB | PC USB |
|---|---|---|---|---|
| RUN | Nối | Nối | Nối | Bị che |
| OFF‑1 | Tách cassette | Còn nối | Còn nối | Bị che |
| OFF‑2 | Tách | Còn nối | Đã rút hoàn toàn | Bị che |
| OFF‑3 | Tách | A và B đã tách | Tách | Bị che |
| PROGRAM | Bị chặn lắp | Bị chặn nối | Bị chặn nối | Có thể cắm |
| Trở về | Lắp cuối | Chỉ nối sau cửa đóng | Chỉ nối sau cửa đóng | Phải rút trước |

Invariant:

1. `PC accessible ⇒ cassette absent ∧ RUN plug fully disconnected ∧ bridge A/B separated`.
2. `PC inserted ⇒ battery insertion blocked ∧ bridge/RUN reconnection blocked`.
3. `partial state ⇒ PC inaccessible hoặc các đường RUN vẫn bị tách`.
4. Điện hồi lại không tự RUN; giữ W/veto/fresh-arm theo hợp đồng điện mới.
5. Không có đường carrier–B01 đi ngoài hai breakpoint, kể cả GND/shield, sense và các cổng mở rộng.

**Pin rút không có nghĩa rail thấp.** Sau OFF‑3, carrier và B01 vẫn có năng lượng trong tụ riêng. Thời gian người dùng đi cam không phải timer bảo đảm.

Box02 phải xác lập một trong hai điều kiện đủ, để review trước khi chọn:

- Năng lượng/điện áp dư trên đảo B01 tương thích với việc PC cấp USB ở mọi corner; hoặc
- Có cơ chế xả/giới hạn độc lập đủ cận trước khi PC thực sự được nối.

Liên động thủ công hiện tại chỉ chứng minh thứ tự **tách vật lý**, chưa chứng minh rail-qualified. Tôi không tự thêm đồng hồ đếm, chỉ dẫn “đợi vài giây” hoặc bleed chưa tính rồi gọi OFF đã đạt.

**5. Force path và hai đường giữ**

Giữ hai đường retention riêng A/B, mỗi đường chịu 100 N service/200 N proof:

`cassette → striker kim loại A/B → key A/B → backstop/frame A/B → vùng tay cầm`.

Holder nhựa và tiếp điểm pin không chịu lực retention.

Giữ envelope nút 100 N, không dụng cụ:

`nút → stem/stop kim loại → frame`.

Không chuyển lực cưỡng bức nút vào contact, plích USB hoặc vỏ đầu nối. Hai đường giữ pin không dùng chung thanh nhả có thể mở đồng thời do một chi tiết gãy.

Không tự coi tiết diện C11 cũ đã đủ cho cơ cấu mới. Dùng chúng làm đầu vào strength review; force path, phương tải và chỗ bắt frame phải kiểm lại trên geometry P0‑14.

**6. Counterexample/fault matrix**

| Tình huống | Yêu cầu / disposition hiện tại |
|---|---|
| Cassette cắm hờ | Tab vẫn chặn cam cho tới khi tiếp điểm đã tách đủ gap |
| Một tiếp điểm pin kẹt | Phải chặn tháo hoặc đứt đường dẫn theo lỗi đã phân tích; không tự coi cassette đã ra là tách điện |
| Một đầu cầu kẹt | Thanh xác nhận đầu đó chặn mở cửa |
| Một contact cầu kéo theo dây/pin | Đầu ngắt còn lại phải vẫn tách; cần kiểm trailing contact không vượt cả hai gap |
| Một latch/cửa gãy | Lớp cửa và thanh khóa còn lại phải tự giữ invariant |
| Cam/shaft chung gãy | Hai barrier cửa phải mặc định không mở từ trạng thái chưa tách; chưa có proof geometry này |
| Cáp PC cắm hờ | Không được cho nối lại cầu/pin; phải kiểm khoảng PC bắt đầu tiếp xúc so với cover trap |
| Cáp góc/vỏ mảnh | Trap phải dựa trên phần plug kim loại; chưa xác nhận tương thích |
| Dây jumper/foreign cable đưa tới chân B01 | Khoang PROGRAM chỉ lộ receptacle; các chân/socket còn bị che |
| Dị vật dẫn nối qua gap | Chưa được bao bằng “2 mm”; cần fault envelope và che chắn cụ thể |
| Vít/shield tạo ground vòng | FAIL kiến trúc; phải loại hoặc đưa qua breakpoint |
| Cố đóng khi PC còn cắm | Stop/frame chịu lực; không dùng USB receptacle làm fuse cơ khí |

**Chưa tuyên bố single-fault tolerant.** Các hàng contact kéo dài, cam chung và cửa gãy là acceptance cases phải khép, không phải trạng thái đã đạt.

**7. Candidate module có nguồn hãng**

- **Keystone 2464:** holder PCB cho **3 AA**, polypropylene, THM. Có thể đặt trong cassette kín với đầu tiếp xúc captive; chưa xác nhận dòng, retention hoặc bao lắp phù hợp. Không dùng 2463: catalogue hãng xếp mã đó cho **2 AA**, không phải 3 AA. [Keystone 2464](https://www.keyelco.com/product.cfm/product_id/1029), [catalog holder, tr.1](https://www.keyelco.com/pdfs/prod04-plasticholders.pdf)
- **Hirose DF11, candidate DF11‑30DS‑2DSA(05):** đầu nối 30 vị trí để khảo sát một đầu cầu giao diện. Chưa chọn mating pair, lượng contact cần dùng, tuổi thọ hoặc travel; không gán chân. Nếu dùng cam tự ghép phải kiểm khả năng chịu lệch, lực ghép/rút và guide riêng, không coi nó là blind‑mate đã được chứng nhận. [Trang hãng và drawing DF11](https://www.hirose.com/product/p/CL0543-0565-8-05)

Không khôi phục WRL‑20168, mã cell AA hoặc BOM lịch sử thành lựa chọn hiện hành. B01 vẫn là mẫu CH340 30 chân đã chọn.

**8. Interface Box02 cần cung cấp**

Đầu ra điện tối thiểu để đóng dossier chung:

- Danh sách đầy đủ mọi conductor liên đảo, gồm power, ground, shield, pull-up, sense, reset/boot và expansion; không cần GPIO assignment.
- Số circuit, dòng/áp contact và ground/shield topology cho cầu hai breakpoint.
- Cận điện áp/năng lượng dư hai đảo và điều kiện PC attach; đường hồi qua USB‑UART/regulator thật vẫn phải đánh giá.
- Trạng thái khi chỉ một đầu cầu tách, một contact stuck và một rail mất nguồn.
- Dải 3 AA NiMH, dòng xung, UVLO/hysteresis, đảo cực/quá dòng và yêu cầu connector pin.
- Điều kiện fresh-arm sau lắp lại, không biến vị trí cam thành bằng chứng nguồn/MCU đã hợp lệ.

**Scope review tối thiểu:** nhận hoặc sửa topology captive bridge + cam tuần tự + hai cover trap; khóa breakpoint/conductor và định nghĩa OFF mới; sau đó mới hoàn thiện kích thước/drawing nguồn để tính tolerance và fault.

Carrier vẫn target 90×90 mm, tối đa 100×100 mm; hai connector cầu, holder, cam và khoảng nâng 12 mm **chưa chứng minh fit**. Tổng robot + tay cầm dưới 1 triệu đồng **chưa có BOM giá hợp nhất**. Không cần hỏi lại hướng B; quyết định thật còn thiếu chỉ xuất hiện nếu OFF mới vẫn bắt buộc rail-qualified mà nguồn dư không thể khép bằng topology này.
