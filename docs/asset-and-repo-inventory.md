# Kiểm kê asset và trạng thái repo — 01/11/2026

Tài liệu này ghi lại trạng thái thực tế để chủ dự án quyết định cách theo dõi source và asset. Không có file nào bị xóa, di chuyển, stage hay commit trong lượt kiểm kê. Đây không phải xác nhận pháp lý.

## Trạng thái Git

- Repo gốc là `D:\StartupOS`, có 1 commit. Thư mục `electronics-learning-demo/` đang **untracked**, nên chưa có lịch sử, diff hay rollback cho Mạch Mở.
- `dist/` được ignore. `.tmp/` (20,0 MB, 165 file) nay được ignore trong `.gitignore` của dự án.
- Chưa có workflow CI. `../.github/` chỉ có file hướng dẫn và nằm ngoài thư mục dự án.

## Dung lượng

| Thư mục | Số file | Dung lượng | Được phục vụ công khai |
|---|---:|---:|---|
| `public/models` | 34 | 44,0 MB | Có |
| `public/cad` | 9 | 21,6 MB | Có |
| `public/boards` | 4 | 1,5 MB | Có |
| `assets/boards/arduino-reference` | 54 | 117,7 MB | Không |
| `assets/boards/vendor` | 85 | 18,0 MB | Không |
| `assets/boards/community` | 11 | 12,6 MB | Không |
| `assets/upstream` | 16 | 10,3 MB | Không |
| `assets/boards/esp32-devkit-v1-30pin` | 15 | 7,8 MB | Không |
| `assets/boards/archive` | 5 | 5,2 MB | Không |
| `vendor` | 3 | 4,2 MB | Không (đóng gói qua npm) |

File công khai lớn nhất là `public/models/arduino-mega-2560-r3.glb` (15,9 MB) và `public/cad/raspberry-pi-pico-2.step` (11,8 MB). `assets/` có nhiều GLB trùng vai trò với `public/models`, ví dụ `mega-with-packages.glb` và `arduino-mega-2560-r3-with-packages.glb` cùng 16,5 MB.

## Đối chiếu file 3D đang phát hành

Đã đọc header và JSON chunk của 8 GLB board: cả 8 file có header hợp lệ, glTF 2.0, độ dài khớp và không dùng extension bắt buộc. `public/models/components/` thêm 25 GLB linh kiện; bảng nguồn và hash nằm trong `docs/component-model-registry.md`. Ba file STEP có header `ISO-10303-21`. Kiểm tra định dạng không xác nhận hình học khớp board vật lý.

| File | Mesh | SHA-256 (12 ký tự đầu) | Điều khoản theo hồ sơ dự án | Cần xác nhận |
|---|---:|---|---|---|
| `esp32-devkit-v1-30pin.glb` | 26 | `6fe855d5aade` | MIT (thiết kế upstream); mesh package có điều khoản riêng | Điều khoản mesh package; file notice đi kèm |
| `esp32-led-assembly.glb` | 33 | `18a3143983d7` | Dẫn xuất từ model trên, thêm hình minh họa | Như trên |
| `arduino-uno-r3.glb` | 39 | `e6a44b3ccb22` | CC BY-SA 4.0 | Share-alike cho model dẫn xuất; mesh bên thứ ba |
| `arduino-nano-classic.glb` | 24 | `3f706c715865` | CC BY-SA 4.0 | Như trên |
| `arduino-mega-2560-r3.glb` | 45 | `1ea564a9c920` | CC BY-SA 4.0 | Như trên |
| `raspberry-pi-pico.glb` | 16 | `aa1b6f4bb7b9` | MIT (`public/cad/raspberry-pi-model-license.txt`) | Mesh bên thứ ba |
| `raspberry-pi-pico-w.glb` | 24 | `28757a63380a` | MIT | Mesh bên thứ ba |
| `raspberry-pi-pico-2.glb` | 53 | `38ba3e6ddefb` | MIT | Mesh bên thứ ba |

Ba GLB Pico được sinh lại ngày 01/11/2026 vì bản cũ bị soi gương, Pico R3 còn sai trục đứng; bản cũ giữ ở `assets/boards/raspberry-pi/pre-orientation-fix/`.

`public/models/components/` có 25 GLB linh kiện (2,0 MB) và `NOTICE.txt`. Danh sách, nguồn, hash và mức xác minh ở `docs/component-model-registry.md`.

Trong `public/` có notice cho Raspberry Pi, `occt-import-js` và mesh linh kiện KiCad. Model ESP32 và Arduino chưa có file notice đi kèm; attribution hiện chỉ nằm trong UI. Repo chưa có `LICENSE` gốc và lượt này không tự chọn license cho sản phẩm.

## Phân biệt mức xác minh

- **Nguồn hình học:** CAD đã ghi nguồn trong `src/data/boardModelSources.ts`.
- **Bảng chân ESP32:** bảy chân LED 7 đoạn có net tương ứng trong `esp32-devkit-v1-30pin.kicad_pcb`.
- **Board vật lý:** chưa đối chiếu với board thật ở mọi mục trên.
- **Hồ sơ board:** 10/21 target chưa có mục trong `boardModelSources`.

## Hai quyết định đang chặn

**1. Cách theo dõi CAD và asset lớn**

| | Git LFS | Lưu ngoài repo kèm manifest |
|---|---|---|
| Ưu điểm | Clone và CI lấy đủ file; version đi cùng commit; quy trình quen | Repo nhẹ; không tốn hạn mức LFS; dễ tách asset chưa rõ quyền khỏi repo |
| Nhược điểm | Tốn hạn mức lưu trữ và băng thông; khó gỡ file khỏi lịch sử nếu sau này phát hiện vấn đề quyền | Cần nơi lưu ổn định, script tải và kiểm hash; dễ lệch nếu manifest không được cập nhật |
| Phù hợp hơn khi | Asset đã rõ quyền và thường đi cùng code | Còn nhiều asset chưa rõ quyền, hoặc chỉ cần giữ CAD nguồn để tái tạo |

Đang bị chặn: commit đầu cho Mạch Mở, `.gitattributes`, CI (test `board-model-assets` đọc file trong `assets/`), việc dọn GLB trùng.

Khuyến nghị: Git cho source; `public/models` đã rõ quyền theo chính sách bạn chọn; CAD nguồn lưu ngoài repo kèm manifest. Lý do: `assets/` chưa rõ quyền ở một số mục, và file đã vào lịch sử Git rất khó gỡ.

**2. Ai xác nhận điều khoản asset**

Người xác nhận cần là chủ dự án kèm tư vấn pháp lý, hoặc người được chủ dự án ủy quyền bằng văn bản. Phần kỹ thuật chỉ liệt kê được nguồn và điều khoản đã ghi, không thay thế xác nhận này.

Đang bị chặn: thêm notice đi kèm model trong `public/`, chọn license sản phẩm, phát hành công khai model ESP32 và Arduino, quyết định giữ hay bỏ `public/cad`.

## Đề xuất để chủ dự án quyết định

1. Theo dõi source, tài liệu và test trong Git trước; `dist/`, `.tmp/` và `node_modules/` nằm ngoài.
2. Với CAD nguồn lớn, chọn một trong hai: Git LFS, hoặc lưu ngoài repo kèm manifest (URL, hash, license).
3. Chỉ đưa vào Git các asset đã rõ điều khoản; rà các bản GLB trùng trong `assets/` trước.
4. Sau khi có repo theo dõi được, thêm CI chạy `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`. CI không cần asset trong `assets/`, nhưng test `board-model-assets` có đọc một số file ở đó.
5. Nhờ người có thẩm quyền xác nhận điều khoản phân phối trước khi phát hành công khai.
