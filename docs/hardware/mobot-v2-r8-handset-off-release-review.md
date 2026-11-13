# MoBot V2 · Review xác nhận OFF và nhả phích

Snapshot proposal tay cầm `3916f00dbca9145baf3437e63474ad56144181b46cfcc8a62b8968721f628da3`. Box 02 turn `01a1b233-2918-7212-b492-c84fe1fc56fb`, Box 03 turn `01a1b233-3fc5-7033-9906-eda60480c841`.

## Điện · đề xuất cần review

- Hai đường cắt nối tiếp mặc định hở cho I/O và JOY_VCC, cùng hai phần tử cắt nối tiếp cho VBUS. Mỗi đường còn lại phải đủ khi đường kia kẹt. Các đường sense, pull-up và clamp ngoài hàng rào cần cận riêng.
- Hai kênh sense RUN OUT và hai điều kiện cấp điện nhả phải được rà lỗi chung về dây sense, bias, tham chiếu và logic. Mất bias, bất đồng hoặc quá thời gian giữ chốt. Đọc lại SEL hoặc EN chỉ xác nhận lệnh.
- Thử từng switch kẹt với upstream còn khả dụng và tải kiểm sau switch. Ghi đồng bộ điện áp trước/sau switch và dòng có dấu. Dải dòng OFF cộng sai số phải tách khỏi dải còn cấp trừ sai số. Xét cả điện áp nâng rail và dòng tiêm qua ranh giới.
- Với bleed thụ động, cần I_bơm_lại,max × R_bleed,max < V_safe. Cả hai kênh phải xác nhận cận trên điện áp đã tính sai số nằm dưới V_safe trong cửa sổ ổn định. Các ngưỡng số và cận thời gian còn mở.

## Fixture · bằng chứng cần trên đúng cụm

Ghi trực tiếp hành trình thân phích so với gá B01 và đo chuyển động chốt trên kênh riêng. So mốc sớm nhất giữa phích rời vùng rơ và CC/VBUS mất hợp lệ với mốc OFF thực muộn nhất. PASS khi biên vẫn dương sau khi trừ sai số. OFF thực gồm I/O đã ngắt truyền, Source đã ngừng cấp và RUN OUT đã xả đủ.

Tiêm lỗi từng switch, sense hở/chập/báo thấp, mất bias, chốt kẹt mở/đóng, kéo trước OFF, kéo lệch, đi vòng và PC cấp B01 trong lúc RUN OUT gặp sink khác. Chốt kẹt mở phải chặn RUN khi khởi động. Nếu phát sinh đang RUN, cần giữ độc lập hoặc chứng minh I/O cách ly trước mất tiếp xúc. Với CHARGE/brownout/lỗi sense, kiểm riêng thời điểm I/O cách ly so với rail đầu tiên mất hợp lệ.

Thử bỏ qua từng bước tháo bảo trì. Lẫy chỉ tiếp cận sau tách pack, tháo hoặc chặn nguồn ngoài, giữ I/O cách ly và xác nhận rail dư. Proposal hiện đã ghi điều kiện bảo trì.

Các phép kiểm cụm ở trên vẫn NOT_RUN và thuộc bằng chứng thiết kế ngoài D10. Box 08 rà cấu trúc đề xuất, tính độc lập của các đường bảo vệ, độ phủ lỗi và tiêu chí fixture. HANDSET-POWER-DESIGN vẫn mở.
