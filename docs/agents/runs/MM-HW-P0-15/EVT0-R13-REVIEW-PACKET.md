# Box 08 · Rà soát đề xuất tay cầm EVT0 r13

Founder đã xác nhận F1–F5 cho việc lập hồ sơ. Mục đích lượt này là phản biện các cận và xác định việc còn thiếu trước khi review đóng cổng.

| Tệp từ thư mục sản phẩm | SHA-256 |
|---|---|
| `docs/mission-control/hardware-config-mobot-v2-typec-r13-handset.json` | `a4fc54f7772f96023fe65c3afda2def59230d467b5418cb8a6adc98c6e7ed631` |
| `docs/hardware/mobot-v2-handset-r13-design.md` | `9072831cdb21f0e44e62d0472e6d9909a8019402848305d7677edd2149a70516` |
| `docs/hardware/mobot-v2-founder-decision-q1-q8.md` | `bab7b759ebd2f7e0772f772e73b71854b8f6685798f81893125e73a2cfccc470` |

Kiểm F1–F5 và C1–C12 theo bản rà soát EVT0. Ưu tiên điều kiện áp dụng của 3 µA trên TPS25810, dòng khi cắm nhầm, khả năng đáp ứng dòng quảng bá Type-C bằng 3 AA, phép tính UVLO ở đầu đo so với cực pack, và hai ca cell yếu/tự phục hồi lặp. Nêu các chứng cứ cần bổ sung theo mốc. Phân biệt lỗi thiết kế trên giấy và mục đo đã được D10 cho phép để sau PCB.

Queue đã đăng ký đúng hash ở trạng thái `proposed`. Validator exit 0 với 61 task, 143 capability và `errors=[]`. Bộ test validator 61/61, exit 0. Preflight B1 exit 1, `dispatch_eligible: false`. B1 tiếp tục trỏ r11, chưa tích hợp baseline r13, chưa cấp lease. Các phép đo `NOT_RUN`. Hồ sơ này là yêu cầu phản biện, chưa là hồ sơ review đóng cổng.
