# Thay đổi code trong review này

Ngày: 04/11/2026. Chỉ có một thay đổi code (B01). Thay đổi nhỏ, đã được tái hiện, nguyên nhân rõ, nằm trong luồng có sẵn. Không stage, không commit.

## C01 · Sửa B01: trùng key và nút tài liệu lặp trong catalog board

| File | Thay đổi |
|---|---|
| `tests/data-integrity.test.mjs` | Thêm test `a board lists each reference link once, so the catalog keys and buttons stay unique`: `referenceDocs` của mỗi board không lặp URL, và nút "Tài liệu hãng" không trùng một tài liệu đã có nhãn |
| `src/data/boards.ts` | XIAO ESP32-S3: gộp hai mục `referenceDocs` cùng URL guide thành "Hướng dẫn, pin map bản thường và phân biệt Sense/Plus". Thêm `getCatalogEvidenceUrl(board)` |
| `src/pages/BoardCatalogPage.tsx` | Nút "Tài liệu hãng" trong viewer dùng `getCatalogEvidenceUrl(activeBoard)`; import helper |

Phạm vi ảnh hưởng: 12 board có `sourceEvidenceUrl` nằm sẵn trong `referenceDocs` không còn hiện nút lặp. Các board khác giữ nguyên. `BoardProfile.tsx` đã tự khử trùng nên không sửa.

### Kiểm chứng

| Lệnh / thao tác | Kết quả |
|---|---|
| Test mới trước khi sửa | exit 1: `seeed-xiao-esp32c3 lists its sourceEvidenceUrl again in referenceDocs` (phiên bản đầu của test); XIAO S3 có URL lặp |
| Test mới sau khi sửa | exit 0, 1/1 pass |
| `node --test --test-concurrency=1 tests/*.test.mjs` | exit 0, **349/349 pass**, 77,6 s |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd run build:local` | exit 0 |
| Browser `/boards?board=seeed-xiao-esp32-s3` sau khi reload | Không còn lỗi "same key"; link trong viewer từ 10 (2 cặp trùng) còn 8, đều khác nhau |

`check:public-release` vẫn exit 1 (gate SPICE). Thay đổi này không liên quan tới gate.

## Dữ liệu tạm đã tạo và dọn

- Trong lab buck-boost (state của trang, không lưu project): xóa dây converter, thêm dây nguồn → R và LED → nguồn để thử handoff SPICE. Không bấm "Lưu project".
- `sessionStorage`: một handoff SPICE (tự hết hạn sau 30 phút).
- `tests/_tmp_dup.mjs`: script tạm để liệt kê URL trùng, đã xóa ngay sau khi chạy.
- `localStorage` của planner kit có sẵn "Đã lưu kế hoạch trên thiết bị này"; không sửa.
