Source: 01a1a858-a54b-7eb1-a7c8-bf039a639757
Turn: 01a1c411-60e2-7840-9e0f-456208486e83
Verbatim independent proposal review, not gate acceptance.

**Verdict: `changes_requested`.** Phản ví dụ sát throat hợp lệ cho topology P2; phép tính capture chưa bao hết range khối lượng. Chưa đủ trình scope CAD/FE với mục tiêu “đóng toàn gate”.

**[P2] Chọn 5 g chưa phải góc bảo thủ của mô hình.** [P2:70–95](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX03-P2-RESULT.md:70) cho khối lượng 3–5 g nhưng chỉ tính 5 g. Với cùng lực/trễ, **3 g** tăng tốc mạnh hơn:

| Khối lượng | Đi trong trễ | Động năng cuối trễ | Tổng quãng tiến |
|---|---:|---:|---:|
| 5 g | 0,065 mm | 30,25 µJ | 0,566667 mm |
| **3 g** | **0,095 mm** | **43,35 µJ** | **0,684 mm** |

Biên với 0,80 mm còn **0,116 mm**, không phải 0,233333 mm cho toàn range. Vẫn dương theo giả định, nhưng phải sửa corner sweep và tránh cộng trùng năng lượng coupling nếu nó đã nằm trong lực drive.

**Phản ví dụ guard/throat được nhận.** [P2:114–132](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX03-P2-RESULT.md:114) có số học đúng: 0,01 mm tại 0,10 m/s tương ứng 0,1 ms; công tay 100 N là 1 mJ. Model selector không bao động năng/lực follower. Kết luận chỉ áp dụng **guard đã rút, follower được tiến sát throat**, không chứng minh mọi M-A bất khả thi.

**Phân xử yêu cầu:** “không vượt commit tại mọi thời điểm precommit” là cách triển khai trong phase contract, không phải nguyên văn Founder. Tuy nhiên, [Q2-OFF:6](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-founder-decision-q2-off.md:6) thực sự yêu cầu **mất bias không được cho phép nhả**, và quyết định hướng còn yêu cầu “mất bias vẫn khóa”. Vì vậy thời gian đáp ứng hữu hạn có thể là tham số kỹ thuật **nếu vẫn chặn vượt throat**; còn chấp nhận follower vượt throat sau mất bias là ngoại lệ cần Founder xác nhận. Giữ điện OFF là cần thiết, chưa tự miễn nghĩa vụ khóa cơ.

**Một quyết định tối thiểu nên trình:**

> Có cho phép **phân tích**, chưa chấp nhận sản phẩm, ngoại lệ mất bias sau physical-OFF và sau permission hợp lệ: khảo sát thời gian thu hồi quyền **0–1 ms** và giới hạn hành trình follower tương ứng bằng mô hình có cận; trong khoảng đó có thể vượt throat. Source/I/O phải luôn OFF, không tạo permission mới, RUN khóa tới tái khóa/fresh-arm. Nếu không chứng minh được cận thời gian **và hành trình**, hoặc mất OFF proof, phương án bị loại. Kết quả phải review trước khi xin chấp nhận ngoại lệ cuối.

**1 ms chỉ là allocation để khảo sát**, chưa phải cửa sổ an toàn được bảo đảm. Cần bổ sung tốc độ/khối lượng follower, lực tay, guard travel và decay/capture bounds; không dùng riêng model selector để chốt nó. Nếu Founder không cho khảo sát ngoại lệ này, bước nội bộ là đổi topology guard để giữ ràng buộc khóa, không đổi tên commit.

Hash đầu/cuối:
`521a21bd8c04aaa83bd931fa23b376619097cc2a9fcbc3ceb3d1a5674525e209`.

Không có gate PASS hoặc quyền CAD/FE từ review này.
