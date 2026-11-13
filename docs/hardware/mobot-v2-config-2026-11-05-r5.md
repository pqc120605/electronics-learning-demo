# MoBot V2 · Cấu hình đề xuất r5

05/11/2026 · `MOBOT-V2-CONFIG-r5` · Cập nhật B01 theo lựa chọn Micro‑USB của người dùng. Kế thừa [r4](mobot-v2-config-2026-11-05-r4.md), SHA‑256 `1ABC20679372B4DF9926CA01C58D401EB727FF68A57E258774FE8E9FB8009BC5`, với các thay đổi dưới đây.

| Dòng | Cấu hình r5 |
|---|---|
| B01 | Hai ESP32 DevKit V1 clone **30 chân, CP2102, Micro‑USB**, một cho robot và một cho tay cầm. Thiết kế đối chiếu là **BrijModi ESP32 Dev Kit Clone** được dùng trong thư viện Mạch Mở, kích thước bo danh nghĩa khoảng **47,06 × 29,23 mm**. SKU thương mại khớp thiết kế còn cần xác nhận. |
| B21 | Giữ hai socket 1×15 mỗi carrier. Dùng tọa độ header của PCB tham chiếu để đối chiếu hàng mẫu trước khi khóa footprint. |

**B02** vẫn là hai motor Pololu #992, 6 V. **B20** vẫn là USB‑C sạc pin riêng. Cổng Micro‑USB của B01 dùng để nạp chương trình. Dự toán r4 dùng giá HH004223 cho B01. r5 cần giá của hai bo Micro‑USB đúng mẫu trước khi chốt tổng.

## Snapshot tham chiếu cho B01

| Tài liệu nguồn Mạch Mở | SHA‑256 |
|---|---|
| [PCB BrijModi](../../assets/boards/esp32-devkit-v1-30pin/upstream/ESP32%20Dev%20Kit.kicad_pcb) | `D5A70C26A4C48B4A6F5E697363593CA56DA6EBE499A3DC8D0EBB115B8A8F345F` |
| [Sơ đồ chính](../../assets/boards/esp32-devkit-v1-30pin/upstream/ESP32%20Dev%20Kit.kicad_sch) | `D6A3C84A6F8978720E70ED418A8DC5D7D5093A1DC46DA59CC504B2EF317DE8D5` |
| [Trang đầu nối](../../assets/boards/esp32-devkit-v1-30pin/upstream/Connectors.kicad_sch) | `5853980279986C480EB24F0A546C17110372708F5DFB3B16D3781F154E0ADAC3` |

[Hồ sơ mô hình trên Mạch Mở](../../assets/boards/esp32-devkit-v1-30pin/README.md) ghi đường USB VBUS qua diode D1 tới đầu vào AMS1117 trên thiết kế nguồn. Dùng thông tin này để review cấp ngược với nguồn carrier. Tên bán hàng “DevKit V1 30 chân” chưa đủ để áp sơ đồ hoặc footprint lên bo thương mại. Cần mã mua hoặc mẫu khớp hình học, thứ tự header và đường nguồn, sau đó chốt tải motor/nguồn và duyệt đúng revision/hash theo [quy trình dự án](../mission-control/parallel-build-policy.md).
