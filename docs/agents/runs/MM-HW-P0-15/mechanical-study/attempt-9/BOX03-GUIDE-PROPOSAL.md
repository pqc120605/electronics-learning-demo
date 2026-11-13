Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c880-f469-71f1-bfb2-86d3933ab9ca

**Có thể dựng ngay một ray chữ T bắt giữ cassette trong hành trình 22 mm.** Tôi đề xuất hai ray nằm trong bề rộng 64 mm, một ray định vị ngang và một ray nới ngang. Cả hai giữ cassette theo Z. Giữ hai lưỡi A/B và bổ sung khoảng hở dưới lưỡi để dung sai ray không làm cassette kẹt khi cầu đã hạ.

Attempt‑5 cho ngưỡng nhả danh nghĩa 16,8 mm và khoảng hở nâng chỉ 0,1 mm khi cassette còn lắp. Attempt‑6 cho mốc ngắt có điều kiện 15,658 mm với cặp Samtec 20 contact. Khoảng hở 0,1 mm là phần cần sửa ngay khi thay dẫn hướng lý tưởng bằng ray có độ rơ. [Geometry attempt‑5](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-5/cassette_geometry.py) · [Kết quả connector attempt‑6](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-6/connector-allocation-results.json)

**Geometry để lead dựng**

Giữ hệ tọa độ attempt‑5. Cassette rút theo +Y, thân khi lắp kín có `X=[−32,32]`, `Y=[34,88]`, `Z=[8,30]`.

| Phần tử | Kích thước tham chiếu đề xuất |
|---|---|
| Hai ray cố định | Tâm `X=±30,5`, `Y=34…86`, tiết diện chữ T nằm trong vùng `Z=8…10,4`, chiều rộng ngoài mỗi ray 3 mm |
| Guốc cassette | Hai guốc trên mỗi ray, tâm Y=38 và 60 khi lắp kín, dài 6 mm. Tại hành trình22 mm, guốc cuối tới Y=85 |
| Tiết diện guốc | Đầu rộng2,0 mm, cao1,2 mm, tâm Z=9,1. Cổ rộng1,0 mm. Miệng ray nominal1,10 mm |
| Ray chuẩn ngang | Ray phía −X, khe tổng theo X **0,06–0,14 mm** |
| Ray phụ | Ray phía +X, khe ngang **0,30–0,50 mm** để tránh hai ray cùng ép định vị ngang. Khe Z cả hai ray **0,06–0,14 mm** |
| Recess | Khoét relief hai mép thân cassette dọc vùng guốc/ray. Kiểm riêng va chạm khi dịch 0–22 mm |
| Stop hành trình | Hai stop tựa frame. Lắp kín `b=0`, park `b=22±0,20 mm`. Contact connector và lưỡi khóa không làm stop |
| Hai lưỡi | Giữ X/Y của bản extension14. **Đổi đáy Z từ12,1 lên12,7 mm**, giữ đỉnh30 mm |
| Reserve connector | Một cặp cassette 20 contact theo trục Y, đặt mặt chuẩn động trên mặt cassette Y=34. Thử tâm `X=−16, Z=19`, reserve ngang X×Z **20×8 mm**. Tính mặt datum cố định theo stack ghép thật |

Ba datum là mặt tỳ Z trên ray, mặt định vị X của ray −X và mặt stop Y khi lắp kín. Cùng hệ datum này phải định vị guốc, lưỡi và PCB connector. Không lấy vách PETG ngoài làm chuẩn connector.

Với khe dẫn 0,14 mm, sai lệch guide phân bổ 0,05 mm và nhịp guốc22 mm, screening góc pitch/yaw là `atan(0,19/22) ≈0,495°`. Nhịp ngang61 mm cho roll khoảng `0,178°`. Dùng **±0,5° pitch/yaw và ±0,2° roll** cho sweep tham chiếu, kể cả tổ hợp cùng dấu.

**Cận cần giữ trong sweep**

- **Theo Y:** phân bổ tổng sai lệch ngưỡng lưỡi **≤0,60 mm**, gồm biên lưỡi 0,15, rail 0,10, datum 0,10 và pose 0,25 mm. Ngưỡng nhả sớm nhất còn **16,20 mm**, cao hơn mốc gap có điều kiện 15,658 mm khoảng **0,542 mm**.
- **Tại park:** `bmin=21,80 mm` phải vượt cả ngưỡng chạm chéo muộn nhất `20,80+0,60=21,40 mm`. Biên screening **0,40 mm**. Giữ ca lưỡi A chạm rail B trong phép kiểm.
- **Theo Z:** đặt điều kiện tổng sai lệch tương đối lưỡi–rail **≤0,55 mm**, gồm pose và sai số đặt chi tiết. Nâng đáy lưỡi lên12,7 tạo khe danh nghĩa 0,70 mm khi cầu hạ. Khe tối thiểu còn **0,15 mm**. Ở corner ngược lại, rail phải chạm lưỡi trước **h=1,25 mm**, còn xa vùng mở ở park16,2 mm. Phải quét cả lug, slot và thanh cửa để xác nhận khoảng nâng nhỏ này không tạo đường mở khác.

Các phép trừ trên kiểm tính nhất quán của bộ tham số. CAD cần xác nhận clearance và góc thực đồng thời thỏa các cận, đặc biệt khi chỉ một lưỡi còn nguyên.

**Nối vào chuỗi cửa–V**

Cassette còn trong vùng có thể dẫn giữ ít nhất một đầu cầu dưới vùng giải phóng cửa. Điều kiện mở PROGRAM vẫn cần **cả hai endpoint cầu**. Khi cầu ở park, lưỡi còn nguyên chặn cassette trước vùng nối lại. Chiều về giữ trình tự **adapter rút → kiểm shutter/probe/witness → V được giữ đúng vị trí → hạ cầu → lắp cassette**. Ray cassette chỉ giữ đúng đường đi và thứ tự contact của cassette. Điều kiện PC-present vẫn thuộc chuỗi V/probe/witness.

Ca cần kiểm trước gồm rút và đẩy lệch ở hai stop, mất từng lưỡi, chạm chéo A–B, một guốc bị nhấc, connector chạm trước khi ray định vị, một đầu cầu đứng thấp và cắm cassette khi cầu park. Bỏ đồng thời hai lưỡi là đối chứng bypass đã có. Bổ sung ca gãy chân đế chung khiến cả hai lưỡi mất vị trí dù vẫn còn trên cassette.

**Giới hạn fit và evidence còn thiếu**

- Ray giữ được bề rộng 64 mm trên bản bao. Holder tham chiếu rộng57,48 mm và mặt trong ray ở `|X|=29` chỉ để lại **0,26 mm mỗi bên** trước dung sai và vách cassette. Nếu holder, vách và guide vượt vùng này thì **bố trí 64 mm không vừa**. Không bù bằng cách làm mỏng vách chịu lực chưa kiểm.
- Reserve connector 20×8 mm đủ để thử socket dài16,64 mm nominal. Cần drawing của **đúng socket plating `‑S`**, stack ghép và metal envelope của cặp thực, lệch tuyến tính/góc cho phép, lực ghép/rút, terminal retention, cycle và cận dòng/nhiệt. Report2.500 cycle hiện thuộc cặp50 contact. Rail phải khớp cận alignment của cặp20 contact trước khi chốt fit. [Report attempt‑6](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-6/REPORT.md)
- Stop22 mm là vị trí service đang khảo sát. Cần kiểm vùng lấy cell/nắp để xác nhận có thay và sạc ngoài được ở vị trí này. Cảnh PROGRAM hiện dài **123,1 mm** khi gồm cassette kéo ra và đầu cắm. PCB ≤100×100 mm vẫn có thể phù hợp dù bao thao tác lớn hơn PCB. [Report attempt‑5](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-5/REPORT-r2.md)

**Bước tiếp theo cho lead** là ghép cặp ray trên vào model22 mm, dựng reserve connector từ cùng datum và quét đồng thời hành trình cassette, lift A/B và các corner dẫn hướng. Hai tiêu chí quyết định là **lưỡi không nhả sớm hơn mốc gap đã review** và **cassette không vào vùng nối điện khi cầu còn park**. Tối ưu lực gạt, chi tiết bắt vít và hình thức ray có thể theo sau nếu hai tiêu chí đó đạt trong bao lắp.
