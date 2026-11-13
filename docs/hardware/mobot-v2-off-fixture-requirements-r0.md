# MOBOT-HANDSET-OFF-FIXTURE-REQ-r0

Source Box02 turn `01a1bb9e-0868-7fa0-90ec-82f982b204a5`, Sol/high. Status: requirements proposal only; not an approved hardware configuration. Measurements NOT_RUN, missing limits OPEN.

Đề xuất hồ sơ **`MOBOT-HANDSET-OFF-FIXTURE-REQ-r0`**, chỉ gồm yêu cầu và tiêu chí nghiệm thu. Fixture rời có thể tạo bằng chứng trước PCB sản phẩm, nhưng **hiện chưa đủ cấu hình để xin duyệt build**. Chưa sửa file hoặc thực hiện thao tác vật lý.

**Phạm vi và điều kiện tương đương**

Đề nghị một cụm OFF rời, có giao diện tháo được để sau này đối chiếu với carrier. Hai cấp kết quả:

- **Kiểm chức năng:** dùng tải và miền nguồn mô phỏng; chứng minh nguyên lý, chưa đóng `HANDSET-POWER-DESIGN`.
- **Kiểm tương đương:** dùng đúng cụm B01–cáp–gá–chốt và phần điện đại diện đủ các cận dưới đây. Chỉ kết quả cấp này mới được trình Box08 để đóng blocker sản phẩm.

| Phần phải đại diện | Điều kiện chuyển bằng chứng sang carrier |
|---|---|
| Hàng rào Source, I/O và JOY_VCC | Cùng phần tử/revision, cấu trúc điều khiển, trạng thái mặc định, đường rò và đáp ứng qua mất nguồn. Không thay switch bằng relay rồi nhận tương đương. |
| Sense, reset, veto, quyền nhả chốt | Đại diện cả pull-up, clamp, bias, GND, lỗi chung và đường cấp actuator; đo trạng thái điện thực. |
| Boost, tụ và đường xả | Ceff, điện áp tích trữ, trở kháng và dòng bơm lại phải bao được carrier. Bỏ boost chỉ cho phép kết luận về đoạn mạch phía sau nó. |
| B01 và mọi nguồn ngoài | Đúng mẫu truy xuất được, hoặc mô hình có cận được chứng minh. Mô hình không thay được bằng chứng cơ khí/cấp ngược của đúng B01. |
| Cáp, đầu ghép, bó dây | Cùng revision hoặc có chứng minh bao trùm điện trở, ký sinh, đường hồi và trình tự tiếp xúc. |
| Gá, phích, chốt, lẫy bảo trì | Đúng cụm dự kiến dùng; đại diện độ rơ, hướng kéo, biến dạng và hành trình. Không cần toàn bộ vỏ nếu chứng minh phần bỏ đi không ảnh hưởng. |

Mọi khác biệt khi chuyển sang carrier phải có bảng đối chiếu. Thay đổi ảnh hưởng rò, xả, bias hoặc cơ khí làm mất hiệu lực các ca liên quan; fixture PASS không tự miễn kiểm tra carrier.

**Nguồn bench và tải**

Có thể thử OFF **không dùng pin Li-ion hoặc motor**:

| Miền thử | Yêu cầu |
|---|---|
| Thay pack 1S | Nguồn lập trình mô phỏng điện áp, trở kháng và sườn mất nguồn. Trạng thái “pack tháo” phải là ngắt vật lý, không chỉ đặt nguồn về 0 V vì nguồn có thể hút dòng và che cấp ngược. |
| RUN/boost | Giữ boost đại diện khi kiểm toàn tuyến. Cấp bench trực tiếp vào upstream Source chỉ dùng cho phép kiểm riêng Source. |
| CHARGE | Mô phỏng VBUS/veto và các đường rò liên quan. Không thực hiện sạc, không kết luận tương thích Jauch/H3. |
| PC và sink khác | Dùng bộ mô phỏng nguồn/sink có hành vi CC, VBUS, trở kháng và bảo vệ đã xác định; sau đó kiểm đúng B01/cáp theo quyền riêng. |
| Tải | Tải điện tử/tải thụ động đại diện công suất và tụ; không dùng tải để vô tình giữ rail thấp, che Source còn dẫn. |

Giới hạn dòng nguồn bench phải đủ để ca “switch kẹt dẫn” vẫn tạo dòng phân biệt được; nếu nguồn vào current-limit thì ca đó không hợp lệ. Điện áp thử tối đa không vượt giới hạn thấp nhất của các phần tử đang nối, đặc biệt B01 chưa rõ nội bộ.

[TPS25810 Rev C](https://www.ti.com/lit/ds/symlink/tps25810.pdf) quy định miền IN1/IN2/AUX khác nhau; không gom chúng thành một miền nguồn thử. Nguồn đo và máy đo cũng không được tạo đường GND thay thế làm che lỗi đứt GND.

**Sáu kênh quan sát bắt buộc**

Đây là sáu **nhóm đại lượng**, không bảo đảm một máy sáu kênh vật lý đã đủ:

| Kênh | Đại lượng và mục đích |
|---|---|
| K1 — I/O thực | Kích thích có cận từ hai phía, đo truyền và dòng tiêm qua từng đường, gồm JOY_VCC. Không dùng SEL làm bằng chứng cách ly. |
| K2 — Source thực | Điện áp upstream và khả năng cấp tải kiểm trước hàng rào, chứng minh nguồn vẫn khả dụng khi thử switch kẹt. Kết hợp K3/K4 xác định Source ngừng cấp. |
| K3 — RUN OUT | Điện áp sau hàng rào, gồm xả, plateau và bật lại khi bỏ tải kiểm. |
| K4 — dòng có dấu | Dòng qua ranh giới Source; nêu rõ chiều dương, vị trí shunt và các đường bypass. Phải phân biệt dòng tụ với dòng cấp duy trì. |
| K5 — thân phích | Hành trình phích so với gá B01; xác định thời điểm sớm nhất phích mất giữ hoặc USB mất điều kiện hợp lệ. |
| K6 — chốt | Chuyển động chốt/actuator riêng với K5; xác định bắt đầu nhả và khả năng giữ khi mất bias. |

CC, nguồn cục bộ và lệnh điều khiển cần ghi đồng bộ bằng kênh phụ. Nếu phải đo từng I/O ở các lượt khác nhau, phải có cơ sở tính lặp lại; không tuyên bố đã quan sát đồng thời mọi đường.

**Quy tắc khóa cận số**

| Đại lượng | Quy tắc lựa chọn |
|---|---|
| `V_safe` | Chọn theo giới hạn nghiêm nhất của USB, miền nhận, cấp ngược và điều kiện nhả. USB Type-C R2.0 bảng 4-3 có cận thấp `vSinkDisconnect1 = 0,8 V`; vì vậy có thể đề xuất **RUN OUT thực <0,8 V** làm một tiêu chí USB. Nó chưa chứng minh I/O hoặc clone không bị nuôi ngược. Ngưỡng comparator phải thỏa `Vtrip,max + sai số chưa tính < V_safe`. [USB-IF](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019_0.pdf). |
| `I_OFF,max` | Lập tổng ngân sách theo từng đường, điều kiện nguồn và nhiệt: switch còn lành, sense, pull-up, clamp, PCB và nguồn ngoài. Không lấy một thông số leakage làm cận hệ thống. [TMUX1511](https://www.ti.com/product/TMUX1511) bảo vệ powered-off tới 3,6 V; phải kiểm đúng miền tín hiệu. |
| Tải kiểm/ngưỡng dòng | Chọn sao cho `I_OFF,max + εI < I_th < I_còn_dẫn,min − εI`. Tính `I_còn_dẫn,min` từ upstream thấp nhất, điện trở đường/tải cao nhất và trạng thái lỗi. Không còn dùng mặc định 1 kΩ/1 mA. |
| Xả rail | Với đường bleed còn lành sau lỗi: `V∞=I_back,max×Rmax < V_safe`; tính thời gian bằng `Rmax×Ceff,max×ln[(V0,max−V∞)/(V_safe−V∞)]`. Bao gồm tụ cáp, B01 và đầu đo. Bleed hở không còn đường xả có cận ⇒ giữ phích. |
| Cửa sổ xác nhận | Hai kênh phải cùng đạt điện áp/dòng/I/O trong cửa sổ bao được settling, lọc và độ trễ phát hiện đã xác lập; tiếp tục giám sát tới khi phích rời. Mất xác nhận phải thu hồi quyền nhả. Không thể suy một số ms chung từ datasheet hiện có. |
| Timing nhả | `t_mất_giữ/USB,sớm nhất − t_OFF_thực,muộn nhất − εđồng_bộ > 0`. `t_OFF_thực` gồm cách ly I/O, ngừng cấp Source và xả đủ rail. Kiểm thêm khả năng giữ/khóa lại khi lỗi xuất hiện giữa hành trình. |

TPS25810 có cận thời gian tắt ở điều kiện tải/tụ cụ thể; không chuyển nguyên sang cụm khác. Tương tự, [TPS3808 Rev N](https://www.ti.com/lit/ds/symlink/tps3808.pdf) có RESET không xác định dưới VPOR: fixture phải thử mất bias thực, không chỉ ép tín hiệu reset.

**Ma trận lỗi tối thiểu**

Mỗi lỗi được thử riêng tại RUN, chuyển OFF và đang nhả; các tổ hợp nguồn ngoài là điều kiện vận hành của ca thử.

| Nhóm | Ca bắt buộc và PASS |
|---|---|
| Hàng rào | Từng phần tử kẹt dẫn; mất điều khiển; một bleed hở. Hàng rào còn lại đạt cận hoặc phích vẫn được giữ. |
| Sense/quyền nhả | Sense hở, chập nguồn/GND, báo thấp giả; lỗi đường chung; một đường actuator kẹt cấp quyền. Một lỗi không được tạo nhả sai. |
| Bias/GND | Mất từng miền và miền chung, ramp chậm/nhanh, brownout; đứt/nâng GND với biên suy từ mạch. Không được có RUN hoặc nhả ngoài ý muốn. |
| CHARGE/PC | Cắm/rút CHARGE; PC cấp B01 trong khi RUN OUT gặp sink khác; cấp ngược từ từng I/O. Không mở I/O/RUN sai; vẫn đủ cận xả và timing. |
| Cơ khí | Kéo trước OFF, kéo lệch, chốt kẹt mở/đóng, mất bias giữa hành trình, đường đi vòng. Kẹt mở phải chặn RUN hoặc có giữ độc lập đủ chứng minh. |
| Bảo trì | Bỏ lần lượt từng bước. Không tiếp cận lẫy khi chưa tách pack, loại/chặn nguồn ngoài, cách ly I/O và xác nhận rail dư. |

Box02 lập cận điện; Box03 lập cận cơ khí; Box08 review. Người vận hành phải được HQ chỉ định và có quyền thử tương ứng. Các ca hiện đều `NOT_RUN`, ngoài D10.

**Ngân sách ứng viên UVLO 83/10**

Tính lại theo hai cầu chia độc lập, R ±0,1%, dòng nút tổng ±100 nA và ngưỡng từng chiều của [TLV6710 Rev B](https://www.ti.com/lit/ds/symlink/tlv6710.pdf):

| Nhánh | Cận tính |
|---|---:|
| Cắt 72/10, giảm | **3,242496–3,317616 V** |
| Hồi 83/10, tăng | **3,677225–3,762905 V** |
| Hồi 83/10, giảm lại | **3,584391–3,734955 V** |
| Biên cắt tới 3,20 V | **42,496 mV** |
| Biên nhận RUN mới tới 3,558 V sau khi đã hồi | **26,391 mV** |

Điều kiện thiết kế cần thỏa:

`E_start + sag đến lúc đóng tải + sụt áp do trễ kiểm tra ≤26,391 mV`

`E_cut + sag tức thời chưa tính + sụt áp trong tổng trễ tắt ≤42,496 mV`

Không cộng lại sai số điện trở/rò đã nằm trong phép tính. Cần kiểm điều kiện start liên tục tới lúc đóng Source, ưu tiên reset, loại lệnh đang giữ và bắt buộc nhả–nhấn mới. Sau khi RUN đã hợp lệ, sàn vận hành vẫn theo nhánh cắt, không giữ ở 3,558 V.

Ngân sách rò phải tính cả đầu đo: tại nút 0,4 V, probe 1 MΩ hút khoảng **400 nA**; probe 10 MΩ khoảng **40 nA** trước dung sai. TLV6710 không cho cận tối đa propagation delay phù hợp để tự đóng toàn bộ ngân sách; phải xác lập cận toàn tuyến bằng phương pháp được review. 83/10 vẫn là ứng viên, chưa được chọn.

**Đầu vào còn thiếu và gate**

| Đầu vào | Chặn ở đâu |
|---|---|
| MPN/revision của hàng rào, sense, reset, actuator; cấu trúc bias/GND và nguồn ngoài | Chặn hoàn thiện cấu hình fixture để xin duyệt build. |
| Ngân sách rò, Ceff, đường xả, cận I/O và sai số đo; lựa chọn `V_safe/I_OFF/window` | Chặn phê duyệt tiêu chí và cấu hình điện fixture. |
| Revision cụm phích–gá–chốt, cận giữ/nhả và điều kiện tương đương carrier | Chặn phê duyệt fixture dùng để đóng blocker sản phẩm. |
| Mẫu đã nhận, thiết bị đo/calibration, operator và quyền cấp điện/chế tạo | Chặn thực thi; có thể chuẩn bị cấu hình trước khi mẫu tới nếu định danh và cận đã đủ. |
| Dossier Jauch CV/NTC/profile | Không chặn phép kiểm OFF bằng bench nếu đã loại sạc thật và đại diện đủ đường điện; vẫn chặn H3 sản phẩm. |

HQ có thể ghi proposal yêu cầu này để Box08 review ngay. Bước tiếp theo là hoàn thiện **cấu hình fixture riêng có revision/hash**, rồi trình Founder duyệt cấu hình và quyền chế tạo/vận hành phù hợp. Chưa có cơ sở xin duyệt build từ hồ sơ hiện tại; D10, D15(a), D16(c) và Q2-OFF giữ nguyên.
