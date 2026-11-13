# Đề xuất nâng cấp Học tập và Board & Linh kiện

Cập nhật: 02/11/2026. Đây là đề xuất nâng cấp có theo dõi trạng thái triển khai; mục đã làm và còn lại được phân biệt ở cuối tài liệu. Trạng thái sản phẩm xem ở [MACH-MO-MVP-STATUS.md](MACH-MO-MVP-STATUS.md).

## Hiện trạng

Dữ liệu nằm ở nhiều nơi và nối với nhau bằng id:

```
boards.ts ── id ──> boardCapabilityRegistry ──> boardModelSources
    │                        │
    │                  simulationTargets ──> builderLessons (chân, khóa bài)
    │
components.ts <── catalogId ── componentRegistry ──> component-models.manifest
    │
componentReferences.ts (mức nguồn suy ra từ kind)

curriculumSchema ──> learningPath (thứ tự, bài cần học trước)
       └──────────> lessonCircuits (linh kiện, dây) ──> preflight, lab, /projects
```

Phần yếu nhất là các mối nối: trước đây chúng chỉ được kiểm khi có lỗi. `tests/data-integrity.test.mjs` nay kiểm phần lớn các mối nối này.

## Kiến trúc dữ liệu

**Đề xuất:** gom các mức xác minh về một kiểu duy nhất, ví dụ `Evidence = { level: 'official' | 'community' | 'educational' | 'unverified'; sourceUrl?; scope; checkedAt? }`, dùng cho board, pin, thông số và linh kiện.

- **Lợi ích:** bỏ các cách nói song song hiện có (`physicalVerified`, `roleEvidence`, `confidence`, `modelStatus`, `kind`). Tên `physicalVerified` và `3d-verified` hiện nói mạnh hơn dữ liệu thật: chúng nghĩa là "có nguồn", không phải đã đo trên board.
- **Rủi ro:** đụng nhiều file. Không đổi `CircuitWorkspaceDocument` hay `PROJECT_BUNDLE_VERSION`, vì đây là dữ liệu chỉ đọc lúc build.
- **Cách làm:** đổi tên hai trường trên trước, rồi thêm kiểu mới song song, chuyển từng registry, cuối cùng bỏ trường cũ.

**Pin map:** tách pin khỏi `simulationTargets` thành bảng riêng theo board, mỗi chân có `evidence`. Sinh `getInputAlias` và `sevenSegmentPins` từ bảng đó. Hiện capability của NUCLEO ghi A0 đã xác minh, còn `getInputAlias` trả "alias 0 · chưa xác minh", vì hai nguồn tách nhau.

## Asset CAD và model

Đã có:
- `src/data/board-asset-lock.json` và `scripts/export-board-asset-lock.mjs`: GLB đổi mà không chạy lại script thì test fail.
- Tất cả board viewer đã dùng 12 ký tự đầu SHA-256 của GLB làm cache version; script export lock tự sinh version này. Test xác nhận URL và version khớp bytes của GLB.
- Giới hạn 20 MiB cho mỗi GLB board trong test.

Đề xuất tiếp:
1. Viết một script `import-board` dùng chung cho ba bộ convert Adafruit, vốn gần trùng nhau.
2. Thử gom primitive cho Uno (10 MB) và Mega (16,6 MB) như đã làm với QT Py. Phải giữ tên node để hotspot còn đúng; test lock và audit sẽ bắt sai lệch.
3. Thêm tổng dung lượng model vào lock để theo dõi theo thời gian.

## Bài học và tiến độ

Đã có: `prerequisiteLessonIds` có kiểu trong `curriculumSchema`, `getLessonPrerequisiteIds` đọc trực tiếp từ curriculum, chỉ khuyên và không khóa bài. Câu chữ `prerequisites` vẫn giữ riêng để hiển thị cho người học.

Đề xuất tiếp:
- Dần chuẩn hóa chuỗi tự do `prerequisites` để nội dung giải thích và liên kết bài không bị lệch.
- Tách trạng thái bài thành các bước (đã đọc, đã lắp, đã chạy) thay cho một cờ tự đánh dấu. Dữ liệu tiến độ mới phải đọc được bản cũ, giống cách `readLearningProgress` đang migrate.
- Lưu board đang chọn cùng tiến độ để CTA mở lại đúng board.

## Đồng bộ catalog, 2D, sơ đồ, 3D, simulator, project

Mỗi lát cắt hiện đọc nhãn linh kiện theo cách riêng, và lỗi 10 kΩ là hệ quả. `getCircuitPartDisplayLabel` là bước đầu.

**Đề xuất:** một hàm `describePart(part, target)` trả tên, trị số, loại model và mức nguồn, dùng chung cho preflight, lab, sơ đồ, 3D và `/projects`. PCB viewer nên nối với net ở một bước riêng vì cần netlist theo từng board.

## Công cụ authoring

- **Đã có:** bộ test toàn vẹn dữ liệu. Thêm board hoặc bài mà thiếu nguồn, revision, hotspot, trang vào bài thì test fail.
- **Đề xuất:** `npm run validate:content` chạy riêng bộ này và in lỗi dễ đọc cho người không viết code; mẫu `docs/` cho thêm board, linh kiện, bài học; trang nội bộ liệt kê mục còn "Hướng dẫn chung" để biết nên tìm datasheet nào.

## Ranh giới web demo và app

Giữ web demo cho: chạy không cần tài khoản, tiến độ cục bộ, parser giới hạn, CAD tham chiếu. Các phần cần chốt sản phẩm trước khi làm: đồng bộ tiến độ qua tài khoản, lớp học, firmware thật cho ngoài ATmega328P, mô phỏng điện.

## UI, accessibility, hiệu năng

- Thu nhỏ dần lượng chữ 9–10 px trong viewer, vốn khó đọc trên điện thoại.
- Tách `CircuitBuilderPage.tsx` theo ranh giới state, không đổi hành vi cùng lúc.
- Hiện tiến trình tải cho model lớn thay vì chỉ "Đang tải".
- Kiểm tra screen reader thật trên NVDA và VoiceOver cho viewer, danh sách linh kiện và stepper.

## Thứ tự ưu tiên

Điểm theo framework tech-debt: (Tác động + Rủi ro) × (6 − Công sức).

| # | Việc | Tác động | Rủi ro | Công sức | Điểm |
|---|---|---|---|---|---|
| 1 | Đổi tên `physicalVerified`, `3d-verified` | 2 | 4 | 1 | 30 |
| 2 | Bảy board sang hash GLB | Đã hoàn thành | — | — | — |
| 3 | `describePart` dùng chung | 4 | 4 | 3 | 24 |
| 4 | Bảng pin theo board có evidence | 4 | 5 | 4 | 18 |
| 5 | `prerequisiteLessonIds` trong schema | 2 | 1 | 1 | 15 |
| 6 | Gom primitive Uno, Mega | 3 | 2 | 3 | 15 |
| 7 | Script `import-board` dùng chung | 2 | 2 | 3 | 12 |
| 8 | Tiến độ theo bước | 4 | 2 | 4 | 12 |
| 9 | Tách `CircuitBuilderPage` | 3 | 3 | 5 | 6 |

## Trạng thái các mục (02/11/2026)

Đã làm: đổi tên `physicalVerified`, `3d-verified`; hash GLB cho mọi board; gom primitive Uno, Mega, Nano, ESP32; `prerequisiteLessonIds` là dữ liệu curriculum có kiểu và các helper lộ trình đọc trực tiếp từ đó.

Chưa làm: `describePart` dùng chung giữa các bề mặt; pin map evidence theo từng chân; script `import-board`; tiến độ học theo từng bước; tách `CircuitBuilderPage`.

`prerequisites` dạng câu chữ vẫn được giữ cho nội dung hiển thị. `prerequisiteLessonIds` là liên kết dữ liệu để dùng cho lộ trình và kiểm tra toàn vẹn; chúng chỉ đưa ra gợi ý, không khóa bài. Test kiểm tra rằng mỗi liên kết trỏ tới một bài có thật nằm trước bài hiện tại.
