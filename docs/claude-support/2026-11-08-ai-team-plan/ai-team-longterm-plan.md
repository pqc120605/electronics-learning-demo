# Kế hoạch dài hạn theo từng AI · 08/11/2026 · Leader Claude

Đội AI: Codex Plus (Sol + Luna), Codex thường (Luna), Antigravity bản thường (Gemini 3.8), DeepSeek 4.1 Flash, Kimi bản thường, và Claude (Leader/reviewer). **Tôi chưa kiểm chứng hạn mức token chính xác hay năng lực thật của các gói và model này**; mọi "ngân sách" bên dưới là ước lượng tương đối dựa trên những gì đã xảy ra (Sol hết token sau P0-01/P0-02; Luna làm xong ~12 slice) và phải hiệu chỉnh bằng sổ token (mục 7).

## 1. Nguyên tắc chia việc theo token

1. Việc đắt (suy luận khó, phần cứng, kiến trúc) → chỉ cho Sol/Claude; việc rẻ (patch nhỏ, nội dung, tóm tắt, thử trình duyệt) → Luna, Gemini, DeepSeek, Kimi.
2. **Luật 2 writer** (`parallel-build-policy.md`): tối đa 2 agent cùng ghi vào repo, đường dẫn rời. Chia hai làn: **Làn HW** (docs/hardware, hardware/) và **Làn SW** (src, tests, e2e, public). Mỗi làn một writer tại một thời điểm; hai tài khoản Luna thay phiên làn SW khi một bên hết hạn mức, không chạy song song cùng đường dẫn.
3. Chỉ Codex ghi code/`tasks.json`. Antigravity, DeepSeek, Kimi KHÔNG ghi vào repo: kết quả đưa vào thư mục trung gian `.tmp/ai-intake/<ai>/<ngày>/`, Claude lọc, Luna tích hợp.
4. Mỗi prompt kèm sẵn danh sách file cần đọc (không để agent tự khám phá), tiêu chí nhị phân và điều kiện dừng; dừng sau 2 lần lỗi cùng kiểu.
5. Báo cáo ngắn (file đổi + lệnh + exit code), không dán log dài vào chat.
6. Model không có công cụ duyệt web hay đọc repo (DeepSeek, Kimi bản chat) chỉ nhận việc "dán dữ liệu vào, lấy kết quả ra"; mọi con số hoặc link do chúng tạo phải có nguồn và được kiểm lấy mẫu.

## 2. Vai trò từng AI

| AI | Vai trò chính | Làm | Không làm | Ngân sách tương đối |
|---|---|---|---|---|
| **Codex Plus · Sol** | Người xây phần cứng/firmware và các việc CẦN SOL | `MM-ESP32-001` hợp đồng MCU, schematic tay cầm (khi có lease), kiến trúc nguồn robot, khung firmware, thiết kế K-RUN, rubric/assessment, cổng ngspice; Codex lead nếu cần ghi `tasks.json` | Patch UI nhỏ, nội dung bài, tìm link, chạy e2e lặp | Rất hạn chế: giữ cho 1 task/lần, slice lớn nhưng tiêu chí rõ |
| **Codex Plus · Luna** | Người xây SW chính (Làn SW) và điều phối hàng đợi | slice ≤5 file; vá lỗi; tính năng P01–P25 cấp D3; đồng bộ `tasks.json`/runs nếu Master giao | Đổi schema khi chưa được duyệt; phần cứng | Trung bình–cao: nguồn việc chính |
| **Codex thường · Luna** | Writer SW dự phòng và việc "tester/docs" | thay Plus khi hết hạn mức; chạy test/e2e theo kịch bản, sửa lỗi nhỏ; tích hợp dữ liệu/nội dung đã được lọc; viết test | Việc chạm kiến trúc, phần cứng | Thấp–trung bình |
| **Antigravity · Gemini 3.8** | Kiểm tra trình duyệt và nghiên cứu có duyệt web | thử UI thật ở 375/768/1440 px, kiểm a11y bằng bàn phím, thử offline/PWA, chụp ảnh bằng chứng; nghiên cứu nguồn/đối thủ; trích bảng thông số từ PDF **chính thức** (có số trang) | Ghi vào repo ngoài `.tmp/ai-intake/antigravity/`; chạy lệnh phá hủy; quyết định kiến trúc | Thấp–trung bình; mỗi phiên một nhiệm vụ |
| **DeepSeek 4.1 Flash** | Soạn nội dung và bản nháp rẻ | bài học tiếng Việt cho hành trình Starter (từ khung do Claude/Luna đưa), glossary, bộ câu hỏi tự kiểm, bảng test case, bản nháp mô tả sản phẩm cho team business, dịch tài liệu, bản nháp prompt | Số liệu điện, license, giá, trích dẫn không nguồn; ghi repo | Rất thấp: dùng nhiều, nhưng mọi đầu ra qua kiểm duyệt |
| **Kimi (thường)** | Đọc tài liệu dài | tóm tắt báo cáo/PDF dài do bạn tải lên (nguồn chính thức), so sánh hai tài liệu, trích bảng thông số kèm trang, đọc báo cáo nghiên cứu của team business, Q&A trên bộ tài liệu | Ghi repo; kết luận pháp lý/an toàn | Thấp |
| **Claude (Leader)** | Định hướng, review chốt chặn, quyết định dạng ADR | CP-01…CP-20, review kết quả Codex, lập prompt, lọc dữ liệu từ AI khác, báo cáo cho founder | Làm việc đọc dài (giao subagent), ghi code | Thấp: chỉ ở điểm chặn (xem mục 6) |

## 3. Kế hoạch dài hạn theo phase (không ghi ngày; đơn vị là chu kỳ làm việc)

Một **chu kỳ** = khoảng thời gian bạn dùng hết một vòng hạn mức của gói thấp nhất (thường tuần). Mục tiêu mỗi chu kỳ là số slice đã hoàn tất kèm báo cáo, không phải số giờ.

### Giai đoạn A · Hoàn tất P1 và mở khóa phần cứng (hiện tại)
| AI | Việc |
|---|---|
| Plus-Luna / Luna thường | (đang làm) sửa `test:e2e` chuẩn; WA-06 phương án B; sau đó `P1-L08` xuất SVG/PNG sơ đồ; hạ `build:local` heap |
| Sol | P0-S03 hợp đồng MCU (CP-02); hồ sơ r8 tay cầm: đóng 5 mục chặn cùng Box 08; xin lease REMOTE-KICAD khi đủ |
| Antigravity | thử e2e offline dưới `vite preview` bằng trình duyệt thật; kiểm Tab/Enter nối chân ở 3 viewport; chụp bằng chứng |
| Kimi | đọc datasheet Jauch 250832, TPS25947 từ trang hãng (bạn tải lên), trích bảng điều kiện sạc/NTC/timer kèm trang |
| DeepSeek | soạn glossary và 6 mục câu hỏi tự kiểm cho 3 bài hiện có (nháp) |
| Claude | CP-06 bù (WA-07), CP-01/CP-02, duyệt kết quả WA-06 |

### Giai đoạn B · P1 còn lại + P2 mở đầu (SW nền, schematic tay cầm)
| AI | Việc |
|---|---|
| Luna (cả hai) | WA-09 sau thiết kế của Sol; `RobotConfiguration` mô phỏng; bài học robot ở chế độ mô phỏng; tích hợp dữ liệu nguồn mở đã duyệt license (từng nguồn một slice) |
| Sol | P1-S01 schematic tay cầm; P1-X01…X04: thiết kế K-RUN (CP-07), spike ESP32 (chờ D13), cổng ngspice (chờ D5) |
| Antigravity | kiểm UI mỗi lần Luna đóng một slice lớn; nghiên cứu bổ sung mô hình 3D board có license rõ; kiểm lại link/license mẫu |
| Kimi | tóm tắt datasheet TPS63070, DRV8833, LM73100, ESP32 theo yêu cầu của Sol (kèm trang, để Sol tự đối chiếu) |
| DeepSeek | 4–6 bài học Starter bản nháp (dưới khung cấu trúc) để Luna đưa vào `src/data` |
| Claude | CP-03, CP-04, CP-05, CP-07, CP-08, CP-09 (phase P1) |

### Giai đoạn C · P2–P3 (mạch Starter, cơ khí) và P4 (bài học + điều khiển robot)
| AI | Việc |
|---|---|
| Sol | layout tay cầm/robot (CP-12), BOM variant (CP-11), chuẩn gắn module, điều khiển robot qua web phía firmware (CP-14) |
| Luna | trang QR, điều khiển Web Serial phía web, bài học hành trình Starter, e2e hành trình |
| Antigravity | thử Web Serial với board thật khi có (cần founder), kiểm UI/offline theo hành trình 7 bước |
| DeepSeek/Kimi | hoàn thiện nội dung bài, hướng dẫn lắp (nháp), tóm tắt tài liệu chứng nhận công khai để team business đọc (không phải tư vấn pháp lý) |
| Claude | CP-10…CP-16 |

### Giai đoạn D · P5–P8 (bench, public, PVT, E1)
Sol và Box 08 lo bench/EVT/DVT; Luna lo `build:public`, gói dự án số, E1 bài học; Antigravity thử trình duyệt toàn bộ trước `build:public`; DeepSeek/Kimi viết tài liệu người dùng, FAQ, hướng dẫn; Claude giữ CP-17…CP-20. Các phần chứng nhận, đóng gói, sản xuất nằm ngoài khả năng của agent: cần chuyên gia và founder.

## 4. Nhịp chu kỳ gợi ý
1. **Đầu chu kỳ (Claude):** đọc báo cáo, chốt danh sách 3–5 việc ưu tiên, sinh prompt; mục tiêu ≤1 phiên Claude.
2. **Giữa chu kỳ:** Làn HW (Sol, 1 task) và Làn SW (Luna, 2–4 slice tuần tự) chạy song song; Antigravity/Kimi/DeepSeek chạy các việc kiểm tra và nội dung ở thư mục trung gian.
3. **Cuối chu kỳ:** Claude review các checkpoint đã tới hạn; cập nhật `slices.md`, `founder-decisions.md`; founder duyệt hash/quyết định.
4. Khi một gói hết hạn mức giữa chu kỳ: hạ cấp việc sang AI rẻ hơn (Sol → Plus-Luna chỉ cho việc nằm trong khả năng Luna; Plus-Luna → Luna thường), không nhồi nhiều slice vào cùng một phiên.

## 5. Ghép việc theo độ khó (quy tắc nhanh)
| Loại việc | Giao cho |
|---|---|
| Đổi schema lưu, kiến trúc ≥2 module, bảo mật, phần cứng, firmware | Sol (rồi Claude review) |
| Patch ≤5 file, một kết quả kiểm chứng | Luna |
| Nội dung bài, glossary, dịch, mô tả | DeepSeek → Luna tích hợp |
| Đọc/tóm tắt PDF dài, so sánh tài liệu | Kimi |
| Thử UI/offline/viewport, nghiên cứu có duyệt web | Antigravity |
| Quyết định phạm vi, ADR, review chốt chặn | Claude + founder |

## 6. Giữ Claude ở mức rẻ (quan trọng)
- Phiên Claude hiện tại đã rất dài (hàng trăm nghìn token); mỗi lượt mới mang cả ngữ cảnh đó. Nên mở phiên Claude mới cho mỗi chu kỳ, bắt đầu bằng đọc `README.md`, `slices.md`, `founder-decisions.md`, `luna-backlog.md` và nhật ký mới nhất trong `docs/claude-support/logs/`.
- Giao việc đọc/kiểm cho subagent chỉ đọc; chỉ đọc kết quả. Chỉ mở Claude ở các điểm chặn CP-xx, ADR và lọc dữ liệu ngoài.

## 7. Sổ token (để hiệu chỉnh kế hoạch)
Tạo `docs/claude-support/2026-11-08-ai-team-plan/token-ledger.md` với bảng | Ngày | AI | Slice | Token ước lượng/đã dùng | Kết quả (ACCEPT/REJECT) | Ghi chú |. Sau 2 chu kỳ, dùng số này thay cho "ngân sách tương đối" ở mục 2: chuyển việc lên/xuống AI khác theo chi phí mỗi slice được chấp nhận.

## 8. Rủi ro
- Chất lượng DeepSeek/Kimi/Gemini chưa kiểm chứng trong dự án này: thử một việc nhỏ trước, so với kết quả của Luna/Claude, rồi mới giao việc lớn hơn.
- Luật 2 writer làm hàng đợi nghẽn khi một gói hết hạn mức: luôn giữ một AI dự phòng cho từng làn.
- Dữ liệu trẻ em, micro/giọng nói, đăng nhập: chỉ Sol/Luna làm, có Claude review (CP-15, CP-16); không giao cho AI không có repo.
- Không một AI nào được quyết thay founder về license, giá, chứng nhận, an toàn pin; những việc này chỉ lập nháp rồi chờ người quyết.

## 9. Chưa kiểm chứng
Hạn mức token thực của từng gói; khả năng Antigravity thao tác Web Serial/thiết bị thật; tên model "Gemini 3.8", "DeepSeek 4.1 Flash" và năng lực của chúng trong tác vụ tiếng Việt kỹ thuật (tôi chưa kiểm).
