# QA độc lập — P0-11

Reviewer `p011_qa`, GPT-6.1 Sol Medium, đã trả kết quả và recheck sau hai lựa chọn Founder. Lead ghi lại; đây không phải phê duyệt gate thiết kế.

Verdict: hồ sơ phù hợp như proposal có điều kiện; không có phát hiện safety trọng yếu mới trong phạm vi đã đọc. Chưa xác minh đúng thiết kế điện/cơ hoặc hiện vật.

- Đã chạy lại script chỉ đọc; stdout JSON khớp calculations.json.
- Timing H3 với K mới 55,922051µs và guard1mV còn51,733589µs đúng mô hình. Các sai số thiếu vẫn được nêu.
- Finding Medium về qualifier: 100ms là MIN, không phảiMAX. Đã sửa caveat ngay cạnh phép tính và thêm proposal100–250ms; tổng điều kiện2,973167498s, còn1,026832502s, chưa có component/MAX chain chứng minh.
- G-B đúng16chân theo hướng; không bỏ sensor/veto/protection/E-channel.
- M-A phân biệt precommit blocking và postcommit giữOFF; clearance0,25mm và separation0,596575mm chỉ là giả thiết/tính toán, không geometry đã chứng minh.
- NguồnADR45 chỉ đọcweb, hai downloadtimeout, không có localbytes/hash; hai nguồnTI mới có PDF/hash.
- r12 và các cổng giữ nguyên; khôngapproved/hash/lease/CAD/FE/physical.
- Finding Low về câu “cầnFounderchọn” đã được lead sửa thành “Founderđãchấpnhậnđểphântíchtiếp”; không đổi số hoặc thiết kế.

Snapshot reviewed before wording-only correction: script8f62c6aa…fae3c0;resultsbc415a55…1a26ca;selectedcontractc2202297…a511c0;Founderrecord014e35bb…5e5506. Hash đầy đủ của snapshot cuối nằm trong packet-snapshot.json; wording-only sửa không được quảng bá thành review kỹ thuật bổ sung.
