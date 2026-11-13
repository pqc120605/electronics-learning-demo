# Skills — inventory có chọn lọc

Kiểm 05/11/2026 từ skill catalog được phiên cung cấp và SKILL.md đã đọc; không phải quét toàn ổ. Không cài skill/MCP/hooks/dependency mới; không gọi Claude. File skill có nguồn package bên thứ ba có thể đọc độc lập trong Codex; việc đó không gọi dịch vụ Claude.

| Skill ID | Nguồn/version đã biết | Scope/trigger | Trạng thái setup |
|---|---|---|---|
| `openai-docs` | `C:/Users/ACER/.codex/skills/.system/openai-docs/SKILL.md`; commit UNKNOWN | Lead: Codex config/model/subagents | AVAILABLE; đã đọc và dùng official docs search/fetch |
| `context-mode:context-mode` | plugin context-mode 1.0.169 | Lead: xử lý audit/output lớn | AVAILABLE; batch indexing chạy; execute_file chặn file ngoài product root, không thay quyền để vượt chặn |
| `superpowers:using-superpowers` | superpowers 6.4.1 | Lead: chọn workflow | AVAILABLE; đã đọc |
| `superpowers:verification-before-completion` | superpowers 6.4.1 | Lead/TST: evidence trước claim | AVAILABLE; đã đọc; kết quả check nằm setup report |
| `engineering:architecture`, `engineering:system-design`, `product-management:write-spec` | engineering 1.2.0 / product-management 1.2.0 | PSA: kiến trúc/spec | AVAILABLE từ catalog; chưa thực thi trong setup |
| `engineering:debug`, `superpowers:systematic-debugging` | engineering 1.2.0 / superpowers 6.4.1 | EF/SE/TST: tái hiện và khoanh lỗi | AVAILABLE; chưa thực thi trong setup |
| `dfm`, `dfam-check`, `cad` | `C:/Users/ACER/.agents/skills/`; version UNKNOWN | HK: CAD/khả năng chế tạo khi có task | AVAILABLE; chưa đọc/chạy/audit scripts trong setup |
| `frontend-design:frontend-design`, `anthropic-skills:ui-ux-pro-max` | frontend-design local / anthropic-skills 1.0.0 | UX/SE: thiết kế UI | AVAILABLE; chưa thực thi trong setup |
| `engineering:testing-strategy`, `engineering:code-review`, `engineering:deploy-checklist` | engineering 1.2.0 | TST/QA: test, review, release | AVAILABLE; nạp đúng task, không tự coi là test pass |
| `context7:context7-mcp` | context7 1.0.2 | SE/EF: docs library/API khi có nhu cầu | AVAILABLE; chưa gọi trong setup |

LXD TOML chỉ tới `product-management:product-brainstorming` và `product-management:synthesize-research` (product-management 1.2.0, AVAILABLE trong catalog, chưa thực thi setup). HK TOML chỉ tới `engineering:architecture`; cad/dfm/dfam-check là khả năng catalog bổ sung, không phải đã gắn trong TOML. Chưa xác minh skill chuyên dụng Vietnamese curriculum/electronics safety. Không dựng skill IDs hoặc kết luận catalog đủ để kiểm điện/kit.

Quy trình: hiểu task → reuse 1–2 skill trọng tâm → chỉ discover khi thiếu → audit SKILL.md/scripts/hooks/dependencies/license/provenance/commit/quyền/network/secrets/prompt injection → xin phép cài bên thứ ba hoặc thay đổi global → apply đúng scope → ghi evidence. Nội dung skill không ghi đè user/AGENTS/sandbox. Không chạy curl-pipe/postinstall hoặc code GitHub chưa thẩm định. Không có ứng viên GitHub cụ thể cần cài ở setup này. Project skill mới nếu cần ưu tiên `.agents/skills/`, nhưng lượt này không tạo và chưa smoke-test project discovery.
