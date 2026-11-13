# 03 — WA-03 Nối chân bằng bàn phím (NHÁP, chưa gửi Codex) · Luna · G-A · 4 file

Goal: Chọn chân và nối dây được bằng bàn phím và screen reader ở view sơ đồ và view 3D.

Context:
- Đọc trước: `src/components/builder/SchematicView.tsx:114`, `src/components/builder/Assembly3DView.tsx:57` (pin `<span onClick>` không `role`/`tabIndex`/`onKeyDown`), `src/components/builder/BuilderPinPanel.tsx`, `e2e/accessibility.spec.mjs`, `e2e/journeys.spec.mjs:12` (kéo dây bằng chuột).
- Bằng chứng: 16 ca axe đang pass nhưng axe không bắt lỗi "không thao tác được bằng bàn phím" ở span có onClick. Chưa xác nhận có đường nối dây bàn phím khác trong `BuilderPinPanel` — kiểm trước, nếu đã có thì chỉ ghi lại và dừng.
- Quyết định liên quan: pin click gọi `onPinClick(partId:pinId)` — giữ nguyên contract.

Scope:
- allowed_paths: `src/components/builder/SchematicView.tsx`, `src/components/builder/Assembly3DView.tsx`, `e2e/journeys.spec.mjs` (thêm một ca), CSS của `.part-pin` (một file `src/styles/*.css` hoặc css cạnh component).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, mọi `.env*`, `src/lib/circuitGraph.ts` và logic nối dây.

Constraints: local-first; không thêm dependency; không đổi hành vi chuột/kéo thả; `aria-pressed` phản ánh chân đang chờ; nhãn đọc được tên linh kiện + chân + cực.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu.

Done when:
- E2E mới: chọn hai chân bằng `Tab`+`Enter`/`Space` tạo đúng 1 dây; `Escape` hủy chân chờ.
- `npm.cmd run test:e2e` exit 0 (≥ 29 pass, 0 fail, giữ nguyên 16 ca axe); `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0.

Report: file đã đổi; lệnh + exit code; ảnh/ghi chú tab order nếu có.
