# C11-MECH-P1 — hình học duy nhất cho phân tích r12

PROPOSED / INSUFFICIENT_EVIDENCE. Đây là proposal phân tích, chưa là bản vẽ chế tạo/geometry được duyệt. Không CAD, FE, MPN, hash approval hoặc lease. Giữ hai đường kim loại độc lập, mỗi đường tự chịu100N service/200N proof khi đường còn lại không khả dụng. Tách yêu cầu100N trên từng nút nhả bằng tay, không dụng cụ.

## Chuẩn hình học và supersession

Chọn proposal lớn spherical-contact trong `box03-contact-dogleg-100N.md` làm chuẩn duy nhất của lượt phân tích này. Hệ tọa độ:x kéo cassette;y chiều nhả key/nhịp;z chiều rộng. Chỉ một định nghĩa trục áp dụng cho tất cả phép tính/RFQ.

| Thông số | C11-MECH-P1 |
|---|---|
| Key | dài40mm theo y; lõi chịu lực còn lại≥12mm theo z×8mm theo x |
| Striker/support | giữa y0; đỡ y±12mm, nhịp24mm |
| Contact | lồiR20,0±0,1mm; lõmR20,5±0,1mm; patch hữu ích≥Ø8mm |
| Guide | hai vùng cách≥24mm; rơ chênh≤0,10mm; lệch tâm sau lắp≤0,20mm |
| Frame mỗi nhánh | tiết diện hiệu dụng≥16×8mm; đoạn10mm song song lực x; lệch tâm≤5mm |
| Dogleg | đẩy vào0,80mm nominal; tổng loss≤0,30mm; separation≥0,50mm trước nhả |
| Tab | lõi≥8×8mm; nhô≤2mm; depth giữ sau loss≥2mm |
| Permission gate | đoạn làm việc1,2mm; tải mở ngoài≤0,30N; pulse mục tiêu3s |
| Interlock electrical | x_locked,max≤0,50mm; x_contact_change,min≥1,00mm |

Superseded trong phạm vi lượt này: key8×2,8/nhịp9/frame12×5,8; dogleg0,60/0,30; ứng suất43,05MPa của `direct-return-geometry`; motor/clutch, prying/pawl cũ; tiêu chí loại actuator2N/3,2mm. RFQ cũ gọi X40mm phải đọc lại thành y40mm. Các file cũ giữ nguyên như lịch sử, không tái dùng review của chúng cho r12.

**Lõi còn lại không phải kích thước phôi.** Túi lõmØ8/R20,4 sâu≈0,396mm; hai mặt có thể mất≈0,792mm. Phôi nominal8mm không bảo đảm lõi8mm. Đề xuất phôi có chứng chỉ≥10mm và gia công giữ lõi8mm; dung sai/phôi/envelope cuốiTBD và cần review. Bao quét key đã>64mm trước clearance/nút; khối lượng/giá/fit tổng chưa chứng minh. Vì thế đây là một chuẩn section/kinematic proposal, chưa phải geometry kín đủ CAD/FE.

## Vật liệu

SSAB Domex355MC, bảng Mechanical Properties cho6,01–16,00mm công bố ReH≥355MPa và Rm430–550MPa, thử dọc. Do đó8mm và phôi10mm có cơ sở công bố; nhận xét C11 rằng chỉ có nguồn1,8–3mm cần sửa. [Nguồn hãng](https://www.ssab.com/en/brands-and-products/ssab-domex/product-offer/355mc); bản HTML/hash được ghim trong `docs/research/downloads/c11-r12/mechanical-sources.json`.

Điều này không xác nhận thép sẽ mua/gia công. Chứng chỉ lô, hướng cán, lõi sau gia công và bề mặt cònTBD. E210GPa,ν0,30 và mật độ7,85g/cm³ là giả thiết phân tích, không giá trị được nguồn này bảo đảm. Không suy S–N/mỏi từ giới hạn chảy.

## Free-body và tính lại

Đường lực mỗi nhánh: tay cầm kim loại→sống cassette→striker→contact giữa→key→hai contact đỡ→frame→tay cầm đối diện. Không dùng chia tải A/B. Tại200N, hai phản lực100N; Mkey=FL/4=1200Nmm. Frame có momentFe=1000Nmm; đoạn10mm song song lực không cộng2000Nmm. Nếu đổi hướng đoạn này, tính lại.

| Một nhánh |100N service|200N proof|300N screening chưa duyệt|
|---|---:|---:|---:|
| Key bending nominal MPa |4,6875|9,375|14,0625|
| Key shear bảo thủ dùng toàn F, MPa |1,5625|3,125|4,6875|
| Frame axial+bending MPa |3,71094|7,42188|11,13281|
| Võng key lý tưởng mm |0,000268|0,000536|0,000804|

Hertz không ma sát, đàn hồi đẳng hướng: E*=115384,6MPa; R*=585,63..1366,80mm. Tại200N radius0,913..1,211mm, áp suất đỉnh tới114,53MPa. Margin mép sơ bộ≈4−1,211−0,086−0,20=2,503mm. Đây không phải hệ số an toàn yield: áp suất contact không phải von Mises. Không dùng355/9,375 để chứng minh cả cụm. Stem chịu100N nút: bending9,375+axial1,5625=10,9375MPa nominal; tab bending/shear2,34375MPa. Fillet/Kt/contact/anchor/fatigue chưa đóng. `calculations.json` ghi cả cận và công thức có thể chạy lại.

## Cửa cấp quyền: lực hồi và lỗi

Allocation mới, chưa đo: spring riêng0,16–0,18N toàn1,2mm; drag guide≤0,05N; feedback≤0,02N; gravity≤0,01N; actuator unpowered drag/remanence≤0,02N. Mở ngoài≤0,26N; yêu cầu net pull actuator≥0,30N sau ma sát/lò xo nội. Hồi net≥0,06N; tiêu chí đề xuất net closing≥0,05N kể cả nóng/lão hóa. Gravity allocation hàm ý khối lượng phần chuyển động≈≤1g nếu không hạn chế hướng. Không biết một thành phần→TBD, không coi tổng đạt.

Lực100N của nút phải kết thúc ở stop/frame kim loại riêng, không kẹp cửa/plunger. Lost-motion/stop placement/deflection chưa đủ geometry để chứng minh; nếu cửa bị preload100N thì0,30N không mở nổi. Kẹt cửa giữ khóa và vetoRUN; không tăng lực actuator để cố phá kẹt. Gate-closed và key-engaged là hai xác nhận khác nhau. Mất nguồn/cam chung/datum yếu/dị vật có thể hỏng cả hai nhánh; hai sensor không tự chứng minh độc lập.

Absent/partial/one-key engaged/misaligned: vetoRUN, chưa claim retention100N. Quá lệch tâm0,20mm/rơ0,10 trên24mm hoặc mất overlap cho phép: reject/jam locked, không báo khóa. Phải xét một nhánh hỏng, kéo cassette đồng thời100N trên một/hai nút, và contact đổi trước physicalOFF. Đẩy0,80mm chỉ tạo separation0,50mm nếu chuyển động đúng normal và tolerance stack đủ; tính thoát cả ba contact và swept interference cònTBD.

## Tiêu chí review đề xuất và tình trạng phân tích

Các mức sau là proposal để Box08/Founder xét, chưa phải thử nghiệm được cấp quyền:

- Static local yield factor≥2 ở100N;≥1,5 ở200N proof và100N nút; allowable tại355MPa là236,7MPa cho proof, không áp vào singularity hoặc Hertz pressure.
- Proof200N/60s mỗi nhánh độc lập; không nhả, nứt/mảnh nguy hiểm; biến dạng dư không ăn quá0,05mm ngân sách.
- Life25000 chu kỳ cassette và100000 chu kỳ gate, kiểm lại proof/force/feedback sau life. Số chu kỳ cần luận chứng tần suất sử dụng.
- Fatigue factor≥1,5 hoặc tiêu chí damage có căn cứ; S–N/process/load spectrumTBD, chưa thể kết luận mỏi.
- Forced-pull screening300N mỗi nhánh+kết hợp100N nút; không biến thành product rating300N; deformation/failure-mode chưa phân tích đầy đủ.
- Screening môi trường đề xuất: rơi1m sáu mặt; rung5–200Hz/1g/30min mỗi trục; aging40°C/90%RH/96h; cycling0–50°C. Profile cần điện/QA xét, không quyền thử pin; sau conditioning không false-lock, giảm overlap hoặc lực hồi dưới0,05N.

Static beam/Hertz đã chạy lại có điều kiện. Stress concentration/contact assembly, fatigue, drop/vibration/spring aging: chưa đủ mô hình/số liệu để phán đạt; **insufficient_evidence**. CAD:NOT_RUN; FE:NOT_RUN. Chưa có exact configuration/hash được duyệt cho build/CAD, chưa có geometry kín, solver/mesh/convergence/BC được kiểm. Không gọi tính beam là FE. Sau duyệt, FE cần nonlinear-contact/friction sensitivity, một nhánh, các tải/kẹt/lệch, finite frame boundary, reaction balance, mesh convergence và đối chiếu analytic. Mẫu vật lý bổ sung ma sát, độ rơ, force nóng, mòn/lão hóa thực; chi phí/mẫu/fixture/thời gianTBD, Founder chọn sau.

## Shortlist actuator cập nhật

Takaha SSBH-0830-01 và Adafruit2776 đều còn là ứng viên, không MPN được chọn. Takaha PDFp1 có stroke5mm và curve5V/20°C trước nóng; chưa là net MIN toàn miền. Adafruit công bố3mm/80gf, chưa bảo đảm net pull tại đoạn1,2mm cần dùng. Không loại Adafruit bằng2N/3,2mm cũ. Phải định vị đoạn làm việc trong stroke, spring/preload/stops, kiểm return/remanence, Rmin lạnh, duty3s/retry, flyback và life. Takaha bảng7,5Ω/600mA và V/R≈667mA có bất nhất nominal; không biến thành MAX. Chi phí landed/gia công để giữ bộ<1triệuVND chưa có cận và không được liên hệ vendor.
