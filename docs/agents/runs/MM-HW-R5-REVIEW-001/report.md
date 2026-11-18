# MM-HW-R5-REVIEW-001 — hoàn tất review, thiết kế cần sửa

Ngày: 16/11/2026. Scope: đọc và review hai bản final KiCad r5 robot/tay cầm do founder chỉ định; không thay đổi thiết kế.

- [Báo cáo chi tiết](../../../reviews/2026-11-16-pcb-r5-independent-review/report.md): **CHANGES_REQUESTED**, 1 High / 6 Medium / 1 Low, có file:dòng, ảnh KiCad, đường track minh họa, đối chiếu F01–F10 và thứ tự khắc phục.
- [Kiểm chất lượng báo cáo](../../../reviews/2026-11-16-pcb-r5-independent-review/report-quality-review.md): EF và HK kiểm lấy mẫu độc lập, PASS báo cáo sau sửa một số đếm U6; không PASS PCB.
- [Lệnh/kết quả](../../../reviews/2026-11-16-pcb-r5-independent-review/verification.json): ERC/DRC/parity nguồn gốc cả hai bo exit 0; strict DRC trên bản sao có đủ thư viện exit 5 như dự kiến (4/2 warnings), không unconnected/parity.
- [SHA-256 artifact](../../../reviews/2026-11-16-pcb-r5-independent-review/artifact-sha256.json); [snapshot nguồn trước](../../../reviews/2026-11-16-pcb-r5-independent-review/snapshot-before.json) / [sau](../../../reviews/2026-11-16-pcb-r5-independent-review/snapshot-after.json): **22/22 file ghim không đổi**. Thư viện bổ sung có hash cuối và git diff nguồn r5 rỗng.
- [Nguồn hãng](../../../reviews/2026-11-16-pcb-r5-independent-review/sources.md): 7 PDF tải/đọc thành công, có hash; 2 PDF Coilcraft bị chặn tải local, kiểm hình land pattern **NOT_RUN**.
- `node D:/StartupOS/docs/agents/validate.mjs`: **exit 0**, 76 task / 143 capability, errors=[], warnings=[]; task review `done`, không đổi trạng thái thiết kế/cổng hardware.

Tóm tắt điểm chính: đường VOUT tay cầm vòng 12,54/23,93 mm dù tụ sát IC; hồ sơ ghi sai dòng sạc 2 A thay vì 0,50 A; chưa có cận bảo đảm khóa sạc VBUS thấp và bias QA/QB; BISEN đi vòng; DFM EP/via, ignored rules/courtyard và BOM/silk cần xử lý.

Physical verification, fabrication approval, MPN approval, sửa schematic/PCB, xuất lại fabrication: **NOT_RUN / ngoài phạm vi**. Không chạy test/build web vì không đổi phần mềm ứng dụng. Không gọi Claude, không mua hàng hoặc cấp điện. Done của task này là **hoàn thành báo cáo review**, không đóng cổng hardware hoặc mở lease xây dựng.
