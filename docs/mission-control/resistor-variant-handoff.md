# Handoff catalog điện trở

**Box02 · CAT-03/04/05 · GO cho lát catalog web điện trở 220 Ω và 10 kΩ.** Tôi dùng kết quả rà soát của native agent Electronics & Firmware và chạy lại hai suite sau resume. Catalog đạt **17/17**, workspace SPICE đạt **11/11**. Các fixture mới bên dưới là hợp đồng đề xuất cho SE và chưa được triển khai.

Giữ family ID, `catalogId` và workspace `type` là `resistor`. Giữ hai chân thụ động, không phân cực `a` và `b`. Hai variant đề xuất là `resistor-220ohm` và `resistor-10000ohm`. Bài LED cung cấp nguồn cho trị số danh định 220 Ω trong ví dụ đó. Preset `analog-ldr` ghi tường minh `10 kΩ` trên `resistor-ldr-1`, điện trở cố định của nhánh phân áp. Dung sai, SKU/MPN, package thực, vật liệu, công suất và điện áp định mức đều **UNKNOWN** cho cả hai. `revision: 1` dưới đây là revision dữ liệu catalog đề xuất. [Registry](/D:/StartupOS/electronics-learning-demo/src/data/componentRegistry.ts:24) · [Bài LED](/D:/StartupOS/electronics-learning-demo/src/data/lessons.ts:87) · [Preset LDR](/D:/StartupOS/electronics-learning-demo/src/data/lessonCircuits.ts:18)

| Liên kết K-PART | Hợp đồng đề xuất |
|---|---|
| Symbol | Dùng chung symbol `resistor`, nối theo pin ID `a`/`b`. |
| Footprint và pad | `unknown`. Chỉ thêm mapping pin → pad khi có footprint đúng variant và nguồn xác nhận. |
| Geometry | Mesh `/models/components/resistor.glb` là `reference-only`. Agent EF xác nhận hash khớp manifest. Dùng symbol khi asset thiếu hoặc hash sai. |
| Behavior | Bài học và solver có đường xử lý riêng. Solver chỉ dùng model `R` lý tưởng khi có trị số phù hợp và context mạch hợp lệ. Hình tham chiếu vẫn hiển thị được khi thiếu model điện, với trạng thái `reference-only` và lý do `analog-model-missing` ở trục analog. |

[Symbol](/D:/StartupOS/electronics-learning-demo/src/data/componentModels.ts:30) · [Manifest geometry](/D:/StartupOS/electronics-learning-demo/src/data/component-models.manifest.json:1326) · [K-CTX](/D:/StartupOS/docs/product/2026-11-05-mach-mo-final-contracts.md:29) · [K-PART](/D:/StartupOS/docs/product/2026-11-05-mach-mo-product-architecture-and-roles.md:98)

Hai fixture độc lập để SE cắm vào suite catalog. `spiceLiteral` là oracle cho giá trị phần tử khi fixture được đặt trong mạch SPICE có dây hợp lệ. `bomKey` chỉ định danh trị số danh định.

```json
{
  "schemaVersion": 1,
  "cases": [
    {
      "id": "legacy-project-explicit-220",
      "part": { "id": "res-1", "type": "resistor", "x": 60, "y": 72, "value": "220 Ω" },
      "endpoints": [
        { "partId": "res-1", "pinId": "a" },
        { "partId": "res-1", "pinId": "b" }
      ],
      "expect": {
        "status": "known",
        "variantId": "resistor-220ohm",
        "revision": 1,
        "nominal": { "value": 220, "unit": "ohm" },
        "bomKey": "resistor:ohm:220",
        "spiceLiteral": "220",
        "tolerancePercent": null
      }
    },
    {
      "id": "ldr-preset-explicit-10000",
      "lessonId": "analog-ldr",
      "part": { "id": "resistor-ldr-1", "type": "resistor", "x": 42, "y": 72, "value": "10 kΩ" },
      "endpoints": [
        { "partId": "resistor-ldr-1", "pinId": "a" },
        { "partId": "resistor-ldr-1", "pinId": "b" }
      ],
      "expect": {
        "status": "known",
        "variantId": "resistor-10000ohm",
        "revision": 1,
        "nominal": { "value": 10000, "unit": "ohm" },
        "bomKey": "resistor:ohm:10000",
        "spiceLiteral": "10k",
        "tolerancePercent": null
      }
    }
  ]
}
```

**Tương thích project cũ.** Resolver nên dẫn xuất variant khi đọc. Giữ schema v4, chuỗi `value` gốc, `partId`, pin `a/b` và đầu dây qua import/export. Với draft thiếu `value`, catalog/BOM trả `unknown`, kể cả khi UI vẫn có nhãn mặc định. Tôi đã kiểm tra lại đường SPICE: khi thiếu `value`, nó đọc 220 Ω từ nhãn registry và ghi assumption vào handoff. Giữ hành vi này cho project cũ. Nếu đổi nhãn family thành “Điện trở”, đưa 220 Ω sang fallback riêng của solver và giữ cảnh báo assumption. [Nhãn hiện tại](/D:/StartupOS/electronics-learning-demo/src/lib/componentDisplayLabel.ts:4) · [Fallback SPICE](/D:/StartupOS/electronics-learning-demo/src/lib/workspaceSpice.ts:67) · [Assumption](/D:/StartupOS/electronics-learning-demo/src/lib/workspaceSpice.ts:228) · [K-ID và BOM](/D:/StartupOS/docs/product/2026-11-05-mach-mo-final-contracts.md:82)

| Ngữ cảnh | Mức hỗ trợ có bằng chứng |
|---|---|
| Học tập | Nhận diện linh kiện và topology theo bài LED/LDR. Trace bài học chưa cung cấp dòng, công suất hay dung sai. |
| SPICE | `a`/`b` ánh xạ vào `R` lý tưởng khi trị số và topology hợp lệ. Kiểm riêng wiring, nguồn, phần tử kết nối và lỗi thiếu model. |
| Board/firmware | Trị số danh định độc lập với MCU. K-CTX xét GPIO, rail, pin và target của toàn mạch riêng. |
| Vật lý | **UNKNOWN** cho đến khi có đúng linh kiện, revision và nguồn thông số. |

**Phạm vi SE đề xuất.** Thêm dữ liệu variant trong `src/data/componentRegistry.ts`, resolver trong `src/lib/componentCatalog.ts` và fixture trong `tests/component-catalog.test.mjs`. Giữ lookup và deep link `resistor`. Lookup bài học hiện match theo family. Chỉ gắn bài vào variant khi preset hoặc nội dung có trị số tường minh. `src/lib/workspaceSpice.ts` và `tests/workspace-spice.test.mjs` là phạm vi bổ sung nếu thay đường fallback từ nhãn. [Catalog lookup](/D:/StartupOS/electronics-learning-demo/src/lib/componentCatalog.ts:6) · [Catalog tests](/D:/StartupOS/electronics-learning-demo/tests/component-catalog.test.mjs:139) · [SPICE tests](/D:/StartupOS/electronics-learning-demo/tests/workspace-spice.test.mjs:86)

Acceptance cho SE:

- Round-trip ca 220 Ω giữ nguyên đầu dây và chuỗi `value`. Ca 10 kΩ trong LDR trả đúng variant. `10 kΩ`, `10000 Ω` và `10kΩ` phân giải cùng ID.
- Thiếu `value` hoặc variant ID lạ trả `unknown` và giữ dữ liệu gốc. `5 V`, `0 Ω` và `-220 Ω` trả `invalid`. `330 Ω` giữ giá trị hợp lệ với trạng thái `custom/unlisted`.
- Asset thiếu hoặc hash sai dùng symbol fallback, giữ nguyên variant và pin IDs. Model thiếu chỉ hạ hỗ trợ ở ngữ cảnh dùng model.
- Handoff SPICE của draft cũ thiếu `value` vẫn ghi `R=220 Ω` dưới dạng assumption. Catalog/BOM của cùng draft vẫn trả `unknown`.
