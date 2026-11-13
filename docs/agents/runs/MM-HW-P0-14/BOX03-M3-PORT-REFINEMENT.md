Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c508-6779-71b3-bef3-c13bf25fae1e
Read-only advisory; no physical qualification, gate or configuration approval.

**Đề xuất P0‑14‑M3: hai follower kiểm “cổng rỗng” độc lập, chỉ khi cả hai tới endpoint mới mở được hai pawl chặn tay cam.** Lực kiểm plug được giới hạn bằng coupling; lực cưỡng bức 100 N kết thúc ở pawl/stop tựa frame, không truyền vào plug PC hoặc receptacle.

Đã đọc hai refinement của Box02. Giữ EXT5V là **role nguồn chưa gán chân** trên cùng cầu double-break. B01 boot không phụ thuộc fresh-arm; grant chỉ cho phép chức năng được bảo vệ. Không sửa file, r12 hoặc thực hiện CAD/FE.

**1. Geometry kiểm cổng rỗng**

Dùng hai paddle/follower A/B ở **hai mặt phẳng trước miệng receptacle**, không đưa chi tiết vào receptacle hoặc quét qua USB contacts.

Mỗi paddle phải phủ toàn bộ corridor mà phần kim loại plug cần đi qua. Không dùng hai que hẹp có thể nằm hai bên plug.

| Tham số | Allocation M3 |
|---|---|
| Hai mặt phẳng kiểm | Cách mặt miệng receptacle nominal 1,0 và 2,0 mm; phải kiểm với drawing plug/socket |
| Vùng paddle phủ | Toàn aperture cắm plug, cộng 0,5 mm mỗi mép |
| Hành trình follower | Theo bề rộng aperture thực +1,0 mm overtravel tới dock; chưa khóa số mm |
| Lực tại mỗi paddle trước endpoint | **≤0,20 N**, kể cả người dùng ấn nút 100 N |
| Hai coupling | Lò xo/link giới hạn lực riêng; không có đáy cứng nối nút trực tiếp tới paddle |
| Phần overtravel nút | Gặp stop frame trước khi coupling có thể solid-bind |
| Xác nhận endpoint | Đầu paddle thực sự vào dock phía đối diện; không lấy vị trí tay nút làm bằng chứng |
| Pawl khóa cam | Hai pawl riêng; mỗi pawl tự chặn toàn thao tác reconnect |
| Phần chịu tải pawl/stop | Lõi proposal ≥8×8 mm; frame/backstop kim loại; cần tính assembly dưới 100 N |

Giới hạn 0,20 N là **yêu cầu thiết kế**, chưa có spring/link được chứng minh. Không cộng biến dạng follower vào hành trình “đã kiểm rỗng”.

**2. Trình tự PC-present và reconnect**

Giữ q của M2: nâng cầu tại q=0…14, park tại q=14…22, mở cửa tại q=22…30.

Trình tự ngược được sửa:

1. **q=30, PROGRAM:** cầu park, cassette bị chặn. Hai pawl chặn cam đi về reconnect.
2. Người dùng yêu cầu đóng. Hai follower được đẩy qua coupling lực nhỏ.
3. **PC còn cắm, kể cả cắm hờ:** phần plug chiếm corridor; ít nhất một follower chưa tới dock. Pawl tương ứng vẫn chặn cam.
4. **Cổng rỗng:** cả hai paddle tới dock và được giữ cơ khí tại endpoint.
5. Chỉ lúc đó từng đầu paddle mới tác động khóa riêng để rút pawl tương ứng. Nếu người dùng đang preload cam, pawl có thể kẹt không nhả; người dùng phải thả lực rồi thao tác lại.
6. Cam q=30→22 đóng hai cửa kết cấu. Paddle vẫn được giữ chắn corridor, nên PC không thể được cắm lại trong chuyển tiếp.
7. Cửa đóng hết mới cho q<22. Paddle chỉ được nhả/rút sau khi hai cửa đã che đường cắm.
8. q<14 mới hạ cầu; cassette lắp cuối tại q=0.

Chiều mở PROGRAM phải thực hiện đảo thứ tự tương ứng: **cầu đã tách → pawl reconnect đã gài → cửa mở → paddle mới rút khỏi corridor**.

Đây là **captive-key sequence**: không tồn tại trạng thái hợp lệ vừa cho PC đi vào vừa cho cam reconnect tiến qua điểm khóa.

**3. Vì sao plug không chịu 100 N**

Khi PC còn cắm:

`tay cam → pawl đang gài → backstop → frame`.

Nhánh follower riêng:

`nút kiểm → coupling lực giới hạn → paddle → plug`, tối đa 0,20 N/nhánh theo yêu cầu.

Không nối hai nhánh thành cùng một thanh cứng. Nếu coupling chạm đáy, cam ép trực tiếp follower hoặc pawl được rút từ hành trình nút thay vì endpoint paddle, **geometry FAIL**.

Sau khi paddle đã xác nhận cổng rỗng, dock giữ nó tại endpoint trước khi pawl nhả. Lúc này paddle chặn việc **cắm mới**, không đang ép lên một plug có sẵn. Cần backstop/dock để tải cắm mới không làm paddle lùi, rút khỏi dock hoặc cho PC tới contact. Đây là bài toán strength riêng, chưa được chứng minh bởi giới hạn lực kiểm 0,20 N.

**4. Partial plug và plug ngoài phạm vi**

Điều kiện hình học bắt buộc:

> Mọi vị trí mà plug PC có thể còn một contact điện với receptacle đều phải chiếm corridor kiểm; không thể có cả hai paddle docked.

Cần kiểm cả cắm/rút, nghiêng cho phép và plug shell thực. Hai mặt phẳng nominal 1/2 mm chỉ là input khảo sát, chưa chứng minh điều kiện trên.

Các counterexample chưa tự giải quyết:

- Adapter có phần dẫn tới contact nhưng không có shell đúng envelope đã kiểm.
- Plug/đầu dây hỏng hoặc shell bị tháo.
- Vật dẫn mảnh đi vòng hai paddle.
- Paddle cong, luồn dưới/trên shell nhưng đầu vẫn tới dock.

Không gọi các trường hợp đó được bao chỉ vì “hai follower”. Phải xác định phạm vi plug/cáp được hỗ trợ và thử hình học tương ứng; không dùng vỏ nhựa hoặc độ dày dây làm chuẩn.

**5. Fault table**

| Lỗi đơn | Hành vi cần có / giới hạn |
|---|---|
| Một follower gãy hoặc mất coupling | Không tới dock → pawl của nó giữ reconnect; nhánh còn lại vẫn kiểm corridor |
| Một mảnh follower kẹt đúng dock | Có thể giả endpoint một nhánh; nhánh còn lại phải tự chặn PC-present |
| Một pawl gãy/rút kẹt | Pawl còn lại tự chịu 100 N và chặn reconnect |
| Một pawl kẹt gài | Không reconnect; không tăng lực để phá |
| Một cửa gãy | Cửa còn lại tự che được đường cắm; cần chứng minh lực và bypass |
| Cam/shaft gãy | Không được kéo đồng thời hai pawl khỏi frame; khóa lấy từ endpoint, không từ shaft |
| Một coupling solid-bind | Có thể mất giới hạn 0,20 N của nhánh đó; cần stop độc lập hoặc coi đây là fault chưa được bao |
| Một đầu cầu không park | Endpoint thật chặn mở cửa như M2; không dùng q làm proof |
| Contact kéo dài tại một breakpoint | Breakpoint còn lại phải cắt chính conductor; không có dây/shield nối vòng |
| Gãy datum chung hoặc dị vật giữ cả hai dock | **Chưa được bao**; tách khoang/neo không tự chứng minh mọi common fault |
| B01 được PC cấp, firmware phát RF | Liên động không tạo cấm RF; giữ disposition riêng của Box02/robot |

Không tự suy hai pawl cùng gắn trên một tấm frame yếu là hai đường độc lập.

**6. Connector và giới hạn service**

Giữ DF11 làm candidate khảo sát kích thước, **không nhận làm connector sản phẩm lặp PROGRAM thường xuyên**.

Hãng công bố DF11‑30DS‑2DSA(05) **30 mating/unmating cycles**. Mỗi chu trình mở–đóng cầu tạo một chu trình ở cả A/B; double-break không nhân tuổi thọ lên. [Hirose — specifications](https://www.hirose.com/product/p/CL0543-0565-8-05)

Disposition:

- Chỉ dùng làm candidate prototype/service trong phạm vi cycle đã công bố, sau khi đối chiếu điều kiện thử.
- Có gate riêng chọn connector sản phẩm theo số lần PROGRAM/thay thế thực tế, lực ghép/rút, terminal retention và blind-mating bằng guide.
- Không mở broad survey hoặc chọn mã mới trong lượt này.

**7. Phần đã khép kiến trúc và phần còn phải kiểm**

Có thể đưa vào dossier: power-entry chung cầu; hai endpoint kiểm rỗng; coupling lực nhỏ tách khỏi stop 100 N; paddle captive ngăn PC cắm lại trong chuyển tiếp; cửa đóng trước reconnect.

Chưa thể gọi geometry proved:

- Corridor của mọi partial-plug điện còn nối.
- Coupling không solid-bind dưới 100 N và lỗi đơn.
- Dock/paddle không cong hoặc thoát khi chặn cắm mới.
- Hai pawl/stop cùng frame chịu tải và lỗi cam.
- Common datum, contact kéo dài và che chắn bypass.
- Fit PCB/vỏ và tổng kit dưới 1 triệu đồng.

M3 không cần actuator, timer 1 ms hoặc spring nạp mạnh. Bước review hữu hạn là kiểm **một chuỗi captive-key đầy đủ** với plug/socket envelope, endpoint thật, lực kiểm ≤0,20 N và đường lực 100 N; nếu không đạt một trong các điều kiện đó thì sửa hoặc loại geometry, không thay bằng hướng dẫn người dùng.
