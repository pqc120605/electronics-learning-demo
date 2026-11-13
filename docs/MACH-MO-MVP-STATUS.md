# Mạch Mở — trạng thái bản demo

## Cập nhật chốt 05/11/2026
Các mục 04/11 bên dưới là lịch sử. Nhận xét BOM thiếu jumper/USB được thay thế: classroomKit.ts đã có cả hai; gap còn lại là biến thể, giá trị và số lượng. Giá trị thiếu là unknown, không suy ra 220 Ω từ family.
Import đã chặn simBoard lạ; fallback im lặng còn ở legacy storage. Cần test riêng hai đường.
Test 04/11 là evidence lịch sử, chưa chạy lại ở lượt chốt thiết kế. Xem [bản final](../../docs/mach-mo-final-2026-11-05.md).


Cập nhật: 04/11/2026. Các mục có ngày bên dưới là nhật ký; khi mâu thuẫn, ưu tiên source, test và mục mới nhất.

## Review sản phẩm và so sánh đối thủ (Claude) — 04/11/2026

- **Báo cáo:** [docs/reviews/claude-competitive-product-audit-2026-11-04/REPORT.md](reviews/claude-competitive-product-audit-2026-11-04/REPORT.md). Kèm bảng so sánh 40 năng lực × 10 sản phẩm (có CSV), nguồn, backlog, kế hoạch 5 slice, danh sách công cụ và ảnh lỗi.
- **Đã sửa:** trùng key React và nút tài liệu lặp trong catalog board (XIAO ESP32-S3 lặp URL guide; 12 board lặp `sourceEvidenceUrl` thành nút "Tài liệu hãng" thứ hai). Có test mới trong `tests/data-integrity.test.mjs`.
- **Lỗi còn mở:**
  - Nhãn "không chạy firmware" sai cho Uno/Nano (`boardCapabilityRegistry.ts:107`).
  - Ghi chú SPICE lộ id nội bộ và có câu tiếng Anh (`workspaceSpice.ts:147,170,213`).
  - BOM kit thiếu dây jumper và cáp USB.
- **Kiểm chứng lượt này:**
  - `node --test --test-concurrency=1 tests/*.test.mjs`: 349/349; `typecheck` và `build:local`: đạt.
  - `check:public-release`: **chặn** (gate ngspice WASM, không vượt).
  - Trình duyệt: firmware HEX Uno chạy được; handoff workspace → SPICE chạy với mạch nguồn + 220 Ω + LED; ở 375 px, 8 route không cuộn ngang.
  - Chưa chạy axe, chưa đo 768/1024, chưa kiểm kéo dây bằng chuột/touch thật, chưa thử board thật.

## Thử thách dự đoán LED 7 đoạn — 03/11/2026

- **Đã bổ sung:** ở bước “Dự đoán & chạy” của bài đếm LED 7 đoạn, người học chọn số 0–9 rồi bật các đoạn A–G mà mình dự đoán. Phản hồi lấy trực tiếp từ hàng `digits` của code subset đã parse và nêu riêng đoạn còn thiếu/đoạn chọn thừa. Có thể tiếp tục “Chạy từng bước” để quan sát chuỗi số.
- **Ranh giới:** chỉ bật khi parser, provider, mạch và topology bài học hợp lệ. Mô hình cathode chung dùng 1 = sáng, 0 = tắt. Kết quả là bài luyện đọc code; không chạy firmware, chấm điểm, mô phỏng điện hoặc xác nhận linh kiện thật. Lượt thử thách không lưu qua phiên.
- **Kiểm chứng lượt này:** 3 test mới cho chấm đúng, báo lỗi theo thứ tự A–G và từ chối bảng/nhãn không hợp lệ. `npm.cmd test`: 335/335; `npm.cmd run typecheck`: đạt; `npm.cmd run build:local`: đạt. Trình duyệt đã thử bài LED 7 đoạn: dự đoán số 2 đúng hiện A/B/D/E/G, dự đoán sai số 4 báo thiếu B/C/F/G và thừa A; “Chạy từng bước” cập nhật trace sang số 1 với bit 0/1 khớp code. Chưa thử screen reader hoặc board thật.

## Thử thách cho bài kịch bản khái niệm — 03/11/2026

- **Đã bổ sung:** bài buck/boost cho dự đoán quan hệ giữa đầu vào và điện áp mục tiêu, bài driver motor cho dự đoán chiều/dừng, và bài MOSFET cho dự đoán tải bật/ngắt. Câu trả lời được đối chiếu với đầu ra của provider kịch bản sau khi chạy; thay đổi trạng thái đầu vào sẽ làm mới thử thách. Kết quả không lưu thành điểm.
- **Ranh giới:** chỉ là quy tắc khái niệm của provider hiện có; không chạy code/firmware, không tính điện áp/dòng thật, tổn hao, RPM, mô-men, nhiệt hay xác nhận tải/phần cứng. Kết quả trước khi chạy được ẩn để người học có thể dự đoán trước.
- **Ma trận bao phủ:** registry thử thách khai báo loại tương tác theo từng bài và test đối chiếu với toàn bộ 11 lesson ID. Blink/source-led có dự đoán LED; năm bài đầu vào có dự đoán LED và thử thách input/output; LED 7 đoạn có dự đoán bảng A–G; ba bài khái niệm có thử thách provider riêng. Bài mới phải có khai báo hoặc test bao phủ sẽ thất bại.
- **Kiểm chứng lượt này:** 4 test mới cho so sánh kịch bản và ma trận 11 bài; `npm.cmd test`: 339/339, `npm.cmd run typecheck` và `npm.cmd run build:local` đạt. Browser đã kiểm tra đáp án buck đúng, motor đảo chiều đúng, MOSFET bật đúng; bài LED 7 đoạn đã kiểm tra đáp án đúng/sai. Chưa thử screen reader, thiết bị thật hoặc phần cứng.

## Logic Analyzer cho firmware AVR8js — 03/11/2026

- **Đã bổ sung:** trace D13/PB5 có timestamp theo chu kỳ CPU AVR8js; giao diện vẽ dạng sóng mức HIGH/LOW, liệt kê thời điểm chuyển mức và ước tính tần số/duty cycle khi có đủ chu kỳ hoàn chỉnh. Dùng chung ở phòng lắp mạch và công cụ firmware HEX.
- **Phạm vi:** chỉ Uno R3/Nano classic với ATmega328P trong worker AVR8js. Tối đa 128 lần chuyển mức cho mỗi lần chạy; trục thời gian là thời gian mô phỏng, bắt đầu ở lần đổi mức đầu tiên. Không đại diện phép đo trên board thật, không phải analyzer đa kênh và không chạy với mô hình bài học hoặc các MCU khác.
- **Nguồn định hướng:** Wokwi có Logic Analyzer để quan sát tín hiệu số theo thời gian ([hướng dẫn chính thức](https://docs.wokwi.com/guides/logic-analyzer)). Mạch Mở áp dụng biểu đồ một kênh từ sự kiện GPIO thật của AVR8js; không sao chép dữ liệu hoặc giao diện của Wokwi.
- **Kiểm chứng lượt này:** `npm.cmd run typecheck` và `npm.cmd run build:local` đạt. Trên `/tools/firmware-hex`, đã chạy HEX nhấp nháy ATmega328P mẫu trong worker; browser hiển thị 6 lần đổi mức trong 1.000 ms mô phỏng, tần số ước tính 2,03 Hz và duty cycle 50,0%. Đã kiểm tra route `/build?lesson=blink&guided=1` nhận panel Logic Analyzer; board ESP32 đúng là khóa chế độ firmware AVR. Không chạy test tự động theo phạm vi phiên. Chưa kiểm tra screen reader, thiết bị di động hoặc oscilloscope thật.

## Lịch sử lượt thực hành cục bộ — 03/11/2026

- **Đã bổ sung:** dashboard và trang bài học hiện có lịch sử lượt mô phỏng gần đây. Lưu tối đa 30 lượt bắt đầu, gồm mã bài, board, loại provider và thời điểm; dữ liệu cùng tab cập nhật ngay, tab khác cập nhật khi storage/focus đổi. Cấu trúc cũ không có trường này vẫn đọc được.
- **Ranh giới:** chỉ ghi nhận lượt đã qua kiểm tra đầu vào và bắt đầu mô hình bài học hoặc worker AVR8js. Không lưu code, không chấm đúng/sai, không tuyên bố mô phỏng hoàn tất, không xác nhận phần cứng. Lịch sử chỉ nằm trong localStorage của trình duyệt này và có thể mất nếu xóa dữ liệu trình duyệt.
- **Kiểm chứng lượt này:** `npm.cmd run typecheck` và `npm.cmd run build:local` đạt. Không chạy test tự động theo phạm vi phiên. Tương tác trực tiếp trên browser pane chưa xác nhận.

## Thử thách quan sát đầu vào/đầu ra — 03/11/2026

- **Đã bổ sung:** các bài biến trở, LDR, siêu âm, nút nhấn và hồng ngoại có thử thách quan sát hai trạng thái đầu vào dẫn tới LED tắt/sáng. Với analog và siêu âm, giao diện nêu phép so sánh/ngưỡng; với LDR, giá trị hiện là phần trăm analog chuẩn hóa sau mô hình bộ chia áp, không phải độ sáng. Với nút/hồng ngoại, hiện trạng thái đầu vào ảo. Thử thách lấy quy tắc từ code đã parse và đầu ra từ provider bài học; thay đổi code, board hoặc mạch sẽ khởi tạo lại thử thách.
- **Ranh giới:** chỉ áp dụng cho code subset và đầu vào ảo mà provider hiện hỗ trợ; không phải bài thi, điểm năng lực, đo ADC/cự ly vật lý hay mô phỏng điện. Tiến độ chỉ tồn tại trong phiên component, không lưu vào học bạ.
- **Nguồn định hướng:** CRUMB mô tả challenge có mục tiêu và live checks trong mô phỏng ([guide](https://crumbsim.com/guide/learning/)). Mạch Mở áp dụng phản hồi từ provider hiện có; chưa có solver-driven goal checking tổng quát.
- **Kiểm chứng lượt này:** typecheck và build được chạy sau thay đổi. Không chạy test tự động hoặc kiểm tra thao tác trên browser trong phạm vi phiên.

## Sao chép linh kiện trong workspace — 03/11/2026

- **Đã bổ sung:** bảng chân linh kiện có thao tác “Sao chép rời” cho linh kiện không phải board. Bản sao giữ loại, trị số và góc xoay, được đặt lệch cạnh linh kiện gốc và tự chọn để tiếp tục thao tác.
- **An toàn topology:** không sao chép dây hoặc vị trí lắp 3D đã lưu; người dùng phải nối chân và bố trí lại bản sao. Giới hạn workspace hiện là 100 linh kiện.
- **Nguồn định hướng:** Wokwi cho phép thêm, di chuyển, xoay và nhân bản linh kiện trong diagram editor ([tài liệu](https://docs.wokwi.com/guides/diagram-editor/)). Mạch Mở triển khai thao tác nhân bản cục bộ, không khẳng định tương đương đầy đủ editor Wokwi.
- **Kiểm chứng lượt này:** typecheck/build được chạy sau thay đổi. Không chạy test tự động hoặc kiểm tra thao tác trình duyệt trong phạm vi phiên.

## Hoàn tác và làm lại topology — 03/11/2026

- **Đã bổ sung:** thanh công cụ workspace có Hoàn tác/Làm lại; phím tắt Ctrl/Cmd+Z và Ctrl+Shift+Z (Ctrl+Y trên Windows). Có tối đa 80 trạng thái; các nhịp kéo liên tiếp được gộp thành một bước. Lịch sử áp dụng cho linh kiện, trị số, vị trí/góc lắp và dây.
- **Ranh giới:** đổi board hoặc bài xóa lịch sử để tránh hoàn tác xuyên ngữ cảnh. Code, đầu vào mô phỏng, firmware/runtime và metadata project không nằm trong lịch sử này. Phím tắt nhường Ctrl/Cmd+Z cho ô nhập, select và vùng soạn thảo.
- **Nguồn định hướng:** Wokwi diagram editor có các thao tác biên tập như di chuyển, xoay, nhân bản và undo/redo ([tài liệu](https://docs.wokwi.com/guides/diagram-editor/)). Mạch Mở hiện quản lý lịch sử topology cục bộ, chưa có lịch sử đa tài liệu hay cộng tác thời gian thực.
- **Kiểm chứng lượt này:** `npm.cmd run typecheck` và `npm.cmd run build:local` đạt. Không chạy test tự động hoặc kiểm tra thao tác keyboard/browser trong phạm vi phiên.

## Panel quan sát mô phỏng workspace — 03/11/2026

- **Đã tích hợp:** `/build` có một panel chọn nguồn quan sát giữa mô hình bài học và firmware HEX AVR8js; các tab trace logic, Serial Monitor và waveform SPICE chỉ bật khi provider tương ứng có dữ liệu. Nhãn phân biệt trace giáo dục, trạng thái D13/PB5 và dữ liệu solver.
- **AVR8js trong workspace:** chỉ Uno R3/Nano classic ATmega328P, yêu cầu tệp Intel HEX hợp lệ và xác nhận target do người dùng cung cấp. Worker có mã phiên, watchdog 30 giây thực tế; hiển thị D13/PB5, thời gian/chu kỳ mô phỏng và byte UART0 đã bắt. Không chạy sketch Arduino, không upload, không ánh xạ built-in LED sang LED rời và không hỗ trợ ESP32/Pico/STM32.
- **SPICE quay về workspace:** kết quả waveform có TTL 30 phút, giới hạn kích thước/số chuỗi/điểm và chỉ được nhận khi fingerprint khớp board, bài, code, linh kiện và dây hiện tại. Bàn lắp 3D/copper không tự sinh netlist; solver không chạy firmware MCU. Đổi runtime cũng xóa quan sát SPICE đang gắn trong panel.
- **Kiểm chứng lượt này:** `npm.cmd run typecheck`, `npm.cmd run build:local` và GET route dev `/build?lesson=blink&guided=1` đã đạt. Trình duyệt đã kiểm tra mô hình bài học chạy từng bước; Uno R3 nhận firmware HEX mẫu và hiển thị D13 `LOW → HIGH → LOW`, UART0 hiện 0 byte đúng với mẫu không phát Serial; đổi về ESP32 xóa kết quả AVR cũ và tắt runtime không hỗ trợ. Với bài LDR, nút mở bộ chia áp SPICE tạo handoff an toàn, solver `.op` hoàn tất, và liên kết trả về mở đúng `/build?lesson=analog-ldr&guided=1`. Kết quả solver hiển thị `V(mid)=0,7928 V`; đây là đầu ra mạch tương đương, không phải phép đo board. Chưa xác nhận lượt trả **workspace → SPICE → fingerprint-matched workspace** vì nút SPICE workspace bị khóa khi MCU/GPIO còn nằm trong topology; cũng chưa thử hết hạn/hỏng/quá cỡ, screen reader, phần cứng hay điện thoại thật. Không chạy test theo phạm vi phiên này.

## Bảo toàn workspace khi mở project — 03/11/2026

- **Lỗi tìm thấy khi rà Phase 6:** `restoreSavedProject` gọi hàm sao lưu đang nuốt lỗi parse/quota/storage, rồi vẫn ghi đè ba khóa workspace. Khi tạo recovery thất bại, thao tác “Mở project” có thể thay bản nháp hiện tại mà không có bản sao phục hồi.
- **Đã sửa:** recovery phải tạo được bundle hợp lệ theo schema trước khi thay workspace; nếu không, thao tác dừng với thông báo và giữ nguyên dữ liệu. Cả mở project đã lưu và nhập project JSON đều dùng chung thao tác thay workspace có rollback nếu một trong ba lần ghi thất bại. Khi nhập, bản recovery được dựng từ trạng thái đang mở trong React để giữ cả chỉnh sửa chưa kịp autosave. Nếu rollback không thực hiện được thì báo vị trí hành động khôi phục thay vì giả vờ mở thành công.
- **Kiểm chứng/giới hạn:** `npm.cmd run typecheck` và `npm.cmd run build:local` đạt sau thay đổi. Chưa fault-inject quota/storage interruption hoặc thử khôi phục trên browser trong lượt này; điều khiển browser bị mất trong phiên, nên Phase 6.2 vẫn mở và chưa được coi là hoàn tất.

## Ảnh board bổ sung và trạng thái hiện hành — 03/11/2026

- **Ảnh nhận diện:** hồ sơ có ảnh/sơ đồ tham khảo cho Arduino Uno R3, Nano classic, Mega 2560 R3, UNO R4 WiFi/Minima, Raspberry Pi Pico/Pico W/Pico 2, Seeed XIAO ESP32-C3/S3, STM32 NUCLEO-F401RE, Blue Pill và ESP32 DevKit. Ảnh ESP32 chỉ xác định một board ESP32 generic, không xác nhận đúng clone 30 chân; ảnh NUCLEO là MB1136 rev C trong khi CAD ghi C04; Blue Pill không xác định clone/revision. Ảnh Minima là render sản phẩm; một số ảnh XIAO là sơ đồ/render, không phải ảnh chụp board vật lý. Ảnh chỉ giúp nhận diện; không xác nhận board trùng CAD, không suy ra pinout/BOM và không dùng để chỉnh hình học. Xem `docs/reference-image-attribution.md` và `docs/board-model-accuracy-audit-2026-11-03.md`.
- **Schematic/net:** explorer hiển thị nhóm dây nối tường minh trong workspace, có thể chọn để highlight chung ở sơ đồ và cảnh lắp ráp. Đây không phải netlist EDA hoàn chỉnh; không tự suy luận bus nội bộ breadboard, không tạo copper hoặc netlist board và không xác nhận điện áp/dòng.
- **Firmware:** công cụ HEX cần người dùng chọn/confirm ATmega328P target cho Uno R3 hoặc Nano classic; ESP32, RP2040, STM32 bị từ chối vì chưa có backend firmware tương ứng. Không tự đoán đích MCU từ HEX.
- **SPICE:** chỉ chấp nhận phần tử có mapping analog đã khai báo và topology/trị số rõ. Không suy diễn netlist từ ảnh, model 3D, đường đồng hiển thị hay highlight wire; KiCad PCB được đối chiếu topology toàn chân từ IPC-D-356 + schematic XML, còn compiler mạch tương đương chỉ hỗ trợ R/C/L/V được xác nhận. Không chạy firmware MCU. Binary ngspice/WASM hiện vẫn **NOT CLEARED** để phân phối công khai vì thiếu source commit, recipe/toolchain, inventory thành phần và review gắn với đúng hash. Chỉ `build:local` dùng nội bộ; build phát hành phải fail-closed.
- **Xác minh board thật:** ảnh cộng đồng và CAD chỉ nâng khả năng tra cứu. Sai số board-to-board, revision, linh kiện lắp thực và pinout ngoài đời vẫn cần mẫu đúng SKU/revision cùng phép đo; không thể đóng bằng tìm ảnh chung trên mạng.

## Workspace → SPICE, nhập KiCad và kit lớp học — 03/11/2026

- **Workspace sang SPICE:** workspace có thể biên dịch các dây và linh kiện analog được map rõ ràng sang netlist có giới hạn; hỗ trợ nguồn/tải analog theo mapping khai báo (R/C, diode/LED, LDR có trị số). Handoff ngắn hạn được kiểm tra trước khi worker nhận. Schematic và view 3D dùng cùng topology dây của workspace nên có cùng giới hạn. Với breadboard, chỉ endpoint nhóm khai báo trùng nhau qua dây rõ ràng mới nối thành cùng net; compiler không suy luận các hàng/lỗ nội bộ breadboard. MCU/GPIO/firmware, copper PCB, parasitics và linh kiện chưa map không được tự suy diễn. Sai topology, chân hở hoặc trị số thiếu sẽ bị chặn.
- **KiCad schematic/PCB → SPICE:** hiện có hai đường nhập. Eeschema XML dùng topology schematic; IPC-D-356 do PCB Editor xuất lấy topology pad/net từ board, còn trị số lấy từ schematic XML tương ứng. Trước khi nhập SPICE, báo cáo riêng đối chiếu topology của mọi chân schematic có kết nối với pad PCB theo designator/chân, không lệ thuộc cách đặt tên net; nhận record 317/327, bỏ record via và phân biệt chân NC. Đây là so khớp hai export CAD, không xác nhận chúng cùng revision hay board sản xuất trùng CAD. Bước tạo mạch tương đương vẫn giới hạn R/C/L/V hai chân có trị số tĩnh và ground rõ; IC/linh kiện khác phải được loại trừ tường minh. Nếu schematic không có nguồn V, người dùng có thể khai báo nguồn thử ngoài tối đa 60 V; đây là giả định nhập vào, không suy ra từ board. IPC-D-356 chỉ mang quan hệ pad/net, không mang trở kháng đường đồng; không tính copper parasitics, via, nhiệt/dòng tải, MCU hoặc firmware. Xem `src/lib/kicadSpiceImport.ts`, `src/components/spice/KicadPcbSpiceImport.tsx` và `docs/kicad-to-spice-import.md`.
- **Lớp/kit/cộng đồng:** `/app/classroom-kits` lưu cục bộ kế hoạch board/revision, bài học, số trạm và danh sách dụng cụ; có JSON allowlist import/export, CSV an toàn công thức, phiếu in và gói chia sẻ thủ công chứa link bài, nhãn phạm vi mô phỏng, thông tin board/nguồn và lưu ý an toàn. Board SKU cụ thể tính 1 chiếc/trạm. Không có upload/đồng bộ, tài khoản lớp, bảng tin hay kiểm duyệt cộng đồng; migration Supabase hiện chỉ có analytics/admin, chưa có schema lớp/cộng đồng.
- **Độ chính xác 3D:** `npm run audit:board-models` rà cấu trúc hotspot/anchor/scene bounds cho 15 cảnh. `npm run audit:board-model-geometry` đối chiếu mesh thân bo STEP đã ghim hash với node PCB tách riêng trong GLB: 8/8 board pass trong ngưỡng 0,005 mm. Sáu viewer board còn lại và cảnh assembly không có cặp node thân bo STEP tách riêng cho phép thử này. Đây là CAD-to-CAD consistency, không kiểm chứng board vật lý, revision bán lẻ, BOM hay vị trí linh kiện. Sai lệch CAD/PDF S3 DevKitC-1 0,125 mm và residual XIAO S3 OPL/STEP ≤0,095 mm vẫn công khai, chưa tự scale/sửa vì thiếu revision/board thật. Xem `docs/board-model-accuracy-audit-2026-11-03.md` và `docs/hardware-validation-intake.md`.
- **Quyền phân phối ngspice:** tài liệu chính thức mô tả ngspice chủ yếu theo Modified BSD với ngoại lệ theo thành phần; chưa biết chính xác mã/thư viện nào được link vào WASM này. `npm run build` và `npm run build:public` đều fail-closed qua `check:public-release`; `npm run build:local` chỉ để build nội bộ và tuyệt đối không dùng làm artefact phát hành khi gate chưa đạt. Gate tự hash bytes đang được phục vụ, đối chiếu byte count, ngspice source commit trùng provenance, inventory có cấu trúc và biên bản review gắn với cùng SHA-256. npm registry báo gitHead wrapper nhưng source archive tại commit đó khai báo version 1.7.0, lệch với package 1.8.0 đang cài; không xác định được source commit ngspice trong WASM. Hiện thiếu đúng 5 điều kiện: trạng thái chưa cleared, ngspice source commit, recipe/toolchain, inventory thành phần và review. Đây là thiếu bằng chứng, không phải kết luận binary vi phạm hay được cấp phép; chi tiết ở `docs/spice-redistribution-audit-2026-11-03.md`.
- **Đã xác minh lượt này:** `npm test` 332/332; `npm run typecheck` và `npm run build:local` thành công. `npm run audit:board-models` kiểm tra 15 cảnh, không có hotspot node thiếu/orphan hoặc anchor pin selectable ngoài scene bounds; `npm run audit:board-model-geometry` đo riêng 8/8 thân PCB STEP ↔ GLB thành công. `npm run audit:spice-engine` xác nhận eecircuit-engine 1.8.0, ngspice 45.2, SHA-256 artifact và smoke test chia áp 2,5 V. HTTP GET tới route SPICE trả 200 nhưng browser automation chưa hoạt động trong phiên; đây không phải kiểm tra giao diện tương tác. `npm run check:public-release` còn fail-closed vì 5 điều kiện provenance/phân phối thiếu; không có board vật lý để đo.
- **Ảnh ESP32 DevKit:** thêm ảnh Commons CC BY-SA 4.0 cho nhận diện board ESP32 chung. Ảnh không xác định DOIT/clone/revision, nên không được dùng để khẳng định đúng model clone 30 chân, sửa geometry hoặc gán BOM/pinout. Attribution và giới hạn biến thể ở `docs/reference-image-attribution.md`.

## Đối chiếu toàn bộ net schematic với PCB — 03/11/2026

- **Đã làm:** thêm báo cáo chỉ đọc so khớp quan hệ nối từ tất cả chân schematic có net với các pad PCB IPC-D-356, theo designator/chân và nhóm kết nối tương đương; tên net khác nhau giữa hai export không gây báo sai. Báo cáo tách chân thiếu trên PCB, pad PCB chưa có node chân tương ứng, nhóm net bị tách/ghép, designator chỉ có ở PCB, và pad PCB tương ứng chân schematic đánh dấu NC.
- **Định dạng được xử lý:** hỗ trợ record 317 cho pad xuyên lỗ và 327 cho pad SMD; record `VIA` 317 được bỏ qua vì không phải pad linh kiện. Chân no-connect không bị tính nhầm là chân thiếu có net; nếu pad tương ứng lại chia sẻ net PCB với pad khác thì báo cảnh báo.
- **Đối chiếu dữ liệu thật trong repo:** dùng KiCad CLI 10.0.7 export từ PCB và schematic cùng bộ thiết kế ESP32 DevKit clone tham chiếu. Kết quả: 118/118 chân có net được đối chiếu, 118 khớp nhóm kết nối, 0 chân thiếu, 0 pad thừa, 0 sai nhóm net; 27 pad NC khớp và không pad nào chia sẻ net với pad khác. Kết quả này xác nhận tính nhất quán của hai export nguồn CAD, không chứng minh board ngoài đời/revision khớp.
- **Ranh giới SPICE:** báo cáo tổng topology không mở rộng phạm vi bộ giải. Tạo netlist tương đương vẫn chặn 12 designator chưa hỗ trợ cho tới khi người dùng loại trừ rõ; không coi phép so net là ERC/DRC, board sign-off, kiểm chứng nguồn hay mô phỏng firmware.
- **Kiểm tra cuối lượt:** 16 test tập trung cho KiCad/SPICE, 329 test toàn suite, typecheck và build nội bộ đều đạt; audit board 15 cảnh và smoke audit SPICE đạt. `npm run check:public-release` còn fail-closed bởi provenance/phân phối WASM thiếu.

## Nhập PCB KiCad theo IPC-D-356 vào mạch SPICE tương đương — 03/11/2026

- **Đã triển khai:** ngoài nhập KiCad Eeschema XML, SPICE Workbench có thể nhận IPC-D-356 từ PCB Editor và XML từ schematic. Tập net/pad lấy từ PCB; giá trị linh kiện lấy từ schematic. Chỉ cho phép R/C/L/V hai chân có pin number và connectivity khớp trong cả hai tệp. IC, diode, connector, MCU và phần tử khác cần được loại trừ tường minh trước khi tạo mạch tương đương; các chân bị loại được coi là hở tại ranh giới analog.
- **Nguồn không có trong thiết kế:** có thể khai báo VTEST DC lý tưởng ngoài ở mức 0.01–60 V giữa hai net PCB được chọn. Đây là giả định người dùng nhập để thử; giao diện không gọi đó là nguồn board thật. Không tự chọn net ground ngoài nhãn GND/GROUND/0 khi nhãn ground hiện diện.
- **Đối chiếu thực:** đã dùng KiCad CLI 10.0.7 xuất IPC-D-356 và KiCad XML từ project `assets/boards/esp32-devkit-v1-30pin/upstream/ESP32 Dev Kit.kicad_pcb` cùng schematic tương ứng; compiler dừng đúng lúc cần xác nhận 12 designator chưa hỗ trợ. Sau khi 12 phần tử đó được loại trừ tường minh và khai báo nguồn thử 5 V, compiler tạo được `.op` tương đương. Đây chỉ xác nhận đọc được exports và kiểm tra chéo topology R/C/L/V; không chứng minh hai tài liệu cùng revision, PCB sản xuất khớp CAD, hay board vận hành như mô hình.
- **Giới hạn:** IPC-D-356 là topology kiểm tra pad/net, không cung cấp dữ liệu trở kháng đồng để tính parasitic. Tính toán chưa gồm đường đồng/via, nhiệt, tải, diode/IC, regulator, MCU, firmware, logic số hoặc các linh kiện bị loại. Kết quả không phải ERC, DRC, sign-off hay mô phỏng toàn board. Dùng KiCad 10 → PCB Editor → File → Fabrication Outputs → IPC-D-356; schematic → File → Export → Netlist → KiCad XML.
- **UI và dữ liệu:** file được đọc cục bộ trong browser (tối đa 1 MB mỗi tệp); netlist hiện tại chỉ được thay khi người dùng bấm nút nhập sau khi thấy preview và giả định. Tệp không được upload. Xem `src/lib/kicadSpiceImport.ts`, `src/components/spice/KicadPcbSpiceImport.tsx` và `tests/kicad-spice-import.test.mjs`.
- **Kiểm chứng lúc thêm importer:** ban đầu KiCad/SPICE focused tests 11/11 và suite 324/324; báo cáo toàn net được bổ sung sau đó ở mục “Đối chiếu toàn bộ net schematic với PCB”. Unit guard chặn sai đơn vị và chuẩn hóa `1MΩ` thành megaohm. Bản production vẫn phải qua gate phân phối ngspice, chưa được coi là cleared.

## Sửa kiểm tra SPICE workspace — 03/11/2026

- Trước sửa, parser chung bỏ qua hậu tố đơn vị nên có thể hiểu `5 V` là điện trở 5 Ω hoặc `100 Ω` là tụ 100 F. Giá trị gán sai đơn vị được tạo thành netlist hợp lệ về cú pháp nhưng sai vật lý.
- Compiler nay kiểm tra đơn vị theo loại phần tử: điện trở/LDR nhận Ω, tụ nhận F, nguồn nhận V; vẫn chuẩn hóa dấu phẩy thập phân, ký hiệu µ/μ, suffix kỹ thuật và chữ thường/hoa phổ biến. Test hồi quy bao phủ cả dữ liệu sai đơn vị và nhập hợp lệ `3,3 v`, `1 kOhm`, `100 µF`.
- Handoff workspace nay kiểm tra kích thước JSON trước khi ghi sessionStorage; gói lớn hơn 24.000 ký tự bị từ chối thay vì tạo một mã chuyển tiếp mà trang SPICE không thể đọc lại.
- Xác minh sau sửa: `npm test` 318/318, typecheck/build nội bộ đạt, audit board 15 cảnh và audit SPICE DC 2,5 V đạt.

## Kiểm tra độ chính xác board 3D và quyền phân phối ngspice — 03/11/2026

- **Coverage:** audit bao phủ đủ 14 viewer board và cảnh assembly riêng (15 GLB scenes); không thiếu node hotspot, orphan hotspot, hotspot không chọn được hoặc pin anchor selectable nằm ngoài scene bounds. Arduino Uno/Nano/Mega có anchor data nhưng pin picking đang tắt. Đây là kiểm tra cấu trúc/tọa độ manifest, không phải xác nhận kích thước cơ khí của board thật.
- **Hiệu năng GLB:** S3 DevKitC-1 giảm 13.632 → 138 primitives (12,88 → 8,23 MB); XIAO ESP32-C3 giảm 7.279 → 118 (7,41 → 4,92 MB). Bộ tối ưu từ chối ghi nếu node/transform/material hoặc bộ tam giác theo node thay đổi; asset hash, inventory, anchor-source hash và asset lock đã được cập nhật.
- **Sai lệch có bằng chứng:** Espressif S3 DevKitC-1 V1.1: outline PADS nhập 62,865 mm so với PDF hãng 62,74 mm, lệch 0,125 mm; giữ CAD nguồn, không scale âm thầm. XIAO ESP32-S3: outline từ OPL PCB căn vào STEP có residual đo được ≤0,095 mm dọc và ≤0,005 mm ngang, nhưng OPL không ghi revision. Board thật chưa có để đo bất kỳ mẫu nào.
- **Kết luận độ chính xác:** report [board-model-accuracy-audit-2026-11-03.md](board-model-accuracy-audit-2026-11-03.md) ghi hash, revision, cơ sở CAD/STEP, package mesh thiếu/generic, pin anchor trực tiếp hay kế thừa và bằng chứng cần có tiếp theo cho từng model. “Theo CAD nguồn” không đồng nghĩa khớp mọi clone/SKU ngoài thị trường.
- **ngspice:** WASM 45.2, 6.133.055 bytes, SHA-256 `ed799542…ae886e4`, được phục vụ tại `public/vendor/eecircuit-engine/spice.wasm`. Wrapper `eecircuit-engine` 1.8.0 khai báo MIT; source commit/build flags/toolchain/component inventory khớp WASM chưa có. Trạng thái tái phân phối công khai của đúng artifact được đặt là **NOT CLEARED**; xem `public/licenses/NGSPICE-NOTICE.txt` và `public/licenses/spice-engine-provenance.json`. Điều này là release gate, không khẳng định binary vi phạm license.
- **Nguồn license:** manual upstream nêu Modified BSD nền, tclspice/numparam LGPLv2, XSPICE public domain và OSDI MPL 2.0. Mục GPL-linking nhắc `table.cm`, đồng thời nói Modified BSD tương thích GPL; tài liệu không chứng minh binary này có `table.cm`. Muốn đóng gate cần xác định source/patch/build chính xác, danh mục thành phần và đáp ứng notice/source obligations tương ứng; việc này cần provenance chính xác và review phân phối.

## Viewer tham chiếu ESP32-S3-DevKitC-1 — 03/11/2026

- **Đã tích hợp:** reference design PADS ASCII/BOM V1.1 vào viewer 3D nội bộ; 48 footprint có mesh package chọn được, 44 pad header J1/J3 có anchor và tra cứu pinout theo guide Espressif. Designator hiển thị model part, footprint, MPN/nhà sản xuất khi BOM có, pad count/net label và tọa độ CAD. Các footprint không định danh trong BOM được ghi rõ, không suy đoán chức năng. Dữ liệu tái tạo bằng `scripts/build-esp32-s3-devkitc-1-model.py`; `scripts/name-esp32-s3-devkitc-1-glb.mjs` đặt tên mesh GLB theo designator và ghi hash.
- **Độ tin cậy:** đây là tái dựng giáo dục, không phải assembly GLB hãng phát hành. KiCad 10 PADS import có 1331 phát hiện DRC và 3 item chưa nối; nhãn net là dữ liệu import, chưa xác minh độc lập bằng schematic/netlist. 47 package bodies là model KiCad chung; U4 thể hiện họ module WROOM-1 nhưng BOM không khóa flash/PSRAM cụ thể. Chưa đối chiếu với board thật.
- **Kích thước:** outline PADS sau chuyển đổi 25,400 × 62,865 mm, bán kính góc 0,667 mm; PDF kích thước chính hãng ghi chiều dài 62,74 mm (chênh 0,125 mm). Giữ đường viền PADS để đồng bộ hình học import và công khai sai lệch.
- **Nguồn/quyền:** giữ archive, BOM, source hash, attribution, điều khoản Espressif và notice CC BY-SA 4.0 của package model KiCad. Không phát hành thương mại model dẫn xuất hoặc giữ nhãn hiệu Espressif nếu chưa đối chiếu điều khoản; NOTICE đi cùng GLB.
- **Giới hạn:** không chế tạo, electrical sign-off, xác minh netlist, mô phỏng điện, firmware hoặc tuyên bố tương thích mọi revision. ESP32-S3 GPIO là 3,3 V; GPIO38 gắn RGB LED ở V1.1; GPIO35–37 có thể bị module memory chiếm tùy variant.
- **Kiểm tra lượt này:** KiCad CLI export GLB thành công; node naming ghi nhận 48 mesh; hash được lưu trong inventory và anchors. `npm.cmd run typecheck` và `npm.cmd run build` đều exit 0. Trên `/boards?board=esp32-s3-devkitc-1`, browser xác nhận viewer, 44 pad, danh sách linh kiện và panel BOM/footprint/net đang hiển thị; chưa kiểm chứng bằng board vật lý. Không chạy test suite trong lượt rà soát này.

## Chọn pad 3D XIAO ESP32-S3 — 03/11/2026

- **Đã thêm:** 14 anchor J1/J2 cho 5V, GND, 3V3 và D0–D10. Tâm pad lấy từ PCB KiCad Seeed OPL, xuất bằng `scripts/export-seeed-xiao-esp32-s3-pin-anchors.py`, rồi căn trục/tâm outline vào STEP bản thường; residual outline tối đa 0,095 mm dọc và 0,005 mm ngang.
- **Đã sửa sau kiểm tra trực quan:** anchor trước đó cộng tâm STEP vào dữ liệu GLB đã được căn tâm, làm chân J1/J2 lệch vào mesh linh kiện. Generator nay xuất anchor trong cùng hệ tọa độ tâm board như GLB; dấu chọn 3D và hit-test dùng chung phép chiếu.
- **Tách bằng chứng:** GPIO/chức năng lấy từ guide Seeed hiện hành. PCB OPL không ghi revision; tên net CAD chỉ được giữ làm nhãn tham khảo và không chứng minh route MCU của mọi revision. Không có board vật lý để đối chiếu.
- **Phạm vi còn thiếu:** 3D cho chọn pad theo tọa độ; chưa ghép 34 mesh còn lại với designator/BOM, chưa có netlist, tô đường đồng hay chạy firmware/mô phỏng điện.
- **Nguồn và license:** PCB Seeed OPL CC BY-SA 4.0, file LICENSE/README gốc và checksum được giữ tại `assets/boards/vendor/seeed/opl-xiao-esp32s3/`; chi tiết ở `docs/board-model-sourcing.md`.
- **Kiểm chứng:** generator chạy với KiCad pcbnew 9.0.1 và tạo đủ 14 anchor; typecheck và build production đạt. Trên trang Board, lần lượt chọn D0 và D7 từ danh sách pinout: dấu chọn hiển thị trên hàng pad J2 ở mép board, không còn nằm trong vùng shield RF; chọn 5V cập nhật nội dung tra cứu và dấu chọn. Phép chiếu dấu chọn và phép hit-test dùng chung một hàm. Chưa xác minh bằng click trực tiếp vào canvas, board vật lý hoặc một revision bán lẻ cụ thể.

## Pin map XIAO ESP32-S3 bản thường trước khi thêm tọa độ — 03/11/2026

- **Đã thêm:** danh sách 14 tên chân breakout 5V, GND, 3V3 và D0–D10 vào hồ sơ board, catalog, tra cứu pinout và capability registry. GPIO/chức năng lấy từ guide Seeed cho bản thường; không lấy bảng của Sense/Plus.
- **Lịch sử:** tại thời điểm mục này được ghi, pin map chỉ tra cứu theo tên. Tọa độ pad được bổ sung sau trong mục “Chọn pad 3D XIAO ESP32-S3” phía trên; không dùng vị trí trong ảnh để tự đoán pad.
- **Cảnh báo được thêm:** GPIO 3,3 V; 5V là VBUS liên quan USB, và guide nói chân 5V không có nguồn khi board chạy bằng pin LiPo.
- **Tài liệu:** link pinout trên profile được đổi về guide bản thường; loại link XLSX mang tên Sense để không gây nhầm variant. Nguồn và phạm vi được ghi trong `src/data/seeedXiaoEsp32S3Pinout.ts` và `docs/board-model-sourcing.md`.
- **Kiểm chứng lượt này:** typecheck đã chạy; chưa kiểm tra trực quan giao diện sau khi thêm danh sách, chưa test hardware và chưa chạy unit suite.

## Tra cứu 14 chân breakout Adafruit QT Py ESP32-C3 Rev B #5405 — 03/11/2026

- JP1/JP3 có đủ 14 pad ngoài board được chọn trên model 3D hoặc trong danh sách pinout; bảng hiện pad number, net CAD, chức năng theo pinout hãng, GPIO và lưu ý điện áp.
- Anchor sinh từ package `1X07_CASTEL` và placement Eagle của đúng Rev B. Script xác nhận cặp pad N/NC chung net, đối chiếu hash Eagle CAD/GLB, căn hệ tọa độ từ 35 mesh có designator, kiểm residual và outline GLB trước khi ghi dữ liệu.
- Nguồn chức năng: [Adafruit QT Py ESP32-C3 pinout guide](https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board/pinouts). Pin selection là tra cứu tĩnh, chưa tô net/copper, chưa chọn tiếp điểm STEMMA QT hoặc chân MCU U2, chưa xác nhận board thật.
- **Kiểm chứng:** `node scripts/export-adafruit-qtpy-esp32-c3-pin-anchors.mjs` tạo đủ 14 anchor; Eagle/GLB translation `x=-8.89 mm`, `z=10.3506 mm`; top PCB `0.785 mm`. Typecheck/build và browser kiểm tra sau khi tích hợp.

## Tra cứu 40 chân J0 cho Raspberry Pi Pico — 03/11/2026

- Pico, Pico W, Pico 2 và Pico 2 H hiện có thể chọn đủ 40 chân J0 qua danh sách pinout và anchor trên viewer 3D. Bảng chi tiết hiển thị pad/net tham chiếu, tên chân, chức năng ngoại vi, mô tả và cảnh báo điện áp.
- Pico/Pico W: tâm pad xuyên lỗ và net lấy trực tiếp từ Allegro chính hãng bằng KiCad CLI 10.0.7; hash và tọa độ lưu trong `src/data/raspberry-pi-pico.j0-pads.json`. Tên/chức năng lấy từ pinout Raspberry Pi.
- Pico 2/Pico 2 H: layout J0 kế thừa từ Pico vì tài liệu hãng công bố chung bố trí/pinout; tọa độ được biến đổi theo trục STEP từng model. Không có Allegro riêng hai biến thể này trong nguồn cục bộ, chưa đo trên board vật lý.
- Đây là tra cứu tĩnh, không tạo dây/netlist, không tô đường đồng, không liên kết firmware và không chạy mô phỏng. Nguồn, hash, phép biến đổi và ranh giới được ghi ở `docs/board-model-sourcing.md`.
- **Kiểm tra:** `npm.cmd run typecheck` và `npm.cmd run build` đạt; build Vite chuyển 222 module. Trên trang Pico W, chọn pad J0.40 hiển thị VBUS, tên net, vai trò và cảnh báo 5 V. Chưa chạy bộ test trong lượt này và chưa kiểm chứng trên board vật lý.

## Tra cứu chân header trong danh mục board — 03/11/2026

- **ESP32 DevKit clone 30 chân:** 30 chân ở hai header có thể chọn trong danh sách hoặc trực tiếp trên model 3D. Anchor lấy từ pad của thiết kế clone Brij Modi đã lưu trong `assets/boards/esp32-devkit-v1-30pin/`; pin function/net lấy từ hồ sơ model. Đây chỉ đúng với clone/layout nguồn đó, không phải pinout phổ quát cho mọi ESP32 DevKit V1.
- **Seeed XIAO ESP32-C3 v1.3:** 14 chân header J1/J2 tiếp tục dùng anchor từ tâm pad PCB KiCad, net CAD và pin map Seeed như mô tả ở nhật ký bên dưới.
- **Kiểm chứng giao diện:** chọn D13 trong danh sách ESP32 cập nhật query `pin` và thông tin GPIO; click trực tiếp lên model cũng chọn chân và đồng bộ thẻ chi tiết. XIAO giữ nguồn Seeed/KiCad riêng, không bị gắn nguồn ESP32.
- **Ranh giới:** pin selection chỉ tra cứu tĩnh, chưa highlight net/copper, chưa liên kết firmware và chưa xác nhận trên board vật lý. Các board khác vẫn theo trạng thái `pinPicking` trong manifest.
- **Regression/verification:** `npm.cmd test` — 282/282; `npm.cmd run typecheck` và `npm.cmd run build` — đạt; `node scripts/audit-board-models.mjs` — 14 scene, `missing=0`, `orphan=0`; `npm.cmd run audit:spice-engine` — đạt, DC smoke test 2,5 V. Browser: chọn chân từ danh sách và click trực tiếp trên ESP32 clone đã đồng bộ phần chi tiết.

## Tra cứu 28 pad Feather ESP32-S3 #5323 và #5483 TFT — 03/11/2026

- **Đã thêm:** 28 pad JP1/JP3 mỗi board có thể chọn trong viewer 3D hoặc danh sách để xem số pad, net CAD, GPIO alias, chức năng và lưu ý an toàn. Anchor derive từ đúng Eagle board CAD và căn với GLB; net label không được suy ra từ vị trí.
- **Khác biệt biến thể:** GPIO alias đọc từ pinout Adafruit và Arduino ESP32 core variant riêng cho từng PID. Bản #5323 dùng SDA/SCL GPIO3/4 và TX/RX GPIO39/38; bản TFT #5483 dùng SDA/SCL GPIO42/41 và TX/RX GPIO1/2. Không dùng mapping TFT cho Feather thường.
- **Sửa nội dung:** #5323 U4 hiện được ghi là footprint BME280 dự phòng, không phải cảm biến lắp sẵn theo guide hãng.
- **Ranh giới:** pinout là tra cứu tĩnh; không có netlist MCU, tô copper, luồng firmware, mô phỏng điện hay xác minh board vật lý. #5323/#5483 vẫn là CAD preview.
- **Kiểm chứng:** generator sinh 28 anchor mỗi model, kiểm hash/outline và transform residual; typecheck/build và browser pin-selection được kiểm tra sau tích hợp. Chưa chạy bộ test trong lượt này.

## Chọn chân header XIAO ESP32-C3 từ CAD — 03/11/2026

- **Đã thêm:** 14 chân J1/J2 chọn được bằng click trên mô hình 3D hoặc qua bộ chọn truy cập bằng bàn phím; lựa chọn được giữ trong query `pin`. Anchor sinh từ tâm pad cùng net trong PCB KiCad v1.3, căn theo khung GLB và mặt đồng trên. GPIO/chức năng lấy từ pin map Seeed, không suy ra cho các net khác.
- **Thông tin khi chọn:** hiện nhãn D0–D10/3V3/GND/5V, reference J1/J2, số pad hai mặt, net CAD, GPIO/chức năng và cảnh báo điện. D0/GPIO2, D8/GPIO8, D9/GPIO9 được đánh dấu strapping; D3/GPIO5 có lưu ý ADC2.
- **Không tuyên bố:** đây chưa phải tô lớp đồng/net theo lựa chọn, đường tín hiệu chạy, mô phỏng điện hay xác minh bằng mẫu vật lý. J1/J2 có vị trí pad trong CAD, nhưng header có thể chưa hàn trên board ngoài đời. Quyền phân phối archive KiCad vẫn cần giải quyết riêng.
- **Sinh lại:** `npm.cmd run generate:xiao-c3-pin-anchors`; script đối chiếu SHA-256 PCB/GLB, kiểm tra độ lệch CAD–GLB, net, số lượng chân và vùng board trước khi ghi JSON.

## Board viewer: lấy nét mesh đang chọn — 03/11/2026

- **Đã thêm:** nút lấy nét đưa mesh của linh kiện đang chọn vào giữa cảnh và tự zoom theo bounds CAD của mesh đó. Tính từ các mesh thuộc cùng feature; không đưa PCB, soldermask, silkscreen, dielectric hoặc pad vào khung lấy nét. Footprint không có mesh thì nút bị khóa, không giả lập hình học.
- **Đặt lại góc nhìn:** trả target và zoom về toàn board; thao tác Home trên canvas vẫn dùng cùng reset.
- **Kiểm tra browser:** trên Pico R3 chọn RP2040, nút lấy nét phóng đúng chip ở giữa cảnh; nút đặt lại trả về toàn board. Trên XIAO ESP32-C3, chọn C1 có mesh thì nút lấy nét bật và đưa vùng package vào giữa; chọn BOOT0 chỉ có footprint thì nút bị khóa, thông tin CAD vẫn đọc được. Trước lần tải mới, HMR giữ instance cũ nên click báo hàm mới chưa tồn tại; tải lại ứng dụng đã xử lý trạng thái dev đó. Không có lỗi mới sau reload.
- **Regression và build:** `npm.cmd test` — 276/276; `npm.cmd run typecheck` — đạt; `npm.cmd run build` — đạt; `node scripts/audit-board-models.mjs` — 14 scene, `missing=0`, `orphan=0`. Bằng chứng chọn mesh Pico và nút lấy nét được kiểm tra trên browser. Chưa kiểm tra trên thiết bị thật hoặc các board vật lý.
- **Ranh giới:** zoom-to-feature giúp quan sát CAD, không tăng mức tin cậy BOM/pinout, không xác nhận mesh chưa định danh và không bật pin picking cho các board đang khóa tính năng này.

## Bộ tính điện tử → SPICE, có thể tải lại draft — 03/11/2026

- **Đã nối bốn bộ tính vào solver:** kết quả LED, chia áp ADC, pull-up I²C và RC tạo netlist tương đương theo thông số hợp lệ. LED dùng diode Shockley lý tưởng hiệu chỉnh tại điểm mục tiêu; ADC không có tải đầu vào; I²C chỉ biểu diễn sườn lên khi nhả bus bằng RC; RC dùng bước kích thích mặc định 5 V. Mỗi netlist ghi rõ giả định và được kiểm tra bằng cùng validator trước khi tải vào editor.
- **Giữ draft qua refresh:** dữ liệu handoff có schema và giới hạn kích thước nằm trong query `calculatorSpice`; URL được tạo từ payload đã xác thực, còn đầu nhận kiểm tra kích thước, schema và netlist trước khi nạp. Có thể tải lại hoặc chia sẻ liên kết mà draft vẫn giữ nguyên. Chỉnh netlist/chọn ví dụ sẽ xóa handoff khỏi URL.
- **Kiểm tra giao diện trực tiếp:** đã chuyển và chạy cả bốn loại trong browser; LED/ADC trả điểm làm việc, I²C/RC trả đồ thị quá độ. Đã kiểm tra namespace `/app/tools/calculators` → `/app/tools/spice` và reload giữ netlist. Các con số là kết quả solver của model tương đương, không phải đo trên board.
- **Kiểm thử mã:** full suite hiện tại 276/276; `npm.cmd run typecheck` và `npm.cmd run build` đạt. Regression kiểm tra serialize/parse bounded URL, từ chối payload quá dài/sai schema, render route handoff và chạy ngspice thật cho cả bốn loại.
- **Handoff workspace đã có nhưng chỉ trong subset:** compiler đọc dây nối tường minh, gom node và chỉ xuất các phần tử analog có mapping/trị số đã khai báo; mạch có MCU/GPIO, linh kiện chưa có model, trị số mơ hồ hoặc topology lỗi sẽ bị chặn với lý do. Handoff mở `/tools/spice` qua dữ liệu session đã kiểm tra. Đây không phải compiler tổng quát cho mọi bài hoặc mọi sơ đồ. PCB CAD không được chuyển thành electrical netlist; nó là thiết kế board tham chiếu riêng.

## Provenance SPICE và evidence board — 03/11/2026

- **SPICE có audit tái chạy được:** `eecircuit-engine` được ghim chính xác ở 1.8.0 trong `package.json` và `package-lock.json`; `npm.cmd run audit:spice-engine` đối chiếu phiên bản, header runtime ngspice 45.2, build header, kích thước và SHA-256 của WASM trong package với bản public; đồng thời chạy mạch chia áp DC 5 V và kiểm tra đầu ra 2,5 V. Artifact hiện tại: 6.133.055 byte, SHA-256 `ed7995425b6f7af02db874539d13ea10d07759d5f2be6b79969343459ae886e4`.
- **Giới hạn provenance/phát hành:** package khai báo MIT cho `eecircuit-engine`, nhưng không ghi commit nguồn ngspice hay danh mục thành phần đã biên dịch vào WASM. Tài liệu upstream mô tả Modified BSD làm giấy phép nền cùng các ngoại lệ theo thành phần, gồm LGPLv2 và MPLv2.0; chưa thể xác định ngoại lệ nào áp dụng cho đúng binary 45.2 này. `public/licenses/NGSPICE-NOTICE.txt` tách rõ hai phạm vi và giữ kiểm tra quyền phân phối công khai là release gate; audit hash không phải chứng nhận license. Xem manifest `public/licenses/spice-engine-provenance.json` và các tài liệu upstream được liên kết trong notice.
- **Evidence XIAO ESP32-S3:** đã Việt hóa nhãn revision/ghi chú chuyển STEP → GLB, giữ nguyên Seeed Studio, @SeeedStudio và CC BY-SA 4.0.
- **Kiểm chứng lượt này:** `npm.cmd test` — 266/266; `npm.cmd run typecheck` — đạt; `npm.cmd run build` — đạt; `node scripts/audit-board-models.mjs` — 14 scene, `missing=0`, `orphan=0`; `npm.cmd run audit:spice-engine` — đạt, DC smoke test `v(out) = 2.5 V`. Trên browser, XIAO S3 revision hiển thị tiếng Việt tại danh mục/viewer/panel nguồn; cây trợ năng của `/boards`, `/components`, `/tools/spice` có tên cho điều hướng, bộ lọc, điều khiển model và trường netlist; ví dụ SPICE RC chạy xong với đồ thị, bảng mẫu và CSV. Đây là rà cây trợ năng thủ công, không thay thế axe hoặc screen reader; chưa chạy axe toàn bộ route. Thiết bị thật và quyền phân phối upstream ngspice vẫn chưa được xác minh.

## Cập nhật công cụ, ARIA và Học tập/Board — 03/11/2026

- **Học tập và Board/Linh kiện:** giữ nguyên dữ liệu, nguồn và nhãn năng lực đã rà soát trước đó. Lượt này nối lại các điểm đến trong bề mặt website và app workspace; board/linh kiện vẫn là mô hình tham khảo theo bằng chứng từng profile, không suy ra độ chính xác phần cứng.
- **ARIA bộ tính:** các ô số trong LED, ADC, I²C và RC nhận `aria-invalid` cùng `aria-describedby` khi dữ liệu lỗi; lỗi hiển thị cạnh đúng ô. Kết quả hợp lệ được thông báo qua live region. Bộ tính không thay SPICE.
- **SPICE:** thêm `/tools/spice` và `/app/tools/spice`, dùng `eecircuit-engine` 1.8.0 với ngspice WASM trong Web Worker. `postinstall` tách WASM thành tệp tải riêng và bỏ model-card foundry đóng gói sẵn mà netlist gate không cho nạp qua `.include`; model số khai báo trực tiếp trong netlist vẫn dùng được. Worker có timeout 30 giây; netlist tối đa 16 kB/160 dòng, yêu cầu phân tích tối đa 20.000 điểm và chặn dataset kết quả solver vượt 20.000 điểm (ngspice có thể thêm bước thích nghi cho `.tran`). Công cụ cho nhập/chỉnh netlist, chạy `.op`, `.tran`, `.ac`, `.dc`, vẽ mẫu kết quả và tải CSV. Các phần tử/nguồn/model được giới hạn; `.include`, `.control`, lệnh file, model ngoài và nguồn hành vi tùy ý bị chặn. WASM khoảng 6,1 MB và chỉ tải khi mở công cụ.
- **Ranh giới mô phỏng:** các bộ tính có handoff draft riêng; workspace có handoff subset analog; KiCad Eeschema XML có importer passive subset; và có đường nhập PCB IPC-D-356 kết hợp schematic XML chỉ sau khi đối chiếu R/C/L/V. Đây là các luồng giới hạn riêng, không phải chuyển đổi tổng quát mọi schematic/PCB/workspace. PCB viewer vẫn đọc copper/net của board CAD độc lập với dây workspace. Hai miền chỉ nối bằng mapping cụ thể đã xác minh, không suy luận từ tên net gần giống. SPICE không chạy firmware MCU, không thay ERC, không xác nhận mạch thật/an toàn điện. Kết quả phụ thuộc model và giả định khai báo; solver chạy cục bộ trong trình duyệt.
- **Dependency và giấy phép:** thêm `eecircuit-engine@1.8.0` (package khai báo MIT), bản MIT được kèm tại `public/licenses/eecircuit-engine-MIT.txt`. Package chứa engine ngspice WASM; nguồn license ngspice và các thành phần liên quan cần được giữ/đối chiếu trước khi phát hành bản phân phối công khai.
- **ARIA:** calculator gắn `aria-invalid`/`aria-describedby` cho từng trường; lỗi netlist được gắn với editor và thông báo bằng live region; trạng thái chạy solver cũng được thông báo.
- **Kiểm chứng lượt này:** `node --test tests/*.test.mjs` — 261/261; `tsc -b` — đạt; Vite production build — đạt. Regression bao gồm calculator ARIA, validator netlist, packaging WASM, chuẩn hóa tiêu đề Unicode, model diode `D(IS=...)`, giới hạn dataset và lời giải DC. Trên Vite dev server, bộ chia áp cho 2,5 V; RC `.tran` sinh đồ thị với các bước solver thích nghi; ví dụ LED chạy `.op` và trả điểm làm việc. Đã thử `.include` bị chặn và cảnh báo xuất hiện trong cây truy cập. Chưa chạy axe lại toàn bộ route trong lượt này.

## Kiểm tra tiếp nối và số liệu hiện hành — 03/11/2026

- **Số liệu đã đối chiếu lại:** 28 hồ sơ board, 58 mục thư viện linh kiện, 14 viewer board 3D, 4 board có lớp đồng PCB 2D, 15 tệp GLB (14 board và một cảnh lắp ráp). Đây là số asset được tích hợp, không phải số board đã xác minh trên phần cứng.
- **Regression cũ:** các test từng còn kỳ vọng XIAO ESP32-S3 chưa phát hành và các pad của QT Py/Feather/XIAO không chọn được. Assertion đã được sửa theo registry hiện hành: ESP32-S3 DevKitC-1 là tái dựng giáo dục được phát hành nội bộ; các anchor CAD đang có được kiểm tra riêng. Đây là cập nhật kỳ vọng test, không thay đổi trạng thái xác minh của model.
- **Kiểm chứng lượt này:** `npm.cmd test` — 287/287; `npm.cmd run typecheck` — đạt; `npm.cmd run build` — đạt. `node scripts/audit-board-models.mjs` — 14 scene, không thiếu/orphan hotspot; `npm.cmd run audit:spice-engine` — provenance engine/WASM và DC smoke test 2,5 V đạt. Test handoff LDR giải `.op` ở 0%, 25% và 100% rồi so với công thức hiện hành; test render xác nhận nút chỉ mở trên board 3,3 V và quay lại đúng board. Chưa có phép đo board thật, screen reader hoặc thiết bị di động thật; trình duyệt tích hợp không cho phiên này truy cập tab người dùng.
- **Handoff LDR có giới hạn — 03/11/2026:** bài `analog-ldr` có thể mở một netlist `.op` tương đương cho riêng bộ chia áp khi board khai báo mức logic 3,3 V, topology không có lỗi, còn LDR mẫu và điện trở cố định 10 kΩ. Netlist dùng đúng đường cong giáo dục 100 kΩ khi tối → 1 kΩ khi sáng ở mức slider hiện tại. Handoff chặn board 5 V, lỗi mạch, sai bài hoặc trị số điện trở khác; không chuyển nhánh LED, dây canvas, pin MCU hay firmware. Đây không phải tự chuyển workspace tổng quát, hiệu chuẩn LDR, lux hoặc bảo chứng board thật.
- **Workspace → SPICE (subset analog):** đã có compiler/handoff cho các phần tử hỗ trợ khi kết nối và trị số tường minh; kiểm tra loại phần tử, node tham chiếu, topology, giới hạn netlist và firmware/GPIO bị loại trừ. Đây là handoff theo tập con, không phải chuyển tự động mọi workspace. Bài LDR vẫn dùng handoff riêng có giả định cố định.
- **Schematic/net/PCB chưa hợp nhất thành netlist tổng quát:** schematic chia sẻ topology dây của workspace và nay có danh sách nhóm net, bấm net để tô sáng các dây liên quan trong sơ đồ và cảnh lắp 3D. Net là phép gom endpoint theo dây tường minh, không đại diện điện áp/dòng hoặc ERC. PCB 2D vẫn hiển thị copper/net của CAD board; workspace nets không tự vẽ/ghi vào PCB. Chỉ mapping code-to-CAD được xác minh trên một số hồ sơ mới được highlight.

## Net explorer, board references và AVR target — 03/11/2026

- **Schematic/net:** sơ đồ có danh sách nhóm net logic ổn định, liệt kê các chân và dây thành viên; chọn một net sẽ highlight cả nhóm qua sơ đồ và cảnh lắp 2D/3D. Các endpoint không có dây không tạo net hiển thị. Nhãn giao diện nêu rõ đây là topology workspace chứ không phải phân tích điện/PCB.
- **PCB:** viewer nêu rõ net của CAD board độc lập với các dây workspace. Chỉ mapping cụ thể trong manifest được xác minh mới nhận highlight từ bài; không lấy copper geometry làm netlist SPICE.
- **Board evidence:** trang hồ sơ board hiện có mục link tài liệu/nguồn đã khai báo trong profile để mở datasheet, pinout, schematic, CAD và trang hãng/cộng đồng. Nguồn ngoài giúp người review đối chiếu model, không tự xác minh board người dùng cầm. Ảnh cục bộ giữ attribution/license và giới hạn revision ở `docs/reference-image-attribution.md` và khai báo trong `src/data/boards.ts`/`src/data/componentReferences.ts`.
- **Firmware HEX:** AVR8js cho chọn rõ Arduino Uno R3 hoặc Nano classic, cả hai cấu hình ATmega328P 16 MHz/D13→PB5; có link tài liệu board chính hãng và bắt buộc xác nhận HEX đích. Không mở hỗ trợ ESP32, Pico hay STM32 bằng alias; chỉ quan sát subset AVR trong tối đa một giây mô phỏng.
- **SPICE binary:** có sẵn WASM 45.2, nhưng giấy phép/provenance của đúng binary vẫn chưa được xác minh để phát hành công khai. Cài emsdk tái lập trên ổ D bị auto-review chặn do lệnh activation có thể ghi cấu hình ngoài D; không cài toolchain, và không thử đường vòng. Bản `build:local` vẫn dùng artifact đã có; build phát hành tiếp tục fail closed.
- **Giới hạn chưa đóng:** board vật lý cần mẫu/revision và phép đo thật; chưa có người dùng thử hoặc screen reader/điện thoại thật. Community hiện là gói kit chia sẻ thủ công, local-first; chưa có tài khoản/lớp trực tuyến, upload, kiểm duyệt hay đồng bộ. Workspace SPICE không bao phủ mọi linh kiện/bài và không thực thi firmware.

## Hoàn thiện Học tập và Board/Linh kiện — snapshot 02/11/2026, được cập nhật bởi các mục 03/11/2026

- **Ảnh board/linh kiện:** Uno R3, Nano V3, Mega 2560 R3, Raspberry Pi Pico và nay có hai sơ đồ pinout mặt trước/sau XIAO ESP32-C3 cục bộ. Thư viện linh kiện có 17 ảnh: HC-SR04, điện trở, LED đỏ, biến trở, tactile switch, LDR GL5528, tụ gốm, tụ điện hóa, breadboard, NTC, servo, motor DC, relay, diode, transistor, buzzer và dây jumper. Ảnh được ghi nguồn, attribution, giấy phép, thay đổi và giới hạn biến thể; riêng ảnh C3 có notice CC BY-SA 4.0 tại `public/board-reference/seeed-xiao-esp32c3.NOTICE.txt`. Metadata ảnh Commons nằm tại [reference-image-attribution.md](reference-image-attribution.md). Ảnh không chứng minh CAD, BOM hay board clone người học đang cầm là cùng biến thể.
- **Bài IR theo module tham chiếu:** code mẫu, block điều kiện, bộ diễn giải và luồng dây nay thống nhất theo Seeed Grove Infrared Reflective Sensor v1.2 (SKU 101020029): có vật → OUT LOW; không có vật → HIGH. `detected` vẫn là trạng thái ngữ nghĩa “có vật”, tách khỏi mức điện.
- **Phạm vi phần cứng:** tài liệu và giao diện ghi SKU này đã ngừng bán, dùng làm ví dụ có nguồn, không xác nhận module/clone người học đang có. Mức điện OUT, pinout, ngưỡng và tầm phát hiện phải kiểm tra theo đúng revision.
- **Đồng bộ nội dung:** trang bài, code mẫu, block, trạng thái đầu vào ảo, cảnh báo simulator, thẻ thư viện và ghi chú nguồn không còn mô tả active HIGH như hành vi phát hiện của module tham chiếu. Code block của nút/IR lấy từ lesson registry để tránh trôi code lặp.
- **Board và thư viện:** board CAD-only không bật giả pin picking/netlist; mesh package được ghi riêng với CAD footprint và linh kiện generic không mượn nhầm model. Mỗi linh kiện có SVG giáo dục; một số mục có ảnh thật/model 3D phù hợp. Mục chưa có package mesh vẫn hiện footprint và thông tin nguồn.
- **XIAO ESP32-C3:** có pin map D0–D10 theo Seeed, hai sơ đồ pinout, liên kết tới tài liệu hãng và viewer 3D xuất từ PCB KiCad v1.3. Bộ chọn có đủ 68 footprint CAD (67 BOM part + logo graphic), 47 hình khối package KiCad tham khảo; bảng chi tiết linh kiện chép số pad/tên net từ PCB và ghép pinout hãng khi tên net trùng chính xác D0–D10. 14 chân header J1/J2 hiện chọn được trên cảnh 3D và qua bộ chọn truy cập; xem mục 03/11 để biết nguồn tọa độ và phạm vi. Đây không chứng minh luồng điện hay tô lớp đồng. D0/GPIO2, D8/GPIO8, D9/GPIO9 là chân strapping; D3/GPIO5 dùng ADC2. Firmware, mô phỏng và kiểm chứng board thật chưa có. Trang License của Seeed ghi tài liệu sản phẩm, hướng dẫn và ảnh liên quan theo CC BY-SA 4.0, nhưng không nêu riêng archive KiCad; schematic cũng ghi CC BY-SA 4.0. Dự án giữ attribution/share-alike và vẫn ghi rõ phạm vi license của archive cần xác nhận trong NOTICE.
- **Kiểm chứng:** lượt hiện tại: `npm.cmd test` — 241/241; `npm.cmd run typecheck` — đạt; `npm.cmd run build` — đạt; `node scripts/audit-board-models.mjs` — 14 scene (13 board viewer + 1 assembly), `missing=0`, `orphan=0`. Đã kiểm tra trang XIAO C3 trong browser: bảng tra nối đúng các net CAD D0/D4/D10 tới pinout nguồn tương ứng; đây là tra cứu tĩnh, không phải mô phỏng. Chưa xác minh hình học, pinout và hoạt động trên board/module vật lý.
- **Còn phụ thuộc bên ngoài:** đối chiếu board/module vật lý và board clone người học sở hữu; model CAD chính xác cho board chưa có nguồn/tác phẩm được cấp phép; người duyệt nội dung an toàn trước phát hành. Chủ dự án chấp nhận share-alike; ảnh/model CC BY-SA vẫn phải giữ attribution và giấy phép tương thích. Việc chấp nhận share-alike không xác nhận rằng một archive không ghi license riêng được phép phân phối. Tên SKU đã chọn không làm model generic thành CAD hoặc mô phỏng điện chính xác.

## Bổ sung model Seeed XIAO ESP32-S3 — 02/11/2026

- **Đã thêm:** board tham chiếu riêng cho Seeed Studio XIAO ESP32-S3 bản thường, kèm viewer GLB chuyển đổi từ STEP v2, render CAD hai mặt, ảnh/thông số/tài liệu và liên kết tới hồ sơ Board & Linh kiện. Attribution và CC BY-SA 4.0 nằm cạnh asset; script chuyển đổi và hash nguồn/model được lưu để có thể tái tạo.
- **Mức nhận diện:** hình học thân PCB, shield và đầu nối U.FL được đặt tên khi nguồn CAD ghi tên tương ứng; các hình học khác gom vào nhóm chưa định danh. Không tự gán reference designator, BOM, pin anchor hay net.
- **Kiểm tra hiện tại:** danh mục có 28 board, 58 linh kiện; 13 board có viewer CAD 3D và 4 có lớp đồng PCB 2D; `public/models/` có 14 GLB (13 board + một assembly). Số đếm được đối chiếu với registry, thư mục asset và audit.
- **Còn giới hạn:** một số viewer board cho phép chọn header và tra dữ liệu tĩnh, nhưng chưa tạo netlist MCU, tô copper theo mạch/code, mô phỏng điện/firmware hoặc xác minh board thật. ESP32 DevKit clone 30 chân, XIAO ESP32-C3, QT Py #5405, Feather #5323/#5483 và Pico family có khả năng tra cứu chân với nguồn/giới hạn ghi riêng; các board khác vẫn theo trạng thái manifest. Không dùng XIAO model cho bản Sense/Plus.
- **Nguồn/giấy phép:** [model Seeed Studio trên Printables, CC BY-SA 4.0](https://www.printables.com/model/1344060-3d-model-for-seeed-studio-xiao-esp32-s3), [tài liệu Seeed](https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/), ghi chú đầy đủ tại `assets/boards/vendor/seeed-xiao-esp32s3/SOURCE.md` và `public/models/seeed-xiao-esp32-s3.NOTICE.txt`.

## Nguồn ảnh board và mã module cụ thể — 02/11/2026

- Thêm [shortlist ảnh board hai mặt và mã module tham chiếu](board-photo-and-module-reference-shortlist.md). Các URL ảnh ngoài trang hãng chỉ là link tra cứu, không được sao chép vào `public/`; từng link phân biệt board/revision và clone.
- Hồ sơ `/components` bổ sung nguồn có SKU/biến thể cụ thể cho Grove IR reflective 101020029, Grove Relay 103020005, Grove MOSFET 103020008, Adafruit OLED #326, TB6612 breakout #2448, Pololu buck #2843, Pololu boost #4941, TowerPro SG90 Digital và Grove LCD RGB V5.
- Đây là nguồn tham chiếu cho nội dung, không nâng cấp mức mô phỏng thành phân tích điện. Lựa chọn module miễn phí và giới hạn bài nguồn/relay ở tải thấp áp đã được chủ dự án chấp thuận. Bài Grove IR đã đổi sang active-LOW; xem trạng thái mới nhất ở đầu file.
- **Kiểm tra tại thời điểm ghi nhật ký:** `npm.cmd test` 225/225; `npm.cmd run typecheck` và `npm.cmd run build` đạt. Không thêm dependency, không tải ảnh/mesh ngoài repo.

## Hoàn thiện lát tiếp theo: model, nguồn, vùng chạm — 02/11/2026

Snapshot tại thời điểm ghi ngày 02/11/2026; trạng thái mới hơn và số liệu hiện tại nằm ở các mục đầu tài liệu.

- **Tối ưu GLB:** `scripts/optimize-board-glb.mjs` gộp primitive theo material, không đổi đỉnh, tên node, transform hay material. Script chỉ ghi file khi từng node giữ đúng tập tam giác so với bản gốc. Uno 10,3 → 6,3 MB, 10.507 → 91 primitive; Mega 16,6 → 9,7 MB, 17.694 → 106; Nano 5,9 → 3,5 MB; ESP32 2,4 → 1,4 MB; cảnh lắp ESP32 2,7 → 1,7 MB. Bản gốc ở `assets/boards/unoptimized-glb/`. Không cần dependency hay nén Draco/meshopt, vì `glbParser` không đọc các định dạng đó.
- **Nhãn bằng chứng:** `physicalVerified` đổi thành `sourceBacked`, `3d-verified` đổi thành `cad-reference`. Hai tên cũ nói như đã đo trên board thật, trong khi bằng chứng chỉ là tài liệu và CAD.
- **Nguồn:** thêm datasheet cho AM2302, SSD1306, WS2812B, PCF8574, HD44780, 1N4148, 1N4001–1N4007 và tài liệu module HC-SR04. Các link trả về PDF khi kiểm tra ngày 02/11/2026; chưa đọc đối chiếu từng thông số. IRLZ44N, LM393, LM2596 chỉ là ví dụ, không nâng mức nguồn.
- **Học tập:** mọi lỗi mạch có gợi ý sửa. Bài tiếp theo giữ board đang chọn. Trang LED có link thực hành trên board tham khảo nếu phòng thử hỗ trợ. Thư viện linh kiện liệt kê bài dùng linh kiện, đọc từ mạch mẫu.

## Tiếp tục hoàn thiện Học tập và Board/Linh kiện — 02/11/2026

- **Rà soát phát hiện:** bảng board XIAO ESP32-C3 đã thực sự ghép net CAD D0–D10 với pinout Seeed khi tên net trùng chính xác, nhưng panel bằng chứng và tài liệu cũ vẫn nói chưa có liên kết. Điều đó khiến giao diện tự mâu thuẫn.
- **Đã sửa:** giải thích trong panel model và trang board rằng đây là tra cứu tĩnh theo tên net chính xác; các net khác không suy ra pinout. Bổ sung ghi chú kiểm thử để ngăn tài liệu/code quay lại mô tả lỗi thời. Không gọi đây là pad picking, net highlighting hay xác nhận kết nối điện.
- **Rà nguồn GitHub:** `21km43/ESP32-C3-DevBoard` có PCB/Schematic và 3D nhưng là board riêng dùng ESP32-C3-WROOM-02, README không công bố license; không sao chép. `ded811/ESP32-C3-Super-Mini-Kicad` là redesign CC BY 4.0 có đổi anten/matching network; không gắn nhãn như model Super Mini thương mại chung. Ghi quyết định trong `docs/board-model-sourcing.md`.
- **Kiểm tra lượt này:** test regression mới tái hiện mâu thuẫn trước khi sửa; full suite 241 test, typecheck, build và audit model đều đạt. Browser trang `/boards?board=seeed-xiao-esp32c3&feature=cad-u4` hiển thị 33 pad U4; D0/GPIO2, D4/GPIO6-SDA và D10/GPIO10-MOSI được đối chiếu ở các dòng chính xác. Đây là kiểm tra UI/CAD nguồn, chưa thử trên board vật lý.
- **Còn phụ thuộc:** archive Seeed KiCad không có LICENSE riêng dù schematic ghi CC BY-SA 4.0; user chấp thuận share-alike cho nguồn đã cấp phép, nhưng archive-specific redistribution rights vẫn cần được nhà phát hành xác nhận trước khi phát hành model này ra ngoài dự án. Kiểm tra board/revision thực tế và ảnh hai mặt vẫn chưa có.
- **Hình minh họa:** chọn theo loại linh kiện. OLED, LCD không còn mượn hình LED; module ánh sáng, driver motor không còn mượn hình điện trở, motor. Thêm hình dây, breadboard, nguồn, ghi rõ là minh họa giáo dục.
- **Kiểm tra:** npm.cmd test 223/223; typecheck, `npm.cmd run build`, npm audit --omit=dev đạt; audit-board-models 11 scene, missing=0. Axe trên bản build: 11 route x 3 khổ, 33 lượt, 0 node, 0 tràn ngang. Chưa thử thiết bị thật, cảm ứng, screen reader, phần cứng.
- **375 px:** rule 44 px đặt một chỗ trong `app.css`. Nút trong canvas và chấm trên cảnh 3D là ngoại lệ, có điều khiển tương đương ngoài canvas.

## Lượt hoàn thiện Học tập và Board & Linh kiện — 02/11/2026

Snapshot tại thời điểm ghi ngày 02/11/2026; nội dung được giữ làm lịch sử thay đổi. Trạng thái mới hơn nằm ở các mục đầu tài liệu. Đề xuất dài hạn ở [learning-board-upgrade-proposal.md](learning-board-upgrade-proposal.md).

- **Mức nguồn linh kiện:** cả 55 mục có link, nhưng chỉ 15 mục có nguồn đúng sản phẩm hoặc chip. 40 mục còn lại là "Hướng dẫn chung". Danh mục không còn dùng nhãn "Có tài liệu" cho mọi link.
- **Chuỗi học:** mọi bài có danh sách bài nên học trước, chỉ khuyên, không khóa. Bài LED có link bài tiếp theo. Phòng thử có nút tự đánh dấu hoàn thành ở bước chạy.
- **Danh sách linh kiện:** `/projects` và mục "Bạn cần" trong phòng thử lấy từ mạch mẫu, nên không còn id thô và không còn thiếu điện trở của LED.
- **Dữ liệu cũ:** workspace LDR lưu trước khi có trường `value` vẫn hiện 10 kΩ. Mục checklist không còn tồn tại không làm sai bộ đếm; dữ liệu cũ không bị xóa.
- **Nhãn:** phần mô tả ESP32 không có nguồn riêng mang nhãn "Mô tả giáo dục". Ghi công và tên giấy phép trong evidence panel đã chuyển sang tiếng Việt.
- **Asset:** hai model Feather dùng hash GLB trong URL. `src/data/board-asset-lock.json` khóa hash, phiên bản và dung lượng của 11 scene; GLB đổi mà không cập nhật lock thì test fail.
- **Toàn vẹn dữ liệu:** `tests/data-integrity.test.mjs` kiểm tra board, nguồn, hotspot, bài học, asset.
- **Kiểm tra:** npm.cmd test 211/211; typecheck, production build và npm audit --omit=dev đạt; audit-board-models 11 scene, missing=0. Axe trên bản build: 10 route x 4 khổ, 40 lượt, 0 node, 0 tràn ngang, chỉ phủ trạng thái mặc định. Chưa thử thiết bị thật, screen reader, phần cứng, người học thật.

## Snapshot lịch sử: Rà soát Học tập và Board & Linh kiện — 02/11/2026

Số liệu dưới đây phản ánh thời điểm ghi snapshot này: 11 bài; 27 hồ sơ board; 11 viewer board 3D; 4 viewer lớp đồng PCB 2D; 21 board profile trong phòng thử; 56 mục `/components`; 27 loại linh kiện trong palette; 4 ảnh board và 17 ảnh tham khảo linh kiện. Trạng thái mới hơn nằm ở các mục đầu tài liệu.

- **CTA học tập:** `getLearningResume` có bốn trạng thái: mới, đang học, bài tiếp theo, đã tự đánh dấu hết. CTA mở trang vào bài, vì chỉ ở đó mới đánh dấu hoàn thành được. `/app` và `/topics` dùng chung tiến độ. Mốc "Bắt đầu từ đây" chỉ hiện với người chưa có tiến độ.
- **Tiến độ:** xem board khác qua `/learn/esp32-led?board=...` không còn ghi là đã mở bài LED.
- **Board tham chiếu:** trang bài LED báo ở đầu trang rằng bài, chân, code và mô phỏng vẫn dành cho ESP32. Panel không hiện linh kiện ESP32 khi đang xem board khác. Liên kết từ thư viện dẫn về `/boards?board=...`, không dẫn vào bài LED.
- **Deep link:** `/boards?board=` giữ đúng board, kể cả board chỉ có dữ liệu tra cứu; `feature` và `view` nằm trong URL. Id lạ ở `/boards`, `/components`, trang bài và preflight được báo rõ.
- **Hồ sơ board:** mọi board có bảng thông số và ba dòng năng lực (mô hình, pinout, phòng thử), lấy từ dữ liệu riêng của từng mặt.
- **Pico 2/Pico 2 H:** bổ sung lại profile catalog còn thiếu cho Pico 2 (đã có GLB từ trước) và thêm Pico 2 H/SC1632 với viewer GLB từ STEP chính hãng. Hai profile tách rõ board không header và board có header hàn sẵn, link tải source CAD, tài liệu hãng và notice license riêng cho H. Cả hai chỉ là CAD tham chiếu; pin picking, netlist, mô phỏng và firmware vẫn tắt. Tài liệu hãng cảnh báo model chỉ hướng dẫn và cần đo board vật lý cho fit-check.
- **Nhãn:** `getFeatureEvidence` tách nguồn nhận dạng khỏi hình khối: "Có nguồn CAD", "Chưa xác minh chức năng", "Có mesh 3D", "Footprint/pad, không có mesh", "Mesh chưa định danh". Linh kiện thụ động Feather không còn được tính là đã xác minh vai trò. Số đếm lấy từ inventory: #5483 37/54, 17 không có mesh; #5323 33/47, 14 không có mesh.
- **Định danh linh kiện:** thêm `ir-obstacle`, `rgb-led`, `dc-supply`, `slide-switch`. Cảm biến IR, LED RGB 4 chân và nguồn DC không còn trỏ vào module ánh sáng, WS2812B và sạc dự phòng. Mục chỉ có model khi `catalogId` khớp, nên tụ gốm không còn mượn mesh tụ phân cực. Mô tả mới không gắn tài liệu nguồn và hiện "Thiếu tài liệu".
- **Preflight:** HC-SR04 ghi nguồn 5 V của module, không còn lấy theo mức logic 3,3 V. Bài LDR tách điện trở 10 kΩ. Link board theo đúng board đang chọn.
- **Model:** viewer có giới hạn tải 60 giây, xử lý mất WebGL và tự mở lại, bỏ qua chuột phải và con trỏ phụ. Evidence panel có link tệp ghi công và giấy phép cho Adafruit và Raspberry Pi. Trang bài LED nay hiện đúng hồ sơ nguồn ESP32.
- **Điều khoản:** QT Py ghi STEP theo CC BY-SA 2.5, còn #5323 và #5483 ghi MIT, dù cùng kho `Adafruit_CAD_Parts`. Thư mục #5483 trên GitHub không hiện license riêng. Chưa xác nhận được lý do khác nhau; cần chủ dự án đối chiếu trước khi phát hành.
- **Kiểm tra trước khi thêm Pico 2 H:** npm.cmd test 192/192; typecheck, production build và npm audit --omit=dev đạt; audit-board-models 11 scene, missing=0. Axe trên bản build: 13 route x 4 khổ, 52 lượt, 0 node, 0 tràn ngang, chỉ phủ trạng thái mặc định của các route đó. Kết quả sau lát Pico 2 H được ghi ở mục mới nhất bên dưới.
- **Chưa làm:** phần bằng chứng trong evidence panel vẫn bằng tiếng Anh; đo mốc timeout 60 giây; thiết bị thật, cảm ứng, screen reader, người học thật, đối chiếu board vật lý.

### Bổ sung Raspberry Pi Pico 2 H — 02/11/2026

- **Nguồn:** Raspberry Pi PIP cho Pico 2 H/SC1632 cung cấp archive STEP cập nhật. ZIP 2,290,425 byte; SHA-256 `024de65032d37f0ef55e0f11611ae67f85fd0cb5a3f79d2841440a7740f967e7`. STEP 12,821,674 byte; SHA-256 `e1d6614bd8e5bb94aae2eef9452be244da56d48f4f1c363e71f19eff1fe69d4f`. Archive và STEP gốc được giữ cùng license/disclaimer.
- **Viewer:** STEP được chuyển thành GLB nội bộ 3.78 MiB, 433 mesh/55 nhóm chọn; GLB SHA-256 `b3ce57f26b5267be6d64ff899846b8c6db2bccb4c5186434317870e48e94395a`. Mô hình riêng cho Pico 2 H có header hàn sẵn; không dùng thay Pico 2 không header hoặc Pico 2 W.
- **Tích hợp Học tập và thư viện:** profile xuất hiện trong danh sách board ở `/boards` và bộ chọn CAD tham khảo ở trang bài; `/components?component=rp2350-pico-2-h` có mục board, nguồn sản phẩm, tài liệu pinout và giới hạn. Model notice ghi attribution, MIT, disclaimer, hash source và quy trình chuyển đổi.
- **Giới hạn:** CAD không có netlist/BOM đủ để xác nhận từng chức năng; chưa bật pin picking, pin map, lớp đồng PCB, simulator hay firmware. Theo disclaimer của hãng, model là hướng dẫn và cần đo board thật cho fit-check. Đây không phải xác nhận vật lý.
- **Kiểm chứng lát này:** kết quả test/typecheck/build/audit và thao tác browser được ghi lại sau khi chạy ở cuối mục; chưa có phép đo phần cứng thật.

## Rà soát tiếp: học tập và board/linh kiện — 02/11/2026

- **Học tập:** khi mọi bài đều được người học tự đánh dấu hoàn thành, CTA dashboard quay về lộ trình để xem lại; không đề xuất tiếp tục bài cuối đã hoàn tất. Đây vẫn là tự khai báo trên thiết bị, không xác minh năng lực.
- **Board:** danh mục hiện có 26 hồ sơ board, 10 viewer board CAD 3D và 4 lớp đồng PCB 2D. Thêm Adafruit Feather ESP32-S3 TFT đúng PID #5483 (4 MB flash + 2 MB PSRAM) theo STEP và Eagle CAD chính hãng. Có 37/54 designator ghép mesh; 17 footprint không có khối 3D và 114 mesh chưa định danh được trình bày riêng. U6 ESP32-S3-MINI-1 không có mesh STEP ghép được, không dựng vỏ giả.
- **Tối ưu asset:** bộ chuyển QT Py #5405 trước đây lặp toàn bộ vertex/normal buffer theo từng mặt STEP, khiến GLB nặng 76.5 MiB. Gom các mặt chung màu bằng helper hiện có, giữ nguyên tọa độ, face index, màu, mapping và nguồn geometry; GLB mới 762,424 byte (~0.73 MiB). Regression kiểm tra kích thước dưới 20 MiB.
- **Thư viện:** 51 mục linh kiện/board catalog. Ba board Adafruit đều được phân biệt bằng PID/revision và ở chế độ CAD preview; QT Py #5405 và Feather #5323/#5483 cho chọn pad breakout để tra cứu tĩnh. Chưa có netlist, net/copper highlighting hoặc simulator. Các mesh không có bằng chứng nguồn vẫn là “chưa định danh”.
- **Nguồn miễn phí/điều khoản:** Feather TFT #5483 dùng STEP trong kho Adafruit CAD Parts (MIT) và board placement/README theo CC BY-SA 3.0; file license, README và attribution được bundling cạnh CAD/GLB. Không phát sinh phí nguồn.
- **Giới hạn còn lại:** chưa đối chiếu mẫu board vật lý, chưa có review người học, chưa kiểm thử cảm ứng/screen reader trong phiên này. Board preview không được tính là mô phỏng hoặc xác minh pinout; vẫn cần đúng revision ngoài đời để xác nhận hình học và lắp thực tế.

## Liên kết học tập ↔ thư viện và board Adafruit — 02/11/2026

- **Học tập:** checklist vật tư trên trang chuẩn bị bài giờ dẫn thẳng tới đúng mục trong `/components` (kèm nguồn/datasheet nếu có); trang linh kiện chấp nhận deep link `?component=<id>` và giữ mục được chọn trong URL. ID vật tư bài học được ánh xạ qua `componentRegistry`, ví dụ `ultrasonic` → `hc-sr04`, không suy đoán từ chuỗi tên.
- **Board:** thêm viewer nội bộ Adafruit QT Py ESP32-C3 Rev B #5405 từ STEP và Eagle CAD của đúng thiết kế. Có 35 nhóm mesh gắn designator, 75 nhóm không ánh xạ được vẫn để “chưa định danh”. Source STEP, board CAD, schematic, pinout, attribution và license được giữ kèm. Board ở trạng thái preview; 14 pad JP1/JP3 hiện được chọn để tra cứu tĩnh, chưa có net coloring, pin MCU hoặc firmware simulation.
- **Board bổ sung:** thêm Feather ESP32-S3 đúng PID #5323 (8 MB flash, không PSRAM) từ STEP và Eagle CAD chính hãng. Có 33/47 designator khớp mesh; 14 footprint vẫn tra được dù thiếu mesh, 129 mesh không khớp còn tách biệt là chưa định danh. README/CC BY-SA 3.0, MIT, source STEP/CAD/schematic được lưu cùng public viewer. Board ở preview; 28 pad JP1/JP3 được chọn để tra cứu tĩnh, chưa tạo netlist/tô copper/simulator. U4/BME280 là footprint dự phòng, không phải cảm biến gắn sẵn.
- **Board bổ sung tiếp:** Feather ESP32-S3 TFT đúng PID #5483 (4 MB flash + 2 MB PSRAM) có STEP/Eagle CAD chính hãng; 37/54 designator khớp mesh, 17 footprint thiếu mesh và 114 mesh còn chưa định danh. Không có mesh STEP ghép cho U6 MCU; viewer không tạo model thay thế.
- **Nguồn/điều khoản:** model board STEP CC BY-SA 2.5; Eagle board CAD/README CC BY-SA 3.0; kho CAD parts có MIT license. Viewer kèm attribution, notices và thay đổi. Người dùng đã chấp nhận các điều khoản nguồn miễn phí; đây không thay cho đánh giá pháp lý phát hành thương mại hoặc xác nhận nhãn hiệu.
- **Danh mục hiện tại:** 26 hồ sơ trong thư viện `/boards`, 10 viewer board 3D, 4 viewer lớp đồng PCB 2D; simulator có 21 board profile và 51 mục `/components`. Số hồ sơ không hàm ý cùng mức xác minh hay hỗ trợ mô phỏng.
- **Kiểm tra lượt này:** 171/171 test, typecheck, production build và audit board-model đều đạt. Đã mở `/boards?board=adafruit-feather-esp32-s3-tft-5483` và `/components?component=adafruit-feather-esp32-s3-tft-5483` trong browser; route và thông tin nguồn/license hiển thị đúng. Đây là xác nhận giao diện/trạng thái truy cập, không phải kiểm định phần cứng.
- **Kiểm tra lượt này:** `npm.cmd test` — 168/168 đạt; `npm.cmd run typecheck` — exit 0; `npm.cmd run build` — exit 0 (191 modules); `node scripts/audit-board-models.mjs` — 10 scene, không thiếu node hotspot; GET `/boards`, `/components?component=adafruit-feather-esp32-s3-5323`, và `/learn/esp32-led?board=adafruit-feather-esp32-s3-5323` đều trả 200. Trình duyệt automation không điều khiển được tab trong phiên này, nên chưa xác nhận bằng quan sát trực quan hay board vật lý.
- **Còn thiếu:** phần lớn module breakout vẫn là model tham số; nhiều nguồn linh kiện chỉ áp dụng cho chip hoặc họ sản phẩm, không xác nhận pinout breakout. QT Py còn 75 mesh chưa định danh; Feather #5323 còn 129 mesh chưa định danh và 14 footprint không có mesh; Feather TFT #5483 còn 114 mesh chưa định danh, 17 footprint thiếu mesh và không có model MCU U6. Chưa so board với mẫu vật lý. Người học thật, keyboard/screen-reader, mobile thật và hardware validation còn chờ.

## Tiến độ học cục bộ — 02/11/2026

- **Đã làm:** `src/lib/learningProgress.ts` ghi nhận bài đã bắt đầu và trạng thái tự xác nhận hoàn thành riêng, đồng thời đọc/migrate dữ liệu `lastLessonId` cũ. `LessonProgressToggle` dùng ở trang bài LED và trang chuẩn bị 10 bài còn lại. Dashboard và lộ trình phân biệt chưa bắt đầu, đã bắt đầu, đang học và tự xác nhận hoàn thành.
- **Tiếp tục học:** nếu bài vừa mở chưa hoàn thành thì quay lại bài đó; nếu đã tự xác nhận hoàn thành thì gợi ý bài chưa hoàn thành tiếp theo theo thứ tự lộ trình; khi chưa có tiến độ, giữ CTA vào bài LED chi tiết. Khi mọi bài đã được tự xác nhận, CTA về lộ trình.
- **Ranh giới:** tiến độ chỉ ở localStorage của trình duyệt này. Hoàn thành do người học tự đánh dấu; không phải chấm điểm, đánh giá năng lực, đồng bộ tài khoản hay xác nhận đã chạy phần cứng.
- **Kiểm tra:** `npm.cmd test` — 158/158 đạt; `npm.cmd run typecheck` — exit 0; `npm.cmd run build` — exit 0 (186 modules). `tests/learning-flow.test.mjs` có kiểm tra migration, tự đánh dấu/bỏ đánh dấu và gợi ý bài tiếp tục.
- **Chưa kiểm tra:** thao tác UI trực tiếp trong browser ở lượt này; CUA không truy cập được browser người dùng trong phiên. Chưa có thử nghiệm với người học thật hoặc lưu tiến độ qua nhiều thiết bị.

## Chuyển view thư viện board — 02/11/2026

- **Lỗi:** trạng thái PCB 2D có thể còn giữ khi người dùng chọn board khác chỉ có viewer 3D, khiến trang thử mount viewer đồng không có dữ liệu cho board đó.
- **Sửa:** `getBoardCatalogView` chỉ cho phép lớp đồng PCB với Uno R3, Nano classic, Mega 2560 R3 và ESP32 DevKit; board không hỗ trợ và ID lạ luôn quay về 3D. Chọn board mới cũng reset góc nhìn về 3D và xóa feature hover/selection cũ.
- **Kiểm tra:** `tests/board-catalog.test.mjs` bao phủ bốn board có dữ liệu đồng, Pico/Nucleo không có và board ID lạ. Toàn bộ sau thay đổi: `npm.cmd test` — 160/160 đạt; `npm.cmd run typecheck` — exit 0; `npm.cmd run build` — exit 0 (187 modules). Chưa chạy thao tác giao diện trực tiếp trong browser.

## Rà định danh linh kiện — 02/11/2026

- **Lỗi:** thẻ công tắc hành trình dùng ID `ultrasonic`, nên panel mô hình có thể mô tả nhầm thành HC-SR04; module MOSFET mang ID `relay-module`; nút nhấn bị xếp trong nhóm cảm biến.
- **Sửa:** dùng `limit-switch` với các chân COM/NO/NC và loại rõ là đầu vào; ID module MOSFET đổi thành `mosfet-module`; nút nhấn xếp vào nhóm đầu vào. Registry có hồ sơ công tắc hành trình ở mức minh họa tham số, `visual-only`, không gán mã sản phẩm hay hành vi điện.
- **Kiểm tra:** `tests/component-catalog.test.mjs` xác nhận danh tính HC-SR04/công tắc hành trình, map chân riêng, module MOSFET không bị gọi nhầm relay và ID registry/catalog không trùng. Sau cả hai lát cắt Board + linh kiện: `npm.cmd test` — 163/163 đạt; `npm.cmd run typecheck` — exit 0; `npm.cmd run build` — exit 0 (187 modules).
  - **Còn thiếu:** nguồn datasheet cho một công tắc hành trình cụ thể, mô phỏng tiếp điểm và mapping sang builder; mesh tham số hiện có chỉ minh họa microswitch chung, không phải model sản phẩm.

## Độ phủ model board và linh kiện — 02/11/2026

- **Đã bổ sung:** hai mesh GLB tham số cho palette builder: NTC dạng hạt epoxy 2 chân và công tắc hành trình dạng microswitch 3 tiếp điểm. Mỗi model hiển thị ghi chú riêng; không gắn mã part, đặc tuyến NTC, lực nhấn hay hành trình cơ học chưa xác minh.
  - **Độ phủ hiện tại:** 27/27 loại linh kiện vật lý trong palette builder có mesh GLB; `board` dùng viewer board riêng. Tổng manifest có 37 mesh GLB, gồm 10 hình học tham số bổ sung cho catalog: DHT22, PIR, module LDR, đầu dò đất, MPU6050, BMP280, đầu thu IR, LCD1602, encoder xoay và RC522. Mesh CAD KiCad và mesh tham số do dự án tự dựng vẫn được phân biệt; model tham số không xác nhận một mã sản phẩm hay pinout thực.
- **Nghiên cứu nguồn:** KiCad Packages3D phù hợp cho package chuẩn CC BY-SA; Raspberry Pi công bố STEP và quyền phân phối thiết kế Pico; Espressif KiCad library hữu ích đối chiếu footprint/pinout nhưng không phải assembly 3D đầy đủ; Wokwi Elements MIT cung cấp web components presentation chứ không phải mesh 3D.
- **Board mới:** không phát hành thêm board chuẩn trong lượt này vì S3 DevKitC-1 và NUCLEO-F401RE dẫn xuất còn thiếu xác nhận quyền tái phân phối; footprint library đơn lẻ cũng không chứng minh vị trí/độ phủ linh kiện trên board. Blue Pill cộng đồng vẫn là biến thể, không phải model chuẩn phổ quát.
  - **Nguồn chi tiết và backlog:** [board-model-sourcing.md](board-model-sourcing.md), [component-model-registry.md](component-model-registry.md). Còn thiếu: quyền/attribution được chủ dự án duyệt, mesh cho module logic-level/dây/kits và CAD/placement hợp pháp cho board MCU mới, cùng xác minh với revision phần cứng thực.

## Sửa bố trí lắp mạch 3D — 01/11/2026

- **Lỗi đã tái hiện:** ở `/build?lesson=blink&guided=1`, ESP32, 1024×768, LED và điện trở nằm ngoài breadboard, dây dừng giữa thân linh kiện. Nguyên nhân: 3D dùng thẳng tọa độ % của canvas 2D, phóng to linh kiện, đặt model theo đáy chân, và model breadboard sai khoảng cách giữa hai nửa.
- **Bố trí mới:** `src/lib/assemblyLayout.ts` xếp linh kiện lên lưới lỗ từ topology. Chân lấy từ footprint KiCad, các chân chỉ chung một dải khi cùng net, thân linh kiện không chồng nhau, mọi linh kiện giữ đúng tỉ lệ. Board đặt cạnh breadboard. Bài không có breadboard xếp trên bàn. Mọi phép biến đổi đi qua `localToWorld` và `placementMatrix`.
- **Đầu dây:** kết thúc ở lỗ cùng dải với chân, hoặc ở pad CAD của board. Uno, Nano, Mega lấy từ `src/data/board-pin-anchors.json`, sinh bằng `scripts/export-board-pin-anchors.mjs`. ESP32 theo pad GPIO trong model. Pico chưa có dữ liệu pad nên là minh họa.
- **Vị trí 3D độc lập với 2D:** lưu trong `part.assembly`, đi cùng workspace và project. Project cũ tự xếp. Giá trị hỏng trong tệp nhập bị bỏ qua.
- **Tin cậy:** từng model tải riêng, có giới hạn 30 giây và hủy được; lỗi tải hoặc sai định dạng chuyển sang khối thay thế có nhãn và nút thử lại. Mất WebGL có thông báo riêng và tự dựng lại.
- **Tương tác:** kéo có preview và giữ điểm nắm; bỏ qua chuột phải và con trỏ phụ. Có bốn nút di chuyển từng lỗ và nút xếp lại tự động. Chấm trên cảnh là nút thật có tên.
- **Kiểm tra:** axe (WCAG 2.0-2.2 AA, best-practice) trên 5 route x 2 view (3D, sơ đồ) x 4 khổ, 40 lượt, bản cuối: 0 node. Chỉ phủ các route và trạng thái mặc định đã quét. Thiết bị thật và screen reader chưa thử.
- **Chưa làm:** Pico chưa có pad; linh kiện chưa đối chiếu với vật thật; PCB chưa liên kết.

## Cảnh lắp mạch 3D — 01/11/2026

- **Hành vi:** view "Lắp mạch · 3D" dựng cảnh WebGL thật từ GLB board và linh kiện (`AssemblyStage`, `AssemblyScene`). Chọn được linh kiện bằng chuột, bằng chấm trên cảnh, bằng thẻ callout, hoặc bằng danh sách dùng được với bàn phím. Với board có model, chọn được cả linh kiện trên board. Panel chỉ hiện các tab có dữ liệu: tổng quan, chân và nối, ví dụ code, lưu ý, nguồn model.
- **Mức trung thực của model:** `src/lib/assemblyLayout.ts` phân loại CAD board, mesh KiCad, mesh tham số và khối thay thế; panel và ghi chú dưới cảnh hiện đúng loại. Mục này đã được thay bởi phần sửa bố trí ở trên.
- **Luồng logic:** `getLogicFlow` trong `src/lib/logicTrace.ts` gắn nhãn HIGH, LOW, GND, Nguồn, TRIG, ECHO và phần trăm analog. Chỉ có hướng khi bài học xác định được. Bài khái niệm chỉ tô nhóm dây theo bước. Đây là logic minh họa, không phải dòng điện hay điện áp.
- **Đồng bộ:** chọn linh kiện và tô net dùng chung cho view lắp mạch 2D, sơ đồ và 3D. View PCB chưa liên kết và giao diện có ghi rõ.
- **Dự phòng:** model lỗi tải thành khối xám kèm cảnh báo; không có WebGL 2 hoặc mất context thì quay về khối CSS cũ; board chưa có model dùng khối thay thế.
- **Kiến trúc:** không thêm dependency. Dùng lại `glbParser`, tách toán 3D sang `src/components/board/sceneMath.ts`. Xem lý do ở `docs/assembly-3d-decision.md`.
- **Giới hạn:** nhãn chân 3V3 của board trong workspace vẫn là nhãn chung, kể cả trên Uno 5 V.

## Builder, preflight và model — 01/11/2026

- **Target size:** chân, nút xóa và nút xoay trên canvas 2D, sơ đồ và 3D chuyển vào bảng "Chân và thao tác của linh kiện" (`BuilderPinPanel`), mọi nút tối thiểu 44 px. Chân vẽ trên canvas còn là lối tắt cho chuột, không phải control, nên dùng ngoại lệ "control tương đương" của WCAG 2.5.8. Sơ đồ bỏ mã nội bộ của linh kiện, vốn gây lỗi tương phản.
- **Trace:** `src/lib/logicTrace.ts` thay `isLogicWireActive`, tính từ net và loại linh kiện, không dùng ID preset. Trace chỉ cho biết dây nào nối chung với phần đang được điều khiển, không phải dòng điện. `source-led` nay chỉ tô khi LED bật, giống `blink`.
- **Preflight:** `/learn/:lessonId` và `/app/learn/:lessonId` cho 10 bài (`LessonPreflightPage`, `src/lib/lessonPreflight.ts`). Mạch mẫu chuyển sang `src/data/lessonCircuits.ts`. Bài LED giữ trang dài `/learn/esp32-led`. Link `/build?lesson=...` giữ nguyên.
- **Model board:** xem `docs/board-model-sourcing.md`. Ba GLB Pico được sửa lỗi soi gương. Không thêm board mới.
  - **Model linh kiện:** 37 GLB, gồm 27 model cho palette builder và 10 model tham số cho các mục catalog, xem `docs/component-model-registry.md`.
- **Audit hình học:** `node scripts/audit-board-models.mjs` kiểm tra tên node thật thay vì chỉ kiểm tra có hotspot; hiện xác nhận 87 footprint Uno, 19 Nano và 33 Mega không có mesh 3D. `pinsOutside=n/a` ở board tắt pin picking, tránh cảnh báo giả. Đây là thống kê hình học, không xác nhận vị trí đúng với board vật lý.
- **Axe (bộ luật WCAG 2.0–2.2 AA và best-practice), trình duyệt trong app, iframe cùng origin:** builder 4 route × 3 view × 4 khổ (375/768/1024/1280). Trước sửa 903 node: 803 `target-size`, 100 `color-contrast`. Sau sửa 0 node. Thêm 11 route × 4 khổ (lộ trình, preflight, linh kiện, board, bài LED): 0 node, 0 tràn ngang. Axe không tự xét chân canvas vì chúng không còn là control; việc đáp ứng WCAG 2.5.8 ở đó dựa vào bảng chân tương đương.
- **Chưa làm:** kiểm tra thiết bị thật; đối chiếu model với linh kiện thật.

## Luồng học cho người mới — 01/11/2026

- **Vấn đề:** người mới thấy 11 thẻ phẳng, bài nhập môn đứng thứ 8; `/app/learn` không có link bài nào; trang bài LED chỉ có nút thực hành ở cuối trang (y≈6862); phòng thử không hiện mục tiêu bài và không cho biết một chân nối với đâu.
- **Đã làm:** lộ trình 4 chặng ở `/app` và `/topics` (`src/data/learningPath.ts`, `src/components/LearningPath.tsx`); tóm tắt và thanh nhảy mục ở bài LED; tóm tắt mục tiêu, trạng thái mạch và danh sách "Nối với" ở phòng thử (`BuilderLessonBrief`, `getCircuitStatus`, `src/lib/circuitNets.ts`). Khối "Project của bạn" chuyển xuống dưới để stepper lên sớm hơn.
- **Ranh giới:** không thêm đồng hồ đo vì chưa có provider trả điện áp/dòng. Net chỉ gom các điểm nối bằng dây, không phải ERC/DRC, không liên kết sang đường đồng PCB. Lộ trình dùng `lastLessonId` (bài vừa mở), không có trạng thái "hoàn thành".
- **Chưa làm:** tab Tổng quan/Pinout/Ví dụ/Thông số cho từng bài (chỉ bài LED có trang riêng), kiểm thử với người học thật, thiết bị thật.
- **Ghi chú audit WCAG trước lần sửa cùng ngày:** axe từng báo `target-size` trên nút chân, nút xóa và nút xoay trong canvas. Mục này đã được xử lý theo nhật ký “Builder, preflight và model” ở đầu file: các thao tác có bảng điều khiển thay thế với đích bấm tối thiểu 44 px. Canvas vẫn giữ lối tắt chuột; việc đáp ứng ngoại lệ tương đương WCAG 2.5.8 cần kiểm tra thêm với người dùng và screen reader.

## Xử lý review H1–H9 — 01/11/2026

Giả định làm việc của lượt này, chưa phải xác nhận pháp lý hay phần cứng: Release 1 ưu tiên ESP32 DevKit V1 theo model nguồn đã ghi, Uno R3 là board tham khảo phụ; ưu tiên luồng desktop và giữ responsive; hướng tới người mới nói chung, không thêm tài khoản hay tracking dành riêng cho trẻ em; chưa chốt offline đầy đủ và license sản phẩm.

- **Link không ghi đè workspace:** mọi `?lesson=<id>` mở phiên riêng trong `sessionStorage`, kể cả khi thiếu `guided=1`, và tiếp tục bản nháp của phiên nếu có. `?board=` không đổi workspace đã lưu; giao diện chỉ đề xuất chuyển board.
- **Parser chặt hơn:** bài LED chỉ nhận thứ tự ghi mức → delay → ghi mức → delay trong `loop()`; `setup()` chỉ nhận `pinMode`; bài nút bắt buộc `INPUT_PULLUP`.
- **ADC theo board:** code analog dùng `map(analogRead(chân), 0, ADC_MAX, 0, 100)`. Đã xác minh dải 0–1023 cho Uno, Nano classic, Mega và 0–4095 cho ESP32 DevKit. Board khác bị khóa bài analog cho tới khi có nguồn. Bản nháp dùng biểu thức cũ không bị xóa, nhưng parser từ chối kèm hướng dẫn.
- **GPIO khác LED:** GPIO hiển thị theo code; LED và LED 7 đoạn chỉ sáng khi mạch không có lỗi. Mạch thành lỗi khi đang chạy thì mô phỏng dừng.
- **Bảng chân:** LED 7 đoạn dùng GPIO 13, 14, 27, 26, 25, 33, 32 trên ESP32 DevKit và D2–D8 trên Uno, Nano classic, Mega. Board khác bị khóa. Bài cũng bị khóa khi chân đầu vào trùng LED (ESP32-S2/S3 với analog, ba board Pico với siêu âm).
- **Dữ liệu cục bộ:** project và revision chưa đọc được vẫn được giữ khi lưu; thư viện JSON hỏng được sao lưu trước khi ghi; trang Dự án cho tải bản sao phục hồi. Mở hoặc nhập project sẽ sao lưu workspace hiện tại vào bản khôi phục. Phòng thử lỗi có nút sao lưu rồi đặt lại, không chạm vào project đã lưu. Không đổi `PROJECT_BUNDLE_VERSION` hay định dạng lưu.
- **Kiểm chứng:** `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`. Trên trình duyệt desktop cục bộ đã kiểm tra link board, link bài, tải lại phiên guided, xóa dây khi đang chạy, bundle lỗi, project không đọc được, khóa bài, chạy bài 7 đoạn và analog trên ESP32, thoát màn lỗi route. Đã biên dịch sketch analog cho Uno bằng avr-gcc của Arduino AVR 1.8.8 và chạy trong AVR8js: `map()` đổi mức đúng quanh ngưỡng, biểu thức cũ không bật LED ở mức ADC cao.
- **Chưa kiểm chứng:** board thật, firmware ESP32, service worker và offline (không đăng ký được trong browser pane), thiết bị cảm ứng thật, trình đọc màn hình.

## Review toàn bộ source lần hai — 01/11/2026

- **Validator:** bài nút, IR, siêu âm, LDR, 7 đoạn, buck/boost, motor, MOSFET nay so theo net và theo loại linh kiện. Đảo hai đầu linh kiện không phân cực, xóa rồi thêm lại linh kiện, hoặc nối qua node breadboard không còn bị báo sai. Breadboard vẫn chỉ có bốn node logic.
- **Dữ liệu:** thao tác thay nội dung dừng lại nếu không sao lưu được. Khôi phục khối mẫu có hỏi xác nhận và sao lưu. Lưu trùng tên hỏi trước khi ghi đè; đổi tên project đang mở được giữ.
- **Parser:** giới hạn 20.000 ký tự; bài siêu âm bắt buộc có xung TRIG và phép tính khoảng cách theo mẫu.
- **Điều hướng:** tiêu đề tab đọc được trên cả route công khai và `/app`; link nội bộ giữ namespace `/app`; link giới thiệu từ app thoát shell app.
- **Responsive:** nút bước không còn bị thanh điều hướng che ở 375 px trên `/app`; từ 1100 px trở xuống canvas nằm trước thư viện linh kiện.
- **Bước tiếp theo:** sau khi có kết quả chạy, panel có nút sang bài kế tiếp trong curriculum.
- **Kiểm chứng:** axe-core 4.10.3 trên 23 route ở 1280, 768 và 375 px (69 lượt) sau thay đổi cuối: không có vi phạm. Bản kiểm tra chạy trong iframe và emulation, không phải thiết bị thật; axe chỉ bắt được một phần lỗi accessibility. Đã thử H1, H2, H4 trên trình duyệt.
- **Bảo mật:** rà tay vì skill `security-review` cần diff với `origin/HEAD`, repo không có. `npm audit --omit=dev` báo 0 lỗ hổng.
- **Chưa kiểm chứng:** service worker và offline, thiết bị thật, Firefox, Safari, trình đọc màn hình, board thật, firmware ESP32, người mới dùng thật.

## Lát cắt chỉ dẫn bước tiếp theo trong phòng thử — 01/11/2026

- **Vấn đề đo được trước khi sửa:** sau khi bấm nút chuyển bước, tiêu đề bước mới nằm ngoài màn hình và focus rơi về `body`; bấm Chạy khi mạch lỗi thì thông báo nằm cách nút khoảng 2.000 px; chẩn đoán hiện ghi chú trước lỗi và lặp một lỗi LED hai lần; board bị canvas cắt mất phần bên trái, che chân GPIO LED.
- **Đã làm:** thêm panel "Việc cần làm tiếp theo" dưới tiêu đề mỗi bước (`src/lib/builderGuidance.ts`, `src/components/builder/BuilderGuidancePanel.tsx`). Panel nêu một việc, cách sửa, chân còn hở và một nút hành động. Chuyển bước đưa stepper lên đầu màn hình và chuyển focus vào tiêu đề bước. Bấm Chạy thất bại đưa focus tới panel. Chẩn đoán đưa lỗi lên trước, gom ghi chú vào mục thu gọn. Thẻ bài hiện nếu chưa chạy được trên board đang chọn, và panel có nút chuyển sang ESP32 DevKit V1.
- **Canvas:** rộng tối thiểu 760 px và cuộn ngang trong khung; board cố định 252 px và không bị cắt.
- **Accessibility:** linh kiện trên canvas chuyển từ `role="button"` lồng nút sang nhóm có một nút chọn riêng; Enter chọn, phím mũi tên di chuyển. Sửa tương phản số chủ đề và gạch chân link trong đoạn văn.
- **Kiểm chứng:** test tự động trong `tests/builder-guidance.test.mjs`. axe-core 4.10.3 chạy thủ công trên 12 route ở 1280 px: không còn lỗi serious hoặc critical; còn cảnh báo best-practice mức moderate về `aside` lồng trong `main` ở 4 route ngoài phòng thử. Đã thử bàn phím thật, đặt lại phòng thử, và kích thước 375, 768, 1024 px (emulation, không phải thiết bị thật).
- **Chưa kiểm chứng:** người mới thật, trình đọc màn hình, cảm ứng thật, Firefox, Safari.

## Khung website và app PWA

- Website công khai giữ trang giới thiệu tại `/`, điều hướng khám phá và các đường dẫn demo hiện có.
- Không gian app có layout riêng tại `/app`: thanh điều hướng workspace trên desktop, thanh điều hướng 5 mục trên mobile, trạng thái khách và liên kết quay về website. Đây vẫn là PWA chạy trong cùng ứng dụng React/Vite, chưa phải app native.
- Các route chính trong app: `/app/learn`, `/app/learn/esp32-led`, `/app/boards`, `/app/components`, `/app/lab`, `/app/projects`, `/app/tools/calculators` và `/app/tools/firmware`.
- App route dùng lại các trang/tính năng hiện có; người học vào từ app sẽ giữ app shell khi các liên kết nội bộ cũ chuyển giữa route tương ứng. Chọn “Về website” mới thoát về giao diện công khai.
- Luồng khách và lưu tiến độ cục bộ hiện có được giữ nguyên. Đăng nhập/đồng bộ đa thiết bị, lớp học, cộng tác, phát hành nội dung và các mục roadmap chưa được tạo chỉ vì đã có chỗ trên thanh điều hướng.
- Khung thích ứng dùng sidebar desktop và điều hướng đáy có safe-area trên màn hình nhỏ; các page builder nặng vẫn dùng giao diện riêng của chúng.

### Kiểm chứng khung điều hướng

- `npm.cmd run build` hoàn tất sau khi thêm app shell và route aliases; TypeScript và Vite production build đều qua.
- Chưa kiểm tra tương tác trực tiếp trên trình duyệt ở lượt này. Mở `/app` để xem workspace; thử chuyển qua Board, Linh kiện, Phòng lắp mạch, rồi chọn “Về website” để xác nhận đổi shell.

## Trạng thái hiện hành sau rà soát

- Curriculum hiện có **11 bài**: **8 bài mô phỏng hành vi cơ bản bằng parser code giới hạn** (dùng 6 mẫu cú pháp, gồm analog biến trở và LDR) và **3 bài minh họa khái niệm theo kịch bản cố định**. Các bài này không chạy firmware MCU hoặc tính toán điện như SPICE. Công cụ `/tools/firmware-hex` có spike AVR8js riêng cho ATmega328P, không phải engine dùng trong curriculum.
- Có **21 board profile cho simulator**; danh mục có **26 hồ sơ board** và **10 model board có viewer 3D tham chiếu** (ESP32 DevKit V1, ba board Arduino, ba board Raspberry Pi Pico và ba board Adafruit #5405/#5323/#5483); trong đó **4 board** có thêm viewer PCB 2D theo lớp đồng CAD. Ba board Adafruit chỉ ở chế độ CAD preview. Thiết kế STM32 Blue Pill community được lưu trữ, không phát hành trên UI. “Theo CAD/revision” xác nhận nguồn hình học tham chiếu, không xác nhận mọi clone, BOM hay revision ngoài đời. Pin map không có nguồn đủ mạnh được ghi là alias học tập; suy luận từ vị trí CAD không được trình bày như dữ kiện thiết kế.
- Board profile và component catalog đã có trạng thái nguồn/năng lực. Linh kiện tham số ở bàn lắp là hình minh họa; chỉ linh kiện được liệt kê trong topology/parser của bài mới tham gia hành vi mô phỏng tương ứng.
- Đã thêm `npm.cmd test` (Node test runner + Vite SSR, không cần mở cổng mạng) để kiểm tra curriculum, parser cho code mẫu, topology của cả mười một preset, luật topology LED cơ bản, metadata board và khả năng biên dịch các page/component chính. Lượt rà soát hiện tại cũng đã mở được `/`, `/build`, `/boards`, `/components` và `/projects` trên trình duyệt; đây là kiểm tra thủ công luồng cơ bản, chưa thay cho kiểm thử người dùng hoặc kiểm chứng mọi kích thước màn hình.
- Trang build vẫn là component lớn; thanh công cụ board/chạy/đặt lại và bộ chọn bài đã được tách thành `BuilderToolbar` và `BuilderLessonPicker`. Canvas, editor và panel mô phỏng vẫn còn gắn trong page; nên tiếp tục tách theo từng ranh giới state để tránh đổi behavior cùng lúc.
- Bài biến trở analog có đầu vào ảo chuẩn hóa 0–100, điều kiện ngưỡng, trace và block/C++ riêng. Bài LDR mới dùng slider mức sáng, bộ chia áp mẫu có validator và parser C++ giới hạn; thermistor vẫn là tài liệu tham khảo.
- Kiểm tra trực tiếp đã đi từ chọn bài → lắp → viết code block → chạy và quan sát. Phát hiện code sinh từ block dùng literal số chân trong `pinMode`/`digitalWrite`, trong khi parser yêu cầu `ledPin`, làm code mẫu bị từ chối. Đã sửa bộ sinh code và xác nhận trên browser: mô phỏng chuyển sang “Đang chạy”, GPIO 23 HIGH, LED sáng, trace khớp code.
- Danh mục board hiện hiển thị 26 hồ sơ, thư viện có 51 mục và bàn lắp 27 loại linh kiện. Mười viewer board 3D gồm ESP32 DevKit V1, ba board Arduino, ba board Pico và ba board Adafruit #5405/#5323/#5483; bốn viewer PCB 2D/CAD là ESP32 DevKit V1, Uno R3, Nano classic và Mega 2560 R3. Ba board Adafruit là CAD preview, chưa có netlist/pin picking. Các profile còn lại là tra cứu hoặc chưa đạt điều kiện phát hành viewer.
- Dashboard `/app` lưu cục bộ bài thực hành vừa mở trong lộ trình và checklist tự xác nhận của bài LED, để có thể tiếp tục trên cùng trình duyệt. Đây không phải đánh giá kỹ năng, xác minh phần cứng hay đồng bộ tài khoản; chưa có tiến độ học cloud.
- Các route nay có error boundary chung để hiển thị hướng thử lại hoặc quay về trang giới thiệu khi component/lazy bundle gặp lỗi; `/build` vẫn giữ thông báo riêng cho lỗi workspace để người học biết cách khôi phục.
- Mở bài học với query `?board=...` khởi tạo đúng linh kiện đang chọn theo board (ESP32 chọn WROOM; Uno chọn ATmega328P; Nano/Mega chọn MCU theo CAD), tránh panel thông tin bị rơi về linh kiện ESP32.
- Bộ chọn feature của ba board Arduino mặc định ưu tiên 33 footprint có mesh 3D; ô tìm kiếm lọc theo tên/designator và disclosure mở đủ 120 footprint CAD, trong đó 87 mục chưa có mesh. Mục không có mesh được ghi rõ là footprint/pad, không tạo hình khối giả.
- Tại thời điểm cập nhật mục này (02/11), các giới hạn chủ động giữ gồm: chưa có simulator firmware dùng trong bài học; spike AVR8js riêng chỉ nhắm ATmega328P và chạy mẫu bare-metal; mô hình linh kiện bàn lắp không phải CAD nhà sản xuất; alias pin và topology chỉ có giá trị giáo dục; các model board mới cần file/revision có thể kiểm tra và điều khoản sử dụng rõ. SPICE được bổ sung ở cập nhật 03/11 phía trên. Tách nhỏ hoàn toàn `CircuitBuilderPage.tsx`, xác nhận model theo board vật lý và kiểm thử có người mới vẫn là việc tiếp theo.

## Rà soát sửa tiếp theo — 01/11/2026

- Dashboard và route curriculum lấy từ cùng schema: 11 thẻ bài học mở được với `?lesson=<id>&guided=1` (từ 01/11 tham số `guided` không còn bắt buộc); khi chọn bài trong builder, bài vừa mở được ghi vào tiến độ cục bộ. Đây chỉ là resume aid, không phải attempt đã hoàn thành hay đánh giá năng lực.
- Liên kết nội bộ ở Chủ đề, Linh kiện, Board, Bài học và Dự án nay giữ `/app/...` khi người học đang ở app workspace; query board/lesson được giữ nguyên khi chuyển trang. Mở project đã lưu cũng điều hướng về builder trên cùng bề mặt. Chưa kiểm tra thao tác trình duyệt trong lượt này.
- Phần dự đoán LED nay áp dụng cả bài “Nguồn thấp áp, điện trở và LED” (cùng parser LED subset). Các bài khái niệm cố định không được gắn nút dự đoán dựa trên code chưa được thực thi.
- Chẩn đoán mạch có thông báo mức `info` khi workspace chứa breadboard: mô hình hiện chỉ bốn node logic rail+, rail−, hàng A/B; chưa suy luận nhóm lỗ hoặc continuity vật lý. Đây không phải ERC.
- `CircuitWorkspaceDocument` được ghi rõ là format học tập legacy, không phải tài liệu EDA hay board CAD; chưa đổi JSON/schema lưu project để bảo toàn tương thích.
- Kiểm chứng lượt này: production build chạy lại sau thay đổi. Không chạy test suite hoặc kiểm tra tay trên browser trong lượt này; các kiểm chứng cần thiết trước phát hành vẫn gồm route interaction, mobile/accessibility, PWA lifecycle/offline, board/revision/asset provenance và kiểm chứng mạch thật.

## Phần đã có trong web

- `/boards`: danh mục 26 board/biến thể, lọc theo họ, tìm kiếm và so sánh tối đa ba board. Có viewer 3D cho ESP32 DevKit V1 30 pin, Arduino Uno R3, Nano classic, Mega 2560 R3, ba mẫu Raspberry Pi Pico, QT Py ESP32-C3 #5405, Feather ESP32-S3 #5323 và Feather ESP32-S3 TFT #5483. Bốn board ESP32/Arduino có thêm manifest/lớp đồng PCB 2D; các board Pico và Adafruit chưa có PCB viewer/netlist. Các board khác có hồ sơ tham khảo; một số có link tải CAD nguồn.
- `/components`: thư viện 51 board/module/linh kiện, tìm kiếm, lọc nhóm và trang giải thích công dụng, chân thường gặp, cách dùng, lưu ý và tài liệu nguồn khi đã có.
- `/build`: bàn lắp ráp logic, kéo thả linh kiện, tìm kiếm thư viện, nối hai chân, chọn 1 trong 21 board profile và mười một bài mẫu. Tám bài dùng parser code subset giới hạn; ba bài nguồn/motor/MOSFET chạy kịch bản khái niệm cố định. Biến trở và LDR dùng đầu vào analog chuẩn hóa 0–100; LDR giả định mắc phía VCC; mô hình tính Vout bộ chia áp giáo dục, không tính lux, đặc tuyến LDR thật hay số đếm ADC vật lý. Bài 7 đoạn có sơ đồ A–G qua bảy điện trở riêng, hai chân COM về GND, hiển thị 0–9 theo bảng mã trong code mẫu. Khi chạy hoặc bước code, dây thuộc luồng logic của bài được làm nổi theo chân ổn định; đây không phải đường đồng PCB hay dòng điện. Thư viện có thêm diode, LED RGB, NPN, MOSFET, motor DC, thermistor, công tắc gạt, nguồn DC và relay. Bố cục được lưu trong localStorage. Đây chưa phải simulator firmware cho 21 MCU.
- `/topics`: bản đồ bốn chủ đề, mỗi mục liên kết tới thư viện, bài học hoặc workspace tương ứng.
- `/projects`: danh mục mười một hoạt động thực hành với linh kiện cần chuẩn bị, thời lượng và nhãn phân biệt bài parser code subset với kịch bản khái niệm cố định. Đây là trang curriculum, không phải mười một mô phỏng điện hoàn chỉnh.
- `/learn/esp32-led`: bài học LED, viewer board, pinout, editor khối lệnh riêng, C++ giới hạn và luồng câu lệnh tới trạng thái LED.

## Cập nhật triển khai 30/10/2026

- Workspace lắp mạch dùng endpoint ổn định theo `partId`/`pinId`, có migrate dữ liệu cũ và kiểm tra topology theo từng preset. Chẩn đoán chỉ xác nhận các điều kiện đã khai báo; không phải ERC/netlist hay phân tích điện.
- Sáu mẫu cú pháp Arduino subset được dùng bởi tám bài: LED, nút, IR, HC-SR04, LED 7 đoạn, analog threshold (biến trở/LDR) và nguồn + LED (bài này dùng lại mẫu LED). Parser từ chối cú pháp ngoài phạm vi và không thực thi source code. Tín hiệu cảm biến/khoảng cách, phần trăm biến trở và mức sáng LDR là đầu vào ảo; giá trị analog được chuẩn hóa 0–100, không biểu diễn số đếm ADC thực.
- Trạng thái chạy LED được khởi tạo từ thời gian `elapsedMs` của mô phỏng, thay vì giả định mỗi lần cập nhật là 500 ms. Lớp tô sáng dây logic quy đổi index legacy về `pinId` ổn định trước khi đối chiếu.
- Các trang được tải theo route; bundle entry giảm từ khoảng 506 kB xuống 277.28 kB minified. Trang học được tải riêng khi mở, nên người xem trang khám phá không cần tải toàn bộ workspace trước.
- Trang dự án hiện phân biệt tám bài parser code subset (sáu mẫu cú pháp; bài nguồn + LED dùng lại mẫu LED) và ba bài kịch bản khái niệm cố định. Biến trở và LDR mô phỏng đầu vào chuẩn hóa theo ngưỡng; thermistor vẫn là nội dung tham khảo analog.
- Danh mục model có publication gate và trạng thái riêng trong `assets/boards/board-model-registry.md`. Trong `/boards`, bốn board ESP32/Arduino có model 3D kèm manifest PCB 2D; thiết kế community Blue Pill đã lưu trữ ngoài `public/` và không phát hành. Pico/Pico W/Pico 2 được mở bằng viewer GLB riêng trong luồng học; chưa nằm trong nhóm manifest PCB 2D. ESP32-S3 và NUCLEO-F401RE vẫn chưa có viewer 3D nội bộ hoàn chỉnh.
- Viewer PCB 2D đọc manifest CAD cho ESP32 DevKit V1 clone, Uno R3, Nano classic và Mega 2560 R3. Trong nhóm viewer CAD, chỉ Uno có mapping tín hiệu D13/SCK được xác minh; các board còn lại xem pad/net CAD nhưng không tô theo code. Riêng hồ sơ NUCLEO-F401RE đã có pinout header Arduino D0–D15/A0–A5 đối chiếu UM1724 Rev 17, hiển thị trong danh mục board; thông tin pinout này không đồng nghĩa có viewer 3D hay mô phỏng firmware. File xuất và số lượng feature được ghi tại `docs/board-model-sourcing.md`.

## Những giới hạn cần giữ rõ

- Các bài học chạy qua parser Arduino subset giới hạn, không qua compiler MCU hay firmware runtime. Công cụ HEX có runner AVR8js riêng cho ATmega328P; đã kiểm chứng HEX blink build từ Arduino Uno sketch qua Arduino IDE, nhưng chưa kiểm chứng toàn bộ peripheral/timing. Người dùng phải xác nhận target trước khi chạy vì HEX không tự nhận diện MCU. Parser chỉ nhận mẫu cú pháp từng bài. Mạch 7 đoạn đang hỗ trợ cathode chung preset; common-anode chưa được hỗ trợ. Bài biến trở chuẩn hóa đầu vào thành 0–100 để giải thích luồng analog, không tương đương kết quả `analogRead()` trên thiết bị thật.
- Đầu vào button, IR, khoảng cách siêu âm, biến trở và LDR là giá trị ảo trong các bài tương ứng. Tụ điện, OLED, buzzer, servo, diode, LED RGB, transistor, MOSFET, motor, thermistor, công tắc, nguồn và relay hiện là mô hình/ghi chú tham khảo; chưa có behavior điện. Dây nối tự do trên canvas chưa được kiểm tra netlist hoặc điện áp. Canvas hỗ trợ kéo thả, xoay linh kiện, xem và xóa từng dây; vị trí chân là sơ đồ giáo dục, không phải breadboard/CAD kích thước thực.
- Cảnh IR mẫu đặt ngõ ra active HIGH để dạy luồng; module ngoài đời có thể active LOW. Code HC-SR04 là ví dụ tham chiếu; `pulseIn` và thời gian ECHO không được mô phỏng. HC-SR04 thường cấp 5 V, ECHO có thể cần chia áp trước khi nối GPIO 3,3 V.
- Các viewer là model tham chiếu theo CAD cụ thể, không đại diện cho mọi board clone/revision. Tương tác linh kiện dựa trên tên node/footprint có sẵn; mức xác thực lắp ráp vật lý chưa đồng đều.
- NUCLEO-F401RE được đối chiếu pin Arduino theo UM1724 Rev 17 (bảng đầu nối của F401RE/F411RE). A4/A5 có thể chuyển giữa chức năng ADC/I²C theo solder bridges; danh mục ghi rõ pinout tài liệu. Bài LED dùng số chân Arduino D13 (tương ứng PA5 trên target này); mô phỏng vẫn chỉ là parser hành vi cơ bản, chưa build/nạp firmware STM32 thật.
- Raspberry Pi Pico/Pico W/Pico 2 đã có GLB nội bộ từ STEP CAD chính hãng và viewer 3D có chọn mesh/hiển thị thông tin CAD. Đây là hình học tham chiếu; mesh tổng hợp hoặc thiếu BOM/netlist không chứng minh chức năng điện hay vị trí linh kiện vật lý trên mọi phiên bản thương mại.
- Hồ sơ ST NUCLEO và Espressif ESP32-S3 đang lưu làm tài liệu nguồn. Chưa xuất bản model dẫn xuất cho tới khi chuyển đổi đúng revision, kiểm tra hình học và xác nhận quyền phân phối.
- Môi trường có KiCad CLI 9.0.1, nhưng log registry quyền truy cập bị từ chối. Lệnh render vẫn hoàn tất; không cần quyền quản trị để tái hiện lỗi STEP nói trên.

## Các cải tiến đã triển khai trước đây

- Bộ chạy mô phỏng không còn khởi tạo lại timer sau mỗi nhịp; bộ đếm thời gian và LED 7 đoạn dùng mốc mô phỏng tiến liên tục. Thay đổi đầu vào vẫn cập nhật chương trình đang chạy.
- “Chạy từng bước” tính đầu ra tại thời điểm kế tiếp và dừng timer chạy liên tục để tránh hai chế độ cùng cập nhật trạng thái.
- Chẩn đoán thêm cảnh báo khi nối nguồn thẳng xuống GND, nối trực tiếp hai ngõ ra, hoặc linh kiện mới thêm còn chân hở. Đây là cảnh báo sơ bộ theo loại chân, không thay ERC.
- Không cho thêm board thứ hai hoặc xóa board nền của workspace; đổi board qua bộ chọn profile.
- Bàn lắp có nút xoay linh kiện 90°, danh sách dây có thể thu gọn và xóa từng dây. Nếu dữ liệu localStorage sai định dạng, ứng dụng mở preset mẫu nhưng giữ nguyên bản lưu cũ để có thể khôi phục.
- Đã sinh manifest PCB 2D từ KiCad cho bốn board; dữ liệu là lớp đồng/net theo CAD, không phải model 3D mới.
- Build sản xuất tại thời điểm ghi nhận hoàn tất với TypeScript/Vite; bundle entry có thể thay đổi theo lần cập nhật.

## Kiểm tra lượt cập nhật gần nhất

### Cập nhật luồng UX cho người mới — 30/10/2026

- Điều hướng chính được nhóm thành Bắt đầu học, Thư viện, Phòng thử và Lộ trình; menu nhóm dùng disclosure native hỗ trợ chuột, bàn phím và cảm ứng.
- Trang đầu trở thành phần giới thiệu sản phẩm và khái niệm điện tử cơ bản: cảm biến → vi điều khiển → thiết bị đầu ra; sau đó giới thiệu bài học, thư viện board/linh kiện, phòng thử và lộ trình.
- Trang bắt đầu có một CTA cho bài LED nhập môn, bốn đường dẫn phụ dễ phân biệt và thông tin không cần tài khoản/kinh nghiệm.
- Phòng thử chia thành bốn bước có thể đi tự do: Chọn bài, Lắp mạch, Viết code, Chạy và quan sát. Các bước là lớp trình bày trên cùng workspace, không khởi tạo lại circuit/code/input state.
- Bài LED tích hợp BlockCodeWorkspace; C++ dùng CppPracticeEditor. Hai bản nháp được giữ riêng, và C++ chỉnh tay không tự đồng bộ về block. Trong workspace, sáu mẫu cú pháp parser tạo luồng cho bảy bài; ba bài khái niệm chỉ chạy kịch bản cố định.
- Trang board, linh kiện, chủ đề, dự án và bài học có nhãn/ngữ cảnh cùng đường dẫn hành động tiếp theo. Board ngoài model đã phát hành được ghi rõ là tham khảo.
- Hướng dẫn nhanh trong phòng thử mở theo yêu cầu, không chặn người dùng bằng modal.
- Build production đã chạy sau cập nhật: TypeScript/Vite thành công; entry JS 278.49 kB minified. Chưa xác nhận bố cục trực tiếp trong browser Codex vì localhost không kết nối trong môi trường hiện tại.

### Bài biến trở analog — 30/10/2026

- Thêm bài `Biến trở bật/tắt LED theo ngưỡng`: preset board/biến trở/LED/điện trở, thanh trượt 0–100, parser giới hạn cho `analogRead(potPin)` và nhánh ngưỡng, hoạt ảnh luồng tín hiệu cùng trạng thái LED.
- Dải 0–100 là thang giáo dục chuẩn hóa, không phải ADC count. Alias chân analog theo họ board chỉ là gợi ý học tập; cần kiểm tra pinout/datasheet của revision thật. LDR và thermistor vẫn là tài liệu tham khảo.
- Build production thành công; không chạy test suite và chưa xác nhận trực tiếp trong browser.

### Bài quang trở LDR — 31/10/2026

- Thêm bài `/build` và `/projects` “Quang trở LDR bật/tắt LED” với preset board, breadboard, LDR, điện trở chia áp, LED hạn dòng và dây nối. Validator kiểm tra hai phần mạch riêng: bộ chia áp và đường LED.
- Có thanh trượt mức sáng 0–100, parser giới hạn cho `analogRead(ldrPin)` → `lightPercent` → if/else, trace giải thích tín hiệu tới GPIO analog và LED. Đã kiểm tra trên web: 25% dưới ngưỡng cho LED LOW; 75% trên ngưỡng cho LED HIGH; topology preset hợp lệ.
- Giả định của bài: LDR phía VCC, điện trở cố định phía GND, nên mức sáng tăng được ánh xạ thành đầu vào chuẩn hóa tăng. Đây là mô hình hành vi giáo dục; không tính lux, điện trở LDR thực hay số đếm ADC thật; Vout bộ chia áp giáo dục được tính theo giả định mô hình. Board pin vẫn là alias học tập theo profile, cần đối chiếu đúng revision khi lắp ngoài đời.
- Đồng bộ curriculum và mô tả phạm vi thành 11 bài; 8 bài dùng parser giới hạn và 3 bài khái niệm cố định. Thermistor vẫn là tài liệu tham khảo.
- `npm.cmd run build` thành công (TypeScript/Vite, 132 modules). Không chạy bộ test theo yêu cầu quy trình của phiên; có cập nhật assertion số bài hiện có từ 10 lên 11.

### Đồng bộ nhãn năng lực — 30/10/2026

- Trang `/projects` gắn nhãn riêng cho bài chạy parser code subset và bài kịch bản khái niệm cố định; phạm vi tổng hợp ghi rõ 10 bài, 7 bài parser dùng 6 mẫu cú pháp (bài nguồn + LED dùng lại mẫu LED), 3 bài khái niệm.
- Trang `/components` phân biệt linh kiện có mặt trong một số bài mẫu, chỉ hiển thị trên canvas và chỉ có thông tin tra cứu. “Có trong bài mẫu” không có nghĩa là đặc tuyến điện của linh kiện được tính toán.
- Danh mục `/boards` giữ trạng thái viewer/CAD tham chiếu và hồ sơ tra cứu; số board profile không đồng nghĩa số board có model tương tác hay firmware simulator.
- `README.md` và tài liệu này đã được đồng bộ theo cùng số bài và cách gọi năng lực mô phỏng. Build TypeScript/Vite đạt; bundle entry hiện 278.49 kB minified. Chưa xác nhận trực quan trong browser.

### Làm rõ bước chọn bài trong workspace — 30/10/2026

- Thay dropdown bài thực hành ở bước đầu bằng mười một thẻ có cấp độ, thời lượng, mô tả ngắn và nhãn kiểu mô phỏng. Chọn thẻ gọi lại luồng nạp preset hiện có.
- Board vẫn được chọn riêng; thao tác đổi bài tiếp tục nạp mạch, code và đầu vào mô phỏng theo preset. Các bước lắp, viết code và chạy giữ nguyên.
- Giao diện thẻ chuyển từ ba cột desktop xuống hai cột màn hình nhỏ và một cột điện thoại.
- Build production sau cập nhật thành công; bundle entry 278.59 kB minified. Chưa xác nhận bằng thao tác trực tiếp trong browser.

- `npm.cmd run build` hoàn tất: TypeScript và Vite không báo lỗi. Bundle entry là 277.28 kB minified; build không còn cảnh báo chunk lớn hơn 500 kB.
- Vite đã báo sẵn sàng tại `http://127.0.0.1:5182/`, nhưng trình duyệt trong Codex vẫn không kết nối được tới localhost; chưa xác nhận được tương tác hoặc bố cục trên giao diện chạy thật.
- Build sau cập nhật manifest và bàn lắp hoàn tất: TypeScript/Vite thành công, entry JS 277.28 kB minified. Chưa chạy kiểm thử tự động và chưa xác nhận tương tác trình duyệt trong Codex.

## Phần còn lại và điều kiện để hoàn thiện

| Hạng mục | Có thể tự triển khai trong code | Cần thêm từ founder/team |
|---|---|---|
| Soát sai lệch vị trí/chiều linh kiện trên các board | Có thể kiểm tra lại file CAD, BOM và transform đã có; chỉ sửa vị trí có bằng chứng nguồn. | Ảnh chụp thẳng mặt trước/sau của đúng board thực tế và tên/revision để xác nhận clone khớp CAD. Không cần ảnh nếu chỉ chấp nhận model là tham chiếu theo CAD. |
| Mở rộng analog/RC ngoài mô hình LDR hiện có | Bài LDR có đầu vào ảo, bộ chia áp giáo dục và handoff SPICE `.op` riêng cho board mức 3,3 V/topology/điện trở mẫu 10 kΩ. Parser vẫn dùng phần trăm chuẩn hóa chứ không phải ADC count; thermistor chưa có model, và workspace chưa chuyển RC tự do sang SPICE. | Không cần quyền truy cập. Muốn khớp kit thực thì team cần chốt mã LDR/thermistor, mạch, dải đo và hiệu chuẩn; nếu chỉ học khái niệm có thể tiếp tục bằng giả định ghi rõ. |
| Bổ sung citation/revision cho danh mục MCU | Có thể rà soát tài liệu chính hãng và ghi nguồn, thông số cùng trạng thái tham chiếu. | Không cần quyền truy cập. Việc đưa thành model tương tác vẫn cần full-board CAD và kiểm tra quyền phân phối. |
| Phát hành thêm model 3D/2D (ESP32-S3, NUCLEO-F401RE, Pico, Blue Pill...) | Thiết kế Blue Pill-style SinaKarvandi đã được lưu trữ ngoài `public/`, không phát hành viewer trên UI; Pico/Pico W/Pico 2 có viewer 3D GLB nhưng chưa có viewer PCB 2D/netlist/pin anchors. XIAO ESP32-C3 v1.3 có viewer 3D từ PCB KiCad, 68 footprint CAD, 47 mesh package tham khảo và chọn được 14 chân header J1/J2; chưa có PCB 2D/tô net. Có thể tiếp tục chuyển đổi board khác khi có CAD và quyền dùng phù hợp. | Với NUCLEO/ST và một số nguồn cộng đồng: xác nhận quyền dùng/phân phối model dẫn xuất. Với board vật lý: cung cấp đúng revision/ảnh để đối chiếu. Chỉ công bố khi đạt checklist ở `docs/board-model-sourcing.md`. |
| Firmware simulator tổng quát | Có thể thiết kế adapter/backend sau khi chốt kiến trúc; hiện parser subset tại web là local và an toàn. | Founder/team chọn provider hoặc chấp nhận tự host; xác nhận chi phí, quyền thương mại, xử lý source code học sinh và chính sách gửi code ra ngoài. |
| Admin analytics | Frontend và migration SQL đã có; có thể hướng dẫn các bước cấu hình. | Tạo Supabase project riêng, áp migration, tạo founder account và thêm UUID vào `site_admins`; đặt URL/public key trong `.env.local` trên máy. Không gửi service-role key qua chat. |
| Kiểm thử trải nghiệm người mới và responsive | Có thể rà tiếp bằng checklist và browser; hiện đã xác minh luồng desktop cơ bản qua bước chọn bài/lắp/code/chạy. | Founder/team có thể cho 2–3 người mới thử, ghi lại nơi họ dừng hoặc cần trợ giúp; không cần cấp quyền kỹ thuật. |

Các thông tin đối chiếu nguồn board mới được ghi ở `assets/boards/vendor/MODEL-SOURCE-REVIEW.md`. Seeed XIAO ESP32-C3 v1.3 hiện có viewer GLB dựng từ PCB KiCad và mesh package KiCad chung; schematic có ghi CC BY-SA 4.0 nhưng archive không kèm LICENSE độc lập, nên NOTICE giữ nguyên điểm chưa rõ quyền phân phối rộng hơn. Raspberry Pi cho phép dùng/copy/chỉnh sửa/phân phối thiết kế Pico/Pico W; Pico/Pico W/Pico 2 đã được chuyển thành GLB và tích hợp viewer 3D. Chức năng của mesh vẫn cần BOM/netlist để xác minh.

## Chạy web cục bộ

Trong PowerShell, từ thư mục `D:\StartupOS\electronics-learning-demo`, chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Mở `http://127.0.0.1:5173/build` và giữ cửa sổ terminal hoạt động. Nếu cổng đang dùng, kiểm tra tiến trình trước khi dừng; không dừng tiến trình Node chưa xác định. Hoặc chạy `start-demo.cmd` để script gọi `npm.cmd` (không phụ thuộc quyền chạy `npm.ps1`) và mở workspace.

## Rà soát browser và sửa code block — 30/10/2026

- Dùng browser mở trực tiếp trang đang chạy tại `127.0.0.1:5173`; kiểm tra được trang giới thiệu, `/build`, `/boards`, `/components`, `/topics`, `/projects` và `/learn/esp32-led`.
- Đi theo luồng phòng thử: chọn bài LED → lắp mạch → viết code block → chạy mô phỏng. Tìm thấy code block sinh `pinMode(23, OUTPUT)` và `digitalWrite(23, ...)`, trong khi parser chỉ nhận `ledPin`; đổi generator sang dùng tên biến `ledPin` nhất quán với khai báo.
- Sau sửa, browser xác nhận nút chạy chuyển sang “Đang chạy”, GPIO 23 hiển thị HIGH, LED ngoài sáng và trace hiển thị `GPIO 23 → HIGH` cùng thời gian chờ 500 ms.
- Thêm regression test bảo đảm code do block sinh ra được parser bài LED chấp nhận. `npm.cmd test`: 7/7 đạt. `npm.cmd run build`: TypeScript và Vite production build đạt.
- Test và lượt browser này không xác minh mọi model cơ khí theo board vật lý, mọi breakpoint, độ chính xác điện, hay hành vi các bài ngoài luồng LED đã thao tác. Các giới hạn và nhu cầu nguồn/revision tiếp tục theo bảng “Phần còn lại”.

## Sửa khởi tạo board và tra cứu footprint Arduino — 30/10/2026

- Khi mở trực tiếp bài học với board Arduino trong URL, lựa chọn ban đầu trong panel linh kiện giờ lấy theo board thay vì luôn chọn module ESP32. Đã xác nhận trên browser rằng URL `?board=arduino-uno-r3` chọn ATmega328P · DIP-28 (ZU4), cùng thông tin CAD tương ứng.
- Bộ chọn linh kiện Arduino giờ mặc định chỉ đưa ra các footprint có hình học 3D trong GLB (Uno: 33 mục). Có thể tìm theo tên hoặc designator; khi cần tra cứu toàn bộ dữ liệu CAD, người dùng mở “Tra cứu thêm” để thấy đủ 120 footprint (87 mục không có mesh gồm pad, test point, fiducial, lỗ hoặc linh kiện thiếu model 3D). Browser đã xác nhận tìm `U1` trả về đúng một mục và nút mở rộng hiện đủ 120 mục.
- Đây là cải thiện khả năng tìm và xem dữ liệu CAD, không tự sửa hình học nguồn hay chứng minh mọi linh kiện clone đã lắp đúng ngoài đời. Các footprint chưa có mesh vẫn không được dựng vật thể giả; xác minh board vật lý cần đúng revision/ảnh hoặc BOM của board đang dùng.
- Kiểm tra hồi quy: `npm.cmd test` đạt 9/9; `npm.cmd run build` hoàn tất TypeScript/Vite. Kiểm tra browser xác nhận board detail mặc định, ô tìm kiếm và disclosure footprint hoạt động.

## Hoàn thiện luồng bài biến trở — 30/10/2026

- Bài biến trở hiện có hai chế độ riêng: block kéo thả và C++ tự luyện. Bản nháp C++ không ghi đè hay tự chuyển thành block; cả chế độ, ngưỡng và thứ tự block được lưu trong workspace cục bộ.
- Khối điều kiện cho phép chỉnh ngưỡng 0–100; giá trị này được sinh vào code C++ mẫu và được parser dùng khi chạy hoặc đi từng bước. Dữ liệu đầu vào biến trở vẫn là thang mô phỏng chuẩn hóa 0–100, không đại diện điện áp hoặc số đếm ADC của board thật.
- Năm khối mô tả đọc cảm biến → so sánh → bật LED → ngược lại → tắt LED. Người học có thể kéo thả hoặc dùng nút lên/xuống có hỗ trợ bàn phím. Sai thứ tự sẽ hiển thị hướng dẫn và ngăn chạy luồng để tránh mô phỏng gây hiểu nhầm.
- Khi chạy bài, trạng thái đầu vào, ngưỡng, trạng thái LED, trace và đường dây logic cùng phản ánh chương trình đã phân tích. Đây vẫn là simulator giáo dục, không chạy firmware hay mô phỏng điện.

### Mở rộng block cho bài nút nhấn và hồng ngoại — 30/10/2026

- Bài nút nhấn và hồng ngoại có chung editor block theo luồng đọc tín hiệu → kiểm tra HIGH/LOW → bật LED → ngược lại tắt LED. Có thể sắp xếp block bằng kéo thả hoặc nút bàn phím; thứ tự sai sẽ chặn chạy và chỉ rõ cách khôi phục.
- Hai bài giữ bản nháp C++ riêng theo từng bài trong localStorage. Chế độ block sinh code mẫu theo board đang chọn; đổi qua lại không ghi đè bản tự luyện. Chỉ cú pháp digitalRead/if/else thuộc parser giáo dục mới tạo trace.
- Chọn bài chuyển người học thẳng sang bước lắp mạch. Số lượng bài trên danh sách hiển thị từ curriculum thay vì ghi cứng; hướng dẫn nhanh đã cập nhật các bài có block.
- Build production thành công sau cập nhật. Chưa kiểm tra tương tác trực tiếp trong browser ở lượt này.

### Bảo toàn bản nháp và khôi phục bài — 30/10/2026

- C++ của các bài dùng textarea/parser được lưu riêng theo bài và board profile. Khi đổi bài/board, workspace nạp nháp đúng tổ hợp hoặc tạo code mẫu theo board; nháp board cũ vẫn được giữ.
- Bài LED, biến trở, nút nhấn và IR có thao tác khôi phục code mẫu đúng board. Nút “Đặt lại bài” khôi phục mạch, đầu vào và mode học; nội dung nháp trước đó vẫn còn trong kho lưu cục bộ.
- Chọn bài không còn âm thầm đặt lại block program hoặc ngưỡng biến trở của bài khác. Code mẫu của trình LED được sinh với GPIO của board hiện hành.
- Build production thành công. Chưa chạy test suite theo yêu cầu trong phiên làm việc.


### Sửa lỗi thao tác và chọn dây — 30/10/2026

- Sơ đồ nguyên lý đo vị trí chân DOM thực để neo dây, tự bố trí linh kiện theo hàng trên màn hình hẹp và cho phép chuyển sang bố trí thủ công khi kéo/di chuyển linh kiện.
- Chọn dây bằng click/keyboard trên đường vẽ hoặc chọn trong danh sách sẽ highlight cùng một kết nối; đã kiểm tra thao tác chọn và trạng thái selected trên browser.
- Sửa React key warning trong renderer pad PCB và câu báo workspace cũ để phản ánh đúng bài đã được nạp.
- `npm.cmd run build` hoàn tất thành công sau thay đổi. Chưa xác minh mọi board/revision ngoài đời, mọi kích thước thiết bị hoặc trải nghiệm với người mới.

## Cập nhật thư viện tham khảo — 31/10/2026

- `/components` hiện gắn link tài liệu hãng hoặc hướng dẫn module cho nhóm board, MCU và linh kiện có nguồn phù hợp; từng link ghi loại tài liệu và phạm vi áp dụng. Datasheet IC không được dùng để xác nhận breakout/module cụ thể.
- Danh sách có trạng thái “Có tài liệu” / “Thiếu tài liệu” và bộ lọc nguồn. Khi đổi nhóm lọc, phần chi tiết luôn khớp với một mục còn trong danh sách.
- Hình minh họa hiện có vẫn là SVG giáo dục, không phải ảnh chụp hay CAD sản phẩm. Các linh kiện chưa có nguồn phù hợp được ghi rõ để tiếp tục bổ sung sau khi xác định part/module cụ thể.
- Xác minh thủ công trên `/components`: trang tải được, 48 mục hiện ra, panel nguồn hiển thị cho ESP32 DevKit V1. `npm.cmd run build` thành công sau cập nhật; không thêm/chạy test suite trong lát cắt này.

## Sửa vùng chọn linh kiện trên model Pico — 31/10/2026

- Khi raycast không gặp bounding sphere của mesh nhỏ, `BoardScene.pick()` trả về sớm nên vùng chọn dự phòng theo hình chiếu màn hình không chạy. Đã bỏ nhánh trả về sớm để Pico/Pico W/Pico 2 vẫn thử hit target rộng hơn cho linh kiện nhỏ.
- Mapping giữa node CAD và danh sách linh kiện được giữ nguyên; không gán tên/chức năng mới cho mesh chưa xác minh.
- `npm.cmd run build` thành công. Lượt này chưa xác nhận thao tác chọn trực tiếp trên trình duyệt vì browser cục bộ bị tắt trong cài đặt Work; cần kiểm tra click/hover trên từng model khi browser khả dụng.

## Khung sản phẩm Web/App và route registry — 31/10/2026

- Thêm `src/data/productRoutes.ts` làm nơi khai báo URL chuẩn Web/App và chuyển URL chức năng legacy sang app workspace; router, điều hướng app và dashboard dùng chung một phần registry.
- Giữ nguyên website `/`, namespace `/app/...` và các URL cũ; chưa di chuyển page module hay thay đổi persistence.
- Thêm `docs/mach-mo-final-web-app-framework.md` mô tả phạm vi website/app/PWA, route/feature map, ranh giới dữ liệu, simulator-provider contract, nguyên tắc an toàn, công cụ mã nguồn mở và lộ trình.
- Tại thời điểm cập nhật này chưa có service worker; lát cắt PWA bên dưới đã thêm offline app shell. Desktop/native app, learner account sync, simulator tổng quát và tích hợp tscircuit/rp2040js vẫn chưa có.
- `npm.cmd run build` thành công sau thay đổi. Không chạy test suite trong lát cắt này. Copilot Chat chưa được dùng để sinh/review mã; khung được sửa trực tiếp trong repo.

## Registry feature và hợp đồng simulation — 31/10/2026

- Tạo `src/data/productFeatureRegistry.ts` làm bản đồ feature dùng chung cho menu website và app workspace; khai báo tên, mô tả, route hai bề mặt, icon và trạng thái (available/limited/reference/planned).
- Chuyển điều hướng public và app workspace sang feature registry, giảm route/label trùng lặp. Route chuẩn vẫn lấy từ `productRoutes.ts`; URL legacy tiếp tục hoạt động.
- Tạo `src/simulation/contracts.ts` với provider descriptor, request, trace event, run report và stateful engine contract cho các mức scenario, code-subset, firmware emulator và circuit solver.
- Provider hiện hữu trong `src/lib/simulationProviders.ts` được gắn loại `code-subset-interpreter`, runtime browser và capability rõ ràng; chưa có engine scenario độc lập, firmware emulator tổng quát hay circuit solver.
- Đã đối chiếu các khối dữ liệu hiện có: capability registry, bundle version/import validation, local saved projects/revisions và schemaVersion workspace trong builder. Chưa thay đổi format lưu project.
- Thêm `src/types/circuitWorkspace.ts` mô tả kiểu document đã lưu (board, lesson, linh kiện, dây theo partId/pinId, code drafts và metadata mở rộng); `ProjectBundle.workspace` dùng kiểu này mà không tăng version hoặc đổi định dạng JSON.
- Tài liệu framework/README mô tả rõ những phần đang chạy so với khung interface tương lai. `npm.cmd run build` thành công; không chạy test suite trong lát cắt này.

## PWA app shell ngoại tuyến — 31/10/2026

- Thêm service worker production `public/sw.js`: lưu app shell/manifest/offline page, cache các bundle JS/CSS cùng origin đã tải, xóa cache phiên bản cũ khi worker mới kích hoạt và dùng app shell khi điều hướng không có mạng.
- Thêm trang fallback `public/offline.html`, đăng ký worker production-only và thông báo trạng thái ngoại tuyến trong app workspace.
- Không cache API/Supabase, firmware, tệp người dùng hoặc model 3D; các tính năng phụ thuộc mạng vẫn cần kết nối. Lần đầu phải tải online để cài service worker và cache shell.
- Cần kiểm tra update/lifecycle và điều hướng offline trực tiếp trên trình duyệt/thiết bị thật. Chưa có offline sync hoặc lưu trữ IndexedDB.

## Theo dõi báo cáo rà soát Học tập và Board & Linh kiện — 02/11/2026

- Thẻ project đã lưu/nhập hiện dùng tên bài tiếng Việt từ curriculum thay vì hiện raw ID; bài cũ/không còn trong curriculum có nhãn dự phòng dễ đọc.
- Alias `input` của NUCLEO trong simulator được ghi rõ là alias học tập và không xác nhận vật lý; mục pin header A0 vẫn giữ evidence riêng.
- Nút thao tác editor khối, chuyển chế độ code, điều khiển luồng và breadcrumb bài học có mức cao tối thiểu 44 px ở viewport hẹp. Chưa đo lại trực tiếp trên thiết bị/công cụ browser sau cập nhật CSS.
- Cache version của toàn bộ board GLB giờ lấy từ 12 ký tự SHA-256 trong asset lock; script `export-board-asset-lock.mjs` tự cập nhật phiên bản khi GLB đổi. Không đổi mesh, tên node hay quyền phân phối asset.
- Kiểm chứng lượt này: `npm.cmd test` 213/213 đạt; `npm.cmd run typecheck` và `npm.cmd run build` đạt; `node scripts/audit-board-models.mjs` kiểm kê 11 scene, không thiếu node hotspot. Chưa kiểm tra board thật, screen reader hoặc tối ưu hình học Uno/Mega.

## Tự bố trí linh kiện, nối dây trực tiếp và hướng dẫn firmware — 03/11/2026

- Thư viện linh kiện trong phòng lắp mạch hỗ trợ kéo một mục vào canvas để tạo linh kiện tại vị trí thả; vẫn giữ thao tác bấm để thêm. Vị trí được chuẩn hóa theo canvas và giới hạn trong vùng bố trí; không cho thêm board trùng hoặc vượt quá 100 linh kiện.
- Bổ sung tương tác kéo dây từ chân này sang chân khác với preview, nhận diện endpoint ổn định theo part ID/pin ID, chặn dây tự nối và dây trùng. Nối dây bằng chế độ chọn hai chân và bàn phím vẫn có sẵn làm lối thay thế.
- Bài kiểm tra tự động mới bao phủ chuẩn hóa vị trí thả, thêm linh kiện, giới hạn canvas, gesture bắt đầu trên chân và luật nối dây; `npm.cmd test` đạt 344/344, `npm.cmd run typecheck` đạt, `npm.cmd run build:local` đạt.
- Trên trình duyệt cục bộ đã xác nhận kéo linh kiện từ thư viện vào canvas và luồng nối dây bằng chọn hai chân. Trình điều khiển browser trong phiên không phát được gesture pointer kéo chân ổn định, nên thao tác kéo dây trực tiếp chưa được xác nhận thủ công trên browser hoặc chuột thật; Phase 3.2 vẫn mở.
- Bảng mô phỏng có hướng dẫn firmware AVR8js: xuất sketch nếu bài/board hỗ trợ, biên dịch bằng Arduino IDE, xuất HEX, xác nhận ATmega328P và quan sát D13/UART0. ESP32, Pico và các board không tương thích vẫn hiện giới hạn và đường dẫn chuyển sang Uno R3 hoặc mở công cụ HEX. Đây là hướng dẫn nối tới công cụ firmware AVR hiện có, không phải compiler, uploader hay firmware emulator mới.
- Chưa xác minh lắp ráp vật lý, chưa kiểm tra thao tác cảm ứng/screen reader, và chưa mở rộng target firmware. Không thêm dependency, không stage/commit/push.

