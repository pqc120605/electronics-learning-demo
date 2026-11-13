# Review S3A + S3B (epic SIM) · Leader Claude · 10/11/2026

Phạm vi: `src/lib/breadboardGrid.ts`, `src/lib/circuitDocV2.ts`, `src/lib/mountResolve.ts`, `tests/breadboard-grid.test.mjs`, `tests/circuit-doc-v2.test.mjs`, đối chiếu `spec-v2.md` (v2.1) và prompt S3a/S3b trong `plan.md`. Không sửa mã.

## Kết luận
**NHẬN CÓ ĐIỀU KIỆN.** Lõi đúng và khớp spec; 1 lỗ hổng validator (F1, Medium) và 1 lỗi nhỏ của hàm lỗ (F2, Low). Nên sửa bằng một slice sửa nhỏ (S3b-fix) trước S3c.

## Đã kiểm
| Kiểm | Kết quả |
|---|---|
| SHA-256 5 file | khớp báo cáo Luna (5/5) |
| `node --test tests/breadboard-grid.test.mjs tests/circuit-doc-v2.test.mjs` | 14/14 pass |
| `npm.cmd run typecheck` | không in lỗi (đọc từ đuôi đầu ra; không đọc exit code) |
| Probe tự viết (vite SSR, ở scratchpad, không ghi vào repo) | 400 lỗ parse/format đủ (300 + 4×25); `bb1:31a`, `5k`, `""`, `01a`, `T+:26` đều null; `blink` (R tại 10c, LED tại 14d) cho footprint R = `10c,14c`, LED = `14d,15d` đúng ví dụ spec mục 6; doc hợp lệ chỉ ra 1 cảnh báo G2b của board; lỗ trùng chân bị G4; type lạ bị G2/G3; `null` và `{schema:2}` không ném lỗi; `lessonId` lạ không ném |
| Danh mục | `registryMissingBreadboardLegs()` rỗng; 9 loại bench rỗng `legsMm` đúng (limit-switch, ir-sensor, servo, dc-motor, battery, relay, buck-converter, boost-converter, h-bridge); `ultrasonic` (4 chân), `tb6612` (16 chân) cắm breadboard: khớp S2r |
| Xoay | công thức `rotate` ở `mountResolve.ts:84` khớp `rotateXZ` ở `assemblyLayout.ts:65-70` (90: `[z,-x]`, 270: `[-z,x]`) |
| Phạm vi | chỉ các file được phép; không sửa `assemblyLayout.ts`, manifest, dữ liệu bài |

## Phát hiện
| # | Mức | File:dòng | Vấn đề | Tái hiện (đã chạy) | Sửa tối thiểu |
|---|---|---|---|---|---|
| F1 | **Medium** | `circuitDocV2.ts:145-154`, `mountResolve.ts:150-153` | G4 không bắt **chân linh kiện và đầu dây trong cùng một lỗ**: `canMount` chỉ so chân với chân; vòng `wireHoleEnds` chỉ so đầu dây với đầu dây | doc `blink` + dây `w2` có đầu ở `bb1:10c` (lỗ chân R): `validateCircuitDoc` chỉ trả cảnh báo G2b, **không có G4** | với mỗi khóa của `occupancy(doc)`, nếu `legs.length>0 && wireEndpoints.length>0` thì G4 error; thêm test |
| F2 | Low | `breadboardGrid.ts:58` | `ROWS.includes(hole.row)` đúng cho chuỗi con: `row: ''` và `row: 'ab'` lọt `normalizeHole` | `formatHole({kind:'grid',board:'bb1',column:1,row:''})` → `"bb1:1"`; `row:'ab'` → `"bb1:1ab"`; `holeToMm(row:'')` trả tọa độ hàng a | `typeof row==='string' && row.length===1 && ROWS.includes(row)`; test đường object. `parseHole` (chuỗi) không bị |
| F3 | Low | `breadboardGrid.ts:99-103` | `railGroup` được tính nhưng không đổi kết quả (`railIndex = index-1`): ray không có khe giữa nhóm 5 lỗ | `railX(5)` = −20.32, `railX(6)` = −17.78 (cách đều 2,54) | hoặc thực hiện khe, hoặc bỏ biến dư và ghi `railGroup` chỉ là siêu dữ liệu; vẫn `railVerified:false` |
| F4 | Low | `circuitDocV2.ts:118` | Mã cổng G2/G4 chọn bằng regex trên câu tiếng Việt: đổi câu chữ là đổi cổng | — | `canMount` trả thêm `code: 'G2' \| 'G4'` |
| F5 | Low | `tests/circuit-doc-v2.test.mjs` | Chỉ test `rotation: 0` | — | thêm 1 ca xoay 90° (điện trở dọc qua hàng) |
| F6 | Info | `spec-v2.md` mục 6 | Ví dụ ghi `row c` (chữ), kiểu dùng số hàng 0-9 và neo `mount` = chân đầu (khớp `assemblyLayout`) | — | Đã sửa ví dụ spec |

Ghi chú không phải lỗi: mọi doc đều có cảnh báo G2b của `board` (nguồn `unknown`), nên cổng S4c phải coi cảnh báo là không chặn. Ray 25 lỗ vẫn là giả định (`railVerified:false`), đúng yêu cầu; S5b phải đối chiếu một ảnh 3D thật.

## Hành động
1. Giao Luna slice **S3b-fix** (≤3 file: `circuitDocV2.ts`, `breadboardGrid.ts`, `tests/circuit-doc-v2.test.mjs`): F1, F2, F4, F5; F3 tùy chọn. Xong khi: test mới cho F1 (đầu dây trùng lỗ chân bị G4), F2 (`row:''`, `'ab'` → null), F5 qua; `npm.cmd run typecheck` và `npm.cmd test` exit 0.
2. S3c sau S3b-fix (S3c dùng `occupancy`; sửa F1 xong thì khỏi sai khóa).
3. Luna ghi "AGENTS.md cấm gửi nội dung dự án cho Claude": đúng quy trình; founder là người chuyển báo cáo.
