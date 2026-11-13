# P0-02 — review packet Box 08 — 08/11/2026

## Mục tiêu

Review độc lập hai handoff mới của 02/03 và xác định điều kiện đóng thực tế của P0-02. Founder đã yêu cầu tiếp tục phần cứng và chuyển agent sang Sol; không có phê duyệt hash mới. Giữ D10, D15(a), D16(c), Q2-OFF và mọi quyền thao tác vật lý hiện hành.

Snapshot file-hashes: `.tmp/agent-checks/P0-02-resume-2026-11-08/review-snapshot.json` trong checkout sản phẩm. Không sửa proposal trong vòng review này.

## Phạm vi đọc (10 file)

1. `docs/mission-control/hardware-config-mobot-v2-typec-r8-handset.json`
2. `docs/mission-control/hardware-config-mobot-v2-typec-r8-robot.json`
3. `docs/hardware/mobot-v2-p0-02-box02-2026-11-08.md`
4. `docs/hardware/mobot-v2-p0-02-box03-2026-11-08.md`
5. `docs/hardware/mobot-v2-config-r8-notes.md`
6. `docs/hardware/mobot-v2-founder-decision-q1-q8.md`
7. `docs/hardware/mobot-v2-founder-decision-d15-d16.md`
8. `docs/hardware/mobot-v2-founder-decision-q2-off.md`
9. `docs/hardware/mobot-v2-r8-handset-off-release-review.md`
10. Packet này.

## Câu hỏi cần phân xử

- Xác minh các sửa sai MCP73833 PG/timer, UVLO hai cầu chia, robot RICHGSET, PS/SYNC và cửa sổ TLV6700 bằng nguồn hãng; chỉ rõ đâu là phép tính được chấp nhận, đâu còn điều kiện chưa chứng minh.
- Phần giao diện/stackup nào có thể đóng trên giấy; thiếu bằng chứng nào cụ thể để đóng các blocker còn lại? Đừng yêu cầu lại bằng chứng đo thuộc D10 chỉ để duyệt proposal; cũng không chuyển điều kiện thiết kế ngoài D10 thành phép đo sau PCB.
- Phân biệt cổng trước duyệt cấu hình, trước schematic, trước layout, trước cấp điện và trước chế tạo. Nếu quyết định hiện hành tạo một phụ thuộc không thể đáp ứng trước PCB, chỉ rõ phụ thuộc và phương án thay đổi phạm vi cần Founder quyết định; không tự mở rộng D10.
- Verification items hiện còn OPEN về cận định lượng và người vận hành: xác định điều kiện nào buộc đóng trước hash, điều kiện nào buộc đóng trước layout theo đúng biên bản đã ký.
- P0-02 có đạt yêu cầu `blocking_unknowns=[]` chưa? Nếu chưa, trả danh sách tối thiểu đầu vào bắt buộc và một gói quyết định cụ thể để Founder giải quyết, thay vì chỉ yêu cầu 'thêm hồ sơ'.

## Thay đổi đã thực hiện

Chỉ thêm hồ sơ tiếp tục và handoff, sửa ghi chú để trỏ đúng hai proposal đã tách. Cả hai proposal vẫn `proposed`, hash giữ nguyên. Không pin assignment, schematic, KiCad, CAD, firmware, mua hàng, liên hệ nhà bán, bench hoặc flash. Chưa có kết quả đo mới.

## Đầu ra mong muốn

Verdict đối với việc đóng P0-02; finding có nguồn và độ nghiêm trọng; bảng gate theo mốc; delta tối thiểu được phép tích hợp; câu hỏi Founder nếu cần. Reviewer chỉ đọc, không sửa file/queue/config, không agent con, không Claude. HQ ghi biên bản và trạng thái sau khi đối chiếu kết quả.
