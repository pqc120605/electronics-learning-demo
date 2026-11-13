# Văn bản xác nhận của founder · D10 và các quyết định đi kèm

Dán nguyên khối dưới vào chat Codex lead (Sol 6.1). Đây là bản dự thảo do Claude soạn từ lời founder ngày 07/11/2026 ("Chấp nhận rủi ro", "Chốt D1, D2, D4", "phạm vi bạn quyết cho tôi"). Founder đọc lại; sửa chỗ nào chưa đúng ý trước khi gửi. Claude không thể xác nhận thay founder.

```
=== XÁC NHẬN CỦA FOUNDER · Mạch Mở · ngày 07/11/2026 ===
Tôi là founder và tôi xác nhận các quyết định sau. Hãy ghi vào biên bản chính thức (docs/hardware/mobot-v2-founder-decision-q1-q8.md) và dùng làm căn cứ cho cấu hình phần cứng mới. Xác nhận này KHÔNG phải duyệt hash cấu hình: việc đó tôi làm riêng, sau khi Box 08 review đúng bytes.

1. Q1–Q5 = A, A, A, B, B (mẫu đã chụp cho cả hai carrier; kiến trúc nguồn tay cầm v1; pack Jauch 250832; tách verification_items; 4 lớp PCB). Q8: giữ board 30 chân USB-C họ CH340; tôi không đo được mẫu nên mọi kích thước và điện nội bộ của board là ước lượng cho tới khi có số đo.
2. D1: robot carrier là lõi Starter; tay cầm là module riêng.
3. D2: thị trường đầu tiên là Việt Nam; chưa ghi độ tuổi lên hộp.
4. D3: giọng nói V1 chỉ là lời hứa tối thiểu (lời chào và hướng dẫn phát sẵn qua loa); không mic ở V1; không ghi "AI" hay "trò chuyện tự nhiên".
5. D4: kênh điều khiển web: Web Serial qua USB để kiểm chứng ở giai đoạn P1; Wi-Fi + WebSocket cho V1 sau khi thử.
6. D6: "L3" nghĩa là D3 của feature-depth-register.
7. D10 (chấp nhận rủi ro Q4-B): TÔI CHẤP NHẬN rủi ro khi cấu hình phần cứng mới được duyệt với các phép đo sau PCB nằm ở verification_items thay vì blocking_unknowns: dòng USB attach/boot/flash; UVLO động và nội trở pack; cận điện áp VM (xung, năng lượng hồi, điện tích lọt phía converter); nhiệt thật; độ ổn định ADC joystick; kích thước và điện nội bộ của board clone. Schematic và layout được tiến hành với các giá trị đó ở TBD.

TÔI KHÔNG CHẤP NHẬN (các việc sau vẫn bị chặn cho tới khi tôi cho phép riêng bằng văn bản): gửi PCB đi sản xuất; cấp điện pin Li-ion hoặc chạy motor trên PCB lắp xong; flash firmware; mua hàng; khẳng định "đã an toàn" hoặc "hợp lệ" cho giá trị chưa đo; bỏ qua Box 08 review từng verification_item trước layout; bỏ cổng chứng nhận đồ dùng trẻ em.

Điều kiện kèm theo: mỗi verification_item có tiêu chí PASS/FAIL, người đo và thời điểm đo. Chỉ tôi được đổi phạm vi chấp nhận này.

Chữ ký: <tên founder> · 07/11/2026
=== HẾT ===
```

## Hướng dẫn gửi (thứ tự)

1. **Đọc và sửa** khối trên. Thay `<tên founder>` bằng tên bạn. Nếu muốn khác ở mục 3 (D2) hoặc mục 4 (D3), sửa ngay trong khối.
2. **Gửi sang chat Codex lead (Sol 6.1)** — một tin nhắn, dán đúng khối đó. Chat Codex lead là nơi giữ `tasks.json` và ghi biên bản (theo `parallel-build-policy.md`, chỉ lead ghi approval).
3. **Ngay sau đó, gửi tiếp prompt `sol/P0-01-supersession-task-sync.md`** (copy nội dung file `docs/claude-support/2026-11-06-final-plan/codex-prompts/sol/P0-01-supersession-task-sync.md`). Prompt này ghi xác nhận ở bước 2 vào biên bản và đồng bộ `tasks.json`. Chờ Codex báo xong và `validate.mjs` exit 0.
4. **Sau đó mới gửi `P0-02` rồi `P0-03`**, mỗi cái một lượt; hai prompt này có "Claude review: CÓ", nên Codex sẽ dừng và đưa bạn khối RELAY CODEX → CLAUDE. Bạn dán khối đó vào phiên Leader Claude (phiên này) để tôi review.
5. **Song song** (không phụ thuộc P0), có thể gửi cho chat Codex Luna lần lượt `luna/P1-01` … `P1-05`, tối đa một lúc hai writer và không chồng đường dẫn.
6. **Việc bạn làm riêng sau này, không gộp vào xác nhận trên:** duyệt hash cấu hình JSON mới khi Codex báo Box 08 đã PASS đúng bytes. Đó mới là phê duyệt cấu hình; xác nhận D10 chỉ cho phép dùng `verification_items`.

Đừng gửi `P1-01` Sol (schematic) hoặc `P1-03` (firmware) khi chưa có lease và cấu hình được duyệt: prompt đã ghi Codex phải dừng nếu `validate.mjs --dispatch-task` ≠ 0.
