# L4 · Provider riêng cho Mở Bot

Vite dev nhận cấu hình provider phía Node. Lớp xử lý độc lập có OpenAI Responses API và mock tất định. Chế độ Ollama cục bộ dùng middleware hiện có khi được cấu hình. Bản tĩnh tiếp tục tra cứu từ kho kiến thức. [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create) · [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

- Mỗi lượt có tối đa hai lượt lịch sử và bốn nguồn. Khi người dùng bật ngữ cảnh, gói S0 chỉ có board, loại linh kiện và chân. Khóa API nằm ở tiến trình Node.
- Phản hồi OpenAI đi qua JSON schema và kiểm trích dẫn, độ dài, nguồn và đề xuất câu hỏi. JSON sai, nguồn ngoài evidence hoặc timeout trả về trạng thái thiếu dữ kiện. 429 và 5xx được thử lại một lần trong tổng 30 giây. Nhật ký chỉ ghi metadata vận hành.
- Người dùng thấy điểm chuyển dữ liệu tới OpenAI trước khi gửi. Hỏi Mở từ pad 2D điền sẵn câu hỏi để người dùng quyết định. Có theo dõi nguồn, sao chép và phản hồi hữu ích lưu cục bộ.

## Đánh giá

| Nhóm | Kết quả mock |
|---|---:|
| Linh kiện | 8/8 |
| Lắp mạch | 12/12 |
| Board | 6/6 |
| Tín hiệu | 8/8 |
| Mô phỏng | 8/8 |
| Workspace | 4/4 |
| Từ chối | 8/8 |
| Ngữ cảnh | 1/1 |

`node scripts/eval-guide-ai.mjs` exit 0. 55 ca có dấu/không dấu, ngoài phạm vi và ngữ cảnh. Một lần đo mock p50 0,07 ms, p95 1,81 ms trên laptop. Không phát sinh lượt API tính phí. Chất lượng trả lời, số token và chi phí OpenAI thật trên 1.000 câu chưa đo.

Còn nối lối hỏi từ cảnh báo mạch và hồ sơ linh kiện, bổ sung topology/net và revision vào S0 có kiểm soát, đánh giá live sau khi có ngân sách và mở dịch vụ production ở giai đoạn S.
