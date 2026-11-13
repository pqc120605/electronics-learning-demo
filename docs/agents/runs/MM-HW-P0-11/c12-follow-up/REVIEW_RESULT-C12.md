REVIEW_RESULT · P0-10 (C11 r12) + P0-11 (H3/OFF/G-B/M-A) · 10/11/2026 · Leader Claude
Trả lời hai request: R-20261110-C11-R12-01 (reply_to R-20261109-C11) và R-20261110-P0-11-01. Relay trả lời: R-20261110-C12.

Đối tượng:

Cấu hình docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json SHA256 8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b (proposed, chưa duyệt).
Manifest P0-10 docs/agents/runs/MM-HW-P0-10/packet-snapshot.json a7a444ca…f4f89 (242 file); manifest P0-11 docs/agents/runs/MM-HW-P0-11/packet-snapshot.json 88cbefe0…a6da (42 file).
Kết luận
Hai gói đạt mức "hồ sơ có điều kiện, trung thực": số học và hash đúng, nguồn TI đối chiếu được, không có PASS nào bị gán nhầm. Cả bốn cổng vẫn insufficient_evidence, giữ OPEN; B1 vẫn NOT_READY.

Điểm quan trọng nhất: biên H3 còn 2,17 mV là biên trước hysteresis. Hysteresis của TLV3201 chỉ có giá trị TYP 1,2 mV; trừ vào thì còn 0,20 mV (F1). Không nên duyệt hash r12: P0-11 đề xuất các giá trị khác r12 (K mới, hành trình 0,90 mm, qualifier 100–250 ms) nên r13 sẽ đổi hash (O1).

Đã kiểm (kết quả)
sha256sum hai manifest: khớp hash trong request.
Tính lại SHA256 từng file trong manifest bằng node: P0-11 42/42 khớp; P0-10 241/242 khớp, file lệch duy nhất là D:/StartupOS/docs/agents/tasks.json (queue đã thêm P0-11). Đúng như báo cáo tổng hợp.
9 hash tệp chính trong request P0-10 (r12, quyết định founder, hai hồ sơ C11, founder-input.json, DISPOSITION, calculate.py, calculations.json, REPORT): 16 ký tự đầu của cả 9 khớp sha256sum.
r12: status=proposed, 14 verification items đều NOT_RUN, 7 cổng OPEN (6 milestone_gates + 1 external_design_gates) + câu hỏi mở JAUCH-UL-STATUS. Hash r12 trùng tasks.json dòng 8829, approved_by/approved_sha256 = null. r12 không còn chuỗi 59.060915; 0.80 vẫn có trong r12 (P0-11 đề xuất 0,90 nhưng chưa sửa r12).
node D:/StartupOS/docs/agents/validate.mjs: 57 task, 143 capability, errors=[], warnings=[] (exit 0). node --test validate.test.mjs: 61/61 pass.
Tự tính lại bằng node từ số trong hồ sơ, mọi số khớp calculations.json: Kmin 1,638288485 / Kmax 1,638671573; trip partial 4,085393–4,107010 V (không shift) và 4,084573–4,107830 V (shift 200 ppm); biên 2,993/2,990 mV và 2,173/2,170 mV; REF33 4,0962×(0,15% + 30 ppm×165) = 26,42049 mV; CV 4,0176–4,0824 V, cửa sổ tới 4,110 V = 27,6 mV; Ipeak 2,387511478 A; yêu cầu cắt 55,922051 µs và 51,733589 µs (guard 1 mV); RUN_OUT 2,703167 s; JOY 22 kΩ 0,614074 s; tổng với qualifier 250 ms 2,973167 s, còn 1,026833 s; dòng 53,701 µA tại 4 s; separation 0,8 mm@5° = 0,496956 mm, 0,9 mm@5° = 0,596575 mm; clearance 0,50−0,15−0,05−0,05 = 0,25 mm; đếm GPIO 15/16/17.
Đối chiếu PDF cục bộ (docs/research/downloads/c11-r12/): BQ25170 VREG_ACC ±0,8% (−40…125 °C) → 4,05 V ±32,4 mV khớp cửa sổ CV; REF33 initial ±0,15%, drift 30 ppm/°C; TLV3201 tr.5 (đọc ảnh trang): offset 4 mV toàn nhiệt, bias 5 nA toàn nhiệt, hysteresis 1,2 mV chỉ cột TYP, không có MAX, CMRR MIN 60 dB, PSRR MIN 65 dB; TPS3430 tr.6 MAX 12,65 ms (CWD=10 k, SET0=SET1=1); TPS3808 tr.7 reset delay CT=open 12/20/28 ms.
Pool GPIO 16 = 5 baseline + 9 output-capable (4/13/18/19/21/22/23/26/27) + 2 input-only (36/39): khớp mobot-v2-p0-07-mcu-design-packet.md dòng 9 và mobot-v2-c11-electrical-consolidation.md dòng 74. G-B: 5+4+2+1+4 = 16.
Receipt founder P0-11 (mobot-v2-p0-11-founder-directions.json): G-B và M-A có nguyên văn, not_approved ghi rõ hash/MPN/CAD/lease; hash r12 nêu đúng.
Không kiểm
ADR45 Rev G (200 ppm initial, 330 ppm drift, 120 ppm line, solder shift): không có PDF cục bộ; tôi không xác nhận các số này. Khoảng trip "proposal chính xác hơn" dựa vào chúng.
SSAB 355 MPa cho dải 6,01–16 mm, mọi tính cơ khí tĩnh/tiếp xúc, hai khảo sát TPS22919/TPS22990: không đối chiếu nguồn. Hệ số ma sát 0,003 chỉ là ví dụ độ nhạy.
TMUX1511 SCDS390B tr.6, các trang khác của TPS3430/3808, TLV3201 CMRR/PSRR toàn nhiệt: không đọc ngoài điểm nêu trên.
Nguyên văn các receipt P0-10 ngoài năm mục đầu của founder-input.json (đã thấy W, RETENTION, DIRECT_RETURN, MANUAL_RELEASE, IO_ISOLATION); không đọc hết 242 file/ảnh nguồn.
Không có CAD/FE/bench; không đánh giá tính đúng thiết kế điện/cơ (chỉ kiểm số học và đối chiếu nguồn). Không đọc lại reissued/*.md hay toàn văn hai hồ sơ C11.
Verdict từng cổng (đều giữ OPEN)
Cổng	Verdict	Vì sao
D17-H3-CV-PROTECTION	insufficient_evidence	Window 27,6 mV là số đúng; nhưng biên sau hysteresis TYP chỉ 0,20–1,19 mV, hysteresis MAX, CMRR/PSRR toàn nhiệt, aging, ripple, topology năng lượng đều TBD (F1). Nguồn ADR45 chưa ghim (F3).
D17-OFF-DESIGN	insufficient_evidence	Mô hình RC/KCL đúng, qualifier 100 ms được sửa thành MIN; nhưng MAX toàn tuyến, ma trận mixed-bias, ngân sách dòng bleed (F5) và 1,027 s còn lại chưa có bound.
D17-ACTUATOR-PRODUCT	insufficient_evidence	Gói không thêm bằng chứng actuator (net force MIN, Rmin lạnh, duty, năng lượng); chỉ M-A và clearance giả định.
MCU-RESET-VETO-RESOURCES	insufficient_evidence	Đếm 16/16 khớp, nhưng không còn chân dự phòng, chưa có bảng reset-state/domain từng chân, chưa gán chân (F2).
Ba cổng mốc muộn (D17-B01-TRACEABILITY, D15B-FAB-LAYOUT, D17-OFF-ASSEMBLY) không thuộc phạm vi gói này; tôi không xét.

Findings
F1 · Medium · Biên H3 2,17 mV là trước hysteresis; với hysteresis TYP chỉ còn 0,20 mV. Evidence: TLV3201 SBOS561C tr.5 (ảnh): hysteresis 1,2 mV, cột TYP, không có MAX. Tính lại: biên thấp 2,173 mV. Nếu hysteresis cộng toàn phần ở phía trip, ×K_max 1,6387 = 1,97 mV → còn 0,204 mV; nếu chia đôi → 1,19 mV. mobot-v2-p0-11-h3-off-analysis.md có nêu "hysteresis 1,2 mV là TYP" và "thiếu hysteresis MAX", nhưng bảng "biên còn lại mỗi phía 2,17 mV" không trừ nó. Impact: cửa sổ 27,6 mV bị cutoff 56 µs ép cố định; detector này không còn chỗ cho hysteresis MAX, aging, ripple, ground error cùng lúc. Khó đóng cổng nếu giữ yêu cầu như hiện nay. Đòn bẩy bằng số (từ chính mô hình): mỗi 1 mV nâng trip MAX lấy đi C/Ipeak = 10 mF / 2,3875 A = 4,19 µs thời gian cắt; tăng gấp đôi Cmin thì gấp đôi ngân sách thời gian. Nâng trip MAX 4,110 → 4,120 V thì cần cắt ≤ ~14 µs. Fix tối thiểu: ghi bảng biên theo hai cột "trước/sau hysteresis TYP"; đặt hysteresis MAX là yêu cầu cho comparator thay thế (hoặc chọn comparator có hysteresis MAX). Nếu không có linh kiện đạt, đưa câu hỏi đánh đổi (trip MAX / Cmin / thời gian cắt) cho founder bằng số.

F2 · Medium · G-B không còn chân dự phòng, trong khi hướng founder đã chọn cho veto là "dùng chân rảnh". Evidence: 16/16 chân bảo đảm (P0-07 packet dòng 9; consolidation dòng 74); mobot-v2-p0-11-selected-interface-contract.md: "Không còn spare ở cận này". Hướng founder 09/11: veto MCU bằng chốt/logic phần cứng dùng chân rảnh của tay cầm. Pool gồm GPIO13 (JTAG) và GPIO4 (pull-down nội); hợp đồng MCU ghi GPIO16/17/18/19/23 At Reset oe=0, ie=0, nên mặc định RUN/FRESH_ARM/WDI/RELEASE trong reset phải do mạch ngoài. E1–E4 được tính là 4 output nhưng hướng/đầu nối chưa chọn. Impact: mọi tín hiệu MCU nhìn thấy thêm (kể cả sửa interface ở OFF-01) vượt pool; pool dựa trên clone DevKit V1 30 chân chưa kiểm continuity. Fix tối thiểu: bảng 16 vai × 11 chân pool (UNASSIGNED) kèm trạng thái At Reset/After Reset, ràng buộc boot/JTAG, miền điện; ghi quy tắc "tín hiệu mới ⇒ bỏ E-channel hoặc đổi module"; làm rõ veto dùng chân nào nếu không còn dự phòng.

F3 · Medium · Mọi số reference của proposal H3 chưa có nguồn cục bộ. Evidence: h3-off-analysis.md ghi tải PDF ADR45 hai lần timeout, chưa ghim; 200/330/120/1,2 ppm (651,2 ppm) và allowance 200 ppm solder shift đến từ đó hoặc là giả định. Tôi chỉ xác nhận được REF33, TLV3201, BQ25170, TPS3430, TPS3808. Impact: khoảng trip 4,0846–4,1078 V không tái lập được trên đúng bytes. Fix tối thiểu: đưa PDF ADR45 vào docs/research/downloads/p0-11/ kèm hash (founder tải được thì chuyển cho Codex); trước đó ghi các số này "giả định chưa kiểm" trong bảng. Báo cáo đã nêu thẳng; finding chỉ ghi mức ảnh hưởng.

F4 · Low · Manifest P0-10 ghim tasks.json là queue sống. Evidence: 241/242 khớp, tasks.json đã đổi vì thêm P0-11. Báo cáo tổng hợp nêu đúng. Impact: manifest không bao giờ còn "242/242"; dễ bị đọc nhầm là sai. Fix tối thiểu: loại queue khỏi manifest, hoặc ghim một bản trích các dòng task liên quan kèm hash.

F5 · Low · Ngân sách dòng bleed chưa tính lại. Evidence: hai bleed JOY 22 kΩ ở 3,3 V = 0,300 mA (hồ sơ đã nêu, "chưa tính lại toàn ngân sách r12"). Hai bleed RUN_OUT 10 kΩ ở 5,25 V = 2 × 0,525 mA = 1,05 mA nếu luôn nối; hồ sơ không nêu con số này. Impact: nếu bleed luôn nối, tải thường trực có thể vượt ngân sách dòng nhàn rỗi hoặc ép đổi giá trị. Fix tối thiểu: ghi rõ bleed luôn nối hay chỉ khi OFF, và cập nhật bảng ngân sách trước r13.

Quan sát
O1 · Không duyệt hash r12. P0-11 đề xuất ≥ 3 giá trị khác r12 (cutoff 55,92 µs thay vì 59,06; hành trình 0,90 mm thay vì 0,80; qualifier 100–250 ms, 100 ms chỉ là MIN). Duyệt r12 bây giờ sẽ phải duyệt lại ở r13 (CONFIG-01). Giữ khuyến nghị: duyệt một lần, kèm câu "duyệt hash này không đóng gate nào".
O2 · 0,80 mm@5° thiếu 3,04 µm so với 0,50 mm yêu cầu (không phải "thiếu hẳn"); 0,85 mm đã dương 0,047 mm. Hướng 0,90 mm hợp lý; loss 0,30 mm phải tránh tính góc hai lần (hồ sơ đã nêu).
O3 · Receipt P0-10 thiếu message ID (source_message_id: null); hồ sơ nêu rõ, không dựng ID. Nhận như đã xử lý F8 C11 ở mức hồ sơ.
O4 · Queue ghi MM-HW-GATE-PREFLIGHT-001 = scoped, -002 = waiting, trong khi dispatch-sequence ghi cả hai đã có review (C03, C08). Chưa rõ nguyên nhân; xem câu hỏi 3.
Phân xử C11 F1–F9 (tư vấn; Box 08 mới là bên độc lập cuối)
Finding	Ý kiến	Ghi chú
F1 High H3	Đồng ý ACCEPT/DEFER	Số 27,6 mV và 59,06→55,92 µs tính lại đúng; vẫn mở, xem F1/F3 mới
F2 High BQ25170	Đã xử lý ở mức quyết định	Founder chấp nhận ứng viên (không phải MPN/suffix/BOM); VREG ±0,8% khớp PDF
F3 High cơ khí	Đồng ý DEFER	CAD/FE NOT_RUN; không có bằng chứng mới
F4 Medium geometry	Đã xử lý ở mức hồ sơ	0,80/0,90 tách thành proposal, chưa sửa r12
F5 Medium vật liệu	Không kiểm	355 MPa cho 6,01–16 mm chưa mở nguồn
F6 Medium GPIO	Đã xử lý ở mức hồ sơ	Đếm 16/16 khớp; xem F2 mới
F7 Medium hash/review	Đã xử lý ở mức tôi kiểm	241/242 và 42/42 khớp
F8 Medium receipt	Chấp nhận có điều kiện	Verbatim có; thiếu message ID nêu thẳng
F9 Low	Chấp nhận	2,387511478 A tính lại đúng
Câu hỏi
(Codex/Sol) Hysteresis MAX của comparator thay thế là gì? Có phương án nào nằm trong cửa sổ 27,6 mV, hay phải đổi một trong trip MAX, Cmin, thời gian cắt?
(Codex/Sol) Bleed RUN_OUT/JOY luôn nối hay chỉ khi OFF? Con số ngân sách dòng nào thay đổi?
(Luna/Codex) Vì sao queue ghi MM-HW-GATE-PREFLIGHT-001 = scoped và -002 = waiting trong khi dispatch-sequence ghi cả hai đã có review?
(Founder) Có tải được PDF ADR45 Rev G từ máy của bạn không?
# RELAY CLAUDE → CODEX

relay_id: R-20261110-C12
reply_to: R-20261110-C11-R12-01, R-20261110-P0-11-01
type: REVIEW_RESULT
scope: review tư vấn P0-10 + P0-11; không đóng cổng, không duyệt hash/MPN/lease
configuration: MOBOT-V2-CONFIG-r12-HANDSET
configuration_sha256: 8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b
verdict: gói đạt mức hồ sơ có điều kiện; cả bốn cổng insufficient_evidence, vẫn OPEN; B1 NOT_READY
findings: F1 Medium (biên H3 sau hysteresis TYP còn 0,20 mV), F2 Medium (G-B hết chân dự phòng), F3 Medium (ADR45 chưa ghim), F4 Low, F5 Low
kiểm: manifest P0-11 42/42, P0-10 241/242 (chỉ tasks.json lệch), validate exit 0 (57 task), test 61/61, mọi số tính lại khớp
không kiểm: ADR45, SSAB/cơ khí, CAD/FE/bench, nguyên văn mọi receipt P0-10
việc tiếp: hysteresis MAX và biên H3 theo hai cột; bảng 16 vai × pool; PDF ADR45; r13 gom mọi giá trị đã chấp nhận rồi review đúng bytes trước khi xin duyệt hash