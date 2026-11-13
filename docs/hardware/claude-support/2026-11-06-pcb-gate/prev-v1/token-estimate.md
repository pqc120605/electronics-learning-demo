# Ước tính token nếu Claude Code tự làm phần PCB (06/11/2026)

Đây là ước lượng, chưa đo. Phạm vi: hai board (tay cầm, robot) từ lúc có lease tới khi review Gerber/BOM/CPL. Không gồm phần KiCad GUI, vì phiên này không chạy KiCad.

## Bảng theo phase

Input mới = token đọc lần đầu (tài liệu, datasheet, xuất ERC/DRC). Input tích lũy = số vòng × ngữ cảnh trung bình, vì mỗi vòng tool gửi lại toàn bộ ngữ cảnh.

| Phase | Vòng tool | Ngữ cảnh TB (K) | Input mới (K) | Input tích lũy (M) | Output (K) | Tin cậy |
|---|---|---|---|---|---|---|
| P0 Nạp ngữ cảnh, đóng gate dư | 12 | 110 | 90 | 1,32 | 20 | Cao |
| P1 Schematic capture hỗ trợ (sinh `.kicad_sch`, symbol riêng) | 45 | 130 | 60 | 5,85 | 145 | Thấp |
| P2 Kiểm symbol/footprint (khoảng 70 MPN) | 30 | 140 | 360 | 4,20 | 35 | Trung bình |
| P3 Review netlist, lặp ERC | 24 | 150 | 80 | 3,60 | 30 | Trung bình |
| P4 Hướng dẫn placement/routing | 35 | 130 | 50 | 4,55 | 70 | Thấp |
| P5 Review DRC | 20 | 130 | 60 | 2,60 | 20 | Trung bình |
| P6 Review Gerber/BOM/CPL | 14 | 110 | 70 | 1,54 | 15 | Trung bình |
| **Tổng** | **180** | | **770** | **23,66** | **335** | |

- **Tổng thô** = input tích lũy + output ≈ **24,0 M token**. Khoảng ước lượng 0,6× đến 2,0×: **14 M đến 48 M**.
- Phần lớn input tích lũy là đọc lại ngữ cảnh đã có trong cache. Input mới chỉ 0,77 M.

## Quy đổi theo trọng số (chỉ để so sánh phase, không phải quota)

Trọng số tỉ lệ giá API công khai: input mới ×1,25 (ghi cache), cache đọc ×0,1, output ×5. Đây là giả định `[chưa kiểm chứng với gói của bạn]`.

| Phase | Tương đương input (M) |
|---|---|
| P0 | 0,34 |
| P1 | 1,38 |
| P2 | 1,01 |
| P3 | 0,60 |
| P4 | 0,86 |
| P5 | 0,43 |
| P6 | 0,31 |
| **Tổng** | **4,93** |

## Quy đổi % ngân sách tuần

`[WEEKLY_TOKEN_BUDGET]` đang trống, nên **không tính %** và không đoán quota của gói.

Công thức, chọn một đơn vị và dùng cho cả tử lẫn mẫu:

- `% tuần = T / B × 100`.
- Nếu B tính bằng token thô: T = 24,0 M (khoảng 14–48 M).
- Nếu B tính theo trọng số: T = 4,93 M (khoảng 3,0–9,9 M, cùng hệ số 0,6–2,0).
- Nếu B là số tin nhắn hay giới hạn theo cửa sổ 5 giờ của gói: không quy đổi được từ token. Cần số liệu của gói.

## Giả định

1. Tài liệu nguồn 144 071 byte (KS7, FB, FV, DL, TY, DS). Với tiếng Việt và bảng, khoảng 2,4 byte/token cho ra khoảng 59 K token. Hệ số 2,0–3,0 byte/token cho 48–72 K `[chưa đo]`.
2. Ngữ cảnh gốc gồm system prompt, công cụ, tài liệu: khoảng 110 K. Ngữ cảnh tăng dần theo phase vì có netlist, ERC và DRC.
3. Mỗi linh kiện sinh khoảng 0,5 K token output trong `.kicad_sch` (symbol, thuộc tính, label). Tay cầm khoảng 95 refdes, robot khoảng 130, cộng khoảng 15 symbol riêng 2 K mỗi cái (TPS259474L, TLV6710, TMUX1511, TS3USB221, BQ25886 và tương tự) `[ước từ KS7:31-109, KS7:143-229, chưa đếm chính xác]`.
4. P2 đọc khoảng 40 trang bản vẽ gói trong datasheet, 3 trang mỗi linh kiện, khoảng 9 K token một linh kiện.
5. ERC và DRC chạy bằng `kicad-cli`. Toolchain mới chỉ kiểm `version` (KH:10), nên mọi vòng lặp ERC/DRC giả định chạy được ở máy HQ.
6. Mỗi phase gồm hai board và khoảng ba vòng sửa lỗi cho ERC và DRC.

## Rủi ro vượt ước tính

- **Đổi board B01 hoặc kiến trúc (r8):** pin map, footprint và interposer vẽ lại. P1–P3 có thể tăng 50–100 %.
- **Box08 yêu cầu sửa sau khi đã vẽ:** mỗi vòng schematic lại tốn 20–30 % P1 và P3.
- **P1 và P4 tin cậy thấp:** không có GUI nên khó thấy sai sót hình học. Routing thực tế nên do người hoặc autorouter làm. Phần Claude chỉ là rule, thứ tự đặt và review.
- **Datasheet PDF nặng:** nếu đọc ảnh trang thay vì trích văn bản, P2 có thể gấp đôi.
- **Hook, gate và agent:** project CLAUDE.md quy định Codex sở hữu mọi chỉnh sửa. Nếu Claude tự làm PCB thì cần đổi workflow, và mỗi tệp mới còn qua cổng GateGuard, thêm vòng tool.
- **Chưa có lease, chưa có file KiCad:** chưa có gì để đo thực tế. Ước tính này không dựa trên lần chạy mẫu nào.
