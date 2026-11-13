# M5 — nghiên cứu CAD tham chiếu và kiểm va chạm

Ngày 10/11/2026 · thuộc P0-15. **Đã dựng và kiểm mô hình tham chiếu; chưa nhận M5 làm cơ cấu sản phẩm, B1 vẫn NOT_READY.** Không FE, đo lực, chế tạo, PCB, pin assignment hoặc thiết bị thật.

## Quyền thực hiện và hồ sơ

Founder trả lời nguyên văn “Duyệt nghiên cứu CAD M5” cho `MOBOT-AA-M5-CAD-STUDY-r1`, SHA256 `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`. Proposal gốc không sửa. Biên nhận: `founder-approval.json`; phạm vi/phương pháp: `protocol.json`.

Codex lead là người ghi duy nhất. Queue tiếp tục đúng P0-15, chế độ lead; không cấp builder lease hoặc B1. Đây là nghiên cứu CAD được duyệt riêng, không dùng quyền nghiên cứu để ghi approved cho cấu hình handset/r12 hay thay validator. Preflight riêng kiểm hash duyệt, biên nhận, phạm vi task và tham số trước chạy; nó không phải kiểm dispatch B1.

## Artifact đã tạo

- `m5_model.py`: bốn cấu hình tham chiếu: cửa đóng, đầu cắm có khóa đang cắm, đầu cắm thường chạm cửa đóng, ca cắm nghiêng gây giao thoa.
- `m5-program-reference.xbf`: bản CAD tham chiếu để mở lại; 12 occurrences/10 hình khác nhau, bao hình **40×45,1×22,8 mm**. Đây chỉ là cụm khảo sát và một khối reserve cầu, không toàn bộ tay cầm/cassette/B01. Không suy ra kit fit, số chi tiết sản xuất, khối lượng hoặc giá.
- `program-xray.png`, `generic-blocked.png`, `tilted-reference.png`: ảnh đã mở kiểm tra. Khung xám, collar xanh lục, khóa vàng, cửa cam, đầu dò xanh lam, reserve cầu tím. Đầu dò/cửa đang thể hiện ở pose áp đặt.
- `sweep-results.json`, `kernel-results.json`, `adversarial-results.json`: số liệu và hash nguồn mã/tham số tại lần chạy.

CAD viewer đã mở đúng model. Không xuất STL/3MF/STEP cho chế tạo; file XBF và ảnh chỉ là hồ sơ nghiên cứu được phép.

**Sai khác so với protocol đã được công khai sau review:** protocol dự kiến thống kê riêng tangency, nhưng `overlap()` hiện chỉ nhận positive overlap lớn hơn EPS. Tangency/overlap trong tolerance chưa được phân loại hoặc đếm riêng ở đợt này. Có54mẫu trong31.590mẫu không đi vào nhóm positive-contact; không được diễn giải chúng là đã ngắt điện hoặc toàn miền d≥0 đã được chứng minh. Protocol và kết quả thô giữ nguyên để truy vết; bảng dưới là thống kê positive-volume, không báo hoàn tất coverage biên. Xem `DISPOSITION.md`.

## Kết quả số và giới hạn

| Phép kiểm | Kết quả thực tế | Điều không được suy ra |
|---|---|---|
| Lưới pose của collar/các đầu dò | 31.590 mẫu; 31.536 mẫu giao miền có thể tiếp xúc điện theo khối tham chiếu. Cả hai đầu dò có giao thoa ở toàn bộ các mẫu đó | Không chứng minh phần kim loại thật có mặt ở mọi vị trí hoặc bao phủ liên tục |
| Góc nghiêng khi tâm đầu cắm còn trước miệng | 432 mẫu có thể giao miền contact; không bỏ qua chỉ vì d<0 | Không là thời điểm contact thực của clone B01 |
| Đầu cắm thường và cửa áp đặt | 162 đường lấy mẫu bị chặn trước contact khi cả hai cửa đóng; tương tự khi chỉ một cửa kẹt mở | Không chứng minh khóa/cam/chốt thật duy trì đúng các pose cửa này |
| Đối chứng hai cửa kẹt mở | 162/162 đường tới miền contact | Cố ý xác nhận phép kiểm phát hiện bypass, không phải ca được chấp nhận |
| Thiếu một khóa, xét riêng ở pose danh định | 6 đường bị chặn nếu cửa tương ứng còn đóng; thêm lỗi cửa đó kẹt mở thì 6 đường tới contact | Ca kết hợp lỗi và luật identity áp đặt, không bằng chứng độc lập cơ khí |
| SAT so với kernel CAD | 84 phép so sánh ở 6 ca cho cùng kết quả | Không kiểm toàn bộ miền bằng kernel |
| Khung CAD tại 6 ca kernel | Giao thoa khung ở ca `inserted_180_tilt` và `early_tilt` | Không báo toàn bộ quá trình cắm không va chạm |

Ở ca cắm nghiêng sâu, collar giao khung khoảng17,785 mm³, thanh nối khoảng5,069 mm³, hai khóa khoảng5,779/8,470 mm³. Đây là thể tích giao nhau của các khối tham chiếu, không lực, áp suất hay độ biến dạng. Các pose cưỡng bức được dùng để chẩn đoán, không coi là trạng thái lắp hợp lệ.

## Ba phản biện đã được đưa thành ca kiểm

Box 03 đọc độc lập source/protocol và trả `BOX03-ADVERSARIAL-REVIEW.md`, turn `01a1c542-e10f-7892-aa23-ad9ff8ba4847`. Lead đối chiếu trước khi sửa cách kiểm/diễn giải.

1. **Khóa quay nhưng luật cửa chưa quay theo.** 8 ca vị trí đầu khóa theo tọa độ host kiểm bằng vertex CAD và phép quay số học. Roll180° đổi khóa sang kênh đối diện; nghiêng5° làm thời điểm tới trigger khác luật scalar. Kết quả này được ghi là thiếu mô hình linkage/contact, không đổi nhãn “áp đặt” thành cơ cấu đã hoạt động.
2. **Khối bao đặc không phải vật liệu chắc chắn có.** Giữ khối bao để nghiên cứu interference; thêm vỏ rỗng bo tròn giả định wall0,15 mm và kích thước8,22×2,37×6,51 mm tại6ca đầu dò. Đây chỉ là sensitivity, không vật liệu MIN hãng bảo đảm. Một đầu dò nhỏ đặt ở góc cho outer-box hit nhưng vỏ minh họa miss, xác nhận nguy cơ false positive của cách suy presence từ bounding box. Ca đó không phải đầu dò full-aperture hiện tại; không kết luận đầu dò hiện tại chắc chắn sai hoặc đúng ngoài phạm vi đã kiểm.
3. **Ca lỗi collar trước đây bỏ cả thanh nối.** Tách4ca cùng pose và luật cửa: đủ cả hai; chỉ bỏ collar; chỉ bỏ thanh nối; bỏ cả hai. Tại d6,4 mm, bỏ riêng collar vẫn làm hai đầu dò không gặp vật thể, dù giữ thanh nối. Bỏ thanh nối nhưng giữ collar vẫn có giao thoa. Các hình lỗi được ghi **synthetic**, không coi là adapter có thể lắp được.

## Những phần chưa được hiện thực hóa

- Luật mở cửa vẫn là chuyển động áp đặt; chưa có cam, linkage, pawl, lò xo hoặc khóa endpoint cơ khí thực.
- Chưa xác lập keying ngăn mọi cáp lạc/vật dẫn thao tác đi vòng; hai cửa cùng kẹt mở có bypass trong mô hình.
- Cầu chỉ là reserve ở vị trí nâng12mm. Không kiểm chuỗi chuyển mode, contact thực, MAX overlap, trailing terminal hay giữ/ngắt nguồn.
- Không mô hình elasticity, ma sát, 100N/200N, mòn, dung sai sản xuất, vật liệu, B01 thật/anten, cassette hoặc fit cả bộ.
- Phép quét là lưới hữu hạn, không proof liên tục. Frame chỉ kiểm bằng kernel tại các ca chọn; không trộn số lượng mẫu đầu dò với độ phủ frame.
- Bảo vệ pin fail-ON/latch/reverse và các lỗi điện P0-15 vẫn mở, không bị quyền CAD xóa đi.

**Disposition thiết kế:** không adopt M5 hiện tại. Bộ mô hình có ích để loại các suy luận sai và xác định việc cần làm tiếp: coupling theo vị trí khóa trong host, mô hình cam/chốt thật, clearance khi nghiêng và tập vật liệu/contactor có nguồn. Chưa cần Founder chọn lại B hoặc duyệt sản phẩm/MPN từ ảnh CAD này.

## Lệnh và kiểm chứng

| Lệnh | Exit / chứng cứ |
|---|---|
| `python -X utf8 .../preflight.py` |0, đúng consent/hash/task active |
| `cad.cmd run .../m5_model.py` |0, bốn model reference; không thêm dependency |
| `python -X utf8 .../run_sweep.py` |0, số mẫu và ca đối chứng nêu trên; không phải hardware PASS |
| `cad.cmd run .../kernel_check.py` |0,84so sánh/6ca, có2ca giao khung |
| `cad.cmd run .../adversarial_checks.py` |0,8ca khóa/6ca vỏ/4ca lỗi và đối chứng false positive |
| `cad.cmd export <model> .../m5-program-reference.xbf` và inspect lại |0; file mở được, bao hình/parts khớp model |
| `node D:/StartupOS/docs/agents/validate.mjs` | Kết quả cuối trong `final-checks.json`; không sửa validator |
| FE/physical/firmware/browser/frontend |NOT_RUN; ngoài phạm vi và không sửa source ứng dụng |

Đã sửa một lỗi đặt tên biến trong kết quả quét trung gian khiến trường danh sách ví dụ bị ghi thành số; chạy lại với biến riêng, kiểm kiểu và ghim provenance. Bảng trên dùng dữ liệu cuối, không dùng kết quả trung gian đó. Engine CAD cần quyền mở socket cục bộ; đã dùng cơ chế cấp quyền chạy công cụ hiện có, không cài package.

Proposal đã duyệt, r12 và các tệp snapshot P0-14/P0-15 trước study được kiểm riêng trong **file cùng thư mục study** `final-checks.json`; không sử dụng file cùng tên ở run cha làm bằng chứng CAD. Review đầu ở `BOX08-STUDY-REVIEW-1.md`; bản report được review đầu được giữ nguyên tại `REPORT.review1.md`. Kết quả tái kiểm hai đính chính được ghi riêng khi đã nhận, không tự ghi reviewer PASS.
