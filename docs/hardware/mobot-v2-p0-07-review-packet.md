# Box 08 · r10 và bốn gói thiết kế

Ngày 09/11/2026. Sẵn sàng để xét hồ sơ proposed, không phải xác nhận thiết kế điện hoặc sẵn sàng KiCad.

## Snapshot

| Hồ sơ | SHA-256 |
|---|---|
| [r10](D:/StartupOS/electronics-learning-demo/docs/mission-control/hardware-config-mobot-v2-typec-r10-handset.json) | `95abdd2762e6f739557a83a5f62f1240510aa4ca326f317738b5eb59196770a4` |
| [D17-OFF-DESIGN](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-07-off-design-packet.md) | `6f2df5a0df8c04b4d37485e0e65eaf63ebbd375dc94c938a64590d88b31e96ae` |
| [D17-ACTUATOR-PRODUCT](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-07-actuator-design-packet.md) | `516199eed9a277a0796bb714c680d0a7ae54f54484a17fe5995716851072bb61` |
| [D17-H3-CV-PROTECTION](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-07-h3-design-packet.md) | `2240930df011b4cb3d884b7e520290bd103bdd538014cd77994ee62f61484fdd` |
| [MCU-RESET-VETO-RESOURCES](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-07-mcu-design-packet.md) | `8458ee4d3aa3a88ef5178ed815ad3cab8ce35ce731d5c11d999e100d50a7c350` |

## Câu hỏi cho reviewer

1. OFF: đánh giá độ phủ lỗi và yêu cầu cận MAX leakage/trễ, lower/upper trip sense, feedback vị trí thật và lỗi bias/reference/GND chung. TBD không phải bằng chứng đạt.
2. ACTUATOR: xét phần tử cấp quyền điện độc lập lực giữ, ngân sách và tiêu chí dừng vì thiếu hình học/force/stroke; kiểm riêng rơi/rung, kéo cưỡng bức, lão hóa và kẹt khóa.
3. H3: kiểm cách phân loại MIN/MAX có điều kiện của SLUSF69A tr.6 và Figure 5-1 tr.10; không diễn giải +9mV là margin xấu nhất. Kiểm profile Jauch, timer, NTC và đường bảo vệ độc lập MCU. BQ25186 chỉ là ứng viên chính; không chọn suffix/setpoint.
4. MCU: kiểm vai trò trong pool 9 output / 2 input-only / 2 conditional; mọi exact GPIO vẫn UNASSIGNED. Kiểm retained HIGH, mất bias và tổng detect→isolate→off còn TBD.

## Nguồn và giới hạn

PDF và hash: [source-manifest.json](D:/StartupOS/docs/agents/runs/MM-HW-P0-07/source-manifest.json). Trích đoạn và ảnh trang nằm cùng run. r9 giữ nguyên hash e8a1d0d319f11d71d0b5040731664f72076396eb5f39d968d8df45e6039510a3.

Bốn cổng schematic và ba cổng mốc khác vẫn OPEN; 14 verification_items vẫn NOT_RUN. Không có phê duyệt hash/MPN, lease hay phép đo. Nếu chưa có cận để kết luận, trả insufficient_evidence cùng danh sách thiếu; không suy PASS từ validator xanh.

PASS tương lai phải đi qua quy ước REVIEW_RESULT gắn đúng hash của MM-HW-GATE-PREFLIGHT-002. Gói này không ghi hay đổi trạng thái cổng.

## RELAY CODEX → CLAUDE · REVIEW_REQUEST · chuyển thủ công

relay_id: R-20261109-P0-07-R10
reply_to: R-20261109-C06, R-20261109-C07
type: REVIEW_REQUEST
scope: r10 proposed và bốn packet đúng snapshot ở trên; không phải xin duyệt hash/MPN.
ask: Kiểm F1–F3/O1 của C07 đã được xử lý đúng và chấm từng gate PASS/FAIL/insufficient_evidence theo tiêu chí gốc; không mặc nhiên coi hồ sơ có TBD là đủ đóng cổng.
constraints: Không liên hệ hay upload tự động. Founder tự chuyển nếu muốn. C03 F1/F2 thuộc validator002 phải được review riêng trước B1.
done_when: Có REVIEW_RESULT ghi rõ snapshot, finding và verdict từng cổng; mọi lựa chọn sản phẩm/hash vẫn thuộc Founder.
