# MM-SW-P0-V2-TRACE-001 — kế hoạch thực thi

## Mục tiêu

Cho hai bài CircuitDocV2 đã có (`blink`, `button-led`) chạy trace giáo dục giới hạn trên topology V2 hiện hành. Khi chạy, cùng một trạng thái phải tô đúng dây/net trong breadboard, schematic và cảnh 3D. Không giả lập điện áp/dòng, không thực thi firmware và không suy ra hướng dòng từ cách dựng net nội bộ.

## Phạm vi

- `src/lib/logicTraceV2.ts` — adapter thuần từ net CircuitDocV2 sang bộ quy tắc trace giáo dục đã có.
- `tests/logic-trace-v2.test.mjs` — hồi quy cho LED sáng/tắt, nút nhấn, mất đường nối, topology lỗi và bài chưa hỗ trợ.
- `src/pages/CircuitBuilderPage.tsx` — dùng cổng V2 hiện hành để chặn trace, bật chạy cho bài V2 đã hỗ trợ, chiếu wire/net IDs sang các view và trạng thái.
- `src/components/builder/AssemblyStage.tsx` — cho phép flow V2 tô dây 3D, không dùng pin alias legacy hoặc hướng giả.

## Điều kiện hoàn tất

1. Mọi dây V2 được highlight phải thuộc net chứa đúng đầu ra/đầu vào bài học; bỏ dây bắt buộc hoặc lỗi G1–G4/G8 thì không có trace.
2. Schematic nhận các endpoint pin của net đang hoạt động; breadboard và 3D nhận cùng tập `wireIds`.
3. Flow mang nhãn logic giáo dục, hướng luôn `none`; không gọi là kết quả SPICE, firmware MCU hay phép đo.
4. Tests mới, typecheck và build:local đạt. E2E báo riêng nếu runner không kết thúc.

## Rủi ro và giới hạn

- Chỉ bật trace cho `blink` và `button-led`, là hai CircuitDocV2 có bài mẫu được đăng ký hiện nay.
- Bài khác tiếp tục báo chưa hỗ trợ V2 tới khi có tài liệu topology V2 và ca hồi quy riêng.
- Cổng G5/G6/G7 không phải bộ giải điện. Trace chặn lỗi cấu trúc G1–G4 và lỗi nguồn/GND G8; cảnh báo hoặc thiếu hình học không biến thành phép đo vật lý.
