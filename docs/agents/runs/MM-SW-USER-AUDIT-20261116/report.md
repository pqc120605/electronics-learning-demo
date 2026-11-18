# MM-SW-USER-AUDIT-20261116 — báo cáo bàn giao

Hoàn tất hồ sơ ngày 17/11/2026 (Asia/Bangkok). Scope audit/report; không sửa source hoặc model, không thực hiện hardware action, không publish online.

- [Báo cáo chi tiết](../../../reviews/2026-11-16-web-user-audit/report.md)
- [Gallery 407 ảnh](../../../reviews/2026-11-16-web-user-audit/gallery.html)
- [Coverage](../../../reviews/2026-11-16-web-user-audit/coverage.md)
- [16 finding OPEN](../../../reviews/2026-11-16-web-user-audit/findings.json): P1=2, P2=10, P3=4.
- [Verification](../../../reviews/2026-11-16-web-user-audit/verification.json), [QA tự kiểm và giới hạn](../../../reviews/2026-11-16-web-user-audit/report-qa.md), [artifact hashes](../../../reviews/2026-11-16-web-user-audit/artifact-index.json).

Đã mở 28 profile/16 board viewer/17 scene; 59 card/45 model linh kiện; 70 asset khớp hash; 11 bài × 4 view/run; 8 board freestyle, 4 mẫu; 20 route mobile; công cụ và luồng lưu/chia sẻ cục bộ, Bot, 7 tour/34 bước. Các tổ hợp/chức năng chưa thử được đánh NOT_RUN trong coverage, đặc biệt Supabase online, thiết bị thật, offline/service-worker, touch thật/cross-browser, storage quota và mọi cursor/import branch.

Phép kiểm:

- `npm.cmd run typecheck`: exit 0.
- `npm.cmd test`: exit 1, 680 test / 676 pass / 4 fail / 0 skip. Bốn ca Arduino/AVR bị lỗi môi trường sandbox không có index/core Arduino và DNS tải index thất bại. Không thay assertion/skip/cài core. Uno biên dịch qua server web đã thành công trong browser, là phép kiểm khác.
- Recheck ca compile-service: exit 1 cùng nguyên nhân; log giữ nguyên.
- axe sáu màn lấy mẫu: 0 violation; không chứng nhận full WCAG.
- Source snapshot 462 file: 0 đổi, 0 thêm. PNG kiểm CRC hợp lệ; link/nguồn được script kiểm.
- Queue validator trước và sau đóng: exit 0, 77 task, errors/warnings rỗng. [Log cuối](../../../reviews/2026-11-16-web-user-audit/evidence/queue-final.log). Task audit ở trạng thái done; 16 finding website vẫn OPEN.

Verdict **website**: CHANGES_REQUESTED. Verdict **deliverable audit**: complete with limits. Hai advisor có kiểm source/model độc lập trước soạn báo cáo; yêu cầu đọc lại báo cáo cuối bị hạn mức, nên không có post-report independent PASS. Lead tự kiểm báo cáo và ghi rõ giới hạn; không gọi Claude.

Hoàn tất task này không đóng 16 finding hoặc mở quyền release. Không push GitHub trong lượt audit.
