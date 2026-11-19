# Rà soát độc lập · Sửa và khôi phục dây

Kết luận PASS trong phạm vi task. Review agent `local_polish_qa` đối chiếu SHA-256 của từng tệp ở [snapshot](snapshot-reviewed.json) và kiểm mã nguồn.

Lưu góc dây riêng với topology, giữ 30 bước hoàn tác trong phiên. Ở v5, tính lại net theo mạch vừa lưu, giữ lựa chọn đúng dây và xóa lựa chọn nếu dây đã bị xóa.

Tab cũ bị chặn khi so sánh thấy bản lưu đã đổi. Tranh chấp đồng thời tuyệt đối vẫn có thể xảy ra trong localStorage.
