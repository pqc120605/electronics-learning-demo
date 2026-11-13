# Quyết định founder (ADR) · xếp theo phase bị chặn

Claude không tự chốt. Mỗi mục: phương án, khuyến nghị. Mọi "[chưa kiểm chứng]" là điều tôi chưa kiểm tra bằng nguồn.

## Chặn P0
**D1 · V2 có là lõi Starter không?** ✅ ĐÃ CHỐT 07/11/2026 theo khuyến nghị (a): robot carrier là lõi, tay cầm là module riêng (founder: "Chốt D1, D2, D4"; chờ biên bản chính thức). (a) V2 robot carrier là lõi, tay cầm là module riêng; (b) thiết kế lõi mới; (c) V2 chỉ tham chiếu. *Khuyến nghị (a)*: tận dụng đã có, nhưng không tài liệu nào nói "mini" hay ranh giới lõi/thân [chưa kiểm chứng].
**D2 · Độ tuổi/thị trường đầu tiên** ✅ ĐÃ CHỐT 07/11/2026 theo khuyến nghị (a): VN trước, chưa ghi độ tuổi lên hộp (chờ biên bản chính thức). (quyết định phạm vi chứng nhận). (a) VN trước, chưa ghi độ tuổi lên hộp; (b) 8+; (c) 12+. *Khuyến nghị (a)* cho tới khi có chuyên gia xác nhận tiêu chuẩn [chưa kiểm chứng].
**D3 · Phạm vi giọng nói V1.** ✅ founder ủy quyền Claude chọn (07/11/2026, "phạm vi bạn quyết cho tôi"); Claude chọn (a): lời hứa tối thiểu (lời chào/hướng dẫn phát sẵn qua loa, không mic ở V1, không ghi "AI"/"trò chuyện tự nhiên"). (b) nhấn-để-nói trên điện thoại là nhánh R&D, chỉ vào V1 nếu qua xác thực và Claude review CP-15. Founder có thể đổi. (a) lời hứa tối thiểu: lời chào/hướng dẫn phát sẵn qua loa; (b) nhấn-để-nói xử lý trên điện thoại; (c) mic trên robot. *Khuyến nghị (a)* (đúng `mobot-starter-target.md:22`), (b) là nhánh R&D.
**D4 · Kênh điều khiển web.** ✅ ĐÃ CHỐT 07/11/2026 theo khuyến nghị: Web Serial qua USB để kiểm chứng ở P1, Wi-Fi + WebSocket cho V1 sau khi thử (chờ biên bản chính thức). (a) Web Serial qua USB; (b) Wi-Fi từ robot + WebSocket; (c) BLE. *Khuyến nghị (a) để kiểm chứng ở P1, (b) cho V1 sau khi thử [chưa kiểm chứng hỗ trợ trình duyệt].*
**D10 · Văn bản chấp nhận rủi ro Q4-B** ✅ founder 07/11/2026: "Chấp nhận rủi ro". Dự thảo văn bản ở mục "Dự thảo chấp nhận rủi ro" cuối file; Codex ghi thành biên bản và founder xác nhận văn bản. (lời trong chat chưa đủ cho validator). (a) ký văn bản; (b) đổi sang Q4-C (hai giai đoạn). *Khuyến nghị (a).*
**D5 · Cổng ngspice WASM cho bản public.** (a) hoàn tất provenance 5 điều kiện; (b) thay engine; (c) loại mô phỏng khỏi bản public. *Khuyến nghị (a) nếu có mã nguồn/recipe, ngược lại (c).*
**D6 · Định nghĩa "L3".** ✅ founder ủy quyền Claude chọn (07/11/2026): (a) L3 = D3 của register; mọi báo cáo dùng D3 khi trích register. Founder có thể đổi. (a) xác nhận L3 = D3 của register; (b) định nghĩa thang L riêng. *Khuyến nghị (a).*

## Chặn P1
**D13 · Toolchain firmware ESP32** (không thấy `avr-gcc`, `arduino-cli`, `pio` trên PATH). (a) PlatformIO; (b) Arduino CLI; (c) ESP-IDF. *Khuyến nghị (b)* vì khớp bài học Arduino, [chưa kiểm chứng]. Không cài khi chưa duyệt.
**D12 · QR bài học** (cần thư viện hoặc tự viết). (a) thêm thư viện nhỏ; (b) tự viết bộ sinh QR; (c) QR tạo ngoài ứng dụng từ URL. *Khuyến nghị (c) trước, (a) khi duyệt dependency.*

## Chặn P2
**D7 · Tay cầm có trong mọi Starter?** (a) có; (b) tùy chọn; (c) bán rời. *Khuyến nghị (b)*, quyết sau khi có giá thật.
**D8 · Q6/Q7 còn mở.** Q6: (a) tay cầm trước, robot sau; (b) robot làm giấy song song; (c) song song hoàn toàn. Q7: (a) giữ B04 và xin hồ sơ NCC; (b) đổi pack có datasheet. *Khuyến nghị Q6-B, Q7-A.*
**D11 · Giá và trần ngân sách.** Dự toán BOM2:35 là 1,19–1,71 triệu đ so với trần 1 triệu đ. (a) giữ trần, cắt phạm vi; (b) nâng trần; (c) hai SKU. *Khuyến nghị (c)* [chưa kiểm chứng giá].

## Chặn P3
**D9 · Định nghĩa "mini" và đường kính bánh.** Ø40 (#1452), Ø42 (#1090), 43 mm xuất hiện ở ba file. Founder chốt một số và định nghĩa mini. *Khuyến nghị Ø40 theo shortlist* [chưa kiểm chứng].

## Chặn P7
**D14 · Tên MởBot và nhãn hiệu** (tên làm việc). Hoãn tới trước in hộp.

## Mới 07/11/2026 · chặn P0 Exit 3 và lease (sau báo cáo P0-02)

**D15 · Tách cấu hình theo carrier và phân loại `blocking_unknowns`.** ✅ ĐÃ CHỐT 07/11/2026: phương án (a) tách cấu hình tay cầm và robot, giữ D10 (theo biên bản `docs/hardware/mobot-v2-founder-decision-d15-d16.md` do subagent báo, Claude chưa tự đọc). Cấu hình r8 hiện có 11 `blocking_unknowns` (kiểm 07/11: HANDSET-POWER-DESIGN, CARRIER-INTERFACES, B01-SUPPLY, HANDSET-PACK-H3, STACKUP-DRC, ROBOT-R1…R6, ROBOT-R3-B04) và 6 `verification_items`; validator đòi rỗng khi duyệt hash. D10 chỉ cho phép dời **phép đo sau PCB** sang `verification_items`, chưa bao phủ các mục thiết kế có mốc "trước layout/BOM/lease". Phương án: (a) tách r8 thành cấu hình tay cầm và cấu hình robot; mục ROBOT-* không chặn lease tay cầm; (b) mở rộng D10 để mục có mốc sau lease schematic chuyển sang cổng mốc (Box 08 duyệt từng mục trước mốc), cần văn bản founder; (c) giữ một cấu hình, đóng hết mục trước khi duyệt. *Khuyến nghị (a), thêm (b) cho mục STACKUP-DRC và B01-SUPPLY* [đề xuất; Codex kiểm chứng với `validate.mjs`]. **08/11/2026 founder chọn mở (b) cho STACKUP-DRC và cận fab** (cổng mốc "trước lease layout", Box 08 duyệt từng mục); chờ biên bản chính thức từ Codex lead (xem `codex-prompts/sol/P0-02b-close-remaining-items.md`). D10 cũng mở rộng cho thông số thiếu của pack Jauch 250832 (dòng kết thúc sạc, timer, NTC, dòng xung, nội trở, connector, kích thước).
**D16 · Q7 pack robot B04.** ✅ ĐÃ CHỐT 07/11/2026: phương án (c) làm cả hai song song (theo cùng biên bản, Claude chưa tự đọc). (a) giữ B04 và xin hồ sơ đúng pack; (b) Box 03 tìm ứng viên 2S có hồ sơ hãng đầy đủ để founder duyệt; (c) làm cả hai song song, chốt khi có hồ sơ. *Khuyến nghị (c)*: robot lease đứng sau schematic tay cầm nên chưa mất tiến độ; hồ sơ pack cần cho cả chứng nhận đồ dùng trẻ em (P7).

## Mới 08/11/2026 · license và dependency (sau `research-intake-review.md`)

**D17 · Chính sách license cho dữ liệu và mã bên ngoài.** ✅ ĐÃ CHỐT 08/11/2026 theo khuyến nghị (founder: "đồng ý với khuyến nghị"): CC-BY-SA được chấp nhận cho **dữ liệu** (KiCad symbol/footprint/3D, tài liệu Arduino, tài liệu Raspberry Pi), đóng gói thành bundle dữ liệu riêng kèm ghi công và file license; **mã** chỉ nhận MIT, Apache-2.0, CC0 (hoặc tương đương đã duyệt); **GPL/AGPL không đưa vào bundle** (circuitjs1, qucs_s; easyeda2kicad chỉ chạy cục bộ ngoài sản phẩm). Nguồn `NOASSERTION` (Espressif kicad-libraries, Fritzing parts, Arduino reference-en, ngspice, Renode) cần đọc LICENSE riêng trước khi dùng. Tôi không phải luật sư: cần ý kiến pháp lý trước khi bán sản phẩm (chưa làm).
**D18 · Dependency.** ✅ ĐÃ CHỐT 08/11/2026 theo khuyến nghị: cho phép thêm dependency **từng thư viện một**, mỗi lần một slice riêng, bắt đầu bằng spike `wokwi-elements` (MIT) và Blockly [license chưa kiểm]. Quy trình đề xuất (Claude, Codex lead quyết): prompt nêu đúng tên gói + phiên bản + license đã kiểm; slice dừng nếu license không thuộc D17; Claude review bắt buộc cho slice đưa dependency hoặc dữ liệu bên ngoài vào repo hoặc `public/`; ghi vào danh sách nguồn dữ liệu/dependency đã duyệt (file registry do Codex lead đặt). Chưa phải biên bản chính thức: Codex ghi vào quyết định founder.

## Bổ sung 09/11/2026 · license mã phụ thuộc Wokwi Elements

**D19 · BSD-3-Clause cho mã phụ thuộc.** ✅ ĐÃ CHỐT 09/11/2026 theo nguyên văn Founder: “Tôi chấp nhận BSD-3-Clause”. Trong D17, BSD-3-Clause được coi là license tương đương đã duyệt **chỉ cho mã phụ thuộc** của `@wokwi/elements` 1.9.2: `lit` 3.3.3, `lit-html` 3.3.3, `lit-element` 4.2.2, `@lit/reactive-element` 2.1.2 và `@lit-labs/ssr-dom-shim` 1.6.0. Khi phân phối phải giữ thông báo bản quyền và nội dung license. Ý kiến pháp lý trước khi bán sản phẩm vẫn chưa làm. Quyết định này **không** nhận `@wokwi/elements` vào app, không đổi trạng thái bất kỳ nguồn nào trong registry và không mở rộng sang license khác.

## Dự thảo chấp nhận rủi ro (D10, Q4-B) · chờ founder xác nhận văn bản

Căn cứ lời founder 07/11/2026: "Chấp nhận rủi ro". Claude soạn phạm vi; chưa phải biên bản được ký.

**Chấp nhận:** cấu hình phần cứng mới được duyệt khi các phép đo sau PCB nằm ở `verification_items` thay vì `blocking_unknowns`: dòng USB attach/boot/flash; UVLO động và nội trở pack; cận VM (xung, năng lượng hồi, điện tích lọt phía converter); nhiệt thật; ADC joystick; kích thước và điện nội bộ của board clone 30 chân (chỉ ước lượng từ ảnh/web). Schematic và layout được phép tiến hành với các giá trị đó ở TBD.

**KHÔNG chấp nhận (vẫn bị chặn):** gửi PCB đi sản xuất; cấp điện pin Li-ion hoặc chạy motor trên PCB lắp xong; flash; mua hàng; khẳng định "đã an toàn"/"hợp lệ" cho bất kỳ giá trị chưa đo; bỏ qua Box 08 review từng `verification_item` trước layout; bỏ cổng chứng nhận đồ dùng trẻ em.

**Điều kiện kèm theo:** mỗi `verification_item` có tiêu chí PASS/FAIL, người đo và thời điểm đo; chỉ founder được đổi phạm vi chấp nhận.
