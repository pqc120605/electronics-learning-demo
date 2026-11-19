# Kế hoạch hoàn thiện sản phẩm và phát hành trên Mini PC

**Quyết định đề xuất cho founder.** Phát hành một hành trình học điện tử bằng tiếng Việt đủ tốt để một người mới tự sử dụng từ đầu đến cuối. Lần đầu người học tự sửa được mạch LED; lần sau mở lại dự án và giải quyết thử thách mới. Mini PC phục vụ bản web đã kiểm và analytics riêng. Chức năng tài khoản, lớp trực tuyến, biên dịch từ xa và AI sinh câu trả lời được bật theo từng đợt có kiểm chứng.

[Bằng chứng và so sánh với đối thủ](README.md) · [Ảnh từng trang](evidence/index.md) · [Runbook Mini PC](van-hanh-mini-pc.md) · [Kế hoạch local đã làm đến 18/11](../../software/local-learning/2026-11-18-roadmap-local-finish.md)

## Bắt đầu ở đâu

1. **Founder + tester** mở bàn freestyle trên điện thoại, nhìn lại trường hợp panel che board và hai dây giao footprint trong [bộ ảnh thao tác thật](evidence/journeys/deep-journey-report.md). Lấy mạch Uno → điện trở → LED → GND đó làm mẫu nghiệm thu xuyên suốt.
2. **Frontend + người phụ trách nội dung** làm A1–A3 trong bảng dưới. **Backend/vận hành** có thể làm C1 song song. Khi chưa ở cạnh Mini PC, dùng hai release thử trong staging để diễn tập; không cần chờ máy mới sửa được giao diện.
3. **Tester độc lập** chạy lại tập nghiệm thu ở local, sau đó dùng đúng artifact public trong môi trường giống Caddy. Chủ máy chọn thời điểm chuyển bản khi C2 đạt. Trì hoãn các module online không làm chậm việc phát hành bản học khách.

Các mã A–E chỉ dùng dẫn chiếu phụ thuộc trong kế hoạch này. Khi duyệt triển khai, lead ánh xạ vào queue hiện hành và cấp phạm vi sửa nhỏ, độc lập. Mốc dưới là ước lượng ban đầu theo **1 frontend, 1 backend/vận hành, tester bán thời gian**. Ngày công khác thời gian lịch; đo lại sau chặng đầu, nhất là phần hình học board và dịch vụ online.

## Đợt A · Hoàn thành thí nghiệm đầu tiên

| Việc – chủ trì – công ước tính | Phụ thuộc và đầu ra | Nghiệm thu có thể lặp lại |
|---|---|---|
| **A1 · FE + UX · 2–3 ngày**. Trang đầu và tổng quan | Dùng lại route nền tảng, bàn tự do và snapshot resume hiện có. Người lần đầu thấy một CTA vào bài và một CTA tự lắp; người quay lại thấy tên dự án, board và bước đang học. Chỉ tải viewer khi người dùng mở. | 375×812 có thể bắt đầu hoặc tiếp tục từ màn đầu. Back/refresh giữ đúng route và tiến độ. Network trace của trang đầu không tải CAD/GLB/WASM chỉ để quảng bá bàn lắp. |
| **A2 · FE + nội dung · 2–3 ngày**. Chọn bài bất kỳ và board | Sau A1. Giữ URL bài cũ. Bài chuyên biệt ghi rõ board; bài đa board mở bước chọn, liệt kê chân sử dụng, kiểu chạy và đầu ra. Tách thiết bị minh họa khỏi board điều khiển bài. | Test một bài đa board trên Uno, Nano, ESP32 và một board chưa hỗ trợ. Chân và code thay đồng bộ; board lạ không tự rơi về ESP32. Không mất nháp khi đổi board hoặc bấm Back. |
| **A3 · FE · 3–5 ngày**. Không gian làm việc mobile | Sau A1, cùng dữ liệu A2. Chọn part xong thu bảng điều khiển, nhìn thấy ngay part và đầu cắm; inspector có nút quay lại đúng selection. Desktop có cảnh, code, kết quả; mobile tập trung một vùng chính với Chạy/Dừng luôn dùng được. | Người dùng chọn 2 board liên tiếp, nối 3 dây và quan sát D13 mà không phải tự tìm cách lộ canvas. Tab/Enter/Escape, cảm ứng và zoom 200% hoạt động, không mất focus hay lựa chọn. Screenshot trước/sau tại 375×812, 768px, 1440×900. |
| **A4 · Nội dung + QA · 1–2 ngày**. Lời giải thích đáng tin | Có thể bắt đầu ngay. Sửa ví dụ GPIO trong cộng đồng, gắn board/revision vào câu trả lời Mở Bot và đường dẫn pinout. Đồng bộ thuật ngữ HIGH/LOW hoặc đơn vị theo tín hiệu thực tế được provider cung cấp. | 20 câu tiếng Việt có/không dấu về board, cực LED, chân, offline, cách chạy. Ghi nguồn tại mỗi kết luận, hỏi lại khi thiếu revision; dùng câu hỏi ngoài phạm vi để kiểm khả năng nói chưa đủ dữ liệu. |
| **A5 · Tester + founder · 1–2 ngày**. Quan sát người mới | Sau A1–A3. Thử với 5–8 người tự nguyện trên hai cỡ màn hình. Ghi điểm dừng, số lần cần gợi ý và lời giải thích của họ. | Mục tiêu thử ≥4/5 người đầu tiên tạo được quan sát có nghĩa trong ≤5 phút. Nếu hai người vướng cùng một chỗ, sửa bước đó rồi thử lại với người mới trước khi mở rộng. |

## Đợt B · Độ sâu điện tử và giá trị quay lại

| Việc – chủ trì – công ước tính | Phụ thuộc và phạm vi | Nghiệm thu |
|---|---|---|
| **B1 · FE mô phỏng · 4–6 ngày**. Chọn và sửa dây | Sau A3. Sử dụng định danh partId/pinId và ID lỗ hiện hữu, giữ topology qua đổi view. Tăng vùng chạm; xem GPIO bằng hover/focus/tap, kéo điểm gấp, hủy, undo; giải quyết hai chỗ chồng footprint của fixture Uno. | Kiểm snapshot mạch cũ/mới với đổi điểm gấp, reroute, xóa rồi undo, chọn bằng bàn phím; không chập hai net ở chỗ giao. Nhập lại JSON giữ đủ endpoint, kể cả mạch cũ chưa có bend. |
| **B2 · FE + QA hình học · 3–5 ngày cho nhóm đầu**. 2D/3D/schematic/PCB | Sau B1. Làm Uno/Nano và một ESP32 đúng revision trước; lập danh mục các board còn lại gồm nguồn CAD, orientation USB, cổng, chân, ảnh top/side, giấy phép và mức hỗ trợ. Một selection xuyên view; PCB vẫn là CAD tham chiếu của board. | Đối chiếu tất cả chân của nhóm đầu, đảo mặt PCB đúng, rail/dải và cực LED đúng; 2D, schematic và 3D chọn cùng net. Ghi board nào còn thiếu nguồn, ví dụ Blue Pill/Nucleo. Không sinh anchor đoán để hoàn tất danh sách. [Hồ sơ nguồn](../../board-model-sourcing.md) |
| **B3 · FE mô phỏng + QA · 3–5 ngày**. Dạng sóng và thay tham số | Sau B1. Dùng provider hiện có và mở quan sát tại chỗ. Đổi R/C, chọn probe, chạy A/B và đánh dấu trục, đơn vị, nguồn, lần chạy. Serial Plotter hiện đã có; tối ưu đường đi từ kết quả về đúng mạch. | Blink Uno có D13 và LED cùng trạng thái; bộ chia áp có kết quả DC tham chiếu; RC có hai đường cong theo hai giá trị C. Đổi mạch làm hết hiệu lực trace cũ. Không ghi dòng điện/điện áp cho dữ liệu logic. |
| **B4 · FE + giáo viên · 2–4 ngày**. Lý do quay lại | Sau A2/B3. Từ hồ sơ mini-project đã có, lưu giả thuyết, lần thử, so sánh và gợi ý một biến thể tiếp theo, ví dụ thay ngưỡng hoặc tìm dây hở. Tái sử dụng hồ sơ và gói giáo viên. Gắn LRN-09/10, PRJ-02, OBS-03. | Học viên đóng trang, mở lại đúng board/code/dây và tiếp tục thí nghiệm thứ hai; xuất cho giáo viên đọc lại được lý do sửa. Trong nghiên cứu tự nguyện, đo lượt trở lại sau 7 ngày có làm thêm thí nghiệm, kèm mẫu số. |
| **B5 · QA + FE · 2–3 ngày**. Tiếp cận, offline, hiệu năng | Sau A3 và B1. Kiểm dark/light, zoom chữ, keyboard-only, screen reader, Android thật; ghi dung lượng nén theo route riêng với gói CAD và solver. Lập bảng offline cho từng công cụ sau khi tải lần đầu. | Ngân sách đề xuất cho thí điểm: p75 LCP ≤2,5s, INP ≤200ms, CLS ≤0,1 trên mẫu thiết bị/mạng đã ghi. Trước khi đủ dữ liệu thực, báo riêng 5 lần cold/warm. Đảm bảo draft riêng tư còn sau cập nhật SW; có trạng thái rõ khi asset chưa cache. |

## Đợt C · Đưa bản đã nghiệm thu lên Mini PC

| Việc – chủ trì – công ước tính | Phụ thuộc và đầu ra | Điều kiện chuyển bước |
|---|---|---|
| **C1 · Vận hành + backend · 2–3 ngày**. Phát hành lặp lại | Bắt đầu song song A1. Tách quy trình cài ban đầu và nâng cấp web. Manifest version/hash cho web, WASM, notices; staging dùng cùng Caddy routing. Hai cấu hình runtime local và public có kiểm tra capability. | Hai lần deploy cùng version không tạo DB mới; một lần deploy bản khác; thử thất bại có kiểm soát ở staging để quay về release cũ. Tab mở trước cập nhật vẫn tải được chunk động hoặc đưa ra cách reload không mất draft. |
| **C2 · Vận hành + tester · 1–2 ngày**. Đợt phát hành thử | Sau C1, A1–A4 và test chặng được chọn. Build public bên ngoài Mini PC. Giữ origin, Caddy, dữ liệu và khả năng rollback. | [Danh sách go/no-go](van-hanh-mini-pc.md) đạt. Kiểm điện thoại dùng dữ liệu di động và Wi-Fi, SPA deep link, SPICE WASM, draft cũ, capability runtime, public/private analytics. Lưu release ID, hash, người nhận và giờ rollback. |
| **C3 · Vận hành · 1–2 ngày + quan sát**. Khôi phục và tải | C1. Backup mã hóa ra ngoài SSD; phục hồi thử vào DB riêng. Kiểm khởi động lại có lịch trên máy thật, dung lượng RAM/ổ, độ trễ và lỗi khi tải lớp dự kiến. | Có bản backup mở được ngoài máy; mục tiêu đề xuất RPO 24h, RTO 2h. Pilot tải staging ở 1/5/15 người giả lập đọc bài, chạy công cụ client; công bố ngưỡng sau khi đo. Nếu swap kéo dài/OOM thì giảm dịch vụ trước khi tăng người dùng. |

## Đợt D · Backend chia sẻ và lớp online

**Kiến trúc đề xuất:** giữ Node + PostgreSQL analytics trên Mini PC. Cho pilot online, tái sử dụng adapter Supabase Auth/DB/Storage hiện có với dự án staging riêng, sau khi founder duyệt vùng lưu dữ liệu, ngân sách và quy trình quản trị. Ít vận hành hơn việc chạy thêm toàn bộ cụm trên RAM 4 GB. Nếu founder muốn toàn bộ dữ liệu ở nhà, ước lượng lại phương án API Node + PostgreSQL + kho tệp riêng; phải thay adapter xác thực/lưu trữ, đo tài nguyên và chứng minh phục hồi. Tránh vận hành hai nơi làm nguồn sự thật cho cùng một bài đăng.

| Việc – chủ trì – công ước tính | Phụ thuộc và thiết kế | Điều kiện nghiệm thu |
|---|---|---|
| **D1 · BE + QA · 3–5 ngày**. Danh tính và quyền | Sau quyết định backend, độc lập với B2. Bật staging; migration version hóa cho bài, attachment, chính sách đọc/ghi, audit kiểm duyệt. SQL community hiện là gói riêng; migration analytics có phạm vi khác. Quyền khách/author/mod/admin có ma trận. | Staging mới và bản được nâng cấp đều dựng lại được. Hai tài khoản A/B: A quản lý nháp của A, B chỉ thấy nội dung được phép; phiên hết hạn trở về luồng khách mà không mất nội dung. Giữ nháp local tới khi server xác nhận. [SQL đã có](../../software/community-online/001-community.sql) |
| **D2 · BE + FE · 3–5 ngày**. Bài đăng và tệp | Sau D1. Quy trình nháp → tải → kiểm → publish → báo cáo/ẩn. Giữ 5 tệp/bài, 10 MiB/tệp và 25 MiB cộng dồn. Kiểm cùng điều kiện ở backend/storage; quy định MIME, tên file, quyền đọc theo trạng thái, dọn blob mồ côi và quota. | Hai người trên hai thiết bị đăng/xem đúng ảnh; retry mạng không trùng bài/tệp; hủy upload còn nguyên nháp; quyền tải biến mất khi thu hồi nội dung. Moderator có hàng đợi, lý do ẩn và nhật ký. |
| **D3 · BE + FE · 4–7 ngày**. Đồng bộ dự án tự chọn | Sau D1. Đề xuất projects/revisions, stable ID và baseRevision; ghi có idempotency key, trả conflict khi base cũ; offline outbox lưu và retry. Liên kết chia sẻ gắn revision, cho fork có ID mới, thu hồi được. | Hai tab sửa song song giữ cả hai bản; nhập schema cũ và xuất JSON byte-đúng theo hợp đồng cũ; logout không để lộ cache của tài khoản trước; giao diện cho tải bản local. Thiết bị B mở được revision do A chia sẻ. |
| **D4 · FE + BE + giáo viên · 3–6 ngày**. Lớp thí điểm | Sau B4/D3. Lớp, lời mời có hạn, bài giao, submission ghim revision, nhận xét của giáo viên. Giữ quy trình dùng file cho lớp ngoại tuyến. | Giáo viên tạo một lớp, hai người học tham gia, nộp, giáo viên mở đúng revision và phản hồi; người ngoài lớp không đọc được bài riêng. Founder duyệt dữ liệu tối thiểu trước thí điểm với học sinh. |

## Đợt E · AI, biên dịch và IoT có kiểm chứng

| Việc | Phương án và cách quyết định |
|---|---|
| **E1 · Nội dung + backend · 3–5 ngày cho benchmark** | Mở Bot hiện có retrieval nội bộ, giao diện /api/guide-ai và danh sách model được client chấp nhận. Chấm tối thiểu 50 câu gồm câu tiếng Việt phổ thông, nhầm board/điện áp, không đủ dữ liệu, follow-up và câu hỏi theo mạch. Chỉ thử model ngoài khi đã duyệt cách truyền dữ liệu, ngân sách và nơi chạy; giữ local fallback. So độ đúng có trích nguồn, tỷ lệ nhận ra thiếu dữ liệu, p95 và chi phí/100 câu. Mục tiêu thí điểm ≥90% đúng trên bộ câu xác minh được, không khẳng định kết quả phần cứng dựa trên trace. Không có cơ sở chọn model tối ưu chỉ từ số tham số. |
| **E2 · Backend runtime · ước lượng sau benchmark** | Chọn một board và toolchain thật cần chạy từ xa dựa trên nhu cầu pilot. Ưu tiên firmware mẫu đã duyệt chạy trong browser trước. Nếu cần compile người dùng, đặt worker tách khỏi web, hàng đợi hữu hạn, sandbox không mạng, giới hạn tài nguyên/thời gian, cache theo target và toolchain; không gắn thiết bị thật. Cân nhắc máy khác nếu tài nguyên 4 GB thiếu. Nghiệm thu qua cùng sketch trên local và public, target sai báo rõ, tải cao web vẫn học được. |
| **E3 · Nội dung IoT + FE** | Sau B3 và nhu cầu pilot. Làm một lab phát lại tín hiệu cảm biến có timestamp/đơn vị, timeline và câu hỏi. Nếu mở phần kết nối thiết bị live, yêu cầu vai trò, nguồn dữ liệu, quyền ghi và quota riêng. Kiểm mất kết nối, sai thứ tự mẫu và phân biệt replay với live trên giao diện. |

## Tổ chức theo lịch và tiêu chí bàn giao

- **Tuần 1–2 dự kiến:** A1–A5 và C1, kiểm thử người mới sớm. Kết quả là một luồng demo có ảnh trước/sau và một quy trình nâng cấp đã diễn tập.
- **Tuần 3–4:** B1/B3, C2/C3; có thể phát hành từng nhóm nhỏ khi qua các cổng liên quan. B2 bắt đầu với một họ board, B4 dùng dự án hiện có.
- **Tuần 5–6:** hoàn tất B2/B4/B5 và D1/D2 nếu founder đã duyệt backend, ngân sách và moderation. Ưu tiên dữ liệu ổn định hơn mở nhiều feature cùng lúc.
- **Tuần 7 trở đi:** D3, D4 và E theo số liệu thí điểm. Các tuần là khung để điều phối; chuyển đợt theo bằng chứng trong bảng.
- Mỗi lần bàn giao có version/hash, thay đổi ảnh hưởng người học, link ảnh/video, kết quả test, danh sách môi trường đã chạy, điểm chưa kiểm và đường rollback. Tester độc lập chọn lại một mạch từ bản cũ để tránh chỉ test demo mới. Mỗi tuần founder xem ba số: tỷ lệ tự hoàn thành, tỷ lệ tự sửa được mạch, tỷ lệ quay lại thực hiện thêm một thí nghiệm. Khi chưa có mẫu, báo “chưa đo”.
