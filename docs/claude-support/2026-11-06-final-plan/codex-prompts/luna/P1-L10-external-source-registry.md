Model: GPT-6 Luna
Goal: Lập sổ đăng ký nguồn dữ liệu và dependency bên ngoài đã duyệt (theo D17 và D18) để mọi slice sau chỉ lấy dữ liệu từ nguồn trong sổ. Chỉ là tài liệu, không có mã.
Context: đọc `docs/claude-support/2026-11-06-final-plan/research-intake-review.md` (kiểm lấy mẫu license 07/11/2026) và `founder-decisions.md` mục D17, D18. Task [đề xuất]: MM-SW-P1-L10. D18 nói file registry do Codex lead đặt chỗ; đề xuất `docs/data-sources/registry.md`, Codex lead đổi được.
Scope: allowed_paths: `docs/data-sources/registry.md` (mới) và `docs/agents/runs/MM-SW-P1-L10/**`. forbidden_paths: `src/**`, `public/**`, `package.json`, `docs/claude-support/**`, `.codex/**`.
Constraints: chỉ ghi điều đã kiểm. Mỗi dòng có các cột: nguồn, URL repo, loại (dữ liệu hay mã), license theo kiểm 07/11/2026, trạng thái (ĐƯỢC DÙNG, CẦN ĐỌC LICENSE, KHÔNG BUNDLE, CHỈ THAM KHẢO), điều kiện dùng, ngày kiểm, người kiểm. Dùng đúng các dòng sau, không thêm nguồn mới:
- ĐƯỢC DÙNG (mã, MIT): `wokwi/wokwi-elements` (chỉ qua slice P1-L09), `wokwi/avr8js` (đã dùng).
- ĐƯỢC DÙNG (dữ liệu, MIT): `adafruit/Adafruit_CAD_Parts`; điều kiện: chưa xác nhận có board khớp với board dùng trong Mạch Mở.
- ĐƯỢC DÙNG (dữ liệu, CC-BY-SA-4.0, đóng gói bundle riêng kèm ghi công và file license): `arduino/docs-content`, `raspberrypi/documentation`; KiCad symbols/footprints/packages3D (CC-BY-SA-4.0 kèm exception cho thiết kế dùng thư viện, theo báo cáo B, chưa đọc trang license gốc).
- CẦN ĐỌC LICENSE RIÊNG (GitHub trả NOASSERTION): `espressif/kicad-libraries`, `fritzing/fritzing-parts`, `arduino/reference-en`, `ngspice/ngspice`, `renode/renode`.
- KHÔNG BUNDLE (GPL/AGPL): `sharpie7/circuitjs1` GPL-2.0, `ra3xdh/qucs_s` GPL-2.0; `uPesy/easyeda2kicad.py` AGPL-3.0 chỉ chạy cục bộ ngoài sản phẩm.
- CHỈ THAM KHẢO: Pindexio (không license), SnapEDA, EasyEDA/LCSC, API DigiKey/Mouser/Octopart (cần tài khoản hoặc online, trái local-first nếu bắt buộc).
- Ghi chú đã hỏng: `sparkfun/SparkFun_KiCad_Library` trả 404.
Thêm đầu file: quy trình thêm nguồn mới (Claude lọc license, founder duyệt, một slice một nguồn) và ghi "Tôi không phải luật sư: cần ý kiến pháp lý trước khi bán sản phẩm (chưa làm)". Không khẳng định quyền sử dụng ngoài những gì bảng ghi.
Approval boundaries: dừng và hỏi founder trước khi thêm nguồn ngoài danh sách trên hoặc đổi trạng thái nguồn nào sang ĐƯỢC DÙNG.
Done when: file tồn tại, mọi dòng có đủ cột, không có dòng nào ngoài danh sách; báo cáo ghi hash file. Không cần chạy test (chỉ tài liệu); ghi rõ "tests not run: docs only".
Report: file đã đổi kèm hash.
Claude review: CÓ (D18: dữ liệu bên ngoài). Claude đối chiếu từng dòng với `research-intake-review.md`.
