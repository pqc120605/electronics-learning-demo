# 06 — WA-06 BOM theo biến thể (NHÁP, chưa gửi Codex) · Luna · G-B · 5 file · cần EF xác nhận giá trị

Goal: BOM của kit lớp học dùng variant identity (family + value/unit + package) với `bomKey` ổn định; giá trị thiếu là `unknown`.

Context:
- Đọc trước: `docs/product/2026-11-05-mach-mo-final-contracts.md` §5 (BOM/kit contract), `src/lib/classroomKit.ts:20,37,74,117,137`, `src/pages/ClassroomKitPage.tsx`, `tests/classroom-kit.test.mjs`.
- Bằng chứng: không tìm thấy trường variant trong `classroomKit.ts` (grep `variant|bomKey` chỉ ra comment dòng 20); status 05/11: gap còn lại là biến thể/giá trị/số lượng. Tham khảo năng lực: P17, P19, P21 (nhãn D); LCSC chỉ cho mẫu matching/thay thế, không gọi API.
- Quyết định: không suy 220 Ω từ family; preset chỉ sau khi EF xác nhận (task nguồn riêng).

Scope:
- allowed_paths: `src/lib/classroomKit.ts`, `src/pages/ClassroomKitPage.tsx`, `src/data/classroomKitPresets.ts` (mới, chỉ giá trị đã có nguồn), `tests/classroom-kit.test.mjs`, `tests/classroom-kit-variants.test.mjs` (mới).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, mọi `.env*`.

Constraints: local-first (không giá/tồn kho từ mạng); không thêm dependency; CSV/UI/share pack cùng identity/nhãn; override mơ hồ phải hiện preview, không áp cho mọi điện trở.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, **đổi schema `ClassroomKitBundle`** (cần versioning + reader cũ), hoặc điền giá trị linh kiện chưa có nguồn.

Done when:
- Test mới: hai điện trở khác value không gộp; thiếu value → `unknown`; round trip JSON/CSV giữ `bomKey`; bundle cũ vẫn đọc được.
- `npm.cmd test` exit 0; `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0.

Report: file đã đổi; lệnh + exit code; danh sách giá trị đang `unknown` cần EF.

## Founder amendment — 2026-11-08 (supersedes conflicting draft constraints above)

Founder has approved option B: implement `ClassroomKitBundle` schema version 2 with a legacy version-1 reader. Do not stop before versioning. Preserve existing version-1 localStorage/import data and its canonical serialized bytes when round-tripping without variant data. Emit schema v1 when there is no variant data; emit v2 only when variant data exists. Older clients must receive the existing clear unsupported-version result for v2.

Use the exact resistor key format from `src/lib/componentCatalog.ts:54`: `resistor:ohm:${nominal.value}` (for example, `resistor:ohm:10000`). Do not use the obsolete pipe-delimited example above. Missing/unknown values remain `unknown`; never infer 220 Ω from the resistor family. `analog-ldr` must identify its fixed resistor as 10 kΩ, matching the circuit/catalog evidence.

When importing a v1 family-level override such as `quantityOverrides.resistor`, detect whether the selected lessons contain multiple resistor `bomKey` values. Show a preview and require an explicit mapping or explicit decision to leave those variant quantities at their defaults; never fan the family override out automatically.

Required coverage before completion:
- v1 legacy canonical JSON round-trip is byte-identical and localStorage reload still reads it.
- v2 round-trips through JSON, CSV and the share-pack import/export path while preserving `bomKey`, value/unit/package and overrides.
- `analog-ldr` inventory/export visibly reports 10 kΩ (`resistor:ohm:10000`) and never substitutes 220 Ω.
- Missing values remain `unknown`; ambiguous v1 family overrides require preview/choice.
- Remove the skip from `tests/classroom-kit-variants.test.mjs` only after its assertions pass.
- Full unit suite, typecheck and `build:local` pass; independent QA and Tester review the final hashes.
