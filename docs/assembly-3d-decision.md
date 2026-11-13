# Quyết định kỹ thuật: cảnh lắp mạch 3D — 01/11/2026

## Quyết định

Mở rộng renderer WebGL2 và `glbParser` hiện có, không thêm dependency.

## Các phương án đã xem

| Nguồn | Phiên bản, giấy phép | Phù hợp | Kết luận |
|---|---|---|---|
| `@react-three/fiber` | 9.8.2, MIT. Peer: react `>=19 <19.4`, three `>=0.156` | Tương thích React 19.3.1 của dự án | Không dùng lúc này. Dự án đã có parser và renderer cho profile GLB của mình; thêm `three` tạo renderer thứ hai cho một cảnh. Đáng xem lại nếu cần vật liệu PBR, bóng đổ hoặc nhiều cảnh phức tạp. |
| `@react-three/drei` `useGLTF` | 10.7.9, MIT. Peer: react `^19`, fiber `^9` | Chỉ có ý nghĩa nếu chọn R3F | Không dùng |
| `@tscircuit/3d-viewer` | 0.0.638. Peer ghim react `19.1.0` | Xung đột với React 19.3.1; phục vụ PCB từ Circuit JSON, README không nói về lắp ráp có breadboard và dây | Không dùng |
| `@tscircuit/pcb-viewer` | 1.11.441, MIT | Phục vụ PCB, dự án đã có `Pcb2DViewer` đọc manifest KiCad | Không dùng |
| `tscircuit` | 0.0.3047, MIT, 73 MB khi giải nén | Bộ công cụ thiết kế mạch, không phải viewer lắp ráp | Không dùng |
| CircuitJS1 | GPL-2.0, nhúng qua iframe | Mô phỏng điện thật, nhưng GPL có thể ảnh hưởng phân phối và dự án chưa chọn license | Không nhúng, không sao chép mã. Cần chủ dự án quyết định về license trước nếu muốn dùng. |

Không có asset, mã hay hình ảnh nào được lấy từ các nguồn trên, từ Learn Arduino, hay từ ảnh tham khảo.

## Cấu trúc

- `src/lib/assemblyLayout.ts`: hàm thuần xếp linh kiện lên lưới breadboard từ topology, tính chân, đầu dây, callout. Vị trí 3D không suy từ canvas 2D.
- `src/lib/logicTrace.ts`: `getLogicFlow` tính trạng thái từng dây.
- `src/lib/partInfo.ts`: dữ liệu panel, chỉ gồm thứ repo có căn cứ.
- `src/components/builder/AssemblyScene.ts`: WebGL, không biết React. Tải từng model độc lập, không tính lại vị trí.
- `src/components/builder/AssemblyStage.tsx`: tương tác và lớp phủ, nạp lười cùng dữ liệu board.
- `src/components/builder/Assembly3DView.tsx`: dự phòng khi không có WebGL 2.
