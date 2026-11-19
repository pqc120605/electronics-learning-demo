# Update Mạch Mở — 18/11/2026

Bản cập nhật tiếp theo hoàn tất dạng sóng, gói giáo viên và các sửa chữa theo tester. [Xem bản local đã kiểm thử và các giới hạn model](2026-11-18-tester-feedback-report.md).

[Kế hoạch nối lợi thế với khoảng cách cạnh tranh](2026-11-17-web-update-roadmap.md) là tài liệu chỉ đường; trạng thái thực thi giữ trong queue chuẩn `D:/StartupOS/docs/agents/tasks.json`.

## Đã triển khai local

| Lợi thế | Phần đưa vào web | Bằng chứng |
| --- | --- | --- |
| Người mới hiểu mạch trước khi code | 5 hoạt động mạch kín → breadboard → LED/điện trở → INPUT_PULLUP → threshold; dự đoán, quan sát, giải thích, gợi ý tăng dần | [Báo cáo đợt 1](../../agents/runs/MM-SW-LOCAL-LEARNING-001/report.md) |
| Có lý do để quay lại tiếp tục | Lưu cursor/board/điều khiển/bằng chứng; card tiếp tục ở home/topics; tiêu chí theo mô hình thay cho chỉ bấm Run/tự tick | Cùng báo cáo; E2E đi hết 5 hoạt động và reload đúng bài |
| Được giúp đúng chỗ đang mắc | Mở Bot nhận activity và quan sát hiện hành, hai câu hỏi theo ngữ cảnh, nguồn kết quả rõ; action đưa focus về thao tác, không chạy hộ | [Báo cáo đợt 2a](../../agents/runs/MM-SW-LOCAL-GUIDE-001/report.md) |
| Tin được trạng thái và dữ liệu | Không mặc định board ở bài code; xóa trace/answer cũ; giữ dữ liệu malformed/newer/quota/conflict và tải bản sao | Unit, E2E, review độc lập và SHA-256 trong hai báo cáo |

Đường vào mới: `/learn/basics` và `/app/learn/basics`. Bản local: `http://127.0.0.1:5320/learn/basics` khi preview đang chạy trên máy này. Bài học, bàn tự do và công cụ hiện có vẫn được giữ.

## Kiểm chứng cuối

Typecheck và build local exit 0. Unit **723/723**. Các E2E course/guide bị ảnh hưởng **25/25** sau integration. Lượt E2E toàn web trước integration **207 passed, 1 skipped**, ca skip là môi trường analytics server riêng; không phải bằng chứng online đã được nghiệm thu. Không sửa assertion/cấu hình của ca đó. Tổng hai đợt thêm **21 unit/SSR và 12 E2E**, không có ca mới bị bỏ qua.

Hai review nguồn độc lập đạt trên snapshot có hash. Có ảnh Chromium 375×812 và 1440×900. [Manifest 24 file hiện hành](../../agents/runs/MM-SW-LOCAL-GUIDE-001/snapshot-combined.json) hợp nhất snapshot đợt 1 với các file integration được review ở đợt 2a. Các thay đổi analytics/SPICE có sẵn của công việc khác được giữ nguyên, không nhận là mã mới của đợt này.

## Phần tiếp theo

Tiếp tục theo roadmap: cross-probe và metadata/anchor có nguồn, quan sát/probe/debug sâu hơn, mini-project có hồ sơ bằng chứng và gói giáo viên local. Các nhánh firmware/peripheral/IoT lớn cần scope và fixture riêng; đợt này không khẳng định đã ngang toàn bộ Wokwi/EveryCircuit/KiCad. Server/sync/community online/analytics deployment đợi môi trường Mini PC. Chưa deploy hoặc push GitHub trong hai đợt này.

Hoạt động hiện tại kiểm topology/trace subset; không xác nhận mạch thật hay kỹ năng đã thành thạo. Hiệu quả giữ chân cần thử với người mới và dữ liệu thực tế, không thể suy ra chỉ từ test tự động.

## Bổ sung cùng ngày — đợt 2b/2c

Đã nối cảnh báo G6/G7/G8 tới selection chân/dây/LED hiện hành, có focus và quay lại; inspection không sửa nháp. Bước chọn board có finder tùy chọn, tìm/lọc và so sánh tối đa hai board, phân biệt pinout, tọa độ trong bài, mô hình bài học và công cụ HEX. Giữ native chọn board và routes cũ.

[Báo cáo diagnostics và ảnh](../../agents/runs/MM-SW-DIAGNOSTIC-NAV-001/report.md) · [Báo cáo finder và ảnh](../../agents/runs/MM-SW-BOARD-CAPABILITIES-001/report.md). Snapshot mới đã qua review độc lập, typecheck/build local, **736/736 unit** và **27/27 E2E liên quan**, không skip. Hai lỗi nhãn/locator phát hiện trong lượt đầu đã sửa và chạy lại; chi tiết/log giữ trong báo cáo. Phần trên về đợt 1/2a là bằng chứng lịch sử theo snapshot, không nhận là lượt E2E toàn web mới sau 2b/2c.
