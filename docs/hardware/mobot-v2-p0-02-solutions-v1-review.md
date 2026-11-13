# P0-02 — independent review of solution proposals v1

Box08 turn `01a1bba2-a05b-7570-88a8-0ff10a46636c`; Sol/high. Snapshot: `.tmp/agent-checks/P0-02-solutions-v1/snapshot.json`. PASS below is document readiness, not P0-02 closure, material approval or hardware gate.

**Proposal-doc readiness: PASS để tiếp tục hoàn thiện proposal. Gate P0-02/build: chưa đạt.** Cả **3/3 file khớp SHA-256** trong snapshot. Không thấy lỗi số học mới; chưa có cơ sở kết luận fixture hoặc giao diện hoàn chỉnh đã đạt.

| Nội dung mới | Kết quả kiểm |
|---|---|
| Dây 150 ±10 mm, DCR ≤0,25 Ω/m | Tại 160 mm: **0,040 Ω**. Ngân sách `0,040 + 0,050 + 0,060 = 0,150 Ω/đường` đúng. DCR ở 50 °C là **yêu cầu mua dây**, chưa được chứng minh bằng mã dây/lô. |
| GND 20 mA / 5 mV | `20 mA × 0,15 Ω = 3 mV`; còn 2 mV cho phần khác, tương đương tối đa 0,10 Ω tại 20 mA. **Chưa chứng minh** tổng dòng hồi thực, tải quá độ và sai số ADC/logic đáp ứng ngân sách này. |
| Trace 1,10 / 0,90 mm | Với các giả định ghi trong proposal, tính lại được **19,799 mV / 14,861 mV**, khớp tài liệu. Đây là sụt áp đoạn đi; chưa bao đường hồi, cổ pad và via. |
| Via | Mô hình thành đồng hình trụ, **đường kính lỗ hoàn thiện nhỏ nhất 0,22 mm**, mạ 20 µm, dài 1,76 mm cho **2,498 mΩ/via**. Phải giữ rõ định nghĩa lỗ hoàn thiện; kết quả không chứng minh phân dòng hoặc nhiệt. |
| Đồng tối thiểu 30/12 µm, mạ cục bộ 20 µm | Tài liệu đã phân loại đúng là **yêu cầu tiếp nhận đề xuất**, chưa phải bảo đảm của fab. STACKUP-DRC chưa đóng trước khi có bằng chứng option fab đáp ứng hoặc tính lại theo cận được chấp nhận. |

Căn cứ: [proposal giao diện/fab:13](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-02-interface-fab-proposal-v1.md:13), [cận fab và tính DC:26](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-02-interface-fab-proposal-v1.md:26).

**Fixture02 và cơ khí03 tương thích ở mức requirements.** Cả hai yêu cầu đo thân phích và chốt riêng, đồng bộ với OFF thực, xét lỗi chung và bảo trì. Tuy nhiên, đề xuất khối kẹp độc lập của 03 chưa chứng minh độc lập nếu vẫn dùng chung vai đầu chụp/gá; tài liệu đã nhận diện đúng giới hạn này.

Recovery 83/10 có các cận tính nhất quán: biên start **26,391 mV**, biên cut **42,496 mV**. Probe 1 MΩ hút khoảng **400 nA**, vượt ngân sách ±100 nA; probe 10 MΩ hút **40 nA**, vẫn phải cộng với rò IC, PCB và các đường nối khác. Vì vậy chưa thể chốt setup đo hoặc ngân sách động chỉ từ hai con số này ([fixture:84](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-off-fixture-requirements-r0.md:84)).

Cách dùng `<0,8 V` làm **một tiêu chí USB ứng viên** có căn cứ ở cận thấp `vSinkDisconnect1`, nhưng không đủ chứng minh cách ly/cấp ngược B01; tài liệu hiện đã giới hạn đúng phạm vi đó. [USB Type-C R2.0, bảng 4-3](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019_0.pdf).

**Có thể đóng phần tài liệu nào:**

- Phân xử số học của ngân sách dây, GND, đoạn trace và mô hình via.
- Bộ yêu cầu fixture r0 làm đầu vào lập cấu hình riêng.
- Phiếu supplier làm bản nháp đủ cụ thể để người có quyền sử dụng; chưa đóng dữ liệu supplier, B01-SUPPLY hoặc H3 ([phiếu:7](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-02-supplier-evidence-request.md:7)).

**Next action tối thiểu:** Box02 xác nhận tải/ngân sách toàn tuyến và setup đo; Box03 bổ sung mã đầu nối B01, dây, cáp, actuator và revision cụm giữ; HQ lấy cận fab áp dụng. Sau đó lập **cấu hình fixture riêng có revision/hash**, gồm cấu trúc bias/GND, phần tử bảo vệ, nguồn/tải, `V_safe`, `I_OFF`, cửa sổ, sai số và cận cơ khí. Danh sách thiếu đã được ghi đúng tại [fixture:110](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-off-fixture-requirements-r0.md:110).

**Chưa đóng CARRIER-INTERFACES, STACKUP-DRC hoặc HANDSET-POWER-DESIGN; chưa đủ để xin duyệt build fixture.** Founder vẫn phải duyệt cấu hình cụ thể và quyền thao tác tương ứng.
