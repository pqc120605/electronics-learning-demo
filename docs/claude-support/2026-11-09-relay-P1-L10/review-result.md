# REVIEW_RESULT · A8 `MM-SW-P1-L10` sổ nguồn dữ liệu · 09/11/2026 · Leader Claude

Đối tượng: `electronics-learning-demo/docs/data-sources/registry.md` (35 dòng) SHA256 `8eddeb7dfbb4adf0c0bc2ff6f1e3fb91eeb03adb40e924b7eb379c808111f9a2`. Tôi tính lại bằng `sha256sum`: khớp `REPORT.md` và `snapshot.json`. Hash `REPORT.md` `d43dd916…30255` và `REVIEW_REQUEST_RELAY.md` `6ee461c5…9e9` cũng khớp snapshot. Request L10 không có `relay_id` nên `reply_to: none`.

## Kết luận
**pass** (theo ba lựa chọn của request), kèm 4 chỉnh sửa Low. Mọi dòng khớp báo cáo lọc 07/11 về license và trạng thái; không có nguồn ngoài danh sách; không phát hiện khẳng định vượt bằng chứng. Review này không đổi trạng thái nguồn nào và không cho phép đưa dữ liệu vào app.

## Đã kiểm (kết quả)
- Đếm: 23 dòng dữ liệu (dòng 11-33), mỗi dòng đúng 8 cột (`awk` đếm: 23 dòng × 8). Danh sách khớp prompt A8 theo thứ tự: 2 mã MIT, Adafruit, 2 CC-BY-SA docs, 3 KiCad, 5 NOASSERTION, 3 KHÔNG BUNDLE, 6 CHỈ THAM KHẢO, SparkFun 404. Không dòng thừa.
- Đối chiếu license và trạng thái với `research-intake-review.md` dòng 6 và 16-19, và D17 (`founder-decisions.md:36`): MIT (wokwi-elements, avr8js, Adafruit), GPL-2.0 (circuitjs1, qucs_s), AGPL-3.0 (easyeda2kicad), CC-BY-SA-4.0 (arduino/docs-content, raspberrypi/documentation), 5 NOASSERTION, SparkFun 404: tất cả khớp. Pindexio "không license" khớp dòng 19. KiCad: dòng nêu rõ "per report B; original license page not read", khớp dòng 17 và 40 của intake.
- Quy trình thêm nguồn (dòng 5-7) khớp D18 (từng thư viện, Claude lọc, founder duyệt, Claude review bắt buộc, ghi tên+phiên bản+license).
- Cột ngày kiểm `07/11/2026` và người kiểm "Claude, as recorded" đúng với intake (Claude tự chạy GitHub license API ngày 07/11).
- Không dùng mạng (đúng yêu cầu request). Không đối chiếu lại license ở nguồn gốc.

## Không kiểm
- License thật tại GitHub/npm/trang KiCad hôm nay (không dùng mạng; intake cũng nói chưa đọc trang license KiCad và Espressif).
- Các URL repo của dòng KiCad (`KiCad/kicad-symbols`, `…footprints`), `https://easyeda.com/`, `https://www.mouser.com/`: intake chỉ ghi tên nhóm ("KiCad symbols/footprints/packages3D", "EasyEDA/LCSC", "Mouser"), không ghi các URL này. Tôi không biết chúng có đúng hay còn sống hay không.
- Không kiểm "chỉ ghi vào đường dẫn cho phép" ngoài registry và thư mục run (không có baseline git).

## Findings

**F1 · Low · Lời tuyên bố pháp lý không đặt ở đầu file và không đúng nguyên văn.**
Prompt A8: "Thêm đầu file: quy trình thêm nguồn mới … và ghi 'Tôi không phải luật sư: cần ý kiến pháp lý trước khi bán sản phẩm (chưa làm)'". Registry dòng 3 có tuyên bố phạm vi, dòng 35 (cuối file) mới có "I am not a lawyer: legal advice is needed before selling the product (not obtained)". `qa-review.md` ghi "exactly as user prompt": không đúng về vị trí và ngôn ngữ.
Fix tối thiểu: chuyển lên ngay dưới tiêu đề, đúng câu tiếng Việt của prompt.

**F2 · Low · Bốn URL không có trong nguồn lọc.**
Registry dòng 16-17 (KiCad symbols/footprints), 29 (`easyeda.com`), 31 (`mouser.com`). Xem mục "Không kiểm". Đây là chi tiết do worker suy ra; nên ghi "URL suy ra, chưa kiểm" hoặc bỏ URL cho các dòng này.

**F3 · Low · Trạng thái "ĐƯỢC DÙNG" cho 3 dòng KiCad có thể bị đọc là đã thông qua license.**
Dòng 16-18. Điều kiện đã nói rõ là chưa đọc trang license gốc, và D18 yêu cầu "license đã kiểm" khi đưa dữ liệu vào repo hoặc `public/`. Prompt do founder duyệt đặt trạng thái này nên không sai, nhưng cột Status không phân biệt "được dùng" với "được dùng sau khi đọc license".
Fix tối thiểu: thêm điều kiện "chặn: đọc trang license gốc trước khi đưa vào repo" vào 3 dòng này.

**F4 · Low · Dòng wokwi-elements thiếu phiên bản và license transitive.**
Dòng 11 chỉ ghi "MIT". L09 (review R-20261109-C05) cho thấy gói kéo `lit` BSD-3-Clause. D18 yêu cầu ghi "tên gói + phiên bản + license đã kiểm". Fix: sau khi founder quyết (C05 F1), ghi phiên bản và license transitive vào dòng 11.

**O1 · Quan sát.** `REPORT.md` ghi "24 table lines including the header"; bảng có 23 dòng dữ liệu + header + dòng phân cách = 25. Số 23 nguồn đúng.

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C04
reply_to: none (request L10 không có relay_id)
type: REVIEW_RESULT
verdict: pass cho registry.md hash 8eddeb7d…f9a2: 23 dòng, 8 cột, license/trạng thái khớp research-intake-review.md và D17/D18; không có nguồn thừa; không đổi trạng thái nguồn nào, không cho đưa dữ liệu vào app
findings: F1 Low (tuyên bố "không phải luật sư" ở cuối file, tiếng Anh, sai prompt); F2 Low (4 URL không có trong intake); F3 Low (3 dòng KiCad "ĐƯỢC DÙNG" khi chưa đọc license gốc); F4 Low (dòng wokwi-elements thiếu phiên bản/license transitive); O1 (đếm dòng bảng)
checks_run: sha256 3 file; đếm 23×8 cột; đối chiếu từng dòng với intake dòng 6, 16-19 và D17/D18
checks_not_run: license ở nguồn gốc (không dùng mạng); URL KiCad/easyeda/mouser; phạm vi đường dẫn ghi
done_when: Codex sửa F1-F4 hoặc ghi lý do; founder không đổi trạng thái nguồn nào bằng review này
=== END RELAY ===
```
