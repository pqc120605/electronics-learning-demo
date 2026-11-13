# Ước tính token nếu Claude Code làm phần PCB (06/11/2026)

Ước lượng, chưa đo. Phạm vi: hai board từ lúc có lease tới khi review Gerber/BOM/CPL, **cộng chi phí phối hợp với lease/review của Codex**. Không gồm KiCad GUI. Không có lần chạy mẫu nào để hiệu chỉnh.

## Bảng theo phase

Input mới = token đọc lần đầu. Input tích lũy = số vòng × ngữ cảnh trung bình, vì mỗi vòng gửi lại ngữ cảnh.

| Phase | Vòng tool | Ngữ cảnh TB (K) | Input mới (K) | Input tích lũy (M) | Output (K) | Tin cậy |
|---|---|---|---|---|---|---|
| P0 Phối hợp lease/review với Codex (6 chu kỳ) | 48 | 120 | 240 | 5,76 | 50 | Trung bình |
| P1 Schematic (`.kicad_sch`, symbol riêng) | 45 | 130 | 60 | 5,85 | 145 | Thấp |
| P2 Footprint/symbol (khoảng 70 MPN) | 30 | 140 | 360 | 4,20 | 35 | Trung bình |
| P3 Netlist và ERC (lặp) | 24 | 150 | 80 | 3,60 | 30 | Trung bình |
| P4 Placement | 20 | 130 | 25 | 2,60 | 35 | Thấp |
| P5 Routing guidance | 15 | 130 | 25 | 1,95 | 35 | Thấp |
| P6 DRC (lặp) | 20 | 130 | 60 | 2,60 | 20 | Trung bình |
| P7 Gerber/BOM/CPL | 14 | 110 | 70 | 1,54 | 15 | Trung bình |
| **Tổng** | **216** | | **920** | **28,10** | **365** | |

- **Tổng thô** = input tích lũy + output ≈ **28,5 M token**. Khoảng 0,6×–2,0×: **17 M đến 57 M**.
- Input mới chỉ 0,92 M; phần lớn là đọc lại ngữ cảnh trong cache.

## Chi phí phối hợp (P0)

Một chu kỳ gồm: đọc lát cắt `tasks.json` (đọc cả file 100,7 KB ≈ 42 K token, nên lọc bằng script còn khoảng 5 K), đọc review và decision, chạy `validate.mjs` và `--dispatch-task`, soạn handoff cho Codex ghi (Claude không phải writer: `claude_communication_allowed: false`, TJ:7-20).

- 6 chu kỳ: lease REMOTE, review schematic tay cầm trước layout, review layout, lease ROBOT, review robot, đóng gói.
- 8 vòng mỗi chu kỳ ≈ 48 vòng. Output 50 K gồm handoff, danh sách file Codex phải ghi.
- Thêm chi phí **mỗi file Claude sinh ra**: Codex phải áp, rồi Claude đọc lại để kiểm; chưa tính trong bảng, ước thêm khoảng 10–15 % output.

## Quy đổi theo trọng số (chỉ để so sánh phase, không phải quota)

Trọng số tỉ lệ giá API công khai: input mới ×1,25, cache đọc ×0,1, output ×5 `[chưa kiểm chứng với gói của bạn]`.

| Phase | Tương đương input (M) |
|---|---|
| P0 | 1,10 |
| P1 | 1,38 |
| P2 | 1,01 |
| P3 | 0,60 |
| P4 | 0,46 |
| P5 | 0,40 |
| P6 | 0,43 |
| P7 | 0,31 |
| **Tổng** | **5,69** |

## Quy đổi % ngân sách tuần

`[WEEKLY_TOKEN_BUDGET]` trống: **không tính %**, không đoán quota.

- `% tuần = T / B × 100`, T và B cùng đơn vị.
- B tính bằng token thô: T = 28,5 M (khoảng 17–57 M).
- B tính theo trọng số: T = 5,69 M (khoảng 3,4–11,4 M).
- B là số tin nhắn hay cửa sổ giới hạn của gói: không quy đổi được từ token.

## Giả định

1. Tài liệu nguồn gồm `kicad-input-spec`, BOM, values, delta, thiết kế: 144 KB ≈ 59 K token (2,4 byte/token cho tiếng Việt và bảng `[chưa đo]`). `tasks.json` thêm 42 K nếu đọc nguyên.
2. Ngữ cảnh gốc 110–120 K gồm system prompt, công cụ và tài liệu.
3. Khoảng 0,5 K token output mỗi linh kiện trong `.kicad_sch`; tay cầm khoảng 95 refdes, robot khoảng 130, cộng khoảng 15 symbol riêng 2 K `[ước từ netlist trước, chưa đếm lại cho board mới]`.
4. P2 đọc khoảng 40 trang bản vẽ gói datasheet, 3 trang mỗi linh kiện.
5. `kicad-cli` ERC/DRC chạy được ở máy HQ (hiện mới kiểm `version`, KH:10).
6. Mỗi phase gồm hai board và khoảng ba vòng sửa cho ERC/DRC.

## Rủi ro vượt ước tính

- **Chưa có lease nào:** gate-matrix cho thấy tay cầm 4/32, robot 4/32 gate CHỐT. Chưa thể bắt đầu P1.
- **Đổi board hoặc kiến trúc:** pin map, footprint và cách ly vẽ lại, P1–P3 có thể tăng 50–100 %.
- **Box08 yêu cầu sửa sau khi đã vẽ:** mỗi vòng lặp lại 20–30 % P1 và P3.
- **P1, P4, P5 tin cậy thấp:** không có GUI nên khó thấy sai sót hình học; routing thật nên do người hoặc autorouter.
- **Chính sách:** `claude_communication_allowed: false` và role toml "user has opted out of Claude". Nếu Claude làm PCB thì cần đổi policy và dispatch; mỗi tệp mới còn qua cổng GateGuard của môi trường này, thêm vòng tool.
