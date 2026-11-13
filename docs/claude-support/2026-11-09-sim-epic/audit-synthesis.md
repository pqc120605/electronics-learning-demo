# Epic SIM · Tổng hợp ba kết quả kiểm kê (S0-v2, S0b, S1) · 10/11/2026

Người đọc: founder và Codex (Luna/Sol). Tác giả: Leader Claude. Tài liệu này lọc và tổng hợp; không thay đổi mã.
Nguồn: (1) S0-v2 Antigravity `.tmp/ai-intake/antigravity/2026-11-09/sim-audit-v2/`; (2) S0b Antigravity `.../board-audit/`; (3) S1 Luna `docs/agents/runs/MM-SIM-S1/code-audit.md`.

Nhãn độ tin cậy: **ĐÃ KIỂM** (tôi tự mở dòng, tính lại hoặc đối chiếu), **TIN ĐƯỢC NHƯNG CHƯA KIỂM** (hợp lý, khớp nguồn khác, chưa tái hiện), **LOẠI** (bằng chứng không đỡ được kết luận).

## 1. Lọc kết quả

### 1.1 Việc tôi đã chạy
| Kiểm | Cách | Kết quả |
|---|---|---|
| 26 phép tính điện từ `electronic-correctness.md` (LDR 3 mức, bộ chia áp, RC τ và fc, LED E24, ADC divider, I²C Rmin/Rmax, LED SPICE, biến trở) | `node -e` tự tính từ số app hiển thị | 26/26 khớp; lệch lớn nhất 0,34 Ω trên 3541 Ω (làm tròn hiển thị). **ĐÃ KIỂM** |
| 10 chỗ file:dòng trong `code-audit.md` | `sed -n` đúng dòng | 9/10 đúng: `lessonCircuits.ts` 8-26; `componentRegistry.ts:57`; `assemblyLayout.ts` 95, 178, 203-223, 333; `SchematicView.tsx:106`; `Assembly3DView.tsx:55`; `AssemblyStage.tsx:314`; `CircuitBuilderPage.tsx` 847, 853; `circuitNets.ts` 13-35. **Sai 1:** đường H-V-H của builder 2D nằm ở dòng **998**, không phải 1001 (S1 ghi 1001). Kết luận không đổi |
| Đếm cứng | `wc -l`, grep | `CircuitBuilderPage.tsx` 1056 dòng (S1 đúng); registry 28 loại, **10 `supported` / 20 `visual-only`** |
| Ảnh chụp 4 chế độ xem của S0-v2 | `md5sum` ảnh `A-<bài>-1440-02..05` | **11/11 bài: ảnh "lắp mạch", "sơ đồ", "3D", "PCB" trùng byte nhau** (cùng một màn hình "Viết code"). Riêng `analog-potentiometer` có bộ ảnh `-3d.png`… khác nhau; ảnh 3D cắt mất nửa dưới khung, chỉ thấy một phần board, breadboard có lỗ, dây cong |
| Bảng board | đọc `index.md`, `not-verified.md`, `esp32-devkit.md` | xem 1.3 |
| So `esp32-devkit.md` với phiên chép nhãn dòng 19-26 | đọc cả hai | Hàng phải 15/15 khớp; hàng trái 14/15 khớp, **chân 1: bằng chứng `VIN`, app `5V`**. **ĐÃ KIỂM** |

Chưa chạy: typecheck/test (không cần cho bước này); mở ứng dụng trên trình duyệt; kiểm tài liệu chính thức qua mạng (xem 1.3).

### 1.2 Phân loại kết luận chính
| # | Kết luận (nguồn) | Phân loại | Ghi chú |
|---|---|---|---|
| K1 | Bài builder có đủ part, tọa độ, dây, endpoint theo chân: 11 bài (S1; S0 số đếm khớp S1 ở blink 4, button-led 5, ir 5, ultra 5, 7-đoạn 10, ldr 6, pot 5) | **ĐÃ KIỂM** (code) + khớp chéo hai nguồn | |
| K2 | Dây là H-V-H qua trung điểm X, không có router tránh vật (S1) | **ĐÃ KIỂM** (dòng 998, `SchematicView:106`, `Assembly3DView:55`) | |
| K3 | 2D builder và sơ đồ dùng tọa độ % viết tay; 3D dùng `getAssemblyPlan` (S1) | **ĐÃ KIỂM** (`assemblyLayout.ts:210`: "2D canvas positions are not used in 3D") | |
| K4 | Lưới breadboard 30 cột × 10 hàng, dải theo cột, ray, chỉ có trong planner 3D; registry breadboard chỉ 4 chân logic (S1) | **ĐÃ KIỂM** (`componentRegistry.ts:57`, `assemblyLayout.ts:95,203-205,323`). Ảnh 3D potentiometer cho thấy lỗ thật | |
| K5 | Phòng thử là bộ diễn giải logic, không tính V/I; app tự ghi "chỉ xét đường nối… không đo điện áp hay dòng điện" (S0) | **ĐÃ KIỂM** (chữ trong ảnh `A-analog-potentiometer-1440-3d.png`) + 20/28 loại `visual-only` | |
| K6 | SPICE workbench, máy tính điện tử tính đúng (S0 khu D, E) | **ĐÃ KIỂM** (tính lại 26 ca) | |
| K7 | "PASS" về linh kiện, chân, vị trí, dây, nhất quán giữa các view ở 11 bài (S0 khu A) | **LOẠI** làm bằng chứng cho vị trí, dây, nhất quán. Số đếm linh kiện còn dùng được (khớp S1). Lý do: ảnh bốn view trùng byte; ảnh 3D potentiometer cắt khung; "PASS vị trí" không kèm ảnh bố cục nào. Mâu thuẫn với triệu chứng của founder | |
| K8 | `mosfet-switch`: cảnh báo cực diode báo sai với diode flyback (S0) | TIN ĐƯỢC NHƯNG CHƯA KIỂM | |
| K9 | 3 chủ đề `analog-ldr-reference`, `analog-thermistor`, `power-source-safety` chỉ là tài liệu tham khảo, không có mạch; 5 đường `/learn/<linh kiện>` trả 404 thân thiện (S0) | TIN ĐƯỢC NHƯNG CHƯA KIỂM | Ứng viên giải thích "mạch chỉ hiện CAD/không xem được linh kiện" |
| K10 | Tiêu đề tab `/app/robot-simulation` sai, favicon 404 (S0) | TIN ĐƯỢC NHƯNG CHƯA KIỂM | Minor |
| K11 | "28/28 linh kiện xem được, 27/28 có 3D" và "không thêm tự do vào phòng thử" (S0 khu F) | TIN ĐƯỢC NHƯNG CHƯA KIỂM; **mâu thuẫn nội bộ**: ảnh phòng thử có palette "Linh kiện 28/28" với nút "+" | Tái hiện khi làm S3-S6 |
| K12 | Chân khớp ở 14 board có viewer (S0b) | TIN ĐƯỢC NHƯNG CHƯA KIỂM | xem 1.3 |
| K13 | 14/28 board chỉ là "hồ sơ tra cứu, chưa có viewer" (S0b) | TIN ĐƯỢC NHƯNG CHƯA KIỂM (chữ app trích nguyên văn) | |
| K14 | S1 NOT_RUN typecheck/test, không đọc mesh/renderer/CSS, không tái hiện UI | Giới hạn ghi trung thực | Mesh và renderer 3D vẫn chưa ai đọc |

### 1.3 Bảng board (S0b): điều dùng được và điều không
- **Chỉ 1 chân SAI trong 28 board**, sai nhãn, không sai nối mạch: `esp32-devkit` chân 1 hàng trái, app `5V` / mẫu thật `VIN`. **ĐÃ KIỂM** với bằng chứng nội bộ (`esp32-devkit-v1-type-c-sample.md:23`), vốn chỉ là phiên chép nhãn.
- Chỉ có 1 chân bị báo sai nên **không thể lấy mẫu 6 chân SAI** theo yêu cầu. Thay vào đó tôi lấy mẫu các câu "KHỚP" của `esp32-devkit.md`: số GPIO cạnh nhãn (VN=39, VP=36, RX2=16, TX2=17, RX0=3, TX0=1) đúng theo kiến thức chung về ESP32 và khớp tài liệu CIRCUITSTATE dẫn trong file bằng chứng. Tôi **không mở mạng**: việc đối chiếu với tài liệu hãng **chưa kiểm**.
- **Điểm yếu của S0b:** (a) URL "chính thức" cho `esp32-devkit` là trang ESP32-DevKitC (38 chân), không phải bo clone 30 chân, nên "29 khớp theo tài liệu hãng" không đủ giá trị; chính `not-verified.md` nhận không có datasheet chính thức duy nhất. (b) 14 board ghi "0 khớp / 0 sai / 0 chưa rõ" tức chưa so chân nào, nhưng cột "3D khớp vị trí chân" vẫn ghi "Khớp" cho cả board không có 3D: cột này **LOẠI**. (c) Mức "Minor" gán đại trà cho 27 board không kèm bằng chứng riêng. (d) 3D dùng USB Micro-B, mẫu thật Type-C (Minor, app đã có chú thích).
- **Danh sách board có chân sai thật:** `esp32-devkit` (nhãn chân 1: đổi `5V` thành `VIN`, ghi chú "nối với 5V USB qua diode trên mạch clone"). Không board nào khác được chứng minh sai. 14 board chưa so chân; 13 board còn lại chưa được tôi đối chiếu với tài liệu hãng.

## 2. Phán quyết năm giả thuyết

| Giả thuyết | Phán quyết | Căn cứ | Chỗ ba nguồn mâu thuẫn |
|---|---|---|---|
| **A.** Dữ liệu mạch thiếu part/vị trí/chân nên chỉ có hình CAD | **SAI cho 11 mạch builder** (đã kiểm). **CHƯA XÁC ĐỊNH** cho triệu chứng "chỉ hiện CAD" của founder | S1 bảng preset; S0 số đếm khớp. Ứng viên còn lại: chủ đề tham khảo không mạch (K9), 14 board chỉ hồ sơ tra cứu, chế độ "PCB 2D · đường đồng", bài `esp32-led` ở `lessons.ts` không có đồ thị nối | Founder báo thiếu linh kiện; S0 báo PASS; S1 báo đủ dữ liệu. Không nguồn nào giải thích triệu chứng: cần phiên tái hiện có founder chỉ đúng bài/trang (S0c) |
| **B.** Vị trí tính bằng công thức, không bám lưới lỗ | **ĐÚNG MỘT PHẦN, phụ thuộc view** (đã kiểm) | 2D và sơ đồ: tọa độ % tay; 3D: planner bám lưới | "Vị trí PASS" của S0 bị loại (K7). "Vị trí sai" của founder khớp với việc có 3 bố cục cho một mạch, nhưng chưa có ảnh chứng minh |
| **C.** Dây không có luật đi dây | **ĐÚNG** theo nghĩa thiếu router; SAI nếu hiểu không có quy tắc nào (H-V-H cố định) | Dòng 998, 106, 55. Ảnh 3D thấy dây cong vắt qua board | S1 chưa đọc renderer 3D nên cách vẽ dây 3D chưa xác định; S0 chỉ nói "dây rõ ràng", không ảnh |
| **D.** Breadboard không có lưới lỗ và dải nối | **ĐÚNG MỘT PHẦN: lưới có trong planner 3D và mesh; mô hình dữ liệu và điện không có** | Registry 4 chân; net chỉ gom dây tường minh (`circuitNets.ts:13`); dải chỉ để snap (`assemblyLayout.ts:95,178-195`) | S0: "khối trừu tượng, không lưới" (FAIL Minor); S1: "SAI" vì thấy lưới trong planner. Mỗi bên đúng ở một lớp (S0 nhìn mô hình điện/2D, S1 nhìn planner); ảnh 3D xác nhận có lỗ. **Xếp Blocker cho mục tiêu epic**: không có chuẩn dải nối thì bài breadboard không dạy "cắm lỗ nào nối với gì" |
| **E.** Catalog 28 loại chưa đủ cho bài | **CHƯA XÁC ĐỊNH; nghiêng SAI cho 11 bài hiện có, ĐÚNG cho mục tiêu mở rộng** | Mọi part của 11 bài có trong registry; nhưng 20/28 loại chỉ `visual-only` | Không nguồn nào có ma trận bài → linh kiện. Spec-v2 mục 7 lập ma trận |

Phát hiện ngoài năm giả thuyết (**F**): phòng thử mô phỏng logic, không mô phỏng điện; SPICE tách rời, chỉ nhận "chuyển mạch sang SPICE" cho mạch analog. "Mô phỏng chưa đạt" của founder có thể gồm điều này. ĐÃ KIỂM.

## 3. Bảng lỗi tổng hợp

| ID | Mức | Nhóm nguyên nhân | Mô tả | Bằng chứng | Độ tin cậy |
|---|---|---|---|---|---|
| E-01 | Blocker | Mô hình breadboard | Không có mô hình dữ liệu lỗ/dải/ray độc lập mesh. Strip chỉ trong planner 3D; registry 4 chân; net không biết "hai lỗ cùng cột nối nhau" | `componentRegistry.ts:57`; `assemblyLayout.ts:95,178-195`; `circuitNets.ts:13`; S0 FAIL breadboard ở 8/8 bài dùng breadboard | ĐÃ KIỂM |
| E-02 | Blocker | Bố cục | Cùng mạch có 3 bố cục: 2D và sơ đồ theo % viết tay, 3D theo planner. Không có nguồn bố cục duy nhất | `lessonCircuits.ts:17-26`; `assemblyLayout.ts:210`; `SchematicView.tsx:20-26` (theo S1) | ĐÃ KIỂM |
| E-03 | Blocker (chờ tái hiện) | Dữ liệu bài học | Triệu chứng "mạch chỉ hiện CAD" chưa có nguyên nhân xác định (K9, K13, S1 dòng 62) | — | CHƯA XÁC ĐỊNH |
| E-04 | Major | Luật dây | Không router: H-V-H qua trung điểm, không tránh part, không kiểm giao cắt; mã vẽ lặp ở 3 nơi | `CircuitBuilderPage.tsx:998`; `SchematicView.tsx:106`; `Assembly3DView.tsx:55` | ĐÃ KIỂM |
| E-05 | Major | Tính điện tử | Phòng thử không tính V/I; không hiển thị Vf, I của LED; 20/28 loại chỉ hình; SPICE tách rời | ảnh `A-analog-potentiometer-1440-3d.png`; registry 10/20; `not-tested.md` | ĐÃ KIỂM |
| E-06 | Major | Dữ liệu bài học | 11 preset trong một file 28 dòng, endpoint theo chỉ số (`board-1:0`), không schema, không test chặn chồng part, chân thiếu, dây hở | `lessonCircuits.ts:8-26` | ĐÃ KIỂM |
| E-07 | Major | Mô hình board | `esp32-devkit` chân 1: nhãn `5V` thay vì `VIN` | `esp32-devkit-v1-type-c-sample.md:23` | ĐÃ KIỂM |
| E-08 | Major | Dữ liệu bài học | 3 chủ đề tham khảo và 5 slug `/learn/*` không có mạch tương tác | `not-tested.md`, `area-B.md` | TIN ĐƯỢC NHƯNG CHƯA KIỂM |
| E-09 | Major | Rủi ro mã | `CircuitBuilderPage.tsx` 1056 dòng ~137 KB trộn state, lưu nháp, kéo thả, SPICE, firmware, JSX nhiều view | `wc -l`; S1 mục rủi ro | ĐÃ KIỂM |
| E-10 | Major | Quy trình kiểm | Ảnh S0-v2 không phân biệt được các view; "PASS vị trí/dây" chưa có giá trị | md5 trùng 11/11 | ĐÃ KIỂM |
| E-11 | Minor | Tính điện tử | Cảnh báo cực diode không miễn trừ flyback ở `mosfet-switch` | S0 khu A | TIN ĐƯỢC NHƯNG CHƯA KIỂM |
| E-12 | Minor | Catalog | Chỉ 10/28 loại có hành vi; mở rộng cần ma trận bài | registry | ĐÃ KIỂM (đếm) |
| E-13 | Minor | Mô hình board | 3D USB Micro-B, mẫu thật USB-C; cột "3D khớp" của S0b không đáng tin | `esp32-devkit.md` mục 2; S0b index | ĐÃ KIỂM (nhãn) / LOẠI (cột 3D khớp) |
| E-14 | Minor | Giao diện | Tiêu đề tab `/app/robot-simulation`; favicon 404 | `area-C.md` | TIN ĐƯỢC NHƯNG CHƯA KIỂM |
| E-15 | Minor | Mô hình board | 14/28 board chỉ hồ sơ tra cứu, chưa viewer, chưa so chân | `not-verified.md` mục 3 | TIN ĐƯỢC NHƯNG CHƯA KIỂM |

Nhóm theo nguyên nhân gốc: **dữ liệu bài học** E-03, E-06, E-08; **mô hình breadboard** E-01; **luật dây** E-04; **bố cục** E-02; **catalog** E-12; **mô hình board** E-07, E-13, E-15; **tính điện tử** E-05, E-11; **quy trình/mã** E-09, E-10.

## 5. Cập nhật 10/11 sau S0c (sim-audit-v3) và S2r (phản biện spec)

**S0c đã lọc.** Tôi chạy `md5sum` lại các ảnh 1440 px: mỗi bài 5 ảnh, 5 mã khác nhau (đúng; lỗi trùng byte của S0-v2 đã hết) và mở 4 ảnh (`blink-logic`, `blink-3d`, `seven-segment-counter-3d`, `blink-pcb`).

| Phát hiện | Bằng chứng | Phân loại |
|---|---|---|
| **E-03 đã có nguyên nhân (nghiêng chắc):** chế độ "PCB 2D · đường đồng" luôn hiện đúng một ảnh PCB của ESP32 (26 linh kiện, 341 đối tượng đồng) cho **mọi** bài; 4 bài có ảnh trùng byte (`d23c722b…`). Chữ trong ảnh: "topology dây trong workspace không tự động biến thành copper PCB". Đây rất có thể là "mạch chỉ hiện bản vẽ CAD, không thấy linh kiện và chân" của founder. Thêm: 3 chủ đề tham khảo không có mạch (chỉ ở `/projects`), 14 board chưa có viewer | `blink-pcb.png`, `md5.txt` | **ĐÃ KIỂM** (ảnh + md5). Founder nên xác nhận đúng chế độ này |
| **E-02 và E-04 xác nhận bằng ảnh:** ở "Mạch lắp thử · logic", thẻ Điện trở đè lên thẻ Breadboard, thẻ Breadboard đè lên board ESP32; dây kết thúc ở mép thẻ, không ở chân; breadboard là một thẻ 4 điểm | `blink-logic.png` | **ĐÃ KIỂM** |
| **3D:** breadboard có lưới lỗ thật, vạch ray đỏ/xanh; board ESP32 và part nhỏ so với bo; ở `seven-segment-counter` bó dây chồng chéo khó đọc; app tự ghi "đây là một cách lắp gợi ý, chưa kiểm tra trên mạch thật" | `blink-3d.png`, `seven-segment-counter-3d.png` | **ĐÃ KIỂM** (giả thuyết D: lưới có ở 3D) |
| Báo cáo ghi "Part chồng nhau" cho cả 11 bài với số px vùng giao | `index.md` | TIN ĐƯỢC (khớp ảnh blink); số px chưa kiểm |
| Số part/dây/chân đếm từ DOM không dùng được làm `expect`: `blink` có 4 part, nhưng dây 6 (logic) / 3 (sơ đồ) / 3 (3D) cho 3 dây thật; 3D 15 part, 0 chân; PCB 67 part, 259 dây | `index.md` | **LOẠI** làm cơ sở G11: cần `data-testid` riêng |

**Phán quyết mới:** giả thuyết A giờ có lời giải cho triệu chứng 3 (xem dòng E-03 ở trên). Triệu chứng 1 ("không xem được hết linh kiện") nghiêng về: 3D thu nhỏ part và dây chồng ở bài nhiều part; 2D logic thẻ che nhau.

**S2r (Luna) đã lọc:** tôi kiểm lại bằng node/đọc mã: 17 loại có `legsMm`, 9 loại rỗng (đúng); `gridMm` chỉ có `pitch, columns, topY, firstColumnX, rows, rails` (4 giá trị Z, **không có số lỗ ray**, đúng); `tb6612` và `ultrasonic` có `mount: "breadboard"` trong manifest (trái D-SIM-02, đúng); `workspaceSpice` gọi `createNetIndex(validWires)` và chỉ nhận `connections` (đúng, `workspaceSpice.ts:160`). 10 giả định sai S2r nêu đều **chấp nhận**; xử lý ở `spec-v2.md` mục 12.

## 4. Giới hạn
- ~~Chưa ai mở ứng dụng~~ (đã có S0c, mục 5). Vẫn cần founder xác nhận triệu chứng bằng mắt nếu có chỗ khác.
- Chưa ai đọc mesh breadboard (`gridMm`), renderer 3D hay CSS. Spec-v2 giả định mesh có `gridMm` đúng như `assemblyLayout.ts:218` đọc; S3 phải kiểm.
- Không mở mạng để đối chiếu tài liệu hãng.
