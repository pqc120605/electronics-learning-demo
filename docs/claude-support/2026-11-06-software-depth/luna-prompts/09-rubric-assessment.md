# 09 — WA-09 Đánh giá theo rubric và tiêu chí live (NHÁP, chưa gửi Codex) · **ĐỀ XUẤT SOL** · G-B · chạm > 5 file

Lý do đánh dấu SOL: cần thiết kế mới (`AssessmentAttempt`, rubric schema, nơi lưu K-EVID, quan hệ với progress/observation); chạm schema lưu trữ và ≥ 7 file. Luna chỉ nhận sau khi Sol chốt schema và approval của founder.

Goal: Cho phép bài học khai báo rubric/tiêu chí live trên trạng thái mạch và ghi `AssessmentAttempt` (met / not-yet / ungradable), tách khỏi tiến độ.

Context:
- Đọc trước: `docs/product/2026-11-05-mach-mo-final-contracts.md` §4 (bốn loại record, quyền kết luận), `src/lib/learningProgress.ts:27,121`, `src/data/builderLessons.ts:27-87`, `src/data/curriculumSchema.ts`, `src/components/builder/InputOutputChallenge.tsx`, `src/components/builder/ScenarioPredictionChallenge.tsx`, `src/lib/educationalProgram.ts`.
- Bằng chứng: 3 loại thử thách đã có phản hồi từ provider nhưng không lưu kết quả; `learningProgress.ts` chỉ ghi `runStarted` (≤ 30 lượt), không phải mastery. Tham khảo năng lực: P11, P13, P14 (nhãn D); P03ᴬ/P08 chỉ tham khảo hướng, không dùng làm chuẩn.

Scope (đề xuất, sau Sol):
- allowed_paths: `src/lib/assessment*.ts` (mới), `src/data/curriculumSchema.ts`, `src/lib/learningProgress.ts`, `src/components/builder/InputOutputChallenge.tsx`, `tests/assessment-*.test.mjs` (mới).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, mọi `.env*`.

Constraints: local-first (lưu cục bộ, không tài khoản); không gọi code-subset là "chấm điểm"/mô phỏng điện; self-report và teacher review là record riêng, không mastery flag; không đổi lịch sử cũ.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, **đổi schema dữ liệu** (bắt buộc approval).

Done when:
- Với 3 bài analog: một mạch đúng và một mạch sai cho `met` / `not-yet` đúng trong test; thiếu dữ liệu → `ungradable`.
- `npm.cmd test` exit 0; `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0.

Report: file đã đổi; lệnh + exit code; ghi rõ phạm vi "không phải chấm điểm".
