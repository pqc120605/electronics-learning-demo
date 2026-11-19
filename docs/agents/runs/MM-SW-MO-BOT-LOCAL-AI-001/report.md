# Mở Bot AI chạy trên máy

`MM-SW-MO-BOT-LOCAL-AI-001` · `OPS-06` · 19/11/2026

Trong bản local, **Trợ giúp → Hỏi Mở → Hỏi AI** mở cuộc trò chuyện tiếng Việt với `qwen3.5:2b`. Mở chọn trích đoạn từ thư viện và bài học rồi gửi câu hỏi sang Ollama trên cùng máy. Câu trả lời đi cùng liên kết để kiểm tra nguồn. Có thể hỏi tiếp, dừng lượt đang chạy, bắt đầu cuộc trò chuyện mới hoặc mở tra cứu cục bộ nếu Ollama chưa sẵn sàng. Ngữ cảnh của bài chỉ dùng khi người dùng bật. Hội thoại sống trong panel, không lưu sang hồ sơ người dùng.

## Lựa chọn model

Máy thử dùng RTX 2050 4 GB, RAM 15,7 GiB, Windows, Ollama 0.40.14. Hai model chạy cùng bộ 6 câu tiếng Việt, gồm 5 câu yêu cầu model sinh văn bản và 1 câu GPIO chưa được nguồn xác minh.

| Lượt | Kết quả |
| --- | --- |
| Qwen3.5 4B, cấu hình gốc | 5/5 lượt sinh vượt giới hạn 55 giây. Câu GPIO dừng trước khi gọi model. |
| Qwen3.5 2B, cấu hình gốc | Có phản hồi cho cả 5 lượt. Lượt đầu 32,6 giây, các lượt sau 1,9–8,7 giây. Có lỗi diễn giải nhóm lỗ và ray breadboard, thiếu đáp án Uno ADC và ví dụ LED lẫn ngữ cảnh LDR. |
| Qwen3.5 2B, cấu hình chọn | Lượt đầu 16,2 giây. Bốn lượt tiếp theo 3,1–6,6 giây. Đạt 5/6 tiêu chí tự động. Breadboard nêu được hai nhóm lỗ cùng cột và các cột kề không tự nối, nhưng câu diễn đạt chưa rõ số lỗ mỗi nhóm và thiếu nhắc rãnh giữa. GPIO chưa có nguồn tiếp tục dừng trước inference. |

Cấu hình chọn dùng context 3072 token, tối đa 240 token sinh, không bật thinking. Dữ liệu sau chỉnh sửa có nguồn breadboard rõ hơn và ưu tiên bài khớp tiêu đề. Chọn 2B cho phần cứng hiện tại theo mẫu thử này. Kiểm schema và ID nguồn giúp gắn đúng liên kết, chưa đối chiếu được mọi mệnh đề do model sinh. Mở Bot không thay thế hồ sơ phần cứng đúng revision, kiểm tra mạch hoặc phép đo. Chưa đo độ phủ trên toàn bộ kho nội dung.

- `qwen3.5:2b` Ollama digest `0689d44085e06d165161a8a9a1731344278cfb5aade63a3c3dbdb48ab54b130a`.
- `qwen3.5:4b` Ollama digest `d8b0f5e9760cd1682034f292d7ef72ec46f432149be0df7574bf2d6e92e38c04`.
- Gói Ollama portable SHA-256 `65d68cade6cf6375f398b518224f8c8a15e062387f38cf477abfc848de7e7e29`, đối chiếu với trang phát hành. [Ollama v0.40.14](https://github.com/ollama/ollama/releases/expanded_assets/v0.40.14)
- Model và API cục bộ. [Qwen3.5 trên Ollama](https://ollama.com/library/qwen3.5) · [Ollama Chat API](https://docs.ollama.com/api/chat) · [Structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
- Phương án API cho giai đoạn server là GPT‑6 Luna để đối chiếu chất lượng và thời gian trả lời. Đợt này chưa tích hợp cloud, khóa API, deploy hoặc Mini PC. [GPT‑6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)

## Khởi động lại nếu cần

Bản preview dùng `127.0.0.1:5320` với dữ liệu web cùng origin. Ollama portable ở `.tmp/mo-bot-ollama-v0.40.14/`. Hai tiến trình chạy trên loopback. Thư mục `.tmp` chứa runtime và model tải về cho máy này.

Trong PowerShell tại thư mục dự án, khởi động Ollama nếu tiến trình trên cổng 11434 đã dừng:

```powershell
$runtime = Join-Path (Get-Location) '.tmp/mo-bot-ollama-v0.40.14'
$env:OLLAMA_MODELS = Join-Path $runtime 'models'
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
Start-Process -WindowStyle Hidden -FilePath (Join-Path $runtime 'runtime/ollama.exe') -ArgumentList 'serve'
```

Khởi động preview khi cổng 5320 trống. Kiểm `GET /api/guide-ai/status` có `state: ready`.

```powershell
npm.cmd run build:local
npm.cmd run preview -- --host 127.0.0.1 --port 5320 --strictPort
```

## Bằng chứng

- Kết quả từng câu và thời gian phản hồi. [So sánh ban đầu](benchmark-qwen3-5-4b_qwen3-5-2b.json) · [Qwen 2B sau tinh chỉnh](benchmark-qwen3-5-2b.json) · [Kịch bản benchmark](evaluate-local.mjs)
- Chromium thật gọi backend và Ollama, 1440 × 900 và 375 × 812. Đã kiểm hỏi nối tiếp, nguồn, câu GPIO không gửi sang model và không ghi nhận lỗi JavaScript hay request HTTP ra ngoài trong hai lượt kiểm. [Kết quả](real-browser.json) · [Ảnh desktop](real-browser-1440.png) · [Ảnh mobile](real-browser-375.png) · [Kịch bản chạy lại](verify-real-browser.mjs)
- Phạm vi review và snapshot sau khi xác minh. [Review độc lập](review.md) · [Lệnh, exit code và SHA-256](verification.json)
