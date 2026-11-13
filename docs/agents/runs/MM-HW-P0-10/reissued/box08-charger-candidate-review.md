# Bản hiệu đính lead — box08-charger-candidate-review.md

Bỏ nhãn chấp nhận candidate như kết luận thiết kế. BQ25170 family được Founder chấp nhận hướng, chưa suffix/MPN/setpoint; H3 trip/MAX fault chain chưa đủ. Không có PASS hiện hành hoặc review nguồn mới của Box08.

Original SHA256 ASCII: `4dbe5f7c89f85f0cb1cbd895f74254a76d20e42c194e51754048d3fe59f6b1b0`. Bản gốc được giữ nguyên. Các hash bên dưới là input thực tế hiện tại, không suy độc lập review mới.

- box03-direct-return-geometry.md: `47d7b22b2fae085b0a970e2b7fb9a9f895ff3860163512eb6a4da97d0d604867`
- box02-hardware-configured-charger-candidates.md: `59b68cafef52b5d85043f3ca2c9d38909abf814827cfbc9f77d3800a2b45b059`

## Nội dung lịch sử (mọi nhãn chấp nhận trong trích dẫn đều hết hiệu lực cho r12)

**HISTORICAL_ACCEPTANCE_WITHDRAWN cho checkpoint candidate: đủ trình Founder chọn BQ25170DSGR/strap 4,05 V làm hướng hoàn thiện dossier. H3/B1 vẫn chưa đủ bằng chứng đóng gate.** Đây chưa phải duyệt MPN, ngưỡng cuối hoặc hash.

Hash đầu/cuối khớp:
`59b68cafef52b5d85043f3ca2c9d38909abf814827cfbc9f77d3800a2b45b059`.

Đối chiếu nguồn hãng xác nhận:

- **BQ25170 SLUSDJ8A Rev A**, strap **47 kΩ → 4,05 V**, accuracy **±0,8% toàn dải nhiệt được đặc tả**; kiểm ISET/VSET trước bật regulator. VSET được latch, không giám sát liên tục; lỗi biến thành một giá trị strap hợp lệ khác vẫn cần bảo vệ ngoài.
- **BQ25170J SLUSEF8** tiếp tục sạc giảm dòng trong vùng khoảng **45–55 °C**; không trực tiếp đáp ứng giới hạn Jauch 0–45 °C nếu thiếu veto nhiệt phù hợp. [BQ25170](https://www.ti.com/lit/gpn/bq25170), [BQ25170J](https://www.ti.com/lit/ds/symlink/bq25170j.pdf)

**Mode-access được giải quyết ở cấp proposal:** cấu hình phần cứng không cần B01/I²C, phù hợp lựa chọn giữ cách ly toàn bộ I/O. Chưa chứng minh toàn bộ startup/fault an toàn.

Các phép tính khớp:

| Nội dung | Kết quả |
|---|---:|
| CV 4,05 V với ±0,8% | **4,0176–4,0824 V** |
| Margin tĩnh tới 4,200 V | **117,6 mV** |
| R750 Ω ±1%, KISET 270–330 | **0,35644–0,44444 A** |
| Hai R tổng MAX 2,222 Ω, Iend **giả định** 44 mA | Pack MIN **3,919832 V**, cao hơn recovery MAX khoảng **156,93 mV** |
| Trip MAX 4,110 V với witness peak cũ | Cutoff còn khoảng **59,06 µs** |

Dòng termination 44 mA vẫn chưa được bảo đảm cho cấu hình này. Timer 10 h là delta profile; không gọi 10,5 h là thời gian sạc tuyệt đối.

**Dữ liệu ngoài còn thiếu chính xác:** transient startup/line/load/reconnect; termination/recharge tại 0,40 A–4,05 V với R/cutoff ngoài; hành vi OUT khi pack bị ngắt. Nội bộ còn phải thiết kế lại cửa sổ bảo vệ—trip cũ chồng lấn CV khỏe—và khép peak/cutoff, reverse/bypass cùng TS qua dung sai. Hai điện trở không tự động được giữ hoặc bỏ mà không tính lại energy-path.

**Disposition cho HQ:** trình lựa chọn candidate nghiên cứu **BQ25170DSGR, Li-ion 4,05 V/47 kΩ**, kèm delta timer và yêu cầu bảo vệ ngoài; giữ BQ25170J làm đối chứng. Không cần mở rộng shortlist. Chi phí toàn bộ vẫn chưa chứng minh dưới 1 triệu đồng; chưa đủ trình duyệt cấu hình triển khai hoặc mở lease.
