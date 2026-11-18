# Nguồn hãng dùng trong review r5

Ngày truy cập/tải: 16/11/2026. Trang tính theo số trang PDF (bắt đầu 1). Nguồn tải từ hãng; không có trao đổi với vendor. Hash ghim đúng bytes đã đọc, không suy ra MPN/suffix TBD được duyệt.

| Tài liệu / revision | Trang đối chiếu | PDF local | SHA-256 |
|---|---|---|---|
| [BQ25886](https://www.ti.com/lit/ds/symlink/bq25886.pdf) — SLUSD88A; June 2019 | 1, 8, 27, 31 | [PDF](../../research/downloads/2026-11-16-r5-review/ti-bq25886-slusd88a.pdf) | `07bb5adce244fc362248faf015098fe28c7df27c8df16e6414efba94b406b893` |
| [TPS631000](https://www.ti.com/lit/ds/symlink/tps631000.pdf) — SLVSFH3C; August 2026 | 18 | [PDF](../../research/downloads/2026-11-16-r5-review/ti-tps631000-slvsfh3c.pdf) | `b52a4064a8c2cbb4c9dd97f366b398dedcb490ffc9d564245f297536a19b426b` |
| [2N7002](https://www.diodes.com/_files/datasheets/2N7002.pdf) — DS11303 Rev.40-2; July 2024 | 2 | [PDF](../../research/downloads/2026-11-16-r5-review/diodes-2n7002-ds11303.pdf) | `ff8e1c98f93c7e3a2cdbe763d4ef6bd6028699bf005882871c00d2d5a398f6b1` |
| [TPS54302](https://www.ti.com/lit/ds/symlink/tps54302.pdf) — SLVSDG6C; March 2026 | 5 | [PDF](../../research/downloads/2026-11-16-r5-review/ti-tps54302-slvsdg6c.pdf) | `d81679ba6ba0a366e372ff8184c4e4b6c20383bdad41c90d636b75d097ae51b8` |
| [TPS63070](https://www.ti.com/lit/ds/symlink/tps63070.pdf) — SLVSC58B; March 2019 | 10 | [PDF](../../research/downloads/2026-11-16-r5-review/ti-tps63070-slvsc58b.pdf) | `a88ef66f3493156ff6e7da0849de0e0e1068647f2553d08c1844d4a90c5c65ef` |
| [DRV8833](https://www.ti.com/lit/ds/symlink/drv8833.pdf) — SLVSAR1E; July 2015 | 3, 4, 5, 6, 10 | [PDF](../../research/downloads/2026-11-16-r5-review/ti-drv8833-slvsar1e.pdf) | `3e400e333f08f1b93ec99a2d52a6af2a864e88462cc892282208548d9e9f0de4` |
| [QFN and SON PCB Attachment](https://www.ti.com/lit/an/slua271c/slua271c.pdf) — SLUA271C; December 2023 | 7, 8, 11 | [PDF](../../research/downloads/2026-11-16-r5-review/ti-qfn-son-slua271c.pdf) | `4693fd4df14f57f67088d881b9509a56db4a084a333caac53f81bc5c800b23ce` |

## Chưa ghim được bản local

Hai PDF Coilcraft đọc được text qua web; tải công khai trực tiếp gặp Cloudflare. Không thử vượt chặn. Recommended land pattern chưa được kiểm bằng hình gốc, không có hash local; không gán kích thước từ text PDF bị mất bố cục.

- [XEL4030](https://www.coilcraft.com/getmedia/8245f050-f190-4295-8c41-7c03d662ee3d/xel4030.pdf) — Doc1321; revised 02/19/2026: cần PDF/ảnh trang land pattern hãng để đối chiếu part, suffix, kích thước và dung sai; không hỏi mua/báo giá.
- [XFL4020](https://www.coilcraft.com/getmedia/50632d43-da1b-4cdb-8ab4-3029cab51df3/xfl4020.pdf) — Doc745; revised 03/10/2026: cần PDF/ảnh trang land pattern hãng để đối chiếu part, suffix, kích thước và dung sai; không hỏi mua/báo giá.

## Ảnh trang nguồn để kiểm lấy mẫu

- [BQ25886 tr.8](images/source-bq25886-p8.png): hệ số ICHGSET.
- [TPS631000 tr.18](images/source-tps631000-p18.png): layout guideline.
- [2N7002 tr.2](images/source-2n7002-p2.png): ngưỡng và điều kiện bảo đảm.

Các ảnh là render từ PDF đã ghim, không phải phép đo phần cứng.
