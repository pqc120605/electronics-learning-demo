Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c685-4c5e-71a2-acba-2908a81d1ab9
Read-only advisory, not approved hardware topology or product configuration.

**Chọn một refinement reference: giữ bốn điều kiện home, nhưng bổ sung phép kiểm dương trên chính mặt che của từng shutter.** Đồng thời hạ claim của hai probe: chúng kiểm **controlled collar**, chưa chứng minh “USB generic đã rút”.

Đã đọc task attempt‑3 và geometry attempt‑2. Không chạy CAD/solver, sửa tệp hoặc chọn cấu hình.

### 1. Mất panel giữ tab: chưa tự là bypass hệ thống

Chuỗi lỗi cần phân biệt:

1. Panel A mất, proof-tab A vẫn home → **báo sai trạng thái chức năng A**.
2. Barrier A mất.
3. Barrier B còn đóng, nguyên vẹn → đường cắm generic vẫn có thể bị B chặn.
4. Nếu B đang mở bởi adapter hợp lệ, collar vẫn có thể cản probe → bridge chưa được nối lại.

Vì vậy, **không được ghi một lỗi mất panel A là system bypass** nếu chưa tìm được đường tới contact và trạng thái cho phép bridge reconnect.

Test phải xuất riêng:

- `false_home_indication`;
- `barrier_A_lost`;
- `reachable_USB_contact`;
- `bridge_reconnect_reachable`.

Chỉ hai giá trị cuối đồng thời đúng mới tạo counterexample cho invariant điện–cơ.

### 2. Functional witness được chọn: thăm dò mặt panel, có overtravel khi panel mất

Không thêm thanh chỉ đi qua lỗ. Đề xuất mỗi shutter một **witness plunger Wᵢ** đi theo Y, kiểm ngay vùng panel thực sự che tunnel.

Geometry reference để dựng:

| Tham số | A | B |
|---|---:|---:|
| Tâm panel Y | −4,0 mm | −2,5 mm |
| Mặt panel phía host | −3,6 mm | −2,1 mm |
| Trục witness | X=0, Z=+1,0 mm | X=0, Z=−1,0 mm |
| Đường kính đầu thăm dò | 0,6 mm | 0,6 mm |
| Vị trí đầu tip bắt đầu | Y=−3,4 mm | Y=−1,9 mm |
| Hướng thăm dò | −Y | −Y |
| Stroke khảo sát | 2,0 mm | 2,0 mm |

Tại shutter home, panel còn nguyên chặn tip sau khoảng **0,20 mm**. Panel mất thì witness có thể đi sâu hơn tới stop cuối 2 mm, trừ khi gặp component khác.

Điều kiện release reference:

`carriage_home AND witness_full-stroke-request_completed AND terminal_position_in_contact_window`.

Contact window khảo sát: **0,15…0,25 mm**. Đây là range nghiên cứu, chưa là dung sai được chấp nhận.

Điểm quan trọng:

- Không dùng “witness đang ở 0,20 mm” đơn thuần: người dùng hoặc lỗi có thể giữ nó ở đó.
- Phải mô hình cả **chu trình yêu cầu stroke tới endpoint**, phân biệt bị panel chặn với dừng tùy ý.
- Panel mất, witness đi hết 2 mm → **reject**, không “dễ đi qua nên PASS”.
- Nếu tip chạm plug, cam, rib hoặc frame tại cùng contact window thì đó là **false witness**; phải báo contributor cụ thể.

Witness phải rút hoàn toàn khỏi corridor trước khi cho shutter mở/adapter tiến. Chưa có cơ cấu force-limited, cycle-completion latch hoặc linkage thực; đây là hypothesis động học cần kiểm, không phải presence sensor đã hiện thực hóa.

**Bộ test ngay:**

1. Panel đầy đủ/home → chỉ panel tạo contact window.
2. Panel mất, tab còn → overtravel/reject.
3. Panel mất + witness kẹt trong window → báo false indication; đây là **hai lỗi**, không một.
4. Panel thủng quanh điểm witness nhưng còn phần che khác, và ngược lại → xác định giới hạn của việc lấy mẫu một điểm.
5. Witness chưa rút mà adapter tiến → phải jam trước khi được ghi reachable.
6. Quét witness với bridge, rib, cam và frame để loại vật cản giả panel.

### 3. Bare plug: có phản ví dụ cụ thể cho “hai probe rỗng ⇒ USB rỗng”

Tại `d=6,4`, reference shell nằm:

`Y=[−0,15;6,4]`.

Hai probe nằm tại −7,5/−8,6 mm nên **không giao shell đó**. Nếu không có controlled collar, kết quả probe-empty phụ thuộc hình dạng dây phía sau, hiện chưa được mô hình hóa.

Geometry frame còn có một đường đáng test:

- Door pocket cao 6 mm: `Z=[−3;3]`.
- Panel cao 5,4 mm: `Z=[−2,7;2,7]`.
- Có khe nominal **0,30 mm phía trên/dưới panel** trong vùng pocket.

Một tail synthetic dày **0,10 mm** có thể được đặt tại `Z≈2,85 mm` để vượt qua mặt phẳng panel; giữa các pocket nó hạ về tunnel `|Z|<2,5 mm`. Tại hai probe phía sau, tail cũng có thể đi ngoài `|Z|≤2,7 mm` qua probe-pocket cao 22 mm. Cần dựng đường liên tục và kiểm cả rib/cam, không chỉ các điểm này.

Đây là **ứng viên counterexample hình học**, chưa phải đường đã chạy thành công hoặc cáp thương mại đã quan sát. Không cần ép tail đi qua key-slot: các relief hiện hữu đã tạo các vùng cần kiểm. Key-slot và cam-pocket là route bổ sung, không được suy là kín.

Hai lưu ý:

- Shell được đặt sẵn tại d=6,4 **không chứng minh bare plug tới được đó qua hai cửa khỏe**. Phải kiểm lịch sử cắm.
- Có thể dùng hai cửa stuck-open làm seed đã biết để kiểm riêng detector/reconnect; khi đó là fault combination, không gọi là single-fault bypass.

**Delta kiến trúc:** không dùng hai probe xa miệng làm chứng cứ generic USB-empty. Trong hypothesis hiện tại, chúng chỉ kiểm collar của adapter xác định. Reconnect còn phải dựa vào các barrier đóng có chức năng thật. Nếu muốn bao generic thin-tail hoặc vật dẫn nhỏ tùy ý, cần một phạm vi cable/envelope có cận hoặc topology khác; chỉ thêm home-tab không giải quyết được.

### 4. Thứ tự hai gap trước khi rút V

Giữ nguyên `Lconductive` là input chưa xác định, không thay bằng wipe nominal.

Với mỗi đầu A/B:

\[
g_i=h_i-L_{\mathrm{conductive},i,\max}-\Delta_i
\]

Reference transition phải yêu cầu:

\[
\min(g_A,g_B)\ge g_{\mathrm{required}}
\]

**trước** khi bất kỳ thanh V nào có thể rút đủ để giải phóng cửa/probe.

Đề xuất model hai endpoint blocker riêng:

- Blocker A gắn với đầu cầu A thực.
- Blocker B gắn với đầu cầu B thực.
- Mỗi blocker chặn đường rút của **cả V₁ và V₂** khi đầu tương ứng chưa đạt `h_release`.
- Handle/shaft không trực tiếp rút hai blocker.

Test một đầu cầu kẹt thấp, đầu kia park: cả hai V phải vẫn không rút được. Contact kéo theo vẫn là fault riêng; vị trí housing không tự chứng minh contact gap.

### 5. Hướng tham chiếu nên dựng tiếp

Giữa hai khả năng:

- **Chỉ thêm V xuyên bốn home-tabs:** giữ lại false indication khi panel mất.
- **Home-tabs + hai positive face-witness:** có thể phát hiện đúng fault “mất panel, tab còn”, nhưng còn giới hạn lấy mẫu và witness kẹt.

Tôi chọn khả năng thứ hai cho **reference test hữu hạn**, với các negative controls nêu trên. Không gọi nó single-fault safe.

Các profile/witness/blocker và phép collision này nằm trong mục tiêu M5 đã duyệt về endpoint locks, keying và tìm bypass. Force limit, tolerance sản xuất, spring/latch thực, 100/200 N và adoption adapter vẫn ngoài kết luận reference. Nếu tests cho thấy false witness hoặc thin-tail reconnect reachable, ghi FAIL đúng hypothesis; không thêm assertion để ép đủ bốn home thành an toàn.
