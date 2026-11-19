# Đợt 4a — gói thực hành giáo viên local

Theo roadmap đã được founder giao tiếp tục: người dạy tải/in được gói thực hành bằng dữ liệu hiện có. CLS-01 là năng lực chính; LRN-02/LRN-08 là consumers. Đây là lát cắt gói giáo viên, không tự nâng toàn bộ CLS-01 lên D3, không phải mini-project tổng hợp hay hệ thống nộp bài.

## Phạm vi và quyết định triển khai

Thêm mục tùy chọn “Gói thực hành cho giáo viên” cuối trang Nền tảng điện tử, dùng chung ở hai route hiện có. Giữ bảng màu/font/focus của web, không thêm vào luồng bắt buộc của người mới. Mở mục này, chọn board tường minh (không mặc định hay lấy board người học), xem trước rồi tải một file HTML UTF-8 để mở offline/in bằng trình duyệt. Thay board trong gói không thay session, workspace, dự đoán, kết quả, draft hoặc storage.

Nội dung gồm chuẩn bị, thời lượng gợi ý có nhãn ước lượng, mục tiêu, lỗi thường gặp và gợi ý dẫn dắt; phiếu trống 13 trường hợp của 5 hoạt động với ô viết dự đoán/quan sát/giải thích/điều đã sửa; đáp án và code tách thành phần giáo viên bắt đầu trang in mới. Vật liệu chỉ là thành phần khái niệm của mô hình, không BOM/hướng dẫn đấu kit thật.

Ngưỡng cảm biến cố định50%, kiểm49/50/51%. Lấy titles/goals/questions/explanations/hints từ BEGINNER_ACTIVITIES, trường hợp từ getBeginnerCaseOptions, kết quả/code từ getBeginnerResult/getBeginnerCode với session mới độc lập. Không viết một engine đáp án khác. Thiếu/unknown board: 3 hoạt động topology có thể xem, 2 bài code ungradable, full-pack download bị khóa kèm lý do; không tự lấy ESP32 hay profile khác.

HTML đứng riêng có CSS nội tuyến và font hệ thống, không script, form gửi dữ liệu, ảnh/font/link stylesheet ngoài hoặc tài nguyên mạng. Escape mọi text khi serialize; không đưa learner progress/observations/code người dùng vào. Link tới ứng dụng chỉ là chỉ dẫn cần mở ứng dụng local, không hứa chạy bài trong file HTML. Nội dung phiếu là để điền thủ công, không tự coi là bằng chứng mô hình hay kỹ năng đạt.

Quyết định triển khai của lead: giữ standalone HTML thay vì sửa project/classkit codec. Project bundle v1/workspace≤4 có allowlist, cần board và lesson builder; khóa cơ bản có schema riêng và hoạt động nguồn không board. Vì vậy không thêm trường evidence vào các format đó. Việc chọn dạng HTML/placement/metadata là triển khai trong scope gói giáo viên đã được duyệt, không cần quyết định dịch vụ, dữ liệu trẻ em hoặc schema lưu mới.

## Files và kiểm chứng

Lease sáu file source/test: helper thuần `src/lib/beginnerTeacherPack.ts`; component/CSS mới `src/components/learning/BeginnerTeacherPack.*`; một import/insertion trong `src/pages/BeginnerLearningPage.tsx`; unit/SSR `tests/beginner-teacher-pack.test.mjs`; E2E `e2e/beginner-teacher-pack.spec.mjs`. Root ghi evidence/docs/queue; builder không sửa file khác.

Unit kiểm đủ5/13, mọi board hỗ trợ khớp engine/code, không board/unknown/điện trở thiếu, thứ tự49/50/51, deterministic output và escaped HTML; SSR không mặc định board, đúng accessible labels/disable. Browser375×812 và1440×900 ở cả hai route: keyboard chọn/tải, preview/answer-key, đọc file tải về, không tài nguyên ngoài, không tràn ngang và print layout. So sánh storage trước/sau thao tác teacher với dữ liệu đang có, malformed/newer, và storage bị chặn/quota; không nới assertion cũ.

Sau source freeze/review độc lập chạy focused/course tests, typecheck, full unit, build local và E2E liên quan dùng config chuẩn. Scope chung cùng phase3 được ghim bằng SHA-256. Không push/deploy/install/hardware từ task này. Mini-project tổng hợp và hồ sơ evidence portable cần contract riêng sau đó.
