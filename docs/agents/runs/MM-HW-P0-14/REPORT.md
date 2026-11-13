# P0-14 — kết quả nghiên cứu 3 AA / liên động thủ công

Ngày 10/11/2026. **Hoàn tất hồ sơ nghiên cứu của hướng B; chưa hoàn tất thiết kế phần cứng, B1 chưa sẵn sàng.** Box 02 và Box 03 đã trả kết quả trong chat chuyên môn; Box 08 đã review độc lập đúng snapshot. Lead là người duy nhất ghi và tích hợp hồ sơ. Không gọi Claude, không tạo schematic/CAD/FE/KiCad, không mua hoặc thao tác thiết bị.

Queue cuối phiên: `MM-HW-P0-14` = `done` chỉ cho đợt nghiên cứu; `MM-HW-P0-15` = `scoped` để giữ đầy đủ các việc thiết kế còn lại, chưa giao chạy. Không có agent hay builder nào đang chạy ngầm cho task kế tiếp. Không cần Founder chọn lại hướng B. Việc chốt đợt nghiên cứu không xóa bất kỳ thiếu sót kỹ thuật nào trong bảng dưới.

## Kết quả cụ thể

- Ghi nguyên văn lựa chọn B và giới hạn trong `docs/hardware/mobot-v2-p0-14-aa-founder-direction.json`.
- Hợp nhất một proposal `docs/hardware/mobot-v2-p0-14-aa-manual-interlock-proposal.md`, SHA256 `53f5f3bc95b6406ab58a623fc9924619c45889b677c200d5d659f530c71537c4`.
- Bỏ phích RUN USB riêng ở mức proposal: EXT5V/return và toàn I/O qua cầu captive cứng double-break. Không gán chân nguồn/GPIO. Cassette và mọi sense conductor phải rời trước khi cầu park và USBPC tiếp cận được.
- M3 bổ sung kiểm cổng USB rỗng, tách lực thăm dò khỏi đường100N về frame, giữ paddle chặn cắm lại trong chuyển tiếp. Chưa chứng minh geometry/strength bằng tên gọi cơ cấu.
- Tách nguồn boot B01 khỏi grant W/fresh-arm, tránh deadlock. Nêu rõ B01 do PC cấp vẫn có RF; không dùng khoảng hở I/O làm bằng chứng radio bị chặn.
- Tải và ghim6nguồn hãng: cellFDK, noticeđổi vật liệu, holderMPD, modulePololu/specs/reference, holderKeystone. Kiểm đúng PDF/HTML, bytes/SHA256; đọc và render trangFDK/MPD. Sửa thiếu sót contact R của holder trong advisory đầu.
- Tái lập budget điện và năng lượng dư có điều kiện. Không dùng nominalcell, hiệu suất typical hoặc100µF giả định thành cận phần cứng đã đạt.

## Review độc lập và disposition

Box08 turn `01a1c510-bcd8-7662-818f-0dadd9f1b796`, raw `BOX08-REVIEW.md`. Reviewer kiểm8/8hash packet và6/6nguồn local. Verdict: chất lượng nghiên cứu đạt; nhận topology/config và gate/B1 đều **insufficient_evidence**. Không có phê duyệt cổng/MPN/hash.

| Finding | Lead đối chiếu | Disposition và người xử lý |
|---|---|---|
| Cell monitor còn tới15mA sau cắt tải; restart loop | Có trong advisory02 và proposal§11, không được nhận làm mạch hoàn chỉnh | ACCEPT/OPEN cho thiết kế; Box02 phải cắt cả monitor, có current/time/default/startup bound trước nhận topology |
| Tap-open/bias/reverse/fuse-open/clamp | Counterexample4tap và candidate6sense còn lỗi đã ghi nguyên | ACCEPT/OPEN; Box02 cần nguồn/cận sai số, fault/current paths và phối hợp bảo vệ; không chuyển sang D10 |
| M3 partialplug/solidbind/commonframe | Box03 tự nêu chưa chứng minh, proposal§10 giữ nguyên | ACCEPT/OPEN; Box03 cần text/drawing-analysis phù hợp phạm vi được duyệt; không CAD/FE khi chưa có config/hash |
| Conductor bypass/trailingcontact/gap thật | Node BAT0…3 không đồng nghĩa4conductor; §11 cập nhật8dây thực ở candidateB | ACCEPT/OPEN; lead+điện+cơ phải khóa conductor matrix,2breakpoint/tolerance và power-entry delta trước nhận cấu hình |
| Cycle/fit/BOM | DF11 chỉ30cycle; chi phí và kích thước hợp nhất chưa có | ACCEPT/OPEN trước khóaBOM/config; ownerkit+lead, không bỏ externalcharger khỏi bộ |

Không finding nào được giả ghi resolved vì đã viết vào báo cáo. Đây là chốt kết quả một đợt nghiên cứu có review; các lỗi trên vẫn là công việc thiết kế thực còn lại, không phải task build đã hoàn thành.

Source spot-check sau snapshot ghi riêng `LEAD-SOURCE-CHECK.md`: TPS3700 timing18µs nằm cộtNOM, chưa làMAX; OPAx192 có miền nguồn toàn họ4,5–36V, bảng4,5–8V là điều kiện ứng dụng. Không sửa proposal/review bytes đang ghim; không thay kết luận thiết kế. Hai nguồnTI mới chỉ mởPDF hãng, chưa thêm vào6localpins.

## Công việc kế tiếp hữu hạn

1. **Box02 — source protection:** không lặp lại mạch4tap không openwire hoặc promote10amp/15mA. Cần một hướng khác có cận dòng sau trip, nguồn monitor/default startup, weakcell hữu hạn, tap fault và fuse/reverse; nguồn linh kiện phải ghim. Không có thêmGPIO. Nếu không tồn tại solution đáp ứng, trả tradeoff sản phẩm cụ thể kèm cost/fault, không tự bỏ nghĩa vụ.
2. **Box03 — manual interlock:** khép corridor của partialplug, independent dock/stop/coupling,2gap thật/terminalretention và conductor matrix. Giữ100N/200N yêu cầu cũ, không gọi allocation kích thước là strength proof. Chưa mởCAD/FE.
3. **Kit/lead:** mục tiêu cyclePROGRAM, holder có taps thật, charger3cell độc lập, outputrating5V/module, fit và toànBOM robot+taycầm dưới1triệu. Giá hãngUS$9,95 chỉ benchmark, không landedVND.
4. **Sau bằng chứng:** cập nhật đề xuất cấu hình/gate migration, review đúnghash rồi mới xin Founder duyệt exactbytes. Không hỏi chọn B lại. Không sửa livegates hoặc validatorallowlist để bỏ qua thiếu thiết kế.

## Kiểm chứng và phạm vi

| Lệnh / kiểm | Kết quả |
|---|---|
| `python -X utf8 docs/agents/runs/MM-HW-P0-14/check-evidence.py` | exit0;6sourcehash/bytes khớp, đại số điều kiện tái lập, r12khôngđổi |
| `node D:/StartupOS/docs/agents/validate.mjs` | exit 0; trước chốt có 60 task; sau ghi task kế tiếp có 61 task, 143 capability, errors=[], warnings=[] |
| Box08 kiểmmanifest |8/8tệp khớp, hashproposal đầu/cuối khôngđổi |
| Frontend/typecheck/e2e |NOT_RUN: không thay source/app |
| Điện/cơ/RF/thermal/device |NOT_RUN: không mẫu, không được cấp điện hoặc build |

Lần trích PDF đầu gặp lỗi encoding consoleWindows; chạy lại bằng `python -X utf8` đã đọc được. Đây không phải lỗi dữ liệu hay phép đo hardware. `git status` không dùng được do parentrepository không truy cập theo cấu hình hiện tại; chứng cứ là exactfilehash, manifest và kiểmqueue, không claimcleanGit.

r12 vẫn `proposed`, approved_by=null, approved_sha256=null, hash `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`; bốn cổng trước schematic vẫn OPEN, 14 verification items giữ nguyên. Không có lease B1 hoặc r13. Xem `queue-close-result.json` và `final-checks.json` để đối chiếu trạng thái và kiểm tra cuối phiên.
