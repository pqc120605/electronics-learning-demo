Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c6aa-b284-77d1-b2a6-4a7fe379dc1e
Read-only advisory; no hardware approval, pin assignment, gate change or B1 permission.

**Đúng: khi cassette đã ngắt toàn bộ nguồn/sense và hai gap I/O đã cắt mọi conductor tới B01 trước khi USB tiếp xúc, thiếu MAX turn-off của TPS22916 không còn ngăn chứng minh PROGRAM isolation.** Nó vẫn liên quan tới bảo vệ cell và dòng sau trip trong RUN; không được dùng kết luận này để miễn các chức năng đó.

Đây là căn cứ đề xuất sửa criteria/config để review, chưa xác nhận cơ cấu/gap thực đã đạt.

### Power-domain theo trình tự

| Trạng thái | Battery/cassette | Carrier, AON, monitor, LED | B01 | Đường dòng cần xét |
|---|---|---|---|---|
| **RUN** | Nối main và sense | Được cấp nguồn; có capacitor | Nối carrier qua bridge | Cell → main/sense → carrier → B01. UV, reverse, short và leakage đều còn áp dụng. |
| **CASSETTE_REMOVED** | Mọi conductor cassette đã tách | Chỉ còn năng lượng trong C; AON/LED có thể chưa tắt ngay | Bridge còn nối nên có thể nhận năng lượng từ C carrier | **C carrier → bridge → B01** vẫn có thể tồn tại. USB chưa được phép tiếp xúc ở trạng thái này. |
| **BRIDGE_PARK** | Vẫn tách | C carrier có thể còn điện | C riêng trên B01; đã tách carrier qua cả hai gap | Không còn đường dẫn carrier ↔ B01 nếu mọi conductor thực sự nằm trong cut-set. |
| **PROGRAM** | Không được tái nối theo interlock | Có thể còn điện tích nhưng tách khỏi B01 | PC cấp USB; ESP32 có thể phát RF | PC → B01. Không có đường tới carrier/battery qua giao diện đã ngắt. |

**Bốn node BAT0…BAT3 không đồng nghĩa bốn conductor.** Nếu có hai dây main và sáu sense riêng thì cassette có **tám conductor phải kiểm kê**, dù một số nối cùng node điện. Con số cuối cùng phải theo conductor matrix, gồm cả shield, debug, metal hoặc nhánh phụ nếu có.

### Energy inventory

| Miền | Năng lượng sau tháo cassette | Ý nghĩa đối với PROGRAM |
|---|---|---|
| Cell trong cassette | Vẫn là nguồn hóa học; đầu tiếp xúc vẫn có thể gây short | Cần bảo vệ nguồn/terminal riêng, nhưng không cấp được cho carrier qua gap đã mở |
| C đầu vào/output converter, C carrier | \(E=\tfrac12CV^2\); tổng C thực chưa chốt | Có thể cấp B01 **trước** BRIDGE_PARK; sau hai gap không còn đường bias tới PC |
| C rail AON/monitor/LED | Có thể giữ logic hoặc LED hoạt động một thời gian | Không tạo lại conductor đã bị ngắt cơ khí |
| C onboard B01 | Còn điện tích riêng trước khi cắm USB | Thuộc hành vi B01 standalone/USB đã để D10 xử lý |
| C/TVS/adapter mới gắn phía B01 | Chỉ tồn tại nếu proposal thực sự thêm | Phải khai báo delta; không mặc nhiên coi thuộc clone nguyên bản |

Ví dụ tính theo từng **100 µF**: tại 5,4 V là **1,458 mJ**; tại 5,25 V là **1,378 mJ**. Đây không phải tổng năng lượng carrier.

Không cần ép carrier về 0 V để chứng minh không bias PC **nếu cut-set vật lý đã ngắt mọi đường**. Ngược lại, “cassette đã tháo” chưa đủ khi bridge còn nối và C carrier còn cấp B01.

### Causal chain của PROGRAM isolation

Chuỗi cần chứng minh là:

1. Cassette tách mọi main/sense/return thực.
2. Bridge mở hai break trên mọi conductor carrier–B01.
3. USB chưa thể tiếp xúc điện trước bước 2.
4. Khi USB hiện diện, interlock ngăn tái nối đường carrier–B01 theo criteria đã chọn.
5. Không có đường vòng qua shield, debug, screw, adapter hoặc phụ kiện.

Trong chuỗi này, **TPS22916 có thể vẫn ON hoặc thậm chí short mà không vượt được gap vật lý hợp lệ**. Vì vậy không dùng `tOFF_MAX`, QOD hay freshness điện tử làm điều kiện thay thế cho gap — và cũng không bắt chúng đạt trước chỉ để chứng minh lại PROGRAM isolation.

### Những chức năng vẫn cần trong RUN

| Chức năng | Vì sao vẫn cần |
|---|---|
| Per-cell UV và cutoff có cận | Cassette đang nối; cell yếu có thể tiếp tục bị xả |
| Reverse/clamp từng cell/input | Đảo cell xảy ra khi nguồn còn nối, không được sửa bằng việc tháo cassette sau đó |
| Short/fuse/guard | Bảo vệ holder, dây và tap trước khi người dùng thao tác |
| Dòng AON/LED/monitor sau trip | Nguồn hóa học vẫn nối cho tới khi cassette thực sự tách |
| Startup/observe-release/freshness | Ngăn retry ngoài ý muốn và load permission sai trong RUN |
| RF/protocol/robot fresh-arm | PC có thể cấp ESP32 trong PROGRAM; physical gap không ngăn RF |

### Disposition trước B1

**Không còn là điều kiện của M5 PROGRAM isolation sau manual separation:**

- TPS22916 phải ngắt trong một MAX điện tử cụ thể;
- carrier phải xả hết điện trước USB chỉ để tránh bias PC;
- AON/LED phải về OFF tức thời sau tháo cassette;
- thêm cận C onboard B01 chỉ để chứng minh lại USB attach standalone.

**Vẫn phải đóng trước B1 theo phạm vi áp dụng:**

- Conductor matrix và trình tự tiếp xúc/cấm tái nối của interlock;
- gap thực, tolerance, contact kéo theo/stuck và đường bypass;
- vị trí, năng lượng và nguy cơ short của các node còn điện;
- bảo vệ nguồn trong RUN hoặc một delta vận hành được review rõ;
- cấu hình đúng revision/hash được phê duyệt cùng preflight tương ứng.

**Kết luận cập nhật:** no-go của chuỗi điện tử trước đây không đồng nghĩa no-go cho M5 manual PROGRAM isolation. Lead nên tách hai acceptance track: **physical separation cho PROGRAM** và **source/cell protection khi cassette còn nối**. D10 giữ nguyên; phần điện RUN chưa được miễn hoặc coi là đã đạt.
