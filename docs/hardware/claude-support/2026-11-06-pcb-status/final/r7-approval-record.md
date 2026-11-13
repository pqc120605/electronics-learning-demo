# Biên bản user duyệt hash r7

- Ngày: 07/11/2026.
- Người duyệt: user (founder), trong chat Claude Code.
- Lời duyệt nguyên văn: "Duyệt hash r7".
- File: `docs/hardware/mobot-v2-config-2026-11-05-r7.md`.
- SHA-256 lúc duyệt, do Claude tính lại bằng `sha256sum`: `9ef75eb96829669e730717eb8565290485f75ad8ca673a87b66c729cd4661d5d`. Khớp hash trong [mobot-v2-r7-box08-review-packet.md](../../../mobot-v2-r7-box08-review-packet.md).

## Phạm vi

Duyệt đúng bytes r7 với ba thay đổi H3, R1, R5 so với r6. Duyệt này **không** bao gồm:
- lease KiCad, do HQ cấp;
- verdict box08 cho các dòng "Đề xuất" trong [final-bom.md](final-bom.md);
- mua hàng, bench.

Quyết định UVLO robot 6,40–6,60 V (06/11) và ba quyết định ngày 07/11 (Schottky DNP, connector PH/XH, MOSFET SOT-23) nằm ngoài bytes r7. Chúng được ghi trong [thiet-ke-va-y-do.md](thiet-ke-va-y-do.md) §7. Nếu HQ muốn đưa các quyết định này vào cấu hình, cần soạn r8 và duyệt riêng.

## Việc cho Codex/HQ

Claude không sửa file của Codex. HQ cần làm:
1. Chuyển record r7 từ `proposed` sang `approved` với đúng hash trên. Xử lý định dạng proposal JSON cho preflight như packet box08 đã nêu.
2. Cập nhật `docs/agents/tasks.json`.
3. Cấp lease `MM-HW-MOBOT-REMOTE-KICAD-001` nếu các điều kiện khác đã đủ.

Nếu bytes r7 thay đổi sau thời điểm duyệt, biên bản này mất hiệu lực.
