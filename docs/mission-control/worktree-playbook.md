# Worktree theo nhiệm vụ — Windows

Audit 05/11/2026: Git root `D:/StartupOS`, branch `main`, HEAD `4119a1131bec2fdc70a0de7cf4b87adcf5545661`. Product không có `.git` riêng; `git ls-files -- electronics-learning-demo` từ Git root trả rỗng. `git status` có nhiều thay đổi/untracked có sẵn, gồm sibling ReTrack. Không tách repo, không stage/commit/move/delete gì trong setup.

Worktrees đã có: `D:/StartupOS` (main); `C:/Users/ACER/.codex/worktrees/company-boardgame/StartupOS` (detached HEAD); `D:/StartupOS/.worktrees/startupos-advanced-platform` (`codex/startupos-advanced-platform`). Không tái sử dụng các worktree dự án khác cho Mạch Mở.

## Trước khi tạo

Một task có owner, allowed files, acceptance, base commit, dependencies và lý do cần cách ly. Không tạo 8 worktree thường trực. Review/docs nhỏ dùng local read-only. Hiện giữ worktree sản phẩm ở trạng thái BLOCKED_PENDING_BASELINE: một worktree Git mới không tự mang theo source Mạch Mở untracked hoặc config/shared docs untracked. Không copy toàn bộ working tree hoặc đưa secrets sang checkout mới.

Lead chuẩn bị exact file list/diff/license/secrets review và đề xuất baseline riêng Mạch Mở; chỉ stage các file cụ thể khi task đó được cho phép. Không dùng `git add .`, không tự tách repo. Nếu chọn baseline ở Git cha, worktree vẫn checkout toàn repo StartupOS; giới hạn task scope về `electronics-learning-demo/`, nhận diện shared docs/agent profiles cần thiết và không sửa sibling `app/`.

## Thực hành sau khi có baseline phù hợp

1. Kiểm lại các lệnh read-only từ terminal tại `D:/StartupOS`:

   ```powershell
   git rev-parse --show-toplevel
   git status --short
   git worktree list
   git ls-files -- electronics-learning-demo
   git rev-parse HEAD
   ```

2. Dùng chức năng tạo Worktree native của Codex cho project Mạch Mở, chọn starting state đã kiểm. Branch theo convention `codex/mm-<task-id>-<slug>`. Kiểm nguồn thật trong checkout, không tin chỉ tên project hoặc UI báo isGitRepository.
3. Task card ghi worktree absolute path, base commit, owner/writer, allowed paths và revision; worktree không chia sẻ file chưa commit. Shared queue do lead ghi ở checkout canonical; worker chỉ trả handoff, không sửa bản queue riêng trong worktree.
4. Sau implementation: chuyển commit/diff + exact hashes cho Tester; QA review snapshot đó. Nếu source đổi sau check, evidence cũ là STALE cho phần bị ảnh hưởng.
5. Lead kiểm base/upstream/file overlap, xếp contract trước caller, đề xuất integration sau review/check/rollback. Nếu conflict, dừng nhánh phụ thuộc, giải trên scope rõ và kiểm lại; không force push/reset/clean hoặc merge mù.
6. Chỉ tích hợp khi có quyền phù hợp. Giữ rollback bằng commit đảo riêng sau đánh giá; không reset thay đổi khác. Worktree native tạo ra được archive bằng tool native khi không còn cần và đã kiểm dữ liệu an toàn.

Chưa chạy create/merge/cherry-pick/commit/archive trong setup. Không có merge queue thực tế của Mạch Mở tại snapshot audit.
