# Claude Code review brief — Mạch Mở

Mở Claude Code ở thư mục gốc `D:\StartupOS\electronics-learning-demo`, đọc `README.md`, `docs/MACH-MO-MVP-STATUS.md`, `docs/product-landscape-and-web-app-split.md` và các mã nguồn liên quan trước khi review. Mục tiêu là hiểu đúng sản phẩm hiện có rồi tìm lỗi và đề xuất cải tiến; **chỉ review, không sửa file, không cài package, không commit hoặc thay đổi dữ liệu** trong lượt này.

## Bối cảnh sản phẩm

Mạch Mở là nền tảng học điện tử, vi điều khiển và IoT cho người mới. Web là nơi giới thiệu, học nhanh, khám phá board/linh kiện, lắp thử mạch và dùng một số công cụ. Định hướng dài hạn là web demo dễ vào, còn app chuyên sâu đảm nhiệm project lớn, workflow EDA/runtime và công cụ nâng cao. Người dùng muốn hoàn thiện khung tính năng, flow và công cụ hỗ trợ trước khi mở rộng mạnh thư viện.

Người mới là nhóm chính. Trải nghiệm cần nói rõ tính năng nào là mô hình tham khảo, mô phỏng hành vi, kịch bản minh họa hay mô phỏng điện thật; không được tạo cảm giác rằng hình 3D hoặc hoạt ảnh đồng nghĩa đã xác minh board/linh kiện ngoài đời.

## Hiện trạng cần hiểu trước khi đánh giá

- Ứng dụng React + TypeScript + Vite, điều hướng bằng React Router; các trang chính ở `src/pages`, dữ liệu ở `src/data`, xử lý mô phỏng/circuit ở `src/lib`.
- Các tuyến đáng chú ý: `/`, `/app`, `/boards`, `/components`, `/build`, `/topics`, `/projects`, `/learn/esp32-led`, `/tools/firmware-hex`, `/tools/electronics-calculators`, `/tools/spice` (cũng có `/app/tools/spice`).
- Có curriculum 11 bài; 8 bài dùng parser Arduino subset giới hạn và 3 bài dùng kịch bản khái niệm cố định. Builder chưa chạy firmware MCU tổng quát, cũng chưa tự chuyển mạch lắp sang netlist; một công cụ SPICE riêng chạy ngspice WASM cho netlist analog bị giới hạn. Chưa có ERC/DRC tổng quát và chưa mô phỏng đầy đủ hành vi điện của các linh kiện trong curriculum.
- Có 21 hồ sơ board, nhưng chỉ một phần có viewer CAD/3D. Mỗi model có trạng thái nguồn/revision/độ tin cậy; không được suy diễn rằng model tham chiếu xác nhận mọi clone, BOM hoặc revision thương mại.
- `/build` hỗ trợ workspace mạch học tập, preset bài, dây theo `partId`/`pinId`, schematic giáo dục, 2D/3D minh họa và kiểm tra topology heuristic. Đây chưa phải EDA chuẩn.
- `/tools/firmware-hex` đọc Intel HEX ở trình duyệt và có spike AVR8js riêng cho ATmega328P; không compile/upload firmware tổng quát.
- `/tools/electronics-calculators` vừa được thêm với bốn phép tính giáo dục: điện trở LED, chia áp ADC, pull-up I²C, và RC. Logic ở `src/lib/electronicsCalculators.ts`, UI ở `src/pages/ElectronicsCalculatorsPage.tsx`, route trong `src/App.tsx`, lối vào ở `src/pages/AppHomePage.tsx`. Các phép tính có giả định lý tưởng; không phải SPICE hoặc xác nhận thiết kế theo datasheet của một board cụ thể.
- `/tools/spice` (và `/app/tools/spice`) dùng `eecircuit-engine`/ngspice WASM trong Web Worker cho netlist giới hạn: `.op`, `.tran`, `.ac`, `.dc`, tối đa 16 kB/160 dòng, dataset 20.000 điểm, timeout 30 giây. Có editor, ba ví dụ, đồ thị/bảng, CSV, kiểm tra cú pháp và trạng thái truy cập được. Đây là solver analog độc lập; không chạy firmware MCU, không nhập dây từ builder tự động, và không bảo đảm hội tụ hay model vendor bất kỳ.
- Kiểm tra dự án: `npm.cmd test`; build: `npm.cmd run build`. Dùng output mới nhất làm bằng chứng; không dựa vào báo cáo cũ trong tài liệu.

## Nhiệm vụ review

1. **Tìm lỗi có thể tái hiện:** crash, sai tính toán, dữ liệu mất/ghi đè, route hỏng, state không đồng bộ, lỗi nhập liệu, edge case, lỗi type/build, lỗi accessibility hoặc UX gây hiểu nhầm. Đọc code thực tế và chỉ ra vị trí cụ thể.
2. **Rà riêng các bộ tính điện tử mới:** kiểm tra dimension/unit, giới hạn E24, làm tròn, dữ liệu không hợp lệ, các giả định I²C/ADC, tình huống không có giá trị điện trở khả thi, và độ chính xác câu chữ/kết quả trên UI. Đối chiếu công thức với nguồn kỹ thuật có thẩm quyền nếu cần; ghi URL và không đưa khuyến nghị phần cứng vượt quá dữ kiện.
3. **Đánh giá test:** xem `tests/*.test.mjs`; nêu lỗ hổng trong smoke test, kiểm tra browser/route, parser, circuit rules, input edge cases và khả năng bảo vệ regression. Chỉ đề xuất test bổ sung, không viết test trong lượt review.
4. **Rà kiến trúc và bảo trì:** đặc biệt kích thước/trách nhiệm của `CircuitBuilderPage.tsx`, ranh giới giữa data/model/view, import/export project, simulator provider và các thư viện mã nguồn mở. Đề xuất thay đổi nhỏ theo thứ tự, tránh tái cấu trúc lớn không cần thiết.
5. **Rà sản phẩm và flow:** học các ý tưởng của Wokwi, Tinkercad, KiCad, EasyEDA, Fritzing, Falstad, EveryCircuit và Pindexio nhưng đánh giá theo phạm vi Mạch Mở; ưu tiên công cụ/flow và làm rõ năng lực mô phỏng, chưa ưu tiên tăng số lượng board/linh kiện.
6. **Rà rủi ro kỹ thuật:** bảo mật dữ liệu local/import, backend/auth nếu hiện diện, accessibility, performance/load 3D, license/provenance asset và những tuyên bố trong docs không còn khớp code.

## Cách trình bày kết quả

Trả lời bằng tiếng Việt, theo thứ tự:

### A. Lỗi/phát hiện cần sửa

Mỗi mục gồm mức độ `Critical/High/Medium/Low`, file và dòng, bằng chứng trong code hoặc bước tái hiện, tác động, và hướng sửa tối thiểu. Chỉ ghi lỗi khi đã xác minh; nếu mới là nghi ngờ, ghi rõ cần kiểm tra thêm.

### B. Thiếu kiểm thử hoặc chưa được kiểm chứng

Nêu chính xác route, input, thiết bị, dữ liệu hoặc hành vi chưa được kiểm tra. Tách test tự động khỏi kiểm thử người dùng/board vật lý.

### C. Đề xuất nâng cấp theo thứ tự

Đưa tối đa 5 lát cắt nhỏ, mỗi lát có giá trị cho người học, phạm vi code dự kiến, phụ thuộc, rủi ro và cách nghiệm thu. Ưu tiên tools/flow/quality gates trước mở rộng library.

### D. Tóm tắt kiểm chứng

Chạy `npm.cmd test` và `npm.cmd run build` nếu môi trường cho phép; báo nguyên văn lệnh, kết quả và các lỗi tồn tại. Không sửa code. Kết thúc bằng danh sách 3 việc tiếp theo nên làm, theo đúng thứ tự.

Không yêu cầu rewrite sản phẩm, không xem TODO hoặc tài liệu cũ là hiện trạng nếu code đã đổi, không giả định khả năng simulator mà sản phẩm chưa có, và không trình bày khuyến nghị như lỗi đã xác nhận.
