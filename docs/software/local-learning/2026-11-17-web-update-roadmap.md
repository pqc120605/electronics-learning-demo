# Kế hoạch update Mạch Mở theo lợi thế cạnh tranh

Founder duyệt triển khai ngày 17/11/2026 và yêu cầu build local trước. Server được tiếp tục khi có Mini PC. Tài liệu này nối kết quả phân tích cạnh tranh với các đợt triển khai. Trạng thái task hiện hành nằm trong ../docs/agents/tasks.json.

## Kết quả sản phẩm

Người mới đi được từ hiểu một mạch đơn giản, dự đoán hoạt động, kiểm tra, sửa lỗi tới làm một dự án của mình. Người đã có kinh nghiệm vào thẳng bàn tự do hoặc công cụ. Tiếng Việt, đúng board, cùng topology giữa các chế độ xem và khả năng quay lại tiếp tục hoạt động là nền cho hành trình này.

## Chuỗi lợi thế và khoảng cách

| Lợi thế muốn phát triển | Khoảng cách và nguồn học hỏi | Thay đổi sản phẩm | Tiêu chí nghiệm thu | Đợt |
| --- | --- | --- | --- | --- |
| Học bằng tiếng Việt theo tình huống | Electronics 101 đưa khái niệm mạch kín, breadboard và điện trở trước lập trình. Tinkercad có hướng dẫn từng bước. | Chuỗi mạch kín → dải breadboard → chiều LED/điện trở → INPUT_PULLUP → cảm biến theo ngưỡng. Mỗi hoạt động có dự đoán, quan sát và giải thích. | Người mới hoàn thành bằng chuột/bàn phím ở 375 và 1440 px. Tiêu chí dựa đúng mô hình được dùng. | 1 |
| Quay lại đúng hoạt động, thấy mình tiến bộ | Tiến độ hiện có thiên về mở bài/tự đánh dấu. MakeCode có lộ trình và lưu tiến độ. | Cursor hoạt động, board và trạng thái thí nghiệm được lưu local. Tiêu chí bài tập riêng với tự đánh dấu. Bài lặp lại được, có bản sao dự phòng. | Reload khôi phục đúng hoạt động; đổi tham số làm mất kết quả hiển thị cũ; dữ liệu hỏng/newer/quota/conflict có phục hồi. | 1 |
| Cùng mạch giữa hình lắp, schematic và 3D | Learn Arduino/ESP32 giữ mạch, thông tin, code gần nhau; Wokwi có thao tác endpoint nhất quán. | Tiếp tục cross-probe theo partId/pinId, kiểm đủ dây theo hình đang xem, inspector ngắn gọn và thao tác sửa tại vị trí lỗi. | Chọn chân/net ở một view trỏ cùng đối tượng ở view khác; sửa topology xóa trace cũ. Unsupported có lý do và đường tiếp theo. | 2 |
| Đúng board và thông tin có nguồn | Wokwi công bố khả năng từng target; KiCad có identity symbol/footprint/model. Một số board Mạch Mở còn thiếu anchor có nguồn. | Bảng capability theo đúng profile/revision, dữ liệu pin thống nhất, mở rộng anchor từ CAD hãng có nguồn. Hướng dẫn người học đọc pin và giới hạn. | Mỗi anchor có file/revision và kiểm tọa độ. Board chỉ tham khảo không dựng kết nối hoặc chạy kết quả giả. | 2 |
| Code giải thích được bằng tín hiệu | Wokwi có firmware/peripheral/debug sâu hơn; EveryCircuit đưa đại lượng và waveform tới gần mạch. | Tận dụng trace read→branch→write để giải thích. Từng bước thêm probe, cursor và phép đo cho đúng provider. | Logic trace, firmware và solver có nguồn kết quả rõ; phép đo có đơn vị và fixture số; stale/unsupported không hiện kết quả cũ. | 3 |
| Mở Bot hỗ trợ đúng chỗ đang mắc | Kho tri thức cục bộ có giới hạn câu hỏi. Các sản phẩm tham khảo giữ giải thích cạnh linh kiện và ví dụ. | Hướng dẫn theo activity/part/net/lỗi; gợi ý tăng dần, kèm nguồn và hành động tới đúng điểm. | Hỏi về hoạt động đang mở trả đúng ngữ cảnh; thiếu dữ liệu được nói rõ; kiểm các câu nhập môn và tên board dễ nhầm. | 2 |
| Bài học dẫn tới sản phẩm riêng | OhStem có chuỗi dự án/kit, Wokwi và CircuitLab cho tái dùng/chia sẻ thiết kế. | Mini-project nối LED, nút và cảm biến. Hồ sơ gồm mạch, code, dự đoán, kết quả và điều đã sửa. Sao chép và xuất/import local trước. | Dự án mở lại được, không ghi đè workspace ngoài ý muốn; board/code/identity/nguồn theo đúng bản dự án. | 4 |
| Dùng được trong buổi học | OhStem có giáo án/slide/kit; Mạch Mở có planner BOM nền. | Gói giáo viên local với mục tiêu, lỗi thường gặp, tiêu chí bài tập, danh sách linh kiện và phiếu thực hành. | Giáo viên tải/in một gói và đi hết bài bằng dữ liệu đi kèm; chỉ rõ mục nào tự đánh giá và mục nào kiểm bằng mô hình. | 4 |
| Hỗ trợ nhau qua dự án tái hiện được | Community hiện có nhánh local; online/auth/upload cần backend được nghiệm thu. | Chia sẻ link mạch+code+board, sao chép, nhận xét, gửi lỗi, đính kèm có quyền truy cập và moderation. | Hai người dùng độc lập mở cùng phiên bản, phân quyền/attachment/quota/lỗi mạng có test. | 5, cần server |
| Có dữ liệu để quyết định cải tiến | Chưa có số liệu giữ chân đủ để kết luận. Dịch vụ analytics có phần triển khai riêng. | Thử người mới tự nguyện, đo hoàn thành hoạt động đầu, chỗ cần giúp, bài tiếp theo và quay lại làm việc có ý nghĩa. | Phân biệt click/Run với kết quả bài tập; thu thập tối thiểu theo lựa chọn người dùng. | local thử nghiệm, server ở đợt 5 |

## Thứ tự và phụ thuộc

1. Hoàn thiện chuỗi học local và entry/resume. Hai task MM-SW-LOCAL-LEARNING-001 và MM-SW-LOCAL-LEARNING-UI-001 sở hữu đúng scope của đợt này.
2. Dùng cùng activity/evidence để đưa gợi ý vào bài đang có, hoàn thiện cross-probe và metadata. Dữ liệu chân thiếu nguồn được thu thập trước khi mở khả năng tương ứng.
3. Nâng quan sát và debug theo một provider mỗi lần. Bắt đầu bằng bộ probe analog/logic hiện có, rồi mới mở rộng firmware/ngoại vi. Khi cần runtime hoặc mô hình chưa có, tách nghiên cứu với tiêu chí số.
4. Gắn kỹ năng thành mini-project và gói thực hành giáo viên. Xuất/import và hồ sơ dự án local giúp thử luồng khi chưa có server.
5. Nối sync/share/community/classroom và analytics trên server sau khi founder có Mini PC. Chuẩn bị interface/fixture có thể làm local; nghiệm thu online cần môi trường thật.

## Cách đánh giá mỗi đợt

- Trước sửa, chốt task/capability và snapshot trong queue. Giới hạn hai writer, paths không chồng.
- Test các hành vi có nguy cơ hồi quy, build:local và browser ở 375x812/1440x900. Independent review theo hash trước đóng task.
- Giữ bộ kiểm thử chuẩn và dữ liệu cũ. Nội dung hoặc topology không hỗ trợ phải cho kết quả chưa đánh giá được.
- Sau khi phần mềm đạt, thử với người mới để đo hiểu và thao tác. Thành công của unit/E2E là bằng chứng kỹ thuật cho đúng scope.

## Quyết định đã có

Guest/local-first. Trang bàn tự do khởi đầu trống. Board trong bài được chọn tường minh. CTA mobile và tên điều hướng theo quyết định founder hiện hành. Mở Bot ưu tiên nội dung và hướng dẫn cục bộ. Server đợi Mini PC. Không phát hành, cài dependency hoặc thao tác thiết bị từ một lần build local.

## Bằng chứng triển khai ngày 18/11/2026

Đợt 1 đã được kiểm chứng tại [báo cáo khóa nền tảng](../../agents/runs/MM-SW-LOCAL-LEARNING-001/report.md): 5 hoạt động có tiêu chí theo mô hình, quay lại đúng hoạt động, bảo vệ bản lưu cũ và xử lý xung đột. Typecheck và build local đạt; 716 unit test đạt; E2E toàn web 207 đạt, 1 analytics bị skip theo điều kiện môi trường server hiện có. Có 14 unit/SSR và 7 E2E mới cho khóa học, không skip ca mới. Không suy ra đã đóng các khoảng cách về firmware/peripheral, analog solver hoặc retention thực tế.

Đợt 2 được tách thành các lát cắt có nghiệm thu riêng, bắt đầu bằng [Mở Bot theo hoạt động đang học](2026-11-18-context-guide-design.md). Những phần tiếp theo vẫn theo thứ tự ở trên. Queue chuẩn giữ trạng thái hiện hành; đoạn này chỉ ghi bằng chứng đã có theo ngày.

Đợt 2a đã có [báo cáo và ảnh](../../agents/runs/MM-SW-LOCAL-GUIDE-001/report.md): Mở đọc activity/quan sát hiện hành, ghi loại bằng chứng, tái dùng gợi ý đã mở và đưa focus tới thao tác tiếp theo. Câu trả lời cũ bị xóa khi context đổi. Snapshot integration đã qua review độc lập, typecheck/build local, 723 unit và 25 E2E liên quan, không skip ở các lệnh cuối này. Đây là lát cắt OPS-06/EXP-05/EXP-07/LRN-02, chưa phải đóng toàn bộ đợt 2 hoặc toàn bộ năng lực tutor.

Tiếp theo ngày 18/11, [điều hướng chẩn đoán 2b](../../agents/runs/MM-SW-DIAGNOSTIC-NAV-001/report.md) và [finder khả năng board 2c](../../agents/runs/MM-SW-BOARD-CAPABILITIES-001/report.md) đã có review/ảnh: chọn lỗi để tìm đúng chân/dây/LED, và so sánh hỗ trợ bài/tọa độ chân/runtime riêng trước khi chọn board. Typecheck/build local đạt, 736 unit và 27 E2E liên quan đạt. Bổ sung anchor mới, probe/debug sâu hơn và mini-project/gói giáo viên còn theo các bước trên; không đánh dấu toàn bộ đợt 2 hoàn tất chỉ từ hai slice này.

## Nguồn

- [Audit và ảnh Mạch Mở](../../reviews/2026-11-16-web-user-audit/report.md)
- [Đợt sửa 16 finding](../../agents/runs/MM-SW-AUDIT-FIX-20261117/report.md)
- [Learn Arduino](https://learn-arduino-red.vercel.app/), [Learn ESP32](https://learn-esp32.vercel.app/), [Electronics 101](https://electronics-101-six.vercel.app/closed-loop)
- [Wokwi ESP32](https://docs.wokwi.com/guides/esp32), [Tinkercad](https://www.tinkercad.com/circuits)
- [EveryCircuit](https://everycircuit.com/), [KiCad](https://www.kicad.org/discover/schematic-capture/), [CircuitLab](https://www.circuitlab.com/)
- [OhStem](https://ohstem.vn/hoc-lap-trinh-robot-voi-xbot/), [MakeCode](https://arcade.makecode.com/identity/cloud-sync)
