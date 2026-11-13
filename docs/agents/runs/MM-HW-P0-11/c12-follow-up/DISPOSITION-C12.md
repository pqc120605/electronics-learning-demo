# Tiếp nhận R-20261110-C12 và PDF ADR45

Ngày 10/11/2026. Đây là xử lý nguồn và phản biện review tư vấn do Founder chuyển; không gọi Claude hoặc liên hệ vendor. Không sửa r12, các cổng hoặc registry. Không có schematic/CAD/FE/bench hay phê duyệt mới.

## PDF đã kiểm

- Tệp Founder tải: `docs/research/downloads/p0-11/adr4520_4525_4530_4533_4540_4550.pdf`.
- Analog Devices ADR4520/25/30/33/40/50, **Rev. G**, 41 trang; revision history p2 ghi tháng 07/2025.
- SHA-256: `de2dca59e24477c2e186440e3d768cc06b7e3742448929a9f5721d5817247b34`.
- Đã kiểm định dạng PDF, trích xuất văn bản và render các trang 1/2/4/5/33/36/37/38/39. Trang 4 đã xem trực tiếp để phân biệt cột MIN/TYP/MAX. Hash từng ảnh trong `source-verification.json`.
- Tệp có tên gốc dài thay vì `adr45-revg.pdf`; không đổi tên hoặc thay tệp Founder. Các bản ghi NOT_RUN của lượt trước là lịch sử, được bổ sung trạng thái nguồn mới ở thư mục follow-up này; không ghi đè packet cũ.

## Các thông số ADR4525 được xác minh ở trang 4

| Đại lượng | Cột và điều kiện | Kết luận cho worksheet |
|---|---|---|
| Initial error B/C/D | MAX ±0,02%; B dùng dải nhiệt của grade tương ứng | 200 ppm có nguồn; chưa chọn orderable MPN |
| B-grade temperature coefficient | MAX 2 ppm/°C, box method, −40…125°C | Excursion 330 ppm là phép tính bảo thủ từ 2×165, không phải một hàng ±330 ppm trong datasheet |
| Line regulation | MAX 10 ppm/V, toàn nhiệt ghi trong bảng | 120 ppm là allowance tính trên toàn 12 V; không phải một giá trị source tách biệt |
| Load regulation A/B/C | MAX 80 ppm/mA source; 120 ppm/mA sink, toàn nhiệt | 1,2 ppm phụ thuộc giả định signed load ≤10 µA, chưa là tải mạch đã chứng minh |
| Solder heat resistance shift | **TYP ±0,02%; cột MAX trống** | 200 ppm trong worksheet chỉ là provisional allowance; **không được gọi MAX đã bảo đảm** |
| Thermal hysteresis / long-term drift | Các giá trị nằm ở cột TYP, điều kiện cycling/time riêng | Chưa có MAX áp dụng toàn đời để đóng H3 |

PDF đã gỡ khoảng trống truy xuất, đồng thời xác nhận rằng không thể lấy solder shift TYP làm một giới hạn chắc chắn. Khoảng trip partial 4,084573–4,107830 V vẫn chưa là full worst-case bound.

## Phân xử finding C12

| Mục | Disposition | Xử lý hiện tại và việc còn lại |
|---|---|---|
| F1 — hysteresis / biên H3 | ACCEPT về thiếu full bound; phép trừ TYP chỉ là sensitivity | Bổ sung bảng trước/sau TYP dưới đây. Hysteresis MAX vẫn TBD; không lấy TYP hoặc chia đôi nó làm guarantee. Phải chọn comparator/topology có cận phù hợp hoặc trình các đánh đổi có số; chưa chọn phương án mới. |
| F2 — G-B hết spare | ACCEPT về headroom và nhu cầu bảng constraint; làm rõ một điểm | 16/16 đúng, chưa có reset/domain matrix hoàn chỉnh. Các role veto/control đã nằm trong 16, không cần thêm một role “veto” chưa đếm. “Dùng chân rảnh” là pool trước phân bổ, không tự yêu cầu còn một chân rảnh sau phân bổ. Tín hiệu mới phải dừng để review tài nguyên/kiến trúc; **không tự bỏ E-channel hoặc đổi module** vì Founder đã giữ E1–E4. Bảng vai trò có ràng buộc không đồng nghĩa được gán GPIO trước duyệt cấu hình. |
| F3 — ADR45 chưa ghim | RESOLVED ở phạm vi nguồn | PDF/metadata/hash/ảnh trang đã có. Không suy F3 được xử lý là gate H3 PASS; các MAX còn thiếu vẫn thiếu. |
| F4 — queue sống trong manifest | ACCEPT; bảo toàn lịch sử | Không xóa queue khỏi manifest cũ hoặc sửa hash lịch sử. Lượt này ghim `queue-excerpt.json` chứa bản trích bất biến các task liên quan và hash nguồn khi chụp; manifest follow-up không ghim đường dẫn queue sống. |
| F5 — dòng bleed | ACCEPT | Làm rõ proposal tính toán dưới đây dùng bleed thụ động nối thường trực tại rail tương ứng, chưa thay BOM/r12. Có dòng nominal/MAX theo dung sai; không cộng hai lần vào RUN budget. Cần bảng ngân sách toàn sản phẩm trước r13. |

## Bảng độ nhạy hysteresis — không phải cận bảo vệ

Dùng biên nhỏ hơn của hai phía trong worksheet đã cộng provisional reference shift: 2,170089976 mV; Kmax = 1,638671573.

| Kịch bản minh họa | Phần điện áp quy về pack | Biên còn lại |
|---|---:|---:|
| Chưa tính hysteresis | 0 | 2,170090 mV |
| Trừ toàn bộ 1,2 mV TYP ở comparator | 1,966406 mV | **0,203684 mV** |
| Trừ nửa 1,2 mV TYP | 0,983203 mV | **1,186887 mV** |
| Hysteresis MAX thật, cùng aging/ripple/ground/error còn thiếu | TBD | **TBD — chưa có full bound** |

Không khẳng định cả hai phương pháp trừ TYP đều mô tả đúng switching threshold thật. Muốn chọn cách cộng phải xác minh định nghĩa offset/hysteresis, chiều trip và các tương quan trong datasheet/topology. Bảng này chỉ tái lập độ nhạy mà review nêu; aging, ripple và các hiệu ứng khác chưa được phân bổ vào một biên đã chứng minh.

## Bleed: nối ở đâu, dòng nào thay đổi

Proposal dùng hai điện trở xả độc lập nối thường trực từ mỗi rail nhận xuống GND của nó. Không dùng một lệnh MCU làm điều kiện duy nhất để xả; nếu đổi sang switched bleed phải review thêm lỗi switch và quyền cấp nguồn, không coi đã tương đương.

| Rail / điều kiện | Tổng dòng hai bleed | Ý nghĩa |
|---|---:|---|
| RUN_OUT, 2×10 kΩ nominal, 5,25 V | 1,050000 mA | Tải khi rail ON, bị thiếu trong bảng cũ |
| RUN_OUT, mỗi Rmin=9,9 kΩ nếu ±1%, 5,25 V | **1,060606 mA** | Power tổng≈5,568182 mW, dưới bộ điều kiện này |
| JOY, 2×22 kΩ nominal, 3,3 V | 0,300000 mA | Tải ON của proposal mới |
| JOY, mỗi Rmin=21,78 kΩ nếu ±1%, railMAX=3,6 V | **0,330579 mA** | Power tổng≈1,190083 mW; 3,6 V là giới hạn worksheet, chưa rail đã xác minh |

Nếu trần tổng RUN_OUT vẫn 0,500 A, sau khi dự trữ bleed RUN cận trên chỉ còn 0,498939394 A cho các tải khác trên cùng output. Không được giữ tải khác 0,500 A rồi cộng bleed ngoài trần. Dòng JOY do B01 cung cấp có thể đã nằm trong tổng RUN; phải trace đường nguồn thực trước khi quy về pack để tránh cộng lặp. Hai bleed JOY mới tăng nominal khoảng 0,267 mA so với một bleed 100 kΩ tại 3,3 V; MAX tăng thêm chưa khóa nếu dung sai/bias của baseline chưa biết.

OFF không đồng nghĩa mọi bleed tiêu thụ đúng zero: khi rail thật zero thì dòng R là zero, còn điện áp dư hoặc cấp ngoài phải tính KCL. Các phản ví dụ, trạng thái một bleed hở, bleed short và lỗi GND vẫn còn nguyên nghĩa vụ kiểm chứng. Không có kết luận mới rằng idle/standby toàn sản phẩm đã đạt.

## O1–O4 và các câu hỏi của reviewer

- **O1:** đồng ý chưa trình duyệt hash r12. P0-11 có các giá trị proposal khác r12; revision tiếp theo phải hợp nhất sau khi phương án đủ chứng cứ, rồi review đúng bytes. Không tự tạo r13 chỉ để đổi số đang còn TBD.
- **O2:** số thiếu tại 0,80 mm/5° là 0,003044 mm, không phải thiếu cả hành trình. Phương án 0,90 mm chưa là kích thước đã duyệt; tránh cộng góc hai lần trong loss.
- **O3:** receipt lịch sử thiếu message ID đã công khai, không dựng ID. Receipt G-B/M-A có tham chiếu câu hỏi HQ hiện có.
- **O4:** đã đọc queue và `dispatch-sequence.md`. Queue PREFLIGHT-001 vẫn scoped, chưa ghi review; -002 waiting có lý do rõ: review C08/C09 đã nhận nhưng giữ baseline lịch sử, thực thi đi qua -003/P0-08. -003 cũng còn waiting với lý do manual exact-snapshot review pending, trong khi dispatch-sequence ghi đã nhận C10. Đây là thiếu đồng bộ hồ sơ đóng review, không phải bằng chứng validator chưa được viết. Chưa tự chuyển các task thành done. Cần kiểm toàn văn C03/C08/C10, hash và DISPOSITION rồi cập nhật lead queue đúng scope.
- Hash hiện tại của validator: `c03af0c170eb1eb894852921b6899331a8434e4c1b833ff089d479e4fe064bd7`; test file: `dd380346fe4140870d186aadc7d6aae1481240f921eeead5d345d9ef2845f2c6`. Prefix/suffix khớp mô tả C10 trong dispatch-sequence; chưa thay việc đọc đầy đủ finding/review để đóng hành chính.

**Trả lời ngắn:** comparator thay thế có hysteresis MAX vẫn chưa chốt; bleed đang được phân tích như phần tử thụ động thường trực; queue preflight có lịch sử chưa đồng bộ đầy đủ; PDF ADR45 hiện đã có. Không có gate/MPN/hash/lease nào được duyệt từ các trả lời này.

## Giới hạn lượt tiếp nhận

Đã kiểm file gốc, ảnh bảng và số học; không chạy lại tests vì không sửa validator, queue, mã sản phẩm hoặc cấu hình. Review C12 được lưu như đầu vào tư vấn do Founder chuyển; không phải Box08 gate approval. r12 vẫn giữ đúng hash cũ, bốn cổng trước schematic vẫn OPEN và B1 vẫn NOT_READY.
