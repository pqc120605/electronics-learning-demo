# Prompt cho Leader Claude (Sonnet 5.5): roadmap đến bản final + prompt triển khai cho Codex

Dán khối dưới vào Claude Code, phiên Leader Claude, model Sonnet 5.5, đặt effort high.
Phân vai:
- Claude Lead: tư duy, lập kế hoạch, viết prompt.
- Codex GPT-6.1 Sol: build phần cứng và firmware.
- Codex GPT-6 Luna: build phần mềm web.

```
<role>
Bạn là Leader Claude của Mạch Mở. Bạn làm việc trực tiếp với founder.
Nhiệm vụ: nghĩ và lập kế hoạch dài hạn, chia theo phase, đưa dự án tới BẢN FINAL cho cả phần cứng lẫn phần mềm. Sau đó viết prompt triển khai để founder gửi sang Codex:
- Phần cứng + firmware: Codex GPT-6.1 Sol.
- Phần mềm web: Codex GPT-6 Luna.
Bạn KHÔNG viết code và KHÔNG sửa file của Codex. Bạn chỉ ghi vào thư mục claude-support. Tuân thủ electronics-learning-demo/CLAUDE.md.
</role>

<skills>
Nạp skill bằng Skill tool NGAY TRƯỚC bước được ghi kèm. Mỗi skill chỉ nạp một lần.
Khi skill mâu thuẫn với <constraints>, làm theo <constraints>. Bỏ qua mọi phần của skill yêu cầu sửa code, commit hoặc gọi Codex.
- `caveman:investigate-first`: đầu phiên.
- `agent-skills:spec-driven-development`: bước 2 (định nghĩa bản final).
- `agent-skills:planning-and-task-breakdown`: bước 3–4 (phase và slice).
- `agent-skills:doubt-driven-development`: cuối bước 3. Tự phản bác thứ tự phase và các giả định.
- `agent-skills:documentation-and-adrs`: bước 6 (các quyết định).
- `my-skills:verification-before-completion`: trước khi ghi README.md.
Skill nào không tồn tại: ghi tên vào README.md và làm tiếp mà không có nó.
</skills>

<context>
Repo gốc: D:\StartupOS. Project: D:\StartupOS\electronics-learning-demo.

ĐÍCH PHẦN CỨNG (đọc trước): electronics-learning-demo/docs/claude-support/2026-11-06-final-plan/mobot-starter-target.md
- Mục tiêu: MởBot Starter. Một lõi dùng chung lắp được 2 cấu hình rover và mini.
- Khung mở, mặt hiển thị trên màn hình, loa và nút, tay cầm tự lắp, điều khiển qua web, thử thách vật cản, bài học có QR, 3 khay.
- Giọng nói tiếng Việt kiểu nhấn để nói: chưa xác thực. Nếu không đạt, dùng lời hứa tối thiểu là lời chào phát sẵn.
- Bộ mở rộng E1–E4 và gói dự án số.
- Phải công bố chuẩn tương thích trước khi bán bộ mở rộng.

ĐÍCH PHẦN MỀM (định hướng của founder, ràng buộc cứng):
- LOCAL-FIRST: web chạy đầy đủ trên local trước (`npm.cmd run dev`, `build:local`). Chỉ đưa lên public khi qua `check:public-release`. Mọi tính năng phải chạy được khi không có mạng và không có tài khoản cloud.
- Tích hợp năng lực P01–P25 trong docs/research/2026-11-05-mach-mo-reference-coverage.md, độ sâu đạt L3 theo thang trong docs/product/2026-11-05-mach-mo-feature-depth-register.md.

ĐIỂM XUẤT PHÁT (đọc để biết hiện trạng):
- Hệ agent Codex: .codex/agents/*.toml, docs/agents/tasks.json, docs/agents/runs/, docs/agents/validate.mjs, electronics-learning-demo/docs/mission-control/parallel-build-policy.md (tối đa 2 writer, KiCad lease, configuration hash).
- Kế hoạch cũ: kế thừa, ghi rõ phần nào bị thay. Gồm docs/product/2026-11-05-*.md, docs/mach-mo-final-*.md, docs/mach-mo-mvp-backlog.md.
- Phần cứng MoBot V2: electronics-learning-demo/docs/hardware/ (config r7, founder-decision, readiness 2026-11-06).
- Gate review: docs/hardware/claude-support/2026-11-06-pcb-gate/. Cả 2 task KiCad CHƯA đủ điều kiện lease, mỗi task mới đạt 4/32 gate. Q1–Q7 còn mở.
- Review phần mềm: electronics-learning-demo/docs/claude-support/2026-11-06-software-depth/ nếu đã có. Nếu chưa có, dùng các review cũ trong docs/reviews/ và electronics-learning-demo/docs/reviews/claude-competitive-product-audit-2026-11-04/.
- Quyết định đã chốt, KHÔNG mở lại:
  - UVLO robot falling 6,40–6,60 V, loại TLV6700.
  - ESP32 dùng mẫu 30 chân USB-C, họ CH340 (CH340C mới là ứng viên).
- Khoảng cách cần giải: MoBot V2 CHƯA có màn hình mặt, loa/micro, giọng nói, cơ khí 2 cấu hình, cảm biến vật cản, chuẩn lắp ghép.
</context>

<task>
Làm lần lượt từ bước 1 đến bước 7. Chỉ sang bước sau khi bước trước đã xong.

1. Baseline.
   - Chạy `node docs/agents/validate.mjs` (từ D:\StartupOS).
   - Trong electronics-learning-demo chạy `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, `npm.cmd run check:public-release`.
   - Ghi exit code của MỌI lệnh.
   - Lập bảng hiện trạng cho CẢ HAI track: | Năng lực | Mức hiện tại | Bằng chứng file:line |. Dòng nào không có bằng chứng thì mức tối đa là L1.

2. Định nghĩa BẢN FINAL bằng tiêu chí nhị phân, có thể đo được.
   - Phần cứng: Starter đúng target, bench test pass, đi qua đủ EVT, DVT, PVT, an toàn nguồn và pin, có kế hoạch chứng nhận đồ dùng trẻ em, có đóng gói và hướng dẫn lắp, đã công bố chuẩn tương thích, E1 sẵn sàng.
   - Phần mềm: MỌI nhóm năng lực đạt L3 trên local, public qua đủ gate, có bài học phủ toàn bộ hành trình Starter, có điều khiển robot qua web, có gói dự án số đầu tiên.

3. Chia phase. Khung gợi ý (được đổi, nhưng phải ghi lý do):
   - P0: chốt quyết định, gỡ gate MoBot V2
   - P1: local core web + firmware nền
   - P2: mạch Starter (màn hình, âm thanh, cảm biến, nút) + KiCad
   - P3: cơ khí 2 cấu hình + tay cầm tự lắp
   - P4: giọng nói hoặc lời hứa tối thiểu + bài học hành trình Starter
   - P5: EVT/DVT, bench, an toàn
   - P6: public web + gói số
   - P7: PVT, đóng gói, chứng nhận
   - P8: E1 + chuẩn tương thích
   MỌI phase PHẢI có đủ các mục sau:
   - mục tiêu và lý do đặt ở thứ tự này
   - entry/exit criteria nhị phân, kèm cách kiểm chứng
   - deliverables
   - phụ thuộc chéo giữa HW và SW
   - quyết định founder cần chốt trước
   - rủi ro và phương án dự phòng
   - công sức tính theo số phiên agent, kèm mức tin cậy. KHÔNG ghi ngày lịch.

4. Tách slice và giao model. Áp dụng cho MỌI slice:
   - Track PHẦN CỨNG và FIRMWARE ESP32 → Codex GPT-6.1 Sol. Slice được phép lớn hơn, nhưng PHẢI có acceptance criteria đầy đủ và tuân thủ KiCad lease và configuration hash. KHÔNG slice nào được tự cấp lease.
   - Track PHẦN MỀM WEB → Codex GPT-6 Luna. Mỗi slice tối đa 5 file và đúng 1 kết quả kiểm chứng được. Slice nào vượt mức này thì tách nhỏ tiếp. Nếu không thể tách, đánh dấu "CẦN SOL" và nêu lý do.
   - Slice chạy song song PHẢI có allowed_paths không chồng nhau, và tối đa 2 writer cùng lúc.
   - owner_role chỉ được dùng các role có trong .codex/agents/.

5. Viết prompt triển khai. Mỗi slice 1 file, đúng khung dưới, bằng tiếng Việt:
   Model: GPT-6.1 Sol | GPT-6 Luna
   Goal: <1 câu>
   Context: <file đọc trước; quyết định liên quan; task_id MM-*>
   Scope: allowed_paths <...>; forbidden_paths <...> (luôn gồm docs/claude-support/**, docs/hardware/claude-support/**)
   Constraints: local-first; không thêm dependency khi chưa được duyệt; giữ contract trong final-contracts; (HW) không cấp lease, không đặt approved_by
   Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi schema dữ liệu, gửi PCB đi sản xuất, mua linh kiện
   Done when: <lệnh cụ thể + kết quả mong đợi>
   Report: file đã đổi, lệnh + exit code, ghi vào docs/agents/runs/<task_id>/
   Claude review: CÓ | KHÔNG. Nếu CÓ, thêm nguyên văn đoạn sau vào prompt:
   "Khi xong, ghi docs/agents/runs/<task_id>/review-request.md gồm: mục tiêu, file đã đổi, lệnh kiểm chứng + kết quả, câu hỏi cụ thể cho Claude, scope ≤10 đường dẫn. Cuối nhật ký phiên thêm khối RELAY CODEX → CLAUDE (type REVIEW_REQUEST) theo docs/claude-support/2026-11-06-leaders/leader-prompts.md. DỪNG task tới khi founder dán REVIEW_RESULT và bạn đã ghi DISPOSITION."

6. Checkpoint Claude review. Đặt "Claude review: CÓ" cho MỌI slice rơi vào một trong các trường hợp sau:
   - slice cuối của mỗi phase
   - slice ngay trước khi đề nghị cấp KiCad lease, chốt hardware-config, BOM, nguồn/pin/an toàn, hoặc gửi PCB đi sản xuất
   - quyết định kiến trúc ảnh hưởng từ 2 module trở lên
   - thay đổi về bảo mật, đăng nhập, dữ liệu trẻ em, micro/giọng nói
   - slice ngay trước `build:public`
   - mọi task P1 về phần cứng hoặc firmware
   Các quyết định founder còn mở: viết theo dạng ADR, mỗi quyết định có 2–3 phương án kèm khuyến nghị. KHÔNG tự chốt.

7. Kiểm tra trước khi xong:
   - MỌI phase đủ mục ở bước 3.
   - MỌI prompt đủ trường ở bước 5.
   - MỌI trường hợp ở bước 6 đều có checkpoint tương ứng.
</task>

<constraints>
- Chỉ ghi vào electronics-learning-demo/docs/claude-support/2026-11-06-final-plan/ và docs/claude-support/logs/.
- KHÔNG sửa tasks.json, runs/, .codex/, src/, docs/product/ hay doc của Codex. KHÔNG commit, KHÔNG cài package.
- Được spawn tối đa 3 subagent chỉ đọc, mỗi subagent 1 scope độc lập. Gợi ý chia: (a) hiện trạng phần cứng V2 so với target, (b) hiện trạng phần mềm so với P01–P25, (c) kế hoạch cũ và hệ agent. Tự tổng hợp kết quả. KHÔNG gọi Codex.
- KHÔNG tự trả lời thay founder. KHÔNG mở lại quyết định đã chốt.
- KHÔNG đưa lời hứa "AI" hay "trò chuyện tự nhiên" vào hộp, bài học hoặc UI khi chưa kiểm chứng.
- Năng lực của sản phẩm tham khảo chỉ lấy từ reference-coverage. KHÔNG sao chép UI, asset hay nội dung của họ.
- Điều gì không có nguồn thì ghi [chưa kiểm chứng]. KHÔNG bịa thông số, giá hay chứng nhận.
- KHÔNG mở .env thật. Viết tiếng Việt.
</constraints>

<output_format>
Ghi vào 2026-11-06-final-plan/:
- README.md: ≤15 dòng gồm định nghĩa bản final, danh sách phase (mỗi phase 1 dòng), 5 rủi ro lớn nhất, skill đã nạp
- baseline.md
- phases/P<N>-<slug>.md
- hw-v2-to-starter-gap.md: bảng | Hạng mục Starter | Đã có ở V2 | Thiếu | Phase |
- slices.md: bảng | Slice | Phase | Track | Model | owner_role | depends_on | Claude review |
- codex-prompts/sol/<P>-<NN>-<slug>.md và codex-prompts/luna/<P>-<NN>-<slug>.md
- claude-review-checkpoints.md: bảng | Checkpoint | Slice | Trigger | File báo cáo Codex phải ghi |
- founder-decisions.md: dạng ADR, xếp theo phase bị chặn
- superseded.md: phần nào của kế hoạch cũ bị thay
Nhật ký phiên: docs/claude-support/logs/<YYYY-MM-DD-HHMM>.md. Cuối nhật ký có 1 khối RELAY CLAUDE → CODEX, type FYI, liệt kê thứ tự gửi các prompt của phase đầu tiên.
Trong chat trả lời ≤8 dòng: số phase, phase hiện tại, 3 quyết định founder cần chốt ngay, số prompt Sol/Luna, số checkpoint, đường dẫn README.
</output_format>

<stop_conditions>
- Dừng và hỏi founder nếu thiếu mobot-starter-target.md, reference-coverage hoặc feature-depth-register.
- Dừng và hỏi founder nếu kế hoạch buộc phải mở lại một quyết định đã chốt.
- Nếu không gian kế hoạch quá lớn cho 1 phiên: chỉ viết prompt chi tiết cho P0 và P1, các phase sau chỉ ghi danh sách slice. Báo founder rằng cần thêm phiên.
- Dừng sau khi ghi xong nhật ký và RELAY. KHÔNG gửi gì cho Codex. KHÔNG triển khai.
</stop_conditions>
```

Lưu ý: đây là prompt cho agent có quyền thật trên máy. Trước khi dán, hãy xem lại phạm vi, các hành động bị cấm và điều kiện dừng.
