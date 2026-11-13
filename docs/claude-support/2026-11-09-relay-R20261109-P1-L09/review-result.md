# REVIEW_RESULT · B8 `MM-SW-P1-L09` spike `@wokwi/elements` · 09/11/2026 · Leader Claude

Phạm vi theo request R-20261109-P1-L09: chỉ spike cô lập, tư vấn; không duyệt đưa gói vào app. Đối tượng: `electronics-learning-demo/spikes/wokwi-elements/`, 6 hash trong `snapshot.json`, tôi tính lại bằng `sha256sum`, cả 6 khớp (`package.json` `bb7ed77d…83e9`, `package-lock.json` `3f3b0a66…5e0e28`, `index.html` `67e8847d…6226`, `main.js` `87795487…69a2`, `dist/index.html` `71b3963b…bb3`, `dist/assets/index-dt1GqgiM.js` `70562446…3bde`).

## Kết luận
**changes_requested (một điều kiện license), chưa có finding High.** Gói, phiên bản, license gốc và việc phân biệt hình minh họa với mô phỏng đều đúng. Thiếu một bước: license BSD-3-Clause của các gói transitive (`lit`…) không nằm trong D17 và báo cáo không nêu. Chưa phải phê duyệt đưa gói vào app.

## Đã kiểm (kết quả)
- 6 hash khớp. `package.json`: `@wokwi/elements` ghim đúng `"1.9.2"` (không dấu `^`), `private: true`.
- `package-lock.json`: 9 gói; `@wokwi/elements` 1.9.2, `resolved` registry.npmjs.org, có `integrity` sha512, `license: MIT`. Đủ 9 gói: `@lit-labs/ssr-dom-shim` 1.6.0 BSD-3-Clause, `@lit/reactive-element` 2.1.2 BSD-3-Clause, `@types/react` 19.3.0 MIT, `@types/trusted-types` 2.0.7 MIT, `csstype` 3.2.3 MIT, `lit` 3.3.3, `lit-element` 4.2.2, `lit-html` 3.3.3 (cả ba BSD-3-Clause). Khớp "9 packages" trong báo cáo.
- `node_modules/@wokwi/elements/package.json`: name `@wokwi/elements`, version 1.9.2, license MIT, dependencies `@types/react >=16` và `lit ^3.0.0`. File `LICENSE` cài cục bộ giống từng dòng đoạn "LICENSE text" trong `report.md` (diff không khác).
- Kích thước: `dist/assets/index-dt1GqgiM.js` = 438.621 byte = 438,62 kB, đúng. gzip: `gzip` mặc định cho 94.851 byte, `-9` cho 94.027 byte; báo cáo ghi 96,39 kB (Vite dùng bộ nén riêng). Cùng bậc độ lớn, không tái tạo chính xác (QA nội bộ cũng ghi "gzip independently unreproduced").
- Báo cáo phân biệt rõ hình minh họa với mô phỏng: dòng 44 ("visual-only", README nói là trình bày, không mô phỏng phần cứng) và dòng 47 ("No evidence that the visual component encodes electrical behavior…", "do not … claim simulation/physical support"). Browser, offline, React runtime đều ghi `NOT_RUN`, không khẳng định quá mức.
- Spike nằm ngoài `src/`; `package.json`/`package-lock.json` gốc của app hiện không được git theo dõi nên tôi không chứng minh được "không đổi" bằng diff.

## Không kiểm
- Không chạy lại `npm install`, `vite build` (122 ms, 88 modules), `typecheck`, `npm test` 408 (báo cáo tự nói 406 trước đó chỉ suy ra, không có chạy trước thay đổi), `build:local`.
- Không dùng mạng: không xác nhận lại trang npm/GitHub v1.9.2 (chỉ dựa vào lockfile, `LICENSE`, `package.json` cục bộ).
- Không mở trình duyệt: hiển thị, offline, shadow DOM, bàn phím, React 19 đều chưa kiểm (đúng như báo cáo).

## Findings

**F1 · Medium · License transitive BSD-3-Clause chưa được đánh giá theo D17/D18.**
`report.md:32` ("D17 permits MIT") chỉ xét gói gốc. D17 (`founder-decisions.md:36`): mã chỉ nhận MIT, Apache-2.0, CC0 "hoặc tương đương đã duyệt". D18: "slice dừng nếu license không thuộc D17". Lockfile cho thấy năm gói BSD-3-Clause (`lit` và họ hàng) là phụ thuộc của gói; mã `lit` là thư viện nền của custom element nên đi vào bundle 438,62 kB (suy luận từ cấu trúc phụ thuộc, tôi không soi nội dung bundle). BSD-3-Clause là license cho phép nhưng đòi giữ thông báo bản quyền khi phân phối; việc coi nó là "tương đương đã duyệt" là quyết định của founder, không phải của worker hay của tôi.
Impact: nếu đưa gói vào app mà không ghi, sản phẩm phân phối mã BSD-3 khi chưa ai chấp nhận license này và chưa có thông báo bản quyền.
Fix tối thiểu: founder ghi rõ chấp nhận BSD-3-Clause cho mã (hoặc từ chối); `report.md` và dòng 11 của `docs/data-sources/registry.md` ghi phiên bản `1.9.2` và danh sách 8 gói transitive kèm license. Tôi không phải luật sư; ý kiến pháp lý trước khi bán sản phẩm vẫn chưa làm.

**F2 · Low · `@types/react` là phụ thuộc `dependencies` của gói gốc.**
Gói gốc khai `@types/react >=16` trong `dependencies`; đây là gói chỉ-kiểu. Khi tích hợp, nó vào cây phụ thuộc của app (app dùng React `^19.2.8`). Không ảnh hưởng bundle. Ghi vào điều kiện tích hợp để slice sau không nhầm là gói chạy runtime.

**F3 · Low · Nhận định "Official sources checked" chưa có dấu vết kiểm.**
`report.md:32` ghi đã kiểm trang npm và GitHub; hai link được đưa nhưng không có tệp lưu kết quả hay giờ kiểm. Tôi dựa vào lockfile và `LICENSE` cục bộ (khớp), chưa kiểm lại trang trực tuyến. Nên lưu trích đoạn khi founder duyệt.

**O1 · Quan sát.** Khuyến nghị của báo cáo (một component mỗi lần, test tích hợp theo slice, không thay mô hình mạch, không khẳng định mô phỏng) phù hợp D18 và tôi không đề nghị đổi. Ba phần cần kiểm trước khi dùng thật đã được báo cáo nêu: tích hợp React/custom element, shadow DOM và bàn phím, phủ danh mục linh kiện (LDR, OLED, transistor, motor… chưa khớp).

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C05
reply_to: R-20261109-P1-L09
type: REVIEW_RESULT
verdict: changes_requested (một điều kiện license, không High): @wokwi/elements 1.9.2 MIT đúng, 6 hash khớp, phân biệt mockup/mô phỏng đúng, NOT_RUN ghi trung thực; nhưng 5 gói transitive BSD-3-Clause (lit…) chưa được đánh giá theo D17; không phải duyệt đưa gói vào app
findings: F1 Medium (BSD-3-Clause transitive ngoài danh sách D17, cần founder quyết và ghi vào registry); F2 Low (@types/react là dependencies của gói gốc); F3 Low (không có dấu vết kiểm trang npm/GitHub); O1 (khuyến nghị phù hợp D18)
checks_run: sha256 6 file; đọc package.json, lockfile (9 gói, license từng gói), package.json và LICENSE cài cục bộ (diff với báo cáo: giống); size JS 438.621 byte; gzip tái tạo 94,85 kB (khác 96,39 kB do bộ nén)
checks_not_run: npm install, vite build, typecheck, npm test 408, build:local; kiểm trang npm/GitHub (không mạng); trình duyệt/offline/React runtime; diff package.json gốc (không baseline)
done_when: founder quyết BSD-3-Clause; Codex ghi phiên bản và license transitive vào registry dòng 11; chưa nhận gói vào app root
=== END RELAY ===
```
