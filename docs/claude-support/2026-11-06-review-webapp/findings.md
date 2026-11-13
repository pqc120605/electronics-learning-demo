# Review web app Mạch Mở — việc cần hoàn thiện (2026-11-06)

Vai: reviewer chỉ đọc. Không sửa code, không commit, không cài package, không mở `.env`.
Phạm vi: `src/**` (205 file, ~15,9k dòng TS/TSX), `package.json`, `public/sw.js`, `supabase/migrations/*`.

## 1. Check đã chạy / chưa chạy

| Check | Kết quả |
|---|---|
| `npm.cmd run typecheck` | Đạt (exit 0). Lần chạy đầu và một lần gọi `tsc --strict` mặc định bị crash V8 hết heap (exit 134, "Last few GCs") — xem M3. |
| `tsc -p tsconfig.app.json --noEmit --strict` với `--max-old-space-size=8192` | Đạt, 0 lỗi. Code đã sạch dưới strict, dù config không bật strict (L1). |
| `npm.cmd test` (mặc định, song song) | **Lỗi**: nhiều file test fail với `errno -4094 code UNKNOWN syscall spawn` — xem M4. |
| `node --test --test-concurrency=1 tests/*.test.mjs` | **367/367 pass**, 0 fail. |
| `npm.cmd run check:public-release` | Chặn (exit 1): ngspice WASM chưa cleared, thiếu 5 điều kiện — xem H1. |
| Lint | Không chạy được: `package.json` không có script lint, không có config eslint/oxlint, `node_modules/.bin/oxlint.cmd` không tồn tại. |
| axe/e2e (`test:e2e`), `build`, `build:local`, screen reader, touch thật | Chưa chạy (e2e cần trình duyệt; build ghi `dist`). |

Ghi chú: `README.md` và `docs/claude-code-review-brief.md` chỉ tra tiêu đề/đọc lướt, không đọc toàn văn. `MACH-MO-MVP-STATUS.md` đọc 226/701 dòng đầu; các mục "lỗi còn mở" ở mục 04/11 không được kiểm lại (status 05/11 nói là lịch sử). Riêng `boardCapabilityRegistry.ts:107` hiện chỉ có chuỗi "Chưa có pin map trong web…", không thấy nhãn "không chạy firmware" cho Uno/Nano ở dòng này → mục lỗi cũ có vẻ đã lỗi thời, chưa xác nhận hết file.

## 2. Findings theo ưu tiên

### H1 — High — Build phát hành bị chặn (không phải bug code)
- Bằng chứng: `npm run check:public-release` exit 1; `build`/`build:public` gọi gate này (`package.json` scripts). Artifact `/vendor/eecircuit-engine/spice.wasm` SHA-256 `ed799542…ae886e4`.
- Thiếu: trạng thái cleared, source commit ngspice, recipe/toolchain, inventory thành phần, review gắn hash.
- Tác động: không có bản build công khai hợp lệ; chỉ `build:local` dùng được.
- Sửa tối thiểu: đóng 5 điều kiện bằng bằng chứng provenance, hoặc quyết định thay/loại engine khỏi bản public. Việc này của founder/Codex, không sửa bằng code UI.

### M1 — Medium — Lưu nháp lỗi bị nuốt im lặng
- `src/pages/CircuitBuilderPage.tsx:677-678`: `try{workspaceStorage.setItem(...)}catch{}` cho `lessonDraftsStorageKey` và `branchStorageKey`; dòng 513 cũng `catch{}` khi `worker.postMessage`.
- Tái hiện (suy luận từ code, chưa chạy): storage đầy hoặc bị chặn → effect chạy lại mỗi lần đổi nháp, không báo gì; người học tưởng đã lưu, reload mất code/nhánh.
- Tác động: mất dữ liệu học viên không có cảnh báo. Không nhất quán với `savedProjects` (đã báo lỗi quota).
- Sửa tối thiểu: bắt lỗi, đặt state cảnh báo một lần ("Không lưu được bản nháp trên trình duyệt này"), có `role="status"`.

### M2 — Medium — Nối chân bằng chuột nhưng pin là `<span onClick>` không focus được
- `src/components/builder/SchematicView.tsx:114` và `src/components/builder/Assembly3DView.tsx:57`: `<span className="part-pin …" onClick=…>` không có `role="button"`, `tabIndex`, `onKeyDown`.
- Bằng chứng: đọc code. `Assembly3DView` đã làm tốt cho cả linh kiện (`tabIndex=0`, Enter/Space/R/Delete), nhưng chân thì không.
- Câu hỏi cần kiểm tra thêm: có đường nối dây bằng bàn phím khác không (ví dụ `BuilderPinPanel.tsx`, `AssemblyStage.tsx` có 21 thuộc tính aria/role). Tôi grep `BuilderPinPanel.tsx` không thấy `onPinClick`/bàn phím; chưa đọc kỹ luồng. Nếu không có, người dùng bàn phím/screen reader không tạo được dây ở hai view này.
- Sửa tối thiểu: đổi thành `<button type="button" aria-pressed={pending===key} aria-label=…>`; hoặc xác nhận và ghi rõ đường thay thế.

### M3 — Medium — `tsc` hết heap ngẫu nhiên
- Bằng chứng: trong phiên này `npm run typecheck` crash V8 (exit 134) một lần và `tsc --strict` mặc định một lần; chạy lại hoặc thêm `--max-old-space-size=8192` thì đạt.
- Tác động: CI/typecheck có thể fail giả; dễ bị hiểu nhầm là lỗi code.
- Sửa tối thiểu: đặt `NODE_OPTIONS=--max-old-space-size=4096` trong script/CI, hoặc chia project references. Chưa rõ nguyên nhân gốc (có thể do ngưỡng bộ nhớ môi trường sandbox) → coi là cần theo dõi.

### M4 — Medium — `npm test` mặc định không ổn định
- Bằng chứng: chạy `npm.cmd test` (song song) hai lần, nhiều file fail với `spawn` `errno -4094 UNKNOWN`; chạy `--test-concurrency=1` thì 367/367 pass. Status doc cũng luôn chạy `--test-concurrency=1`.
- Tác động: kết quả `npm test` không dùng được làm bằng chứng nếu máy/sandbox hạn chế process con. Chưa kết luận do code hay do môi trường.
- Sửa tối thiểu: đưa `--test-concurrency=1` vào script `test` (hoặc ghi rõ trong README), và kiểm tra lại ngoài sandbox.

### L1 — Low — `tsconfig.app.json` không bật `strict`
- `tsconfig.app.json` chỉ có `noUnusedLocals/Parameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`; không có `strict`.
- Bằng chứng: `tsc --strict` với heap lớn cho 0 lỗi → bật strict không tốn công sửa.
- Sửa tối thiểu: thêm `"strict": true` để code mới không tụt lại.

### L2 — Low — Thiếu lint, hook deps không được kiểm soát
- Không có script/config lint. Ví dụ cần chú ý: `src/pages/ComponentsPage.tsx:45` `useEffect(() => { if (link.status === 'found') revealDetail() }, [])` thiếu deps (hiện vô hại vì chỉ chạy lúc mount).
- `CircuitBuilderPage.tsx` (1040 dòng, nhiều câu lệnh trên một dòng) rất khó review hook; không thấy lỗi cleanup: worker, interval, listener đều có `terminate`/`clear`/`remove`.
- Sửa tối thiểu: thêm eslint/oxlint với `react-hooks/exhaustive-deps` và chạy trong CI; tách `CircuitBuilderPage` thành hook nhỏ khi có dịp.

### L3 — Low — Service worker: tên cache cố định, comment nói "bounded"
- `public/sw.js:1` `CACHE_NAME='mach-mo-shell-v1'` không đổi theo bản build; `sw.js:50-57` chèn mọi `/assets/*.js|css` đã tải vào cùng cache, không bao giờ xóa bản cũ (activate chỉ xóa cache khác tên). `registerServiceWorker.ts:1` gọi là "bounded app-shell cache".
- Chỉ precache asset ở `index.html`; chunk lazy route chưa tải sẽ không có khi offline (`sw.js:11-12`). Chưa kiểm tra bằng trình duyệt.
- Tác động: cache tăng dần qua các lần deploy; offline lẻ route.
- Sửa tối thiểu: gắn version/hash build vào `CACHE_NAME`, hoặc dọn entry không có trong manifest hiện tại.

### L4 — Low — Error boundary không ghi lại lỗi
- `src/App.tsx:26-66`: `BuilderErrorBoundary` và `RouteErrorBoundary` có `getDerivedStateFromError` nhưng không `componentDidCatch`; lỗi render biến mất, chỉ có UI báo lỗi. `App.tsx:38` dùng `<a href="/projects">` cứng (tải lại trang) và không theo `PRODUCT_ROUTES`/bề mặt app.
- Sửa tối thiểu: `componentDidCatch` ghi `console.error` (không gửi nội dung user); dùng `Link` + `R.appProjects`/`R.publicProjects`.

### Câu hỏi / Cần kiểm tra thêm
1. `Assembly3DView.tsx:53` `onWheel={e => { e.preventDefault(); … }}`: React gắn listener wheel dạng passive, `preventDefault` có thể bị bỏ qua và cảnh báo console; các view khác (`BoardViewer.tsx:175`, `AssemblyStage.tsx:144`) dùng `addEventListener('wheel', …, {passive:false})`. Cần thử trên trình duyệt xem trang có cuộn khi zoom không.
2. Analytics (`src/lib/analytics.ts`) gửi sự kiện cho mọi khách khi Supabase được cấu hình, không có banner đồng ý; `PrivacyPage.tsx:12` có công bố. Quyết định sản phẩm/pháp lý: có cần opt-in theo thị trường mục tiêu không?
3. Luồng nhập tệp: `FirmwareHexToolPage.tsx:58` giới hạn 2 MB; chưa kiểm tra giới hạn kích thước/schema cho nhập JSON project (`savedProjects.ts`, `ClassroomKitPage.tsx`). Cần đọc thêm.
4. Chưa chạy axe, chưa đo 768/1024 px, chưa thử kéo dây bằng chuột/touch thật (status cũng ghi chưa làm) → độ phủ a11y/responsive vẫn là khoảng trống.

## 3. Bảo mật client — kết quả tốt (đã kiểm chứng bằng grep/đọc)
- Không có `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` trong `src`.
- Mọi link `target="_blank"` đều có `rel="noreferrer"`.
- Chỉ `VITE_SUPABASE_URL` và anon key ở client (`src/lib/supabase.ts`); không thấy service-role key.
- Cổng admin phía client (`AdminGate.tsx`) chỉ là UX; quyền thật nằm ở RLS: `0001_analytics_and_admin.sql` bật RLS cho `site_admins` và `analytics_events`, `revoke all` rồi cấp insert theo cột cho khách, select cho `authenticated` qua policy admin, `get_analytics_summary` chỉ `authenticated`. Chưa chạy thử RLS trên DB thật.
- `trackEvent` lọc path, chặn `/admin`, whitelist `component_id`.
- Redirect sau đăng nhập dùng `location.state.from` do chính app đặt (pathname nội bộ), không lấy từ query.

## 4. Việc nên làm trước (thứ tự đề nghị)
1. H1 (quyết định phát hành) — founder.
2. M1 báo lỗi lưu nháp; M2 xác nhận/sửa nối chân bằng bàn phím.
3. M3/M4/L1/L2: ổn định typecheck/test, bật strict, thêm lint — rẻ, tăng độ tin của mọi lần kiểm chứng sau.
4. L3/L4, rồi các câu hỏi mục 2.
