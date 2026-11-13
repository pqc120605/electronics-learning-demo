# MoBot V2 · Mốc tạm dừng phần cứng · 07/11/2026

Founder yêu cầu tạm đóng gói sau khi Box 02 và 03 hoàn tất kiểm chéo DeepSeek. P0-02 còn mở. Hai cổng IF ở `waiting`, hai task KiCad ở `scoped`, cả hai chưa có lease. Mốc này ghi nhận việc tạm dừng điều phối phần cứng. Queue giữ các trạng thái kỹ thuật hiện hành.

## Hồ sơ và phiên bản

| Hồ sơ | SHA-256 |
|---|---|
| [Proposal tay cầm r8](../mission-control/hardware-config-mobot-v2-typec-r8-handset.json) | `3916f00dbca9145baf3437e63474ad56144181b46cfcc8a62b8968721f628da3` |
| [Proposal robot r8](../mission-control/hardware-config-mobot-v2-typec-r8-robot.json) | `2fb61b4fa3074f4da83c604e4e9fb1ae08cc557eb50be67efec72bcef36674fc` |
| [Packet OFF đã được Box 08 review](mobot-v2-r8-handset-off-release-review.md) | `8bc6fc2d825d095b21b2aa382cbd830c3fc4875549226ef3b45dfe402cd242ea` |
| [Đầu vào tư vấn DeepSeek](mobot-v2-p0-02-deepseek-review-2026-11-07.md) | `671ef1397f7a4c944b7fb44b7c87f9f8fa488d4439935cebbc7d51e3f84e15f7` |

Cả hai proposal vẫn `proposed`. Box 08 đã PASS phạm vi tách carrier theo D15(a) và đóng finding thiếu yêu cầu `service_release` trong hồ sơ tay cầm. Nguồn tay cầm vẫn `changes_requested`. Robot có cổng IF riêng và giữ phụ thuộc KiCad tay cầm. Giữ [D10](mobot-v2-founder-decision-q1-q8.md), [D15/D16](mobot-v2-founder-decision-d15-d16.md) và [RUN → OFF → PROGRAM](mobot-v2-founder-decision-q2-off.md). Hai ca chức năng C-to-C và các phép đo vẫn `NOT_RUN`, giá trị đo `TBD`.

## Kết quả kiểm chéo mới

**Box 02, lượt `01a1b412-0d93-7cd3-9e5c-2e0785b10cbe`.**

- Giữ cận cắt UVLO tĩnh 3,242–3,318 V, biên khoảng 42 mV với ngân sách sai lệch nút ±100 nA. Nhánh hồi INB dùng cầu chia độc lập, không có R_H. Chưa chọn 80 kΩ hay 83 kΩ. Dòng các cầu chia thuộc ngân sách pack, chỉ cộng vào dòng OFF nhánh Source nếu đi qua chính điểm đo.
- CV cao 4,232 V của MCP73833 chồng khoảng 2 mV với cận PCM thấp 4,230 V ở điều kiện bảng. 4,242 V chỉ là phép ngoại suy có điều kiện từ VDD 5,2 lên 6,0 V ở 10 mA. Mô hình NTC giả định cho cận nóng 48,19 °C qua dung sai, chưa áp cho Jauch. Cần hồ sơ CV, NTC và XHP-3 đúng pack.
- MCP73833-FCI/MF dùng timer 6 giờ danh nghĩa, 5,4–6,6 giờ, và chân PG. TE thuộc MCP73834. Cần lượng nạp lại từ ngưỡng UVLO MoBot, cộng taper và giảm dòng nhiệt để kết luận timeout. Giữ H3 hiện hành trong proposal.
- Tải kiểm OFF 1 kΩ và thời gian xả khoảng 0,97 s chỉ là ví dụ. Thiếu cận dòng OFF/còn cấp, V_safe, C_eff, I_back, sai số và timing đúng cụm. Khi bleed hở và không còn đường xả đã định mức, thời gian chờ không đủ làm bằng chứng OFF. Các lỗi GND, bias, sense chung và timing nhả vẫn cần chứng minh ngoài D10.

**Box 03, lượt `01a1b412-243a-7093-ae55-29200ae79acd`.**

- Giữ 0,80/0,65 mm làm bề rộng dự trù pack/RUN của tay cầm. Kết quả IPC-2221 chỉ dùng sàng lọc. Cần bề dày mạ tối thiểu, hình học pad/via, đường hồi, phân dòng và thoát nhiệt. Loại quy tắc 1 A mỗi via khỏi cơ sở chốt thiết kế. Tải pack robot 1,76 A cần ngân sách riêng cho pack, VM, converter và shunt.
- Ultralife UBBL20-C1, RS PRO 176-9352 và B04 chưa đủ hồ sơ để khóa pack. Cần cận xung theo thời lượng, cân bằng và CV theo cell. Giao diện hai cực không có đường NTC riêng. Vị trí và ghép nhiệt của cảm biến ngoài vẫn cần chứng minh đại diện cho cell qua tải và nhiệt.
- Giữ [phiếu xin hồ sơ nhà bán](mobot-v2-p0-02-supplier-evidence-request.md). Ưu tiên PCBA đúng lô của B01, R–T/XHP-3/profile của Jauch, và dữ liệu xung/cân bằng/cảm biến của pack robot.

Box 08 chưa review hai bàn giao kiểm chéo mới. Các kết luận trên là bằng chứng hồ sơ, chưa phải kết luận bench hoặc phê duyệt thiết kế.

## Mở lại khi Founder yêu cầu

1. Giao Box 08 review mốc này cùng báo cáo DeepSeek, hai lượt kiểm chéo và proposal tay cầm. Phân xử các điểm có thể khóa trên giấy và hồ sơ Jauch/H3 còn thiếu.
2. Ưu tiên tay cầm. Đóng fail-off và bằng chứng OFF thực trên đúng B01/cáp/chốt/gá, giao diện và nguồn hàng B01, H3 và stackup/DRC. Định mức tải kiểm, cận xả và fixture trước khi xin quyền chạy các phép kiểm cần mẫu.
3. Robot đi theo nhánh riêng. Chốt Q7 sau hồ sơ B04 hoặc ứng viên đạt, rồi đóng R1–R6 gồm BT-R1a hoặc bằng chứng tương đương, phát hiện kẹt, hồi VM, CE/veto và cách ly Type-C.
4. Khóa cận, người đo và thời điểm cho từng mục D10. Box 08 review đúng bytes trước khi Founder duyệt hash từng carrier. Chỉ xét lease khi blocker đã đóng và preflight đạt. Quyền mua, sản xuất, cấp điện pin, chạy motor và flash vẫn tách riêng.

Kiểm tra tại mốc dừng: `node ../docs/agents/validate.mjs` exit 0, 21 task, 143 capability, `errors=[]`. `node --test ../docs/agents/validate.test.mjs` exit 0, 24/24 pass. [Bàn giao P0-02 trước DeepSeek](mobot-v2-p0-02-handoff-2026-11-07.md).
