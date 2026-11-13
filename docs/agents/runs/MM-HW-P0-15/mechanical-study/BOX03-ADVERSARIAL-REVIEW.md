Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c542-e10f-7892-aa23-ad9ff8ba4847
Read-only protocol/model critique; not artifact or gate acceptance.

**Có 3 case đáng bổ sung.** Protocol đã ghi rõ chuyển động áp đặt và giới hạn nghiên cứu; tôi không thấy nó tự tuyên bố cam/pawl đã được hiện thực hóa. Tuy nhiên, cách diễn giải kết quả có thể vượt mô hình ở các điểm dưới đây.

Chỉ đọc hai tệp và tính tọa độ độc lập; không chạy model, collision sweep, export hoặc sửa file.

**1. Key quay theo adapter nhưng luật mở shutter không đổi theo pose**

[transform/adapter_parts](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/m5_model.py:33) quay cả key, trong khi luật protocol mở shutter theo `d+lead` và identity `key_a/key_b`.

- Với **roll=180°**, hai vị trí key `(7,2;4)` và `(−7,2;−4)` đổi chỗ trong host.
- Với lead=3,5 mm, pitch=yaw=5°, roll=0°, tọa độ Y của **tâm mặt đầu key** tương đối origin lần lượt khoảng **3,75364 và 3,19319 mm**, không còn cùng bằng 3,5 mm.
- Luật hiện tại cũng chưa kiểm key thực sự đi vào channel hoặc gặp phần tử tác động.

**Test cụ thể:**

- Chỉ key A hiện diện; chạy roll=0° và 180°, rồi đổi A/B.
- Log riêng: key nằm ở channel nào, thời điểm đầu key tới trigger plane và shutter nào được áp chuyển động.
- Thêm pitch=yaw=5° để so sánh luật scalar với geometry.

**Tiêu chí:** hoặc mô hình công khai giữ đây là hai chuyển động áp đặt không phụ thuộc tiếp xúc, hoặc mapping/trigger phải theo host-space geometry. Không dùng kết quả hiện tại làm proof “key đúng mới mở đúng cửa”.

**2. “Guaranteed metal” đang là solid bounding box kích thước lớn**

[Protocol profile/baseline](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/protocol.json:17) dùng 8,28×2,43×6,55 mm; code dựng thành khối đặc.

Đó là **outer envelope**, không phải tập vật liệu kim loại chắc chắn hiện diện:

- Plug thật rỗng, có bo/chamfer và kích thước dung sai.
- 8,28/2,43 mm là phía kích thước lớn của reference.
- Exposed shell MIN đã đọc là 6,51 mm; không mặc nhiên coi toàn khối dài 6,55 mm là kim loại lộ.

Với kiểm va chạm, outer envelope có thể bảo thủ về **interference**. Với detector, “paddle chạm bounding box” chưa chứng minh paddle sẽ bị plug thật chặn.

**Test cụ thể:**

- Giữ khối hiện tại làm `outer-envelope`.
- Đối chiếu riêng các pose sát ngưỡng bằng reference shell rỗng/bo/chamfer hoặc một tập vật liệu bảo đảm được xác lập từ nguồn.
- Nếu outer-envelope collision nhưng mô hình vật liệu không collision, phân loại **indeterminate for presence detection**, không “port occupied proved”.
- Tìm các pose có penetration nhỏ nhất tại d≈6,4 mm và góc/offset biên.

Đây là điểm cần sửa cách gọi *guaranteed*, không nhất thiết bỏ mô hình bounding-box hiện tại.

**3. Negative control `collar=False` thay đổi nhiều hơn collar**

Ở [adapter_parts](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/m5_model.py:25), `collar=False` bỏ **cả collar lẫn rear crossbar**; keys vẫn có thể hiện diện và vẫn áp luật mở shutter.

Do đó test “missing/truncated collar” có thể đồng thời thay mất crossbar hoặc để key không còn liên kết được mô hình hóa. Không thể quy toàn bộ kết quả cho collar.

**Test cụ thể:**

Giữ cùng pose và shutter state, so sánh:

1. Đủ collar + crossbar.
2. Chỉ collar bị bỏ/rút ngắn, crossbar giữ nguyên.
3. Chỉ crossbar bị bỏ, collar giữ nguyên.
4. Cả hai bị bỏ như hiện tại.

Log collision theo từng component, tại dock và trên sweep. Với keys không còn được giữ bởi geometry, ghi rõ **synthetic fault geometry**, không coi đó là adapter lắp được.

**Kết luận review:** study vẫn phù hợp vai trò reference/collision exploration đã khai báo. Ba case trên giúp tránh biến **imposed motion, outer envelope và negative control nhiều biến** thành bằng chứng interlock. Chưa có kết luận về cơ cấu thực hoặc B1.
