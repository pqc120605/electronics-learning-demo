# MM-UX-001 — Handoff

Source: chat06 final turn `01a1aa6c-ad3e-7183-8706-fae9835ae5f7`.

**MM-UX-001 · Handoff cho HQ và SE**

Lưu theo đúng mục đã mở trong thư viện. Nhập tệp hoặc lưu bản nháp chưa gắn mục sẽ tạo mục riêng và giữ định danh trong tệp. Chỉ thao tác **Tạo project độc lập** cấp định danh mới cho cả nội dung và mục thư viện.

Native agent `ui_ux_designer` đã trả thiết kế. Tôi đối chiếu các đường mở, nhập và lưu với mã nguồn, đồng thời xác nhận hash của năm tệp liên quan và queue khớp trước và sau lượt đọc. Phạm vi thiết kế là EXP-05, PRJ-02, PRJ-04 / M01, M11. Kiểm tra trình duyệt chưa chạy.

Hiện tại, mở mục thư viện có thể ghi ID mục vào `workspace.projectId`. Builder dùng cùng giá trị để tự lưu bản nháp, xuất tệp và chọn đích cập nhật thư viện. Hàm ghi còn tìm theo tên khi không tìm thấy ID. Trang Dự án đã có vùng xem trước và kiểm tra trùng tên trên danh sách đang hiển thị. [savedProjects.ts](/D:/StartupOS/electronics-learning-demo/src/lib/savedProjects.ts:63) · [CircuitBuilderPage.tsx](/D:/StartupOS/electronics-learning-demo/src/pages/CircuitBuilderPage.tsx:646) · [ProjectsPage.tsx](/D:/StartupOS/electronics-learning-demo/src/pages/ProjectsPage.tsx:78)

**Định danh và thao tác**

`P` là `workspace.projectId` trong tài liệu. `L` là ID mục thư viện, được giữ trong metadata cục bộ của bản nháp để khôi phục qua reload theo độ bền thực tế. Bundle chỉ mang `P`. Nhãn thư viện và `workspace.projectName` được giữ riêng. Với dữ liệu cũ, giữ nguyên `P` nếu có, kể cả khi `P === L`. Nếu bản nháp thiếu liên kết cục bộ rõ ràng, mở như bản nháp chưa gắn mục. [Hợp đồng roundtrip](/D:/StartupOS/docs/agents/runs/MM-CONTRACT-001/contract.md)

| Thao tác | Kết quả |
|---|---|
| **Nhập tệp ở Builder** | Sau khi bảo vệ bản nháp hiện tại và mở thành công, giữ `P` của tệp, kể cả khi tệp không có `P`, rồi bỏ liên kết `L` cũ. Hủy chọn tệp, hủy xác nhận hoặc hủy xem trước giữ nguyên bản đang mở và mục thư viện. Chỉ báo khôi phục thành công khi đã xác nhận đầy đủ. |
| **Lưu vào thư viện** | Tạo `L` mới và giữ `P`. Builder chỉ gắn `L` sau khi commit thành công. Nhập từ trang Dự án tạo mục mới và giữ nguyên workspace đang mở. |
| **Mở mục → sửa → cập nhật** | Mở đúng `L`, nạp nguyên bundle, giữ `P`. Chỉ chuyển trang khi mở thành công. **Cập nhật bản đã lưu** ghi đúng `L`. Khi nội dung đổi, đưa đầu mục cũ vào lịch sử của chính mục đó. Nếu `L` đã mất, báo “Không tìm thấy bản đã lưu. Bản đang mở vẫn còn.” Cho **Lưu thành mục mới** hoặc **Xuất bản đang mở**. |
| **Trùng tên** | Kiểm tra tại lúc ghi trên tên đã trim và giới hạn độ dài, so hoa thường theo `vi-VN`. Khi cập nhật, loại trừ đúng `L`. Báo “Tên này đã có trong thư viện. Hãy chọn tên khác.” Giữ tên và preview để sửa. Tên không chọn đích ghi. Kiểm tra lại lúc ghi chưa bảo đảm chống tranh chấp giữa các tab. |
| **Trùng `P`** | Cho tạo `L` riêng nếu tên hợp lệ. Khi phát hiện, báo “Thư viện đã có bản cùng nguồn. Mục mới sẽ được lưu riêng.” Áp dụng cả khi `P` của tệp tình cờ bằng `L` của mục khác. |
| **Tạo project độc lập** | Dùng thao tác sao chép trên thẻ, đổi nhãn thành **Tạo project độc lập**. Sinh `P` và `L` mới, giữ nội dung, bản nháp và kết nối, bắt đầu lịch sử riêng. Giữ workspace đang mở và toàn bộ dữ liệu nguồn. Nếu ghi lỗi, giữ nguyên mục nguồn và không hiện mục mới. |
| **Xuất → mở lại** | **Xuất bản đang mở** lấy snapshot hiện tại. **Xuất bản đã lưu** lấy đầu mục thư viện. Cả hai giữ `P`, bỏ metadata `L` khỏi tệp và không tạo revision. Mở lại từ thẻ gắn đúng `L`. Nhập lại từ tệp đi qua luồng tạo mục mới. |

**Trạng thái và câu chữ**

Hiển thị riêng trạng thái **bản nháp tự động** và **bản đã lưu trong thư viện**. Hai dòng có thể đồng thời là “Bản nháp đã lưu trong trình duyệt này” và “Có thay đổi chưa cập nhật vào thư viện”. Chỉ commit thư viện thành công mới đổi thời điểm bản đã lưu. Hiện `getBrowserStorage` có thể trả bộ nhớ tạm, nên `setItem` thành công chưa đủ để chọn câu chữ lưu bền. [workspaceStorage.ts](/D:/StartupOS/electronics-learning-demo/src/lib/workspaceStorage.ts:5) · [BuilderToolbar.tsx](/D:/StartupOS/electronics-learning-demo/src/components/builder/BuilderToolbar.tsx:29)

| Trạng thái | Câu chữ và bước tiếp theo |
|---|---|
| Đang đọc hoặc ghi | “Đang đọc tệp…” / “Đang lưu vào thư viện…” Chặn gửi lặp và giữ vị trí thao tác trong lúc chờ. |
| Persistent | “Bản nháp đã lưu trong trình duyệt này.” Với commit thư viện đã xác nhận, “Đã lưu ‘{tên}’ vào thư viện trong trình duyệt này.” Cho **Xuất tệp** để giữ bản riêng. |
| Session | “Bản nháp được giữ trong phiên của tab này. Hãy xuất tệp trước khi đóng tab.” Cho **Xuất bản đang mở**. Báo riêng nếu bản thư viện đã ghi bền thành công. |
| Volatile | “Bản nháp chỉ còn trên trang này. Tải lại hoặc rời trang có thể làm mất thay đổi.” Cho **Xuất bản đang mở** và thử lưu lại khi có đích phù hợp. Không xác nhận đã lưu vào thư viện trên trình duyệt. |
| Partial | “Chưa lưu đủ bản nháp. {Tên phần} chưa được ghi.” Cho **Thử lưu lại**, và **Xuất bản đang mở** nếu snapshot đầy đủ. Nếu mở thất bại và rollback thiếu phần, báo “Không mở được project. Bản nháp trước đó chưa được khôi phục đầy đủ.” Chỉ hiện tải bản sao khi đọc được bản sao. |
| Ghi thư viện thất bại | “Không lưu được vào thư viện. Bản đang mở vẫn còn.” Giữ tên, preview, liên kết và revision cũ. Cho **Thử lại**, **Xuất tệp** hoặc **Hủy**. Giữ bản nháp đang sửa dù thao tác lưu bị hủy. |
| Code và bản nháp khác nhau | “Code hiện tại và bản nháp của bài này khác nhau. Cả hai đang được giữ.” **Xem code và bản nháp** dẫn đến đúng bài và board. Mở, reload và xuất giữ cả hai giá trị, kể cả chuỗi rỗng. Chỉ sửa hoặc áp dụng rõ ràng mới thay nội dung. |
| Future version, board hoặc trường chưa hỗ trợ | “Tệp dùng phiên bản dự án mới hơn phiên bản này.” / “Phiên bản này chưa hỗ trợ board ‘{board}’.” Với trường mở rộng chưa hiểu, nêu trường liên quan. Giữ nguyên bytes tệp hoặc giá trị lưu gốc. Chặn mở và ghi. Cho **Tải tệp gốc** khi còn nguồn hoặc **Chọn tệp khác**. |
| Xem trước sửa dữ liệu | “Đã tìm thấy {n} mục cần xem lại. Dữ liệu gốc vẫn được giữ.” Nêu mục giữ, đổi hoặc bỏ, cùng lý do và ảnh hưởng. Cho **Tải tệp gốc**, **Hủy**, và **Áp dụng vào bản sao** khi có phương án sửa đã kiểm tra. Nếu chưa có phương án, giữ trạng thái chưa hỗ trợ. |
| Khôi phục | “Có bản sao của bản nháp trước đó.” Cho **Xem bản sao** và tải nguyên bản. Bảo vệ workspace hiện tại trước khi áp dụng. Chỉ gắn lại `L` khi metadata cục bộ xác thực còn trỏ đúng mục. Giữ bản sao sau khi xem, tải hoặc khôi phục. |

Dùng lại vùng công cụ project trong Builder, vùng xem trước nhập trên trang Dự án và xác nhận hiện có khi thay workspace. Thêm **Hủy** trong preview và báo lỗi trùng tên ngay cạnh ô nhập. Hủy hoặc đóng khi tệp còn đang đọc phải vô hiệu hóa kết quả đọc cũ để preview không xuất hiện lại.

Đưa focus tới tiêu đề preview khi mở. **Hủy** hoặc `Escape` trong preview trả focus về chỗ chọn tệp. Lỗi tên đưa focus về trường nhập và liên kết lỗi qua `aria-describedby`. Lỗi ghi giữ vị trí để thử lại. Nếu dùng hộp thoại tùy biến để xác nhận thay workspace, đặt focus ban đầu vào **Hủy**, giữ Tab trong hộp và trả focus về nút gọi khi đóng. Sau khi mở và chuyển trang thành công, đưa focus tới tiêu đề workspace. Dùng một vùng `role="status"` ổn định cho thông tin và thành công, thông báo lỗi cần xử lý ở vùng riêng. Chỉ đọc trạng thái autosave khi đổi loại hoặc gặp lỗi. Đặt trạng thái bên ngoài panel có thể bị ẩn. Màn rộng có thể đặt trạng thái cạnh thao tác. Ở 320 px hoặc zoom 200%, xếp dọc theo thứ tự DOM và giữ các nút dùng được bằng bàn phím và cảm ứng.

**Phạm vi giao tiếp theo**

- **SE** tách create, update và fork trong `savedProjects.ts`, giữ liên kết cục bộ qua `workspaceStorage.ts`, tách `P` và `L` ở Builder, rồi nối luồng nhập và mở ở `ProjectsPage.tsx`. Nếu toolbar vẫn phát câu “đã lưu” sai trong hành trình nghiệm thu, HQ cần đưa file đó vào phạm vi sửa hoặc ghi rõ lỗi còn mở.
- **QA/TST** kiểm tra hai đường nhập qua lưu → mở → reload → sửa → cập nhật → xuất → mở lại. Dùng fixture có hai `L` cùng `P`, `P` trùng `L` của mục khác, `P` vắng mặt, nhãn thư viện khác tên trong bundle và hai bản code xung đột. Xác nhận cập nhật chỉ đổi đúng mục và lịch sử của nó. Đích bị xóa, tên trùng, hủy và lỗi ghi phải giữ bản gốc và bản nháp. Fork phải cấp hai ID mới. So roundtrip theo hợp đồng, chỉ bỏ qua `exportedAt` ở hành trình không chỉnh sửa. Kiểm tra thêm focus, thông báo và màn hẹp.
- **HQ** có thể dùng handoff này để review và chốt phần định danh của MM-DATA-001. Mặc định thiết kế là cho nhiều mục cùng `P`, xử lý trùng tên bằng đổi tên và dùng thao tác sao chép làm fork tường minh. Không có quyết định sản phẩm đang chặn phần này. Codec cho schema và board chưa hỗ trợ, xuất nguyên bản, quota giữa nhiều lần ghi, rollback và độ bền tổng hợp vẫn cần triển khai và kiểm chứng riêng.
