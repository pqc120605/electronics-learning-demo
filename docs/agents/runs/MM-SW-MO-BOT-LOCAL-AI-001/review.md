# Review độc lập Mở Bot AI local

- Task `MM-SW-MO-BOT-LOCAL-AI-001`, 19/11/2026. Reviewer `repair_tester_sol`, chỉ đọc 11 đường dẫn lease và chạy test middleware với provider giả lập.
- Kết luận **pass cho phạm vi kỹ thuật local**. Reviewer không phát hiện blocker P0–P2. Chất lượng câu trả lời được đo riêng bằng benchmark inference thật.
- HTTP giữ loopback, ràng buộc Host/Origin, chặn cross-site, ghim Ollama `127.0.0.1:11434`, cấm redirect. Model mặc định `qwen3.5:2b`, context 3072 token và tối đa 240 token sinh ra.
- Mở AI dùng ngữ cảnh bài theo lựa chọn rõ ràng. Câu hỏi, trích đoạn chọn lọc và tối đa hai lượt trước là payload. Reviewer không thấy thao tác đọc code, file, tiến độ hoặc nhật ký người dùng để gửi vào model. Hủy, đổi ngữ cảnh hoặc rời panel bỏ phản hồi cũ. Không thấy lưu hội thoại vào storage hay tài khoản.
- Renderer dùng văn bản và đường dẫn đã có trong ứng dụng. Validation schema và ID nguồn chưa kiểm nội dung theo nghĩa. Câu trả lời sai hoặc thiếu ý vẫn có thể lọt qua. Hỏi đáp cục bộ và hồ sơ gốc tiếp tục là điểm đối chiếu.
- `node --test tests/guide-ai-service.test.mjs` exit `0`, 2/2. Reviewer không chạy browser hoặc inference. Các kiểm thử đó nằm trong báo cáo của lead.

| File được reviewer ghim | SHA-256 |
| --- | --- |
| `scripts/guide-ai-service.mjs` | `f90745a531166c36be0d44fee2951bf6c20aad2a8840b13866e99024873d92fc` |
| `src/lib/guideAi.ts` | `3b09da4c25d8a04c4132eac3e53ac6dbb2848e15f0bfa86d458004671ff7a9b8` |
| `src/components/guide/GuideAiChat.tsx` | `5772dccf0c50ca09942471fee3209a81e938b9ada4b6d07dcd78d35f8b13b08b` |
| `e2e/guide-ai.spec.mjs` | `caba26cb9bc96d24f48119f17b6ff6eb9a5aea5836fb20b960d269bb514152f4` |

Reviewer đã xem lại delta tự cuộn tới lượt trả lời mới nhất và hai kiểm tra viewport. Phán quyết pass trong phạm vi review mã. Effect chạy cả khi lịch sử đủ sáu lượt, không dời focus và không đổi ràng buộc riêng tư. Kiểm viewport tự động dùng câu trả lời ngắn.
