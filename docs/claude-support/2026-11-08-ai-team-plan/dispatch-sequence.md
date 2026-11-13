# Bảng điều phối AI: nhiệm vụ và thứ tự giao việc (08/11/2026)

Người đọc: founder (người điều phối). Tài liệu này đi kèm `ai-team-longterm-plan.md` (vai trò, rủi ro, sổ token). Ở đây chỉ có thứ tự giao việc, đầu vào, đầu ra và điều kiện xong của từng bước.

Giới hạn trung thực: tôi chưa kiểm chứng hạn mức token thật của các gói và năng lực thật của Gemini 3.8, DeepSeek 4.1 Flash, Kimi. Cột "Chi phí" chỉ là ước lượng tương đối (S nhỏ, M vừa, L lớn). Việc sửa `test:e2e` (P1-L07) và WA-06 là việc founder đã cho Codex làm.

## 0. Trạng thái cập nhật 09/11/2026

| Việc | Trạng thái | Căn cứ |
|---|---|---|
| A2 · WA-06 | XONG | `tasks.json`: `MM-SW-WA-06` done |
| A3 · P0-03 hợp đồng MCU | XONG, review `R-20261108-C01` đã xử lý (F1 thành cổng `MCU-RESET-VETO-RESOURCES`) | `tasks.json`: `MM-ESP32-001` done; hash hợp đồng `8665a8cc…e4f3` (tôi kiểm khớp) |
| A4 · P0-02 và P0-04 tay cầm | XONG ở mức DOCUMENT ONLY / PROPOSED; review `R-20261108-C02` đã xử lý | `tasks.json`: `MM-HW-MOBOT-IF-001`, `MM-HW-P0-04` done; hash cấu hình tay cầm hiện tại `c5d342db…dc626` (tôi kiểm khớp), CHƯA được founder duyệt |
| A5 · thử trình duyệt | XONG, đã lọc 09/11: offline và lưu nháp PASS ở 375/768/1440 px; mục "FAIL bàn phím" CHƯA XÁC NHẬN (xem dưới) | `browser-report.md` |
| A6 · bảng datasheet | XONG phần TI, ĐÃ LỌC: 8/9 số tôi lấy mẫu khớp PDF. **Hàng NTC Jauch "10kΩ ±1% (B=3435)" KHÔNG có trong PDF, loại bỏ**; cấu hình tay cầm vẫn đúng khi ghi NTC chưa có R–T | `datasheet-table.md` |
| A7 · CP-06 WA-07, tổng hợp R-20261106-06, nhật ký | XONG theo phiên con báo; tôi xác nhận các file tồn tại, chưa đọc nội dung | `2026-11-09-cp06-wa07-codec/review-result.md`, `2026-11-06-relay-R20261106-06/review-result.md`, `logs/2026-11-09-0021.md` |
| Việc dọn | `browser-report.md` và `datasheet-table.md` nằm ở thư mục gốc dự án, kèm 34 ảnh `ca-*` trong `screenshots/`; quy tắc là chỉ ghi vào `.tmp/ai-intake/`. Nhờ Codex chuyển hoặc xóa sau khi bạn đọc xong | thư mục gốc dự án |
| A1 · sửa `test:e2e` | CHƯA XÁC NHẬN: có thư mục chạy `MM-SW-P1-L07` nhưng tôi không thấy task này trong `tasks.json` | hỏi Codex trạng thái và exit code `test:e2e` |
| A8 · P1-L10 sổ nguồn | XONG, REVIEW pass kèm 4 Low (`R-20261109-C04`, `2026-11-09-relay-P1-L10/review-result.md`); registry hash `8eddeb7d…f9a2` (tôi kiểm khớp, 23 dòng × 8 cột, license khớp intake). Chưa đổi trạng thái nguồn nào | `docs/data-sources/registry.md` |
| A9 · `MM-HW-GATE-PREFLIGHT-001` | XONG theo done_when, REVIEW NHẬN kèm 2 Medium + 2 Low (`R-20261109-C03`, `2026-11-09-relay-R20261109-01/review-result.md`): F1 phân loại mốc bằng regex, F2 chưa ghim `required_gate_ids`. Tôi chạy lại: validate exit 0, test 32/32; hash `69540e83…7816c`, `a4fcc857…b1b` khớp. Chưa coi preflight đủ cứng cho B1 cho tới khi Codex xử lý F1/F2 (gộp được vào A10) | `docs/agents/validate.mjs`, `validate.test.mjs` |
| A10 · `MM-HW-P0-05` hồ sơ 4 cổng | XONG ở mức DOCUMENT ONLY; REVIEW (`R-20261109-C06`, `2026-11-09-relay-R20261109-A10-01/review-result.md`): cả 4 cổng `insufficient_evidence`, VẪN OPEN. 2 Medium: F1 dữ liệu MCP73833/DRV8833/… không có trích đoạn gốc; F2 cổng MCU không có phân tích tài nguyên riêng tay cầm. Hash dossier `28ddd882…d152` khớp. Task chưa có trong `tasks.json`. Founder phải chọn: nhóm actuator, hướng OFF, H-A/B/C/D, hướng C01. Chưa duyệt hash; C03 F1/F2 vẫn trước B1 | `docs/hardware/mobot-v2-p0-05-handset-gates-closure.md` |
| A10g · `MM-HW-P0-10` + `MM-HW-P0-11` (r12, G-B, M-A, H3/OFF) | REVIEW (`R-20261110-C12`, `2026-11-10-relay-R20261110-P0-10-P0-11/review-result.md`): hồ sơ có điều kiện, trung thực; cả 4 cổng `insufficient_evidence`, OPEN; B1 NOT_READY. Tôi kiểm: manifest P0-11 42/42, P0-10 241/242 (chỉ `tasks.json` lệch), r12 `8b345654…4427b` khớp queue, validate exit 0 (57 task), test 61/61, mọi số điện/cơ tính lại khớp. 3 Medium: F1 biên H3 2,17 mV là trước hysteresis, trừ hysteresis TYP 1,2 mV còn 0,20 mV (TLV3201 không có MAX); F2 G-B hết chân dự phòng (16/16); F3 ADR45 chưa ghim PDF. 2 Low (manifest ghim queue sống; ngân sách dòng bleed). KHÔNG duyệt hash r12: r13 sẽ gom cutoff 55,92 µs, hành trình 0,90 mm, qualifier 100–250 ms. Founder: PDF ADR45 nếu tải được | `hardware-config-mobot-v2-typec-r12-handset.json`, `mobot-v2-p0-11-h3-off-analysis.md` |
| A10b · `MM-HW-P0-06` r9 + hướng founder + ứng viên sạc H-C | REVIEW NHẬN document-only (`R-20261109-C07`, `2026-11-09-relay-R20261109-P0-06-01/review-result.md`): bốn hướng founder ghi đúng nguyên văn, r9 `e8a1d0d3…510a3` chỉ thêm khóa đã nêu, queue thêm đúng 2 mục. Cả 4 cổng vẫn `insufficient_evidence`, OPEN. 1 Medium (margin 9 mV dựa trên hàng accuracy "typical", chưa là cận xấu nhất), 2 Low. r9 CHƯA được duyệt hash; MPN BQ25185/BQ25186 chờ founder duyệt riêng; C03 F1/F2 (validator thực thi stage, required IDs, trusted baseline) vẫn phải xong trước B1 | `hardware-config-mobot-v2-typec-r9-handset.json`, `mobot-v2-p0-06-handset-charger-candidates.md` |
| A10c · `MM-HW-GATE-PREFLIGHT-002` validator | REVIEW NHẬN (`R-20261109-C08`, `2026-11-09-relay-R20261109-PREFLIGHT-002/review-result.md`): C03 F1-F4 và O1 đã sửa, tôi tái hiện từng ca; test 51/51, validate exit 0, dispatch KiCad thật vẫn bị từ chối. 1 Medium: bằng chứng PASS (envelope trong `docs/hardware/reviews/`) do Codex tự tạo được và byte review không được ghim (cần `review_sha256`, `reviewer`/`relay_id`, đường dẫn nơi Claude ghi được); 2 Low (tên 8.3, hàm gọi trực tiếp). Hash `validate.mjs a0da4cdf…b28ed`, `validate.test.mjs dfe4a696…7d08` | `docs/agents/validate.mjs`, `validate.test.mjs` |
| A10f · P0-09 checkpoint B1 (hồ sơ hội tụ, r11) | REVIEW `R-20261109-C11` (`2026-11-09-b1-readiness-checkpoint/review-result.md`): **B1 NOT_READY xác nhận**, 4 cổng `insufficient_evidence`. 3 High: (F1) cửa sổ trip H3 chỉ tối đa 27,6 mV (4,110 − 4,0824 V) so với dải partial 71,1 mV; (F2) BQ25170 chưa có quyết định founder, r11 vẫn BQ25186; (F3) cơ khí thiếu hệ số an toàn/chu kỳ/mỏi/lão hóa. 5 Medium: Box03 mâu thuẫn (0,60 vs 0,80 mm, hai hình học), 355 MPa chỉ cho dày 1,8-3 mm, ngân sách 11 role cũ + r11 còn LIVENESS_CHALLENGE_RESPONSE, review Box08 có hash Cyrillic/thiếu hash, biên nhận founder thiếu. Datasheet BQ25170/TPS3430/TMUX1511/TLV6710/TPS22916 chưa ghim nên chưa kiểm. Founder cần trả lời 3 câu (BQ25170, liên hệ vendor, đường chứng minh cơ khí) | `MM-HW-P0-09/b1-readiness/`, r11 |
| A10e · `MM-HW-GATE-PREFLIGHT-003` validator | REVIEW NHẬN (`R-20261109-C10`, `2026-11-09-relay-R20261109-PREFLIGHT-003/review-result.md`): 7 hunk đúng 003a-f, C08 F1-F3 xử lý, test 61/61, validate exit 0 (55 tasks), dispatch KiCad thật bị từ chối. Thiết kế `gate_reviews` ngoài proposal đúng (đề xuất `review_sha256` trong proposal của C08 là vòng phụ thuộc, tôi rút lại). 1 Low: thư mục `docs/hardware/reviews/` vẫn cho Codex tự viết envelope. Hash `validate.mjs c03af0c1…64bd7`, `validate.test.mjs dd380346…2c6` | `docs/agents/validate.mjs`, `validate.test.mjs` |
| A10d · P0-07 r10 + 4 gói thiết kế | REVIEW (`R-20261109-C09`, `2026-11-09-relay-R20261109-P0-07-R10/review-result.md`): C07 F1-F3 và O1 xử lý đúng (kiểm bằng ảnh trang BQ25186 tr.6/10). r10 `95abdd27…770a4` chỉ thêm khóa đã nêu, 0 PASS, không approved. **Cả 4 cổng `insufficient_evidence`, vẫn OPEN** (gói chỉ là đề xuất chức năng, mọi cận TBD). 2 Medium: nhu cầu GPIO chưa có cận trên (E1–E4); H3 cần `Vpack_allowed,max` mà nguồn chỉ có 4,2 V. Founder cần quyết: hỏi Jauch hay lấy 4,200 V làm trần tuyệt đối; số kênh E1–E4. Chưa duyệt hash r10 | `hardware-config-mobot-v2-typec-r10-handset.json`, `mobot-v2-p0-07-*.md` |
| B8 · P1-L09 spike wokwi | REVIEW changes_requested, 1 Medium (`R-20261109-C05`, `2026-11-09-relay-R20261109-P1-L09/review-result.md`): 5 gói transitive BSD-3-Clause (lit) chưa được founder chấp nhận theo D17. Chưa nhận gói vào app | `spikes/wokwi-elements/` |
| Cổng thiết kế | 4 cổng chặn lease schematic còn OPEN (`D17-OFF-DESIGN`, `D17-ACTUATOR-PRODUCT`, `D17-H3-CV-PROTECTION`, `MCU-RESET-VETO-RESOURCES`); 3 cổng mốc sau (BOM, chuyển mode, lease layout) cũng OPEN | JSON cấu hình tay cầm; KiCad chưa có lease |
| Kiểm cổng tự động | (cập nhật 09/11 sau A9) đã triển khai, xem dòng A9 ở trên; `MM-HW-MOBOT-REMOTE-KICAD-001` vẫn `waiting` | DISPOSITION `R-20261109-P0-04-DISPOSITION` |

**Thứ tự kế tiếp (làn phần cứng):** A10 (Sol đóng 4 cổng thiết kế) song song với A9 (Luna làm kiểm cổng tự động); dữ liệu TPS259474L từ A6 là đầu vào cho A10. Sau khi A9 và A10 xong và Box 08 PASS bốn cổng, mới tới duyệt hash rồi lease schematic (B1).

**Về duyệt hash:** đừng duyệt `c5d342db…` bây giờ. Đóng cổng ở A10 sẽ sửa lại file cấu hình và đổi hash, nên duyệt lúc này sẽ phải duyệt lại. Duyệt một lần, sau A9 và A10, kèm câu "duyệt hash này không đóng gate nào" như DISPOSITION yêu cầu.

**Cập nhật 09/11 (tối):** A10 xong ở mức document-only, review C06 cả bốn cổng `insufficient_evidence`, giữ OPEN. Founder đã chọn bốn hướng ("Đồng ý cả 4"): khóa cơ thụ động; O-A kết hợp O-C; sạc H-C (bộ sạc có dung sai CV chặt hơn); veto MCU bằng chốt/logic phần cứng dùng chân rảnh của tay cầm. Bước kế tiếp là **A11**: dán `docs/claude-support/2026-11-06-final-plan/codex-prompts/sol/P0-06-founder-decisions-a10.md` cho Sol (ghi quyết định, sửa cấu hình một lần, đăng ký `MM-HW-P0-05`/`P0-06` vào `tasks.json`, bảng ứng viên bộ sạc, gói Box 08). Song song vẫn cần A9 (kiểm cổng tự động, mã validator giao Luna). P1-01 (B1) đang bị chặn đúng bởi preflight (`validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` exit 1).

**Epic SIM cập nhật 10/11 (S0-v2, S0b, S1 xong và đã lọc; S2 soạn xong):** `docs/claude-support/2026-11-09-sim-epic/audit-synthesis.md` (26/26 phép tính điện tôi tính lại khớp; 9/10 file:dòng của S1 đúng, 1 lệch 3 dòng; **ảnh bốn chế độ xem của S0-v2 trùng byte ở 11/11 bài nên "PASS vị trí/dây" bị loại**; chỉ 1 chân board sai thật: nhãn `5V` thay `VIN` ở `esp32-devkit`; giả thuyết A sai cho 11 mạch builder, B/C/D đúng một phần, E chưa xác định) và `spec-v2.md` (lưới breadboard 400 lỗ, router, schema `CircuitDocV2`, cổng G1-G13, di chuyển bản nháp). `plan.md` mục 8-9 có slice S0c, S2r, S3a-S7 và prompt dán sẵn S0c, S2r, S3a, S3b, S3c. **Founder cần chốt** Q-SIM-1…7 (`spec-v2.md` mục 10) trước khi mở S3a; S0c (Antigravity) và S2r (Luna Plus hoặc Sol, chỉ đọc) chạy ngay được.

**Epic SIM (09/11, founder báo mô phỏng mạch và breadboard chưa đạt):** kế hoạch riêng ở `docs/claude-support/2026-11-09-sim-epic/plan.md` (bước S0–S7, quyết định Q-SIM-1…4, prompt S0 cho Antigravity và S1 cho Luna). Làn phần mềm của Luna chuyển sang epic này; làn phần cứng của Sol (A11) không đổi.

## 1. Quy tắc cố định cho mọi bước

1. Chỉ Codex (Sol hoặc Luna) ghi vào repo. Tối đa 2 writer cùng lúc: một làn phần cứng (Sol), một làn phần mềm (Luna). Hai tài khoản Luna thay phiên, không chạy song song cùng đường dẫn.
2. Antigravity, DeepSeek, Kimi không ghi vào repo. Kết quả đặt ở `.tmp/ai-intake/<ai>/<ngày>/`. Claude lọc, Luna mới tích hợp.
3. Mỗi prompt phải có: danh sách file được sửa, tiêu chí xong dạng nhị phân, lệnh kiểm kèm exit code, và "dừng sau 2 lần thất bại".
4. Báo cáo ngắn: file đã đổi, lệnh, exit code, số test trước và sau.
5. Việc "CÓ Claude review" chưa được coi là xong cho tới khi Claude ghi kết quả vào `docs/claude-support/`.
6. Số liệu điện, license, giá, chuẩn an toàn từ AI ngoài: không dùng khi chưa có nguồn chính thức mở được.

## 2. Thứ tự chạy tổng thể

Ký hiệu làn: **HW** (Sol), **SW-A** (Luna của Codex Plus), **SW-B** (Luna của Codex thường), **EXT** (Antigravity, DeepSeek, Kimi, không ghi repo), **CL** (Claude).

### Giai đoạn A: đóng P1, mở khóa P0 (làm ngay)

| Bước | Làn | AI | Việc | Đầu vào | Đầu ra | Xong khi | Claude review | Chi phí |
|---|---|---|---|---|---|---|---|---|
| A1 | SW-A | Codex Plus Luna | Sửa `npm.cmd run test:e2e` để chạy được `offline.spec.mjs` bằng `vite preview` (bản build) thay vì dev server. Founder đã giao. | `playwright.config.mjs`, `package.json`, `e2e/offline.spec.mjs:8`, `src/lib/registerServiceWorker.ts:3` | file đã đổi + báo cáo trong `docs/agents/runs/MM-SW-P1-L07/` | `test:e2e` exit 0 với 33/33, không dùng cấu hình tạm trong `.tmp/` | KHÔNG | S |
| A2 | SW-B | Codex thường Luna | WA-06 Option B: BOM theo biến thể, `bomKey` theo `src/lib/componentCatalog.ts:54`, bỏ `skip` trong `tests/classroom-kit-variants.test.mjs`. Founder đã giao. | prompt WA-06 đã duyệt, `luna-backlog.md` mục 4 | file đã đổi + báo cáo | `npm.cmd test` exit 0, không còn bài bị hoãn, không đổi version schema | CÓ nếu đụng cách đọc dữ liệu cũ | M |
| A3 | HW | Codex Plus Sol | P0-03: hợp đồng MCU `MM-ESP32-001` (board 30 chân CH340, USB-C). | `codex-prompts/sol/P0-03-esp32-mcu-contract.md`, `founder-answers-q1-q5.md` | tài liệu hợp đồng + báo cáo | mọi giá trị chưa đo ghi TBD, không khẳng định "an toàn" | CÓ | M |
| A4 | HW | Codex Plus Sol | Đóng 5 mục chặn của cấu hình tay cầm (sau khi tách theo D15(a)). Chỉ làm khi A3 xong. | `docs/mission-control/hardware-config-mobot-v2-typec-r8.json`, `parallel-build-policy.md` | cấu hình tay cầm mới ở trạng thái đề xuất | `blocking_unknowns` của tay cầm rỗng; chưa có `approved_by` (founder duyệt riêng) | CÓ | M |
| A5 | EXT | Antigravity (Gemini 3.8) | Thử trình duyệt thật bản build: offline/PWA, 375/768/1440 px, bàn phím, chụp màn hình. Chạy sau A1. | URL `vite preview` cục bộ, danh sách ca từ `e2e/` | `.tmp/ai-intake/antigravity/<ngày>/browser-report.md` + ảnh | mỗi ca có PASS/FAIL, bước tái hiện, ảnh | Claude lọc | M |
| A6 | EXT | Codex thường Luna (thay Kimi, Kimi lỗi 09/11). Phần Jauch đã do Claude trích và đối chiếu xong; chỉ còn TPS259474L. | Trích bảng thông số TPS259474L từ `docs/research/downloads/ti-tps25947.pdf`, có số trang. | PDF trong repo | `.tmp/ai-intake/luna/<ngày>/tps25947-table.md` | mỗi số có trang trích dẫn; ô không tìm thấy ghi "không có" | Claude lấy mẫu kiểm 5 số | S |
| A7 | CL | Claude | CP-06 hồi tố cho WA-07 codec; tổng hợp `partition-review.md` và `t8-data-review.md` thành REVIEW_RESULT cho RELAY R-20261106-06; viết nhật ký phiên. | file Codex đã đổi | file trong `docs/claude-support/` và `logs/` | mỗi phát hiện có file:dòng và mức độ | n/a | M |
| A8 | SW-B | Codex thường Luna | P1-L10: sổ đăng ký nguồn dữ liệu và dependency được duyệt (D17-LIC, D18). Chỉ tài liệu, chạy bất cứ lúc nào. | `research-intake-review.md` | `docs/data-sources/registry.md` | đủ cột, không có nguồn ngoài danh sách | CÓ | S |
| A9 | SW-B (hoặc Luna Plus) | Luna | `MM-HW-GATE-PREFLIGHT-001`: kiểm cổng tự động, từ chối dispatch lease khi còn cổng OPEN (F1 của review C02). Không đụng KiCad. | DISPOSITION `R-20261109-P0-04-DISPOSITION`, `docs/agents/validate.mjs` | thay đổi `validate.mjs` + ca test hồi quy | lease schematic bị từ chối khi còn cổng OPEN trước mốc đó; 24 test cũ còn đạt; có ca mới | CÓ | M |
| A10 | HW | Sol | P0-05: đóng 4 cổng thiết kế trước lease schematic (OFF, actuator sản phẩm, CV/bảo vệ H3, reset-veto). Cần dữ liệu TPS259474L từ A6. | cấu hình tay cầm, hợp đồng MCU §6-7, `mobot-v2-p0-04-handset-closure.md`, A6 | dossier thiết kế + yêu cầu Box 08 review từng cổng | mỗi cổng có đề xuất kèm cận và nguồn trang; gate vẫn OPEN cho tới khi Box 08 PASS | CÓ | L |

Phụ thuộc: A1 và A3 chạy song song (hai làn khác nhau). A2 chạy song song với A1 chỉ khi `allowed_paths` hai bên không chồng. A4 chờ A3. A5 chờ A1. A6 chạy bất cứ lúc nào. A7 chờ A2 và báo cáo A1.

### Giai đoạn B: schematic và nội dung

| Bước | Làn | AI | Việc | Chờ | Đầu ra | Xong khi | Claude review | Chi phí |
|---|---|---|---|---|---|---|---|---|
| B1 | HW | Sol | P1-01 schematic tay cầm (KiCad). Cần lease KiCad và cấu hình tay cầm được founder duyệt hash. | A9, A10 (4 cổng PASS), founder duyệt hash | schematic + log ERC | ERC không lỗi, giá trị chưa đo ghi TBD | CÓ | L |
| B2 | HW | Sol | P1-02 giấy thiết kế nguồn robot (chưa layout). | D16: hồ sơ pack B04 hoặc ứng viên 2S | tài liệu thiết kế nguồn | mỗi giới hạn có tiêu chí PASS/FAIL đo sau | CÓ | M |
| B3 | HW | Sol | P1-03 khung firmware. | **D13** (chọn toolchain) | khung code + log build | build sạch; không flash | CÓ | M |
| B4 | SW-A | Luna Plus | P1-L08 xuất SVG/PNG từ SchematicView, không thêm dependency, ≤4 file. Prompt chưa viết. | A1 | file + báo cáo | typecheck, test, e2e đều exit 0 | KHÔNG | M |
| B5 | SW-B | Luna thường | Bài học robot ở chế độ mô phỏng (chưa điều khiển robot thật). Prompt chưa viết. | D4 đã chốt | nội dung + e2e | e2e chạy được bài mới | CÓ nếu chạm dữ liệu trẻ em | M |
| B6 | EXT | DeepSeek 4.1 Flash | Soạn 4 đến 6 bài Starter nháp (tiếng Việt), glossary, bảng test case, chỉ từ khung Claude cung cấp. | khung bài từ Claude | `.tmp/ai-intake/deepseek/<ngày>/lessons-draft.md` | không có số liệu điện hay tuyên bố an toàn tự bịa | Claude lọc, người có chuyên môn điện xác nhận số liệu | M |
| B7 | EXT | Antigravity | Nghiên cứu duyệt web các đối thủ còn "chưa kiểm" trong `research-intake-review.md` (Proteus, CircuitLab, Scheme-It, OhStem xBot, LEGO SPIKE, QEMU, Cloud Editor, Arduino Education). | `research-prompts.md` | `.tmp/ai-intake/antigravity/<ngày>/competitors.md` | mỗi nhận định có URL mở được | Claude lọc | M |
| B8 | SW-A | Luna Plus | P1-L09: spike `wokwi-elements` trong `spikes/wokwi-elements/`, không đụng `src/` (D18). | A1, A8 | `docs/agents/runs/MM-SW-P1-L09/report.md` | bảng license, kích thước, khuyến nghị dùng hay không | CÓ | M |

### Giai đoạn C: tích hợp web và robot (khi giai đoạn B xong)

| Bước | Làn | AI | Việc | Chờ | Claude review |
|---|---|---|---|---|---|
| C1 | HW | Sol | Layout, BOM | schematic được review, lease | CÓ |
| C2 | HW | Sol | Thiết kế K-RUN và rubric đánh giá (CẦN SOL) | D5 cho cổng ngspice | CÓ |
| C3 | SW-A | Luna Plus | Điều khiển robot qua Web Serial (D4) | C2 | CÓ |
| C4 | SW-A hoặc SW-B | Luna | Trang QR theo bài | **D12** | KHÔNG |
| C5 | SW-B | Luna thường | Tích hợp dữ liệu nghiên cứu ngoài, mỗi nguồn một slice | Claude đã lọc license theo D17 và D18 | CÓ |
| C6 | EXT | Antigravity | Thử e2e hành trình đầy đủ trên bản build | C3 | Claude lọc |

### Giai đoạn D: bench và phát hành

Bench, `build:public`, gói dự án số, E1. Chứng nhận đồ dùng trẻ em, đóng gói, sản xuất, ý kiến pháp lý về license cần chuyên gia, không giao cho agent. Vẫn bị chặn theo D10: gửi PCB đi sản xuất, cấp điện pin Li-ion, flash, mua hàng.

## 3. Quyết định founder cần chốt, theo thứ tự chặn

| Khi nào cần | Quyết định | Chặn bước |
|---|---|---|
| Trước B1 | duyệt cấu hình tay cầm bằng hash (chỉ founder; làm một lần sau A9 và A10, kèm câu "duyệt hash này không đóng gate nào") | B1 |
| Trước Box 08 review ở A10 | chỉ định người đo cho 14 verification_items (O1 của review C02; nếu không ai đo thì các mục UNKNOWN vô thời hạn) | PASS của verification_items, không chặn A10 |
| Trước B2 | D16: hồ sơ pack B04 hoặc ứng viên 2S | B2 |
| Trước B3 | D13 toolchain firmware (khuyến nghị Arduino CLI, chưa kiểm chứng) | B3 |
| Trước C2 | D5 cổng ngspice WASM public | C2 |
| Trước C4 | D12 QR (khuyến nghị tạo ngoài ứng dụng trước) | C4 |
| Trước giai đoạn D | D7, D8, D9, D11, D14 | các bước sau |

## 4. Quy trình mỗi chu kỳ điều phối

1. Mở phiên Claude mới cho mỗi chu kỳ; bắt đầu bằng đọc `README.md`, `slices.md`, `founder-decisions.md`, `luna-backlog.md` và nhật ký mới nhất trong `docs/claude-support/logs/`.
2. Chọn bước kế tiếp trong mục 2 theo cột "Chờ". Không bắt đầu bước còn chờ quyết định.
3. Gửi prompt cho AI đúng làn; không gửi hai writer cùng đường dẫn.
4. Nhận báo cáo. Bước ghi "CÓ" ở cột Claude review: dán báo cáo cho Claude, nhận kết quả, rồi mới đánh dấu xong.
5. Ghi token đã dùng vào sổ token (`token-ledger.md`, chưa tạo; tạo khi founder đồng ý).
6. Một bước lỗi hai lần liên tiếp: dừng, hạ việc sang AI rẻ hơn hoặc nhờ Claude phân tích nguyên nhân.

## 5. Điều chưa kiểm chứng

- Hạn mức token thực của từng gói và thời gian reset.
- Gemini 3.8, DeepSeek 4.1 Flash, Kimi có xử lý tốt PDF datasheet dài và tiếng Việt hay không; A6 và B6 là phép thử đầu tiên.
- Chưa có prompt viết sẵn cho các slice CẦN SOL P1-X01 đến X04 và Luna P4/P6; viết khi tới lượt.
- Prompt ở mục 6 cho A1, A2, A4, A5, A6, A7, B5, B6, B7 là bản tôi soạn mới, chưa gửi lần nào. Phần Codex nêu file và lệnh theo những gì tôi đã đọc ở các phiên trước; Luna cần đọc lại file thật trước khi sửa. Prompt giai đoạn C chỉ là khung nháp.

## 6. Prompt cho từng bước

Cách dùng: với bước có "File", gửi nguyên file đó cho AI. Với bước có khối prompt, dán nguyên khối. Tên task `MM-...` là đề xuất, Codex lead đổi được.

Phần mở đầu chung cho mọi prompt gửi Codex (dán trước khối riêng):

```
Bạn là Codex làm việc trong D:\StartupOS\electronics-learning-demo. Chỉ sửa file trong allowed_paths. Không thêm dependency, không đổi schema, không xoá file khi chưa được founder duyệt. Báo cáo ghi lệnh và exit code thật, số test trước và sau; nếu không chạy được thì ghi NOT_RUN kèm lý do, không báo đạt. Dừng sau 2 lần thất bại liên tiếp ở cùng một bước và báo lại.
```

### Giai đoạn A

**A1 · Codex Plus Luna · sửa `test:e2e`**

```
Model: GPT-6 Luna
Goal: `npm.cmd run test:e2e` phải exit 0 với 33/33, kể cả e2e/offline.spec.mjs, mà không dùng cấu hình tạm trong .tmp/.
Context: hiện exit 1 (32/33) vì e2e/offline.spec.mjs:8 cần bản build và service worker; playwright.config.mjs dùng vite dev (cổng 5196) và src/lib/registerServiceWorker.ts:3 bỏ qua đăng ký khi không phải PROD. Codex từng đạt 33/33 bằng cấu hình preview tạm trong .tmp/. Task: MM-SW-P1-L07.
Scope: allowed_paths: playwright.config.mjs, package.json (chỉ mục "scripts", không đụng dependencies), scripts/run-browser-tests.mjs, e2e/offline.spec.mjs. forbidden_paths: docs/claude-support/**, .codex/**, supabase/**, src/lib/circuitGraph.ts.
Constraints: webServer dùng bản build + vite preview (hoặc tương đương) trên cổng cố định; không để lại tiến trình treo; giữ nguyên các ca e2e khác; không nới lỏng assertion của offline.spec.mjs.
Approval boundaries: dừng và hỏi nếu phải thêm dependency hoặc chạm quá 4 file.
Done when: `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0; `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` exit 0 với 33/33 chạy hai lần liên tiếp.
Report: file đã đổi kèm hash, lệnh + exit code, ghi vào docs/agents/runs/MM-SW-P1-L07/.
Claude review: KHÔNG
```

**A2 · Codex thường Luna · WA-06 Option B**

```
Model: GPT-6 Luna
Goal: Hoàn tất WA-06 (BOM theo biến thể) theo phương án B đã duyệt có điều kiện, tương thích schema ClassroomKitBundle hiện tại, và bật lại bài đang bị hoãn.
Context: đọc docs/claude-support/2026-11-06-software-depth/luna-prompts/06-bom-variant-identity.md làm nền, docs/claude-support/2026-11-06-final-plan/luna-backlog.md (mục 4), src/lib/componentCatalog.ts:54 (định dạng bomKey), tests/classroom-kit-variants.test.mjs (có skip). Task: MM-SW-WA-06.
Scope: allowed_paths tối đa 5 file: các file src/lib liên quan BOM/biến thể mà bạn liệt kê trước khi sửa, tests/classroom-kit-variants.test.mjs. forbidden_paths: docs/claude-support/**, .codex/**, package.json, supabase/**, src/lib/circuitGraph.ts.
Constraints: không bump version schema; bundle cũ phải đọc được và cho kết quả giống trước; bomKey theo định dạng ở componentCatalog.ts:54; giá trị chưa xác nhận để `unknown`, KHÔNG điền 220 Ω hay giá trị đoán; gỡ `skip` trong tests/classroom-kit-variants.test.mjs; không dùng cờ hay biến môi trường để bỏ qua test.
Approval boundaries: dừng và hỏi nếu phải đổi version schema, thêm khoá lưu mới, hoặc chạm quá 5 file. Nếu không tìm thấy văn bản duyệt phương án B, dừng và hỏi founder.
Done when: `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0 và không còn bài bị hoãn (ghi số test trước và sau); `npm.cmd run build:local` exit 0.
Report: file đã đổi kèm hash, lệnh + exit code, ghi vào docs/agents/runs/MM-SW-WA-06/.
Claude review: CÓ nếu đổi cách đọc dữ liệu lưu cũ; còn lại KHÔNG
```

**A3 · Sol · hợp đồng MCU** — File: `docs/claude-support/2026-11-06-final-plan/codex-prompts/sol/P0-03-esp32-mcu-contract.md`

**A4 · Sol · đóng 5 mục chặn tay cầm**

```
Model: GPT-6 Sol
Goal: Đưa cấu hình phần cứng của tay cầm (sau khi tách khỏi robot theo D15(a)) về trạng thái blocking_unknowns rỗng, chưa duyệt hash.
Context: đọc docs/mission-control/hardware-config-mobot-v2-typec-r8.json, docs/hardware/mobot-v2-founder-decision-q1-q8.md, docs/hardware/mobot-v2-founder-decision-d15-d16.md, hợp đồng MCU của bước A3, docs/agents/parallel-build-policy.md (v3). Năm mục chặn của tay cầm: HANDSET-POWER-DESIGN, CARRIER-INTERFACES, B01-SUPPLY, HANDSET-PACK-H3, STACKUP-DRC. Task: MM-HW-P0-04 [đề xuất].
Scope: allowed_paths: file cấu hình tay cầm mới trong docs/mission-control/ và docs/hardware/ do bạn liệt kê trước khi sửa. forbidden_paths: file cấu hình robot, docs/claude-support/**, .codex/**, mọi file KiCad (chưa có lease).
Constraints: theo D10, phép đo sau PCB chuyển sang verification_items với tiêu chí PASS/FAIL, người đo, thời điểm đo; mục thiết kế còn thiếu dữ liệu để TBD và ghi lý do, không bịa số; không ghi approved_by hay approved_sha256 (chỉ founder); mọi số lấy từ datasheet phải kèm tên tài liệu và trang.
Approval boundaries: dừng và hỏi founder trước khi mở rộng D10, đổi phạm vi chấp nhận, hoặc đặt approved_by.
Done when: `node docs/agents/validate.mjs` (hoặc lệnh validate hiện hành) chạy và ghi kết quả; blocking_unknowns của tay cầm rỗng; verification_items đủ tiêu chí PASS/FAIL.
Report: file đã đổi kèm hash, lệnh + exit code, ghi vào docs/agents/runs/MM-HW-P0-04/.
Claude review: CÓ (xin theo mẫu RELAY REVIEW_REQUEST trong docs/claude-support/2026-11-06-leaders/leader-prompts.md)
```

**A5 · Antigravity (Gemini 3.8) · thử trình duyệt thật**

```
Vai trò: tester trình duyệt. KHÔNG sửa file nào trong repo.
Việc: mở bản build của ứng dụng tại URL tôi cung cấp (chạy bằng vite preview). Với mỗi kích thước 375, 768, 1440 px thử: tải trang, mở Trình dựng mạch, thêm một linh kiện, nối dây bằng bàn phím (Tab, Enter, phím R, Delete, mũi tên), lưu nháp, tải lại trang, rồi chuyển sang chế độ offline (DevTools > Network > Offline) và tải lại.
Đầu ra: file browser-report.md với bảng: ca, kích thước, PASS/FAIL, bước tái hiện, ảnh chụp (đặt tên theo ca). Cuối báo cáo liệt kê rõ ca NÀO KHÔNG thử được và vì sao.
Ràng buộc: chỉ ghi điều bạn thấy; không suy đoán nguyên nhân lỗi mã; không đăng nhập, không nhập dữ liệu cá nhân; nếu trang cần tài khoản thì dừng và báo.
```

**A6 · trích bảng datasheet** (09/11: Kimi lỗi, dùng Codex thường Luna cho TPS259474L; Jauch đã xong. Prompt thay thế cho Luna nằm trong trao đổi ngày 09/11, dạng Codex: đọc `docs/research/downloads/ti-tps25947.pdf` bằng `pdftotext -layout -f -l`, ghi `.tmp/ai-intake/luna/<ngày>/tps25947-table.md`, mỗi số có số trang PDF và trang in, không sửa file nào khác. Khối dưới là bản gốc cho Kimi, dùng lại nếu Kimi chạy được.)

```
Vai trò: trích xuất bảng thông số từ PDF tôi tải lên (datasheet Jauch 250832 và datasheet eFuse TPS259474L). KHÔNG tìm kiếm ngoài, KHÔNG suy luận.
Việc: lập bảng gồm tham số, ký hiệu, min, typ, max, đơn vị, điều kiện thử, số trang. Ưu tiên: điện áp danh định, điện áp cắt, dòng xả liên tục và đỉnh, nội trở, nhiệt độ làm việc, ngưỡng bảo vệ, dòng giới hạn, ngưỡng UVLO/OVP của eFuse.
Quy tắc: mỗi ô số phải có số trang; ô không thấy trong tài liệu ghi "không có trong tài liệu", không ước lượng. Nếu hai chỗ mâu thuẫn, ghi cả hai kèm số trang.
Đầu ra: datasheet-table.md bằng tiếng Việt, tên tham số giữ nguyên tiếng Anh.
```

**A7 · Claude · phiên mới** (dán vào phiên Claude mới)

```
Bạn là Leader Claude, chỉ đọc, ghi vào docs/claude-support/**. Đọc README.md, slices.md, founder-decisions.md, luna-backlog.md trong docs/claude-support/2026-11-06-final-plan/ và nhật ký mới nhất trong docs/claude-support/logs/. Việc: (1) CP-06 hồi tố WA-07 codec (src/lib/projectBundle.ts, src/lib/savedProjects.ts:58 khoá machmo-saved-projects-damaged-<ts>, src/lib/projectTransfer.ts, ProjectsPage). (2) Tổng hợp docs/claude-support/2026-11-06-relay-R20261106-06/partition-review.md và t8-data-review.md thành một REVIEW_RESULT + RELAY (reply_to R-20261106-06). (3) Viết nhật ký phiên docs/claude-support/logs/<YYYY-MM-DD-HHMM>.md. Chỉ báo phát hiện đã xác minh, kèm file:dòng và mức độ; nêu rõ lệnh nào đã chạy.
```

**A8 · Luna thường · sổ nguồn** — File: `docs/claude-support/2026-11-06-final-plan/codex-prompts/luna/P1-L10-external-source-registry.md`

**A9 · Luna · kiểm cổng tự động trước lease** (`MM-HW-GATE-PREFLIGHT-001`)

```
Model: GPT-6 Luna
Goal: Làm cho kiểm tra dispatch lease từ chối (fail-closed) khi cấu hình có cổng thiết kế còn OPEN trước mốc của lease đó, để blocking_unknowns rỗng hoặc validator xanh không bị đọc nhầm là sẵn sàng lease.
Context: đọc D:/StartupOS/docs/agents/runs/MM-HW-P0-04/attempt-2/DISPOSITION.md (F1), docs/mission-control/hardware-config-mobot-v2-typec-r8-handset.json (khóa milestone_gates, external_design_gates, blocking_unknowns_scope), docs/agents/validate.mjs (validateLease hiện chỉ kiểm cấu hình được duyệt, hash và blocking_unknowns của registry), docs/agents/validate.test.mjs (24 test hiện có), docs/agents/parallel-build-policy.md. Task: MM-HW-GATE-PREFLIGHT-001.
Scope: allowed_paths: docs/agents/validate.mjs, docs/agents/validate.test.mjs, docs/agents/runs/MM-HW-GATE-PREFLIGHT-001/**. forbidden_paths: mọi file cấu hình phần cứng, mọi file KiCad, docs/claude-support/**, .codex/**, src/**.
Constraints: stage-aware: lease schematic bị chặn khi còn cổng OPEN có mốc "trước lease schematic"; lease layout bị chặn khi còn cổng mốc "trước lease layout"; cổng mốc muộn hơn (khóa BOM, cho phép chuyển mode) không được chặn lease sớm hơn nhưng không được bị bỏ qua; thiếu hoặc không đọc được trường trạng thái cổng thì coi là OPEN (fail-closed); không sửa trạng thái cổng; không dùng cờ để bỏ qua kiểm tra; không xóa blocker dispatch để làm xanh preflight.
Approval boundaries: dừng và hỏi founder nếu phải đổi ý nghĩa của blocking_unknowns, sửa file cấu hình hoặc chạm quá 3 file.
Done when: `node docs/agents/validate.mjs` exit 0 với trạng thái hiện tại; `node --test docs/agents/validate.test.mjs` exit 0 và 24 test cũ vẫn đạt; có ít nhất 4 ca hồi quy mới: (a) lease schematic bị từ chối khi một cổng trước-lease-schematic OPEN; (b) lease schematic được phép khi mọi cổng mốc đó PASS; (c) trạng thái cổng thiếu hoặc lạ bị coi là OPEN; (d) cổng mốc muộn OPEN không chặn lease sớm nhưng vẫn được báo cáo. Ghi số test trước và sau.
Report: file đã đổi kèm hash, lệnh + exit code, ghi vào docs/agents/runs/MM-HW-GATE-PREFLIGHT-001/. Xin Claude review (RELAY REVIEW_REQUEST theo docs/claude-support/2026-11-06-leaders/leader-prompts.md).
Claude review: CÓ
```

**A10 · Sol · đóng 4 cổng thiết kế trước lease schematic** (P0-05, tên đề xuất `MM-HW-P0-05`)

```
Model: GPT-6.1 Sol
Goal: Với từng cổng trong 4 cổng sau, lập hồ sơ thiết kế có cận và nguồn đủ để Box 08 review quyết định PASS hay không: D17-OFF-DESIGN, D17-ACTUATOR-PRODUCT, D17-H3-CV-PROTECTION, MCU-RESET-VETO-RESOURCES. Bạn KHÔNG tự đánh PASS cổng nào.
Context: đọc docs/mission-control/hardware-config-mobot-v2-typec-r8-handset.json (milestone_gates, external_design_gates, power_design, whole_path_budget), docs/hardware/mobot-v2-p0-04-handset-closure.md, docs/hardware/mobot-v2-esp32-mcu-contract.md (§6 cổng tài nguyên, §7 nSLEEP), docs/hardware/mobot-v2-founder-decision-q2-off.md, docs/hardware/mobot-v2-handset-b01-architecture-v1.md, dữ liệu pack Jauch 250832 Rev 1.2 trong cấu hình, và bảng datasheet TPS259474L do founder cung cấp từ bước A6 (nếu chưa có, đọc docs/research/downloads/ti-tps25947.pdf và ghi trang). Task: MM-HW-P0-05 [đề xuất].
Scope: allowed_paths: docs/hardware/mobot-v2-p0-05-handset-gates-closure.md (mới), docs/agents/runs/MM-HW-P0-05/**. forbidden_paths: file cấu hình robot, docs/claude-support/**, .codex/**, src/**, mọi file KiCad (chưa có lease), file cấu hình tay cầm (không sửa; chỉ đề xuất thay đổi bằng văn bản).
Việc, theo từng cổng: nêu yêu cầu của cổng (trích tiêu chí PASS/FAIL trong JSON); các phương án thiết kế khả dĩ (không chọn khi lựa chọn thuộc về founder, nêu rõ ưu nhược và tài nguyên cần: chân, linh kiện, ngân sách); cận điện (điện áp, dòng, ngưỡng, thời gian) kèm tên tài liệu, revision, trang; phần chưa có dữ liệu ghi TBD; điều kiện lỗi đơn và lỗi chung cho OFF; phản ví dụ cho từng đề xuất (khi nào nó FAIL). Riêng MCU-RESET-VETO-RESOURCES: nêu rõ 18/18 GPIO đã dùng và các hướng đã được review C01 liệt kê (chốt phần cứng dùng chung với MCU_MOT_EN/OE_N, mở rộng I/O qua bus I2C, giải phóng chân đang bị loại theo chính sách r7), không chọn khi chưa có cận.
Constraints: không khẳng định "an toàn" hay "đạt" cho giá trị chưa đo; không bịa số; không đặt approved_by hay approved_sha256; không cấp lease; không mua hàng, flash, cấp điện; local-first; không thêm dependency.
Approval boundaries: dừng và hỏi founder khi một cổng cần chọn giữa các phương án thuộc quyết định sản phẩm (ví dụ loại actuator, hoặc đổi chân), hoặc cần đổi Q1-Q8.
Done when: file hồ sơ có đủ 4 cổng với mục lục; mỗi cổng liệt kê PASS/FAIL còn thiếu gì; `node docs/agents/validate.mjs` exit 0; không file cấu hình nào bị đổi.
Report: file đã đổi kèm hash, lệnh + exit code, ghi vào docs/agents/runs/MM-HW-P0-05/. Cuối nhật ký phiên thêm RELAY CODEX → CLAUDE (REVIEW_REQUEST) và chuẩn bị gói Box 08 review. DỪNG tới khi founder dán REVIEW_RESULT.
Claude review: CÓ
```

### Giai đoạn B

**B1 · Sol · schematic tay cầm** — File: `codex-prompts/sol/P1-01-handset-schematic.md`

**B2 · Sol · nguồn robot (giấy)** — File: `codex-prompts/sol/P1-02-robot-power-paper.md`

**B3 · Sol · khung firmware** — File: `codex-prompts/sol/P1-03-firmware-skeleton.md` (chờ D13)

**B4 · Luna Plus · xuất SVG/PNG** — File: `codex-prompts/luna/P1-L08-export-schematic-svg-png.md`

(Các đường dẫn `codex-prompts/...` nằm dưới `docs/claude-support/2026-11-06-final-plan/`.)

**B5 · Luna thường · bài học robot mô phỏng**

```
Model: GPT-6 Luna
Goal: Thêm một bài học robot chạy hoàn toàn ở chế độ mô phỏng (không kết nối robot thật), dùng được trong ứng dụng và có e2e.
Context: D4 đã chốt: Web Serial để kiểm chứng ở P1. Đọc docs/claude-support/2026-11-06-final-plan/luna-backlog.md (mục "Bài học robot ở chế độ mô phỏng"), slices.md, và cấu trúc bài học hiện có trong src/. Task: MM-SW-P1-L11 [đề xuất].
Scope: allowed_paths tối đa 5 file: file nội dung bài mới, file đăng ký bài, e2e/journeys.spec.mjs (thêm ca), tối đa 2 file hỗ trợ bạn liệt kê trước khi sửa. forbidden_paths: docs/claude-support/**, .codex/**, package.json, supabase/**, src/lib/circuitGraph.ts.
Constraints: không gọi Web Serial thật; không hứa giọng nói/AI; không ghi tuổi trên bài; không điền thông số điện chưa kiểm; local-first; không thu thập dữ liệu của trẻ em.
Approval boundaries: dừng và hỏi nếu bài cần lưu dữ liệu người học hoặc đổi schema.
Done when: typecheck, test, build:local, test:e2e đều exit 0; ca e2e mới đi hết bài ở viewport 375 px và 1440 px.
Report: file đã đổi kèm hash, lệnh + exit code, ghi vào docs/agents/runs/MM-SW-P1-L11/.
Claude review: CÓ nếu chạm dữ liệu trẻ em; còn lại KHÔNG
```

**B6 · DeepSeek 4.1 Flash · bài Starter nháp**

```
Vai trò: người soạn nội dung giáo dục tiếng Việt cho học sinh. Bạn KHÔNG có quyền ghi vào dự án và KHÔNG được tự thêm số liệu điện.
Đầu vào: khung bài do tôi dán bên dưới (mục tiêu, linh kiện, bước làm).
Việc: soạn 4 đến 6 bài Starter ngắn, mỗi bài gồm: mục tiêu, linh kiện dùng, bước làm đánh số, câu hỏi dự đoán (trước khi làm), câu hỏi quan sát, câu hỏi giải thích, lỗi thường gặp. Kèm glossary thuật ngữ điện tử và bảng test case (đầu vào, kết quả mong đợi).
Quy tắc: không nêu giá trị điện trở, điện áp, dòng điện cụ thể nếu khung bài không cho; chỗ cần số ghi "[CẦN KIỂM TRA]". Không viết "an toàn", "được chứng nhận". Không ghi độ tuổi. Đầu ra là một file markdown.
[DÁN KHUNG BÀI Ở ĐÂY]
```

**B7 · Antigravity · đối thủ chưa kiểm**

```
Vai trò: nhà nghiên cứu có duyệt web. KHÔNG sửa file trong repo.
Việc: với mỗi sản phẩm sau: Proteus, CircuitLab, Scheme-It, OhStem xBot, LEGO SPIKE, QEMU, Arduino Cloud Editor, Arduino Education. Ghi: nó làm gì với người học điện tử, có chạy offline không, có xuất sơ đồ không, giá công khai, license nếu mã mở, URL chính thức.
Quy tắc: mỗi nhận định có URL mở được, ghi ngày truy cập. Trang không mở được hoặc cần tài khoản thì ghi "không kiểm được", không đoán. Không dùng trang không chính thức làm bằng chứng cho tính năng của sản phẩm.
Đầu ra: competitors.md, bảng một dòng mỗi sản phẩm. Bối cảnh dự án: xem phần "Shared context" trong research-prompts.md.
```

**B8 · Luna Plus · spike wokwi-elements** — File: `codex-prompts/luna/P1-L09-wokwi-elements-spike.md`

### Giai đoạn C (khung nháp, hoàn thiện khi tới lượt)

- **C1 Sol, layout và BOM:** "Tạo layout KiCad cho tay cầm từ schematic đã được Claude review; cần lease KiCad; mọi giá trị chưa đo ghi TBD; không gửi gia công, không cấp điện pin. Done: DRC không lỗi. Claude review: CÓ."
- **C2 Sol, K-RUN và rubric:** "Thiết kế hợp đồng K-RUN (chạy mã trên robot) và rubric bài chấm (dự đoán, quan sát, giải thích) thành tài liệu quyết định kèm kế hoạch slice; chưa viết mã. Cần D5 cho cổng ngspice. Claude review: CÓ."
- **C3 Luna Plus, Web Serial:** "Cài kênh điều khiển Web Serial theo hợp đồng K-RUN và MOBOT-CTRL/1 (32 byte CMD, boot ID, epoch, token); có chế độ giả lập để test; không flash. Claude review: CÓ."
- **C4 Luna, trang QR:** "Tạo trang QR theo bài theo quyết định D12 (khuyến nghị: QR tạo ngoài ứng dụng từ URL trước); không thêm thư viện khi chưa duyệt. Claude review: KHÔNG."
- **C5 Luna thường, tích hợp dữ liệu ngoài:** "Mỗi nguồn một slice, chỉ nguồn trạng thái ĐƯỢC DÙNG trong docs/data-sources/registry.md; kèm ghi công và file license trong bundle dữ liệu riêng. Claude review: CÓ."
- **C6 Antigravity, e2e hành trình:** dùng lại khung A5 cho toàn bộ hành trình đầy đủ trên bản build, thêm kiểm điều khiển robot ở chế độ giả lập.
