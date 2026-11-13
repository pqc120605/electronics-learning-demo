# Kiểm lấy mẫu nguồn bổ sung — 10/11/2026

Lead mở trực tiếp hai PDF hãng qua công cụ web sau khi đóng snapshot yêu cầu review; ghi riêng, không sửa proposal đang được Box08 đọc. Hai PDF này chưa tải/ghim bytes cục bộ; không tính thành nguồn thứ7/8 trong sources.json.

- [TPS3700, SBVS187G](https://www.ti.com/lit/ds/symlink/tps3700.pdf), tr.6–7: falling threshold387…400mV; startup MAX450µs. Bảng6.6 đặt18µs trong cột NOM, không phải MAX. Proposal gọi TYP với ý không bảo đảm, nhưng nên chuẩn hóa tên cột thành NOM khi có bản sau. Kết luận chưa có trễ MAX của cả topology không đổi.
- [OPAx192, SBOS620E](https://www.ti.com/lit/ds/symlink/opa4192.pdf), tr.1 và mục6.8: họ IC có miền nguồn tổng4,5…36V; bảng4,5…8V là miền điều kiện được Box02 dùng cho ứng dụng5V, không phải nguồn tối đa8V của cả họ. Không dùng spec tại một common-mode làm guarantee toàn topology hoặc bỏ bài toán clamp/bias.

Đây chỉ là source spot-check, không review mạch hay xác nhận topology đạt. Lead giữ nguyên giới hạn candidate detector/front-end, standby drain, sense injection và missing clamp/fault closure. Nguồn cell/module/holder6tệp đã pin được kiểm hash riêng bằng check-evidence.py.
