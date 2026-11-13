# MM-UX-001 — Independent design review

Source: chat08 final turn `01a1aa79-d502-7f01-a138-34aa7606591f`. HQ checked the seven SHA-256 values below against fresh file bytes. This is a design review. Browser verification belongs to the implementation task.

**PASS cho thiết kế MM-UX-001 và lease SE giới hạn ở hành trình thư viện với workspace chính `/build`.** Native `qa_safety_reviewer` đối chiếu handoff với MM-CONTRACT-001 và source, không thấy mâu thuẫn trong quy tắc định danh. Tạo mục thư viện giữ `P`, cập nhật chỉ ghi đúng `L`, và fork tường minh cấp cả hai ID mới. Giữ nguyên `P` khi dữ liệu cũ có `P === L` hoặc bundle thiếu `P`. [MM-CONTRACT-001](/D:/StartupOS/docs/agents/runs/MM-CONTRACT-001/contract.md:35)

Hai điều kiện HQ cần ghi vào lease:

- **Giới hạn acceptance ở `/build`.** Guided Builder dùng key riêng trong `sessionStorage`, nhưng handler nhập hiện ghi vào các key của workspace chính. Nếu đưa guided vào lease, xác định store đích và kiểm tra nhập, hủy, lỗi ghi đều giữ nguyên workspace chính. [CircuitBuilderPage.tsx](/D:/StartupOS/electronics-learning-demo/src/pages/CircuitBuilderPage.tsx:705)
- **Tách gate định danh khỏi gate độ bền và khôi phục.** Nếu lease nghiệm thu thông báo lưu, đưa `BuilderToolbar.tsx` và kết quả ghi của từng phần bản nháp vào cùng phạm vi. Toolbar hiện có thể báo đã lưu khi dữ liệu chỉ ở bộ nhớ tạm hoặc mới ghi được một phần. Luồng khôi phục cũng cần giữ cả bản nguồn lẫn bản nháp vừa được bảo vệ. [BuilderToolbar.tsx](/D:/StartupOS/electronics-learning-demo/src/components/builder/BuilderToolbar.tsx:29) · [Recovery](/D:/StartupOS/electronics-learning-demo/src/pages/CircuitBuilderPage.tsx:721)

Ca bàn giao SE/TST:

- Chạy hai đường nhập qua lưu, mở, reload, sửa, cập nhật và xuất. Dùng hai `L` cùng `P`, `P` trùng `L` của mục khác, legacy `P === L`, bundle thiếu `P`, bản nháp thiếu `L` và nhãn thư viện khác tên tài liệu. Với vòng không chỉnh sửa, chỉ bỏ qua `exportedAt` khi so bundle. Giữ đủ code và bản nháp xung đột, kể cả chuỗi rỗng.
- Xóa mục đang mở rồi cập nhật, thử tên trùng sau trim và giới hạn 80 ký tự, fork và lỗi quota. Xác minh chỉ mục đích nhận revision mới, fork cấp hai ID mới, và lỗi ghi giữ bản đã lưu cùng bản nháp đang sửa.
- Hủy khi tệp còn đang đọc, kiểm tra focus sau hủy và sau mở, lỗi tên/lỗi ghi qua bàn phím, thông báo autosave và bố cục ở 320 px hoặc zoom 200%. Gate khôi phục cần thêm ca lỗi giữa các lần ghi, rollback thất bại và storage fallback.

Snapshot thiết kế là final message `msg_08a9ae08de392249016aec24e75e5c87d080cb2d24fd413dab` trong chat `01a1a856-f10d-7d93-9684-5be471523aa6`. SHA-256 reviewer đọc mới và tôi đối chiếu lại:

| File | SHA-256 |
|---|---|
| [contract.md](/D:/StartupOS/docs/agents/runs/MM-CONTRACT-001/contract.md) | `92b491ca5cd455d71f562f34cbecd4e55daae747f4021ca6c7faee38f7434ea9` |
| [savedProjects.ts](/D:/StartupOS/electronics-learning-demo/src/lib/savedProjects.ts) | `7a4c5650e93fb1cc01bbf257e27d83894d76ac32684014b319e8fd3ce87ed279` |
| [workspaceStorage.ts](/D:/StartupOS/electronics-learning-demo/src/lib/workspaceStorage.ts) | `5c7dd3107bc45333ffd6c57b52035d1d1bf0b5ed145bbadb63c8cf2956e0ddf7` |
| [projectBundle.ts](/D:/StartupOS/electronics-learning-demo/src/lib/projectBundle.ts) | `90ef63294a905d72d2d0ff4258eba8951bb5cbc91fa05772d09e279396bea7cc` |
| [CircuitBuilderPage.tsx](/D:/StartupOS/electronics-learning-demo/src/pages/CircuitBuilderPage.tsx) | `069e0c4068ebea450d392e8a2e8cbc6a4ad29c7e1fe04d55d3170338c12cc15b` |
| [ProjectsPage.tsx](/D:/StartupOS/electronics-learning-demo/src/pages/ProjectsPage.tsx) | `0be0cbc67130d016c00f9c81fa07f189318aacef97fa77bc5d5ed53f4326eabe` |
| [BuilderToolbar.tsx](/D:/StartupOS/electronics-learning-demo/src/components/builder/BuilderToolbar.tsx) | `6fe6527923f5f8f7b05a68094998e6cc5a3577ba8e3c5d63c0aea951bf457bfd` |

Verdict áp dụng cho thiết kế. Kiểm thử runtime và nghiệm thu codec, khôi phục dữ liệu vẫn chờ triển khai.
