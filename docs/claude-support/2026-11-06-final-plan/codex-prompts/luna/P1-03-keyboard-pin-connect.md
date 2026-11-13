Model: GPT-6 Luna
Goal: Cho phép nối chân linh kiện bằng bàn phím ở hai view sơ đồ và 3D.
Context: đọc trước `docs/claude-support/2026-11-06-review-webapp/findings.md` (M2). Bằng chứng: `src/components/builder/SchematicView.tsx:114` và `src/components/builder/Assembly3DView.tsx:57` có `<span className="part-pin …" onClick=…>` không focus được. `Assembly3DView` đã làm tốt cho linh kiện (`tabIndex=0`, Enter/Space/R/Delete). Kiểm trước xem `BuilderPinPanel.tsx` có đường nối bàn phím khác không; nếu có, ghi lại thay vì sửa. Task [đề xuất]: MM-SW-P1-L03.
Scope: allowed_paths tối đa 4 file: hai file view, một file test, tối đa một file CSS/helper. forbidden_paths: `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`, `package.json`.
Constraints: local-first; không thêm dependency; đổi `<span>` thành `<button type="button" aria-pressed={pending===key} aria-label=…>` hoặc tương đương, giữ nguyên hành vi chuột; không đổi kiểu dữ liệu nối dây.
Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi schema dữ liệu, hoặc nếu phải chạm quá 5 file.
Done when: `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0; có test (unit hoặc e2e) chứng minh Tab tới một chân, Enter chọn, Tab tới chân thứ hai, Enter tạo dây; e2e chạy được thì ghi kết quả, không thì NOT_RUN kèm lý do.
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-SW-P1-L03/`.
Claude review: KHÔNG
