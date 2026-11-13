# MoBot V2 r6 · Quyết định founder cho H3, R1, R5

05/11/2026. Founder trả lời trong phiên Claude: **"Theo đề xuất Claude"**. Câu trả lời áp dụng cho ba mục CẦN FOUNDER QUYẾT trong gói này. Claude ghi lại nguyên văn; Codex HQ chuyển thành decision record theo `docs/agents/templates/decision.md`.

| ID | Quyết định | Giá trị chốt | Thay đổi so với r6 | Chi tiết |
|---|---|---|---|---|
| H3 | Phương án B | MCP73833-FCI/MF (DFN-10), RPROG 2,49 kΩ ±1 %, IREG 0,40 A danh nghĩa (0,361–0,442 A) | Dòng sạc tay cầm 0,25 A → 0,40 A; package UN → MF | [handset.md H3](handset.md#h3--chu-kỳ-sạc-1s--cần-founder-quyết) |
| R1 | Phương án A | RISEN 0,62 Ω ±1 %, 0,25 W, mỗi kênh; ITRIP 0,256–0,391 A, danh nghĩa 0,323 A | Mục tiêu dòng motor 0,40 A danh nghĩa → 0,32 A; trần 0,45 A giữ nguyên | [robot.md R1](robot.md#r1--giới-hạn-dòng-drv8833--cần-founder-quyết) |
| R5 | Phương án A | Chỉ bật sạc khi TUSB320LAI báo nguồn 1,5 A hoặc 3 A; RILIM 1,24 kΩ (IIN 839–980 mA); ICHG 0,5 A | Thêm chính sách: nguồn Default (gồm cục sạc cổng A + cáp A–C) không sạc robot, LED báo nguồn yếu | [robot.md R5](robot.md#r5--sạc-42-w-vượt-25-w-của-usb-5-v500-ma--cần-founder-quyết) |

## Hệ quả founder đã chấp nhận

- **H3:** sạc tay cầm khoảng 5 giờ ở CC thay vì 8 giờ; charger tỏa 1,05 W, TJ ước tính 83 °C ở 40 °C trên DFN (bo JEDEC 4 lớp).
- **R1:** một số mẫu motor sẽ bị chopping ở 0,256 A khi khởi động hoặc kẹt, nên mô-men khởi động thấp hơn. Lựa chọn này đúng khi L motor ≥ 0,39 mH (đo BT-R1a). Nếu L < 0,39 mH, phải xem lại.
- **R5:** robot không sạc từ cục sạc điện thoại cổng A hay cổng USB máy tính thường. Người dùng cần cục sạc USB-C báo 1,5 A/3 A.

## Việc còn lại trước khi cấp lease

1. **Revision cấu hình.** H3 và R1 đổi mục tiêu số đã ghi trong r6 (`mobot-v2-config-2026-11-05-r6.md:9`, `mobot-v2-r6-handset-b15-evidence.md:35`). Theo `docs/mission-control/parallel-build-policy.md:33-34`, Codex HQ lập **r7** gồm ba thay đổi trên, tính SHA-256, rồi lấy **user duyệt đúng hash r7**. Câu "Theo đề xuất Claude" là quyết định hướng đi, chưa phải duyệt bytes của r7.
2. **R5** không đổi linh kiện r6 nhưng thêm chính sách sạc; HQ ghi vào r7 cùng lúc.
3. Box08 xác nhận ba thay đổi không mở finding mới.
4. Các mục khác giữ nguyên nhãn: H1, R3 chờ hồ sơ NCC; H2, R2, R4 chờ đo; H4, R6 chờ box08 tái review.
