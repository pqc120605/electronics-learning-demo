# B1 — ma trận bằng chứng hiện hành

Ngày09/11/2026. Nguồn quyết định là biên bản Founder và cấu hình r11 proposed; ma trận này không thay trạng thái gate.

| Gate | Tiến triển mới | Bằng chứng còn thiếu thực sự trước B1 |
|---|---|---|
| MCU | Founder chọnW; không còn yêu cầu challenge một dây; A có budget11 chân về số học | Topology fresh-arm/veto/default có cận, timing theo đúng fault case và các miền bias; software-only feed contract phải review |
| ACTUATOR | Founder chốt100N/200N; pawl có check tiết diện; motor/pulse candidates và phép tính nguồn | Anchorage/common-cam fault/contact sequence; torque phù hợp; current transient/pulse/default/energy và source branch có cận |
| H3 | Có witness cửa sổ3,8–3,9V và supplemental comparator/reference; trần4,200V giữ nguyên | Complete threshold, current transient, cutoff driver, capacitor/parasitics và độc lập fault; setpoint/MPN chưa chọn |
| OFF | TPS2553 có toffMAX3ms ởtest cụ thể; D10 được áp dụng đúng | Total forward/mixed-bias leakage và fault→isolation cho topology/tải thực; sense/window đầy đủ, lỗi chung và giữ/nhả |

PackNTC/termination/timer/IR và các phép đo D10 vẫn TBD/NOT_RUN đúng mốc đã cho phép. Không tự biến chúng thành blockers mới. Cần phân biệt missing design bound với measurement được hoãn.

Trạng thái: **bốn gate OPEN; B1 NOT_READY**. Các kết quả tính mới ở readiness-resolution và calculate.py, không phải physical qualification. r11 không bị sửa hoặc duyệt hash.

## Lượt tiếp tục 09/11/2026 — direct-return

Founder đã duyệt hướng direct-return và envelope thao tác sai bằng tay100N mỗi nút nhả, không dụng cụ. Biên bản tại cuối `mobot-v2-founder-decision-q1-q8.md`; đây không phải duyệt MPN/hash hoặc gate.

- **ACTUATOR:** proposal cross-key được đỡ hai bên; cửa cấp quyền1,2mm/0,30N và3s là allocation đang khảo sát, không thông số hãng. Các check tiết diện/free-body được08 nhận ở mức proposal; contact toàn frame/dogleg và dữ liệu actuator vẫn thiếu. Qualification cơ cấu không tự nằm trongD10.
- **MCU-W:** preset nhanh với feed4–6ms có timeout upperMAX12,65ms; 7,35ms còn lại là ngân sách tuyến, chưa bound implementation. Bảng trạng thái fault-dominant/fresh-edge đã có; no-auto-rearm không được suy từ WDO recovery.
- **OFF:** đề xuất divider có biên tốt hơn nhưng input leakage±100nA vẫn allocation. KCL phải baoRUN OUT, B01/PC,JOY/carrier và rail giữa các tầng. Sáu lines còn cần map theo vai trò, không gán GPIO.
- **H3:** witness371µs bị rút: với partial trip4,0356V còn370,682µs; với allocation4,050V còn310,369µs. Cả hai không là cutoff bảo đảm. Cần threshold/energy-path/capacitor/driver/barrier bounds.
- **Nguồn direct-return:** hai cuộn7,5Ω danh nghĩa cho20J ở5V hoặc22,05J ở5,25V trong3s. Chưa làMAX hoặc nguồn đã đạt; trần BOM<1triệu chưa có tổng landed.

Bằng chứng chi tiết và review nguyên văn nằm trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/box*.md`. Baseline r11 giữ nguyên SHA-256 `b4a7a5aedcd9012ca75df93a973f0517d86f28a13249632c1ea2a576f945e887`, proposed. Trạng thái hiện thời vẫn **B1 NOT_READY**; không lease, không tự ghiPASS.
