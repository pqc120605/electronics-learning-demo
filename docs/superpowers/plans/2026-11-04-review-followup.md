# Tiếp nhận review 04/11 — phạm vi thực thi

Source of review: `docs/reviews/claude-competitive-product-audit-2026-11-04/IMPLEMENTATION-PLAN.md`.

Thực hiện trực tiếp trong checkout hiện có theo yêu cầu người dùng, không stage/commit/push, không gọi Claude. Không dùng script commit/worktree của skill vì cây dự án còn untracked cùng nhiều thay đổi khác.

- [ ] Đối chiếu B01 đã sửa; sửa B02 qua nguồn firmware target hiện có, không suy từ tên MCU.
- [ ] B03/B04: nhãn người dùng cho SPICE, giữ nguyên id/netlist/handoff schema và luật solver.
- [ ] B05: phụ kiện trạm tính từ số dây preset; USB chỉ ghi cổng khi có mapping rõ, trường hợp khác yêu cầu kiểm tra; không đưa phụ kiện vào circuit simulation. Giữ format kit cũ.
- [ ] Thêm Playwright/axe dev-only, cache Chromium trên D; kiểm luồng hiện có và ghi giới hạn nếu không chạy được.
- [ ] Test/unit, typecheck, build nội bộ và cập nhật report. Public SPICE gate giữ nguyên.

Preflight: kit inventory được share-pack/CSV/UI dùng chung → bổ sung kind phụ kiện phải cập nhật cả ba consumer và giới hạn import wrapper. SPICE message đổi chỉ presentation; `ignoredUnwiredParts` vẫn là id cho API cũ. Board label dùng firmwareTarget hiện hữu để không quảng cáo Mega/Nano Every là ATmega328P.

Chưa thực hiện ở lát này: engine MCU mới, rebuild ngspice, tài khoản lớp học. Các mục đó cần spike/thiết kế riêng; không coi đề xuất version/source trong review là build record đã xác minh.
