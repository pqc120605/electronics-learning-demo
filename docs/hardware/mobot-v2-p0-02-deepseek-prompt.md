# RELAY · Codex HQ → DeepSeek · MoBot V2 P0-02

Gửi câu lệnh bên dưới cùng file `mobot-v2-p0-02-handoff-2026-11-07.md`. Nếu cần cung cấp thêm dữ liệu, đính kèm hai proposal JSON và packet OFF-release nêu trong hồ sơ. DeepSeek chỉ có thể đọc những gì được đính kèm hoặc dán, kể cả khi văn bản chứa đường dẫn nội bộ.

---

Bạn là reviewer kỹ thuật tư vấn cho MoBot V2. Đọc bàn giao P0-02 đính kèm. Mục tiêu là tìm bằng chứng mới hoặc tính toán có thể giúp đóng các blocker trước khi Founder duyệt hash. Ưu tiên tay cầm Type-C/CH340 độc lập theo D15(a), sau đó mới đến robot. Trả lời bằng tiếng Việt, giữ thuật ngữ và mã linh kiện gốc.

**Các quyết định đang áp dụng**

- Tay cầm dùng Jauch 250832, H3 danh nghĩa 0,40 A, giữ một USB-C B01 luân phiên RUN/PC và cổng CHARGE riêng. Chuyển chế độ RUN → OFF → PROGRAM với giữ phích đến khi xác nhận OFF thực. OFF thực gồm I/O đã cách ly, Source ngừng cấp và RUN OUT đã xả đủ. Tháo bảo trì chỉ sau cách ly vật lý pack và nguồn ngoài, giữ cách ly I/O và xác nhận rail dư.
- D10 giữ nguyên. Chỉ sáu nhóm đo đã ký được để TBD / NOT_RUN sau PCB. Bằng chứng thiết kế về fail-off, đường hồi, chốt và timing đúng cụm nằm ngoài D10. Hai ca C-to-C tại B01 được theo dõi riêng.
- B04 và hai pack ứng viên chưa được chọn theo D16(c). Mọi đề xuất đổi kiến trúc, charger, pack hoặc setpoint cần trình Founder riêng.

**Bốn gói cần xử lý**

1. **OFF thực và lỗi một điểm.** Phản biện hai đường cắt nối tiếp, hai kênh sense và hai điều kiện cấp điện nhả. Rà chập chéo, GND/bias chung, pull-up còn nguồn, switch hoặc actuator kẹt, chốt kẹt mở khi đang RUN. Đề xuất cách chứng minh ở cấp khối với nguồn hãng. Rà tải kiểm 1 kΩ và điều kiện tách hai dải dòng. Rà công thức xả, trường hợp bleed hở và ca PC cấp B01 trong lúc RUN OUT gặp sink khác. Nêu đại lượng phải lấy trên đúng cụm và gợi ý phép kiểm phân biệt được từng giả thuyết. Các số 4,40 V, 0,10 mA, ±0,05 mA, 0,8 V, 10 µA, 47 µF và 0,97 s chỉ dùng minh họa.
2. **UVLO và Jauch/H3.** Kiểm lại sàn 3,558 V lúc nhận RUN mới, cận rising/falling của phương án 80/83 kΩ và biên ngắt 42 mV. Tìm đường xả/hồi áp đúng pack hoặc chỉ ra dữ liệu tối thiểu còn thiếu. Kiểm chồng lấn CV–PCM 2 mV với điều kiện thử và dung sai đúng. Tìm CV pack cho phép, termination/timer/recharge, NTC R–T qua dung sai và ánh xạ XHP-3 đúng revision. Nếu hồ sơ không đủ, trình các phương án có điều kiện và ghi rõ mục nào cần Founder quyết.
3. **B01, cơ khí, bó dây và fab.** Tìm bằng chứng nối đúng PCBA/lô mẫu ảnh với SKU 02030089 hoặc EP000723. Kiểm dữ liệu CC/VBUS, cận đường hồi và rò qua hai miền mất nguồn. Rà giới hạn dùng stackup JLC04161H-3313A và 0,80/0,65 mm dự trù. Đề xuất các cận fixture về giữ phích, kéo lệch, mòn, sai số đồng bộ và dừng thử. Phân biệt thông số đầu nối chuẩn với giới hạn chốt/gá thực.
4. **Robot.** Ưu tiên bằng chứng có thể làm song song cho B04, UBBL20-C1 và RS PRO 176-9352 về cân bằng, dòng xung theo thời lượng, PCM, NTC và tương thích sạc. So 466 mA khuyến nghị của Ultralife với R5 500 mA danh nghĩa qua dung sai và nhiệt. Chỉ ra chứng cứ cần cho R1/BT-R1a, phát hiện kẹt, hấp thụ VM và CE/veto mặc định OFF qua ramp/mất bias. Không chọn pack thay Founder.

**Định dạng trả về**

Trả một bảng theo blocker với các cột `ID | Kết luận | Nguồn đúng mã/revision và trang | Phép tính, cận và giả định | Còn cần hồ sơ/mẫu/đo gì | Điều kiện PASS/FAIL | Có cần Founder quyết không`. Phân loại từng dòng thành **đủ căn cứ trên giấy**, **ứng viên có điều kiện**, **cần đúng mẫu**, hoặc **cần quyết định Founder**. Kết thúc bằng các đầu vào tối thiểu có thể chuyển nhà bán và các câu hỏi còn cần Box 02/03/08 kiểm. Nếu phản đối số liệu trong bàn giao, chỉ ra phép tính hoặc nguồn cụ thể.

Chỉ dùng dữ liệu công khai, ưu tiên nguồn hãng và trích điều kiện áp dụng. Giữ TBD/UNKNOWN khi thiếu căn cứ. Đừng ghi PASS cho bench chưa chạy, tự sửa queue hay đề nghị coi phản hồi này là phê duyệt kỹ thuật. Không yêu cầu truy cập tài khoản, bí mật, mua hàng, cấp điện, flash, gửi sản xuất hoặc mở KiCad.
