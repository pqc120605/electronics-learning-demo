# Đợt 2b/2c — từ cảnh báo tới vị trí mạch, chọn đúng khả năng board

Tiếp tục roadmap đã được founder giao thực thi local ngày 18/11/2026. Giữ routes, cách chọn board và dữ liệu người dùng. Không server, dependency, hardware, nguồn ngoài hoặc thay định dạng project.

## 2b — điều hướng chẩn đoán

Cross-probe part/net/pin giữa breadboard, schematic và 3D đã có và đã được E2E kiểm. Khoảng trống là panel Kiểm tra mạch chỉ có văn bản, dù evaluator biết chân/dây/linh kiện bị ảnh hưởng.

Thêm metadata điều hướng có kiểu cho G7 (chân hở), G6 (dây có vấn đề) và G8 (LED có lưu ý), tại chỗ evaluator đã biết ID. Giữ nguyên thông báo và verdict của cổng. Không phân tích câu tiếng Việt để đoán ID. Lỗi không có vị trí chính xác vẫn hiện thông báo, không tạo target giả.

Panel có nút xem chân/dây/linh kiện và lời nhắc kiểm tra tiếp. Callback thuộc page: kiểm target còn tồn tại trong doc và report hiện hành, dùng trạng thái selection/net đang có; bỏ pending nối dây khi chuyển sang inspection. Nếu view hiện tại là PCB tham chiếu hoặc không có geometry phù hợp, chuyển sang schematic hoặc thông tin văn bản có lý do. Không tạo nháp, nối dây, sửa document, vị trí, code, ID/revision hoặc chạy mô phỏng từ thao tác xem.

Đổi doc/board/bài phải loại hành động chẩn đoán cũ và highlight liên quan. Tính net của dây từ doc hiện hành khi bấm, không lưu net ID suy ra trong metadata. Sau render focus về vùng/view được chọn, có đường quay lại cảnh báo. Phím/bố cục kiểm ở 375×812 và 1440×900. Chỉnh topology tiếp tục xóa trace cũ theo cơ chế đang có.

Nghiệm thu: G7 chọn đúng endpoint sau khi xóa dây; G6 chọn đúng dây/net; G8 đúng LED; điều hướng đơn thuần không đổi bytes lưu hoặc tạo draft; stale target/report không chọn nhầm; read-only và thiếu geometry vẫn kiểm được với giới hạn rõ. Đây không phải ERC/solver hoặc xác nhận vật lý.

## 2c — finder khả năng board theo bài

Giữ native select và onChoose tức thời hiện có. Thêm phần tùy chọn “Chưa biết chọn board? So sánh khả năng” trong bước chọn board. Có tìm kiếm/bộ lọc theo hỗ trợ bài, hiển thị danh sách có giới hạn, tối đa hai card so sánh cùng lúc. Không chọn board hoặc tạo code/doc chỉ vì mở finder hoặc tick so sánh. Nút chọn card dùng callback hiện có; board chỉ tham khảo có đường tới hồ sơ/nguồn.

Helper thuần lấy đúng board ID từ registry, không gọi fallback ESP32/Uno cho ID lạ. Các cột độc lập: kịch bản bài hiện tại và lý do khóa; pinout theo tài liệu; số endpoint board trong bài có anchor chính xác trong presentation; CAD/ảnh tham chiếu theo đúng ID; runtime riêng của bàn tự do/HEX và điều kiện dịch vụ. Nhãn runtime không được coi là runtime đang sẵn sàng. Bài theo kịch bản không tự trở thành firmware khi board có emulator ở công cụ khác. Mọi board đều không được coi là đối tượng SPICE MCU đầy đủ.

Tái dùng boards, simulationTargets, getLessonBoardSupport, lessonBoardPresentation, board model evidence, firmware target và freestyle descriptors. Số chân có tài liệu không thay thế số chân có anchor trong bài. Không tạo anchor mới từ ảnh/ước lượng. Pico W/Pico 2 hoặc STM32 có pinout không đồng nghĩa presentation của bài đã nối được chân trên model.

Nghiệm thu: đúng biến thể, unknown trả null; Uno/Nano/ESP32/Pico/STM32 và catalog-only phân biệt đúng; coverage theo endpoint thực của bài; tìm kiếm/lọc/so sánh không ghi storage/đổi route; chọn vẫn theo callback hiện hành; keyboard/375/1440/nguồn mở đúng bề mặt app/public. Không thay pins/manifest/model hoặc chế tạo.

## Quy trình và bằng chứng

Hai task exact lease không chồng: MM-SW-DIAGNOSTIC-NAV-001 và MM-SW-BOARD-CAPABILITIES-001. Codex lead là người ghi queue và báo cáo, tối đa hai writer. TDD cho logic, kiểm browser theo tác động và review độc lập sau freeze. Worktree hiện tại được founder cho phép sửa trực tiếp trước đó; giữ nguyên các thay đổi analytics/SPICE/hardware và dữ liệu của công việc khác. Build local không phải duyệt phát hành.
