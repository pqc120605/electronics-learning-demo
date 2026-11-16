# Kho kiến thức Mở Bot

16/11/2026 · MM-SW-GUIDE-KB-002

147mục catalog+18FAQ; tổng hợp board/linh kiện/workspace/bài/công cụ và nguồn; TB6612 có STBY/safetyNotes; unknown/conflict không bịa profile.

## Kiểm chứng

- typecheck exit0.
- npm.cmd test:680/680, exit0;52ca liên quan URL/board chạy lại sau sửa liên kết cuối, exit0.
- build:local exit0 (bản nội bộ).
- production-preview e2e toàn bộ:191/194, exit1; ba fixture/selector đã sửa, hai file liên quan chạy lại10/10 exit0 trên cùng bundle. Không tuyên bố194/194 trong một lượt. Dùng config kế thừa cổng5311 để giữ tiến trình khác ở5196. Không báo đã chạy lệnh chuẩn5196.
- Review độc lập:PASS, xem [review.md](review.md); hash source khớp snapshot đã review.

Lệnh/log/exitcode: [verification.json](verification.json). Bản quét đầu bị ngắt sau khi phát hiện hồi quy; kết quả source cũ không được dùng thay lượt cuối. Không thêm dependency, không deploy, không gọiClaude, không chạm hardware.

## Giới hạn

Truy hồi cục bộ hữu hạn, chưa có AI sinh;46mục chưa exact-product source,7board chưa simulation target. Chưa crawl kiểm độ mới URL; không đọc/upload code hay câu hỏi người dùng.

## SHA-256 file trong scope

| File | SHA-256 |
|---|---|
| docs/software/mo-bot-knowledge-coverage.md | 8128fb569bb76351a0ad095234262101ccaa47c92c81d325e41c313e224972d0 |
| e2e/guide-depth.spec.mjs | ad4188463cd8a3c309961bf25d56e6ebab0dca59e37bd87b78f0c97b79b70a80 |
| src/components/guide/Guide.css | 2ac7f95f05b9af0ac75729d9ab021bd3ff381b1994ecae2764b9e49391efc001 |
| src/components/guide/GuidePanel.tsx | 05ac1851d410e47ed75117d73a8bb7053b151ef2b35114f1d2e81e06a831e19c |
| src/lib/guideCatalog.ts | 583a8bad6e6433bbde7cc52a66510206843c07d3fbaf17409dd6d78752ac21d4 |
| src/lib/guideKnowledge.ts | 2fd45c619224ca9feb4a0f0e439125c1f48b46d46bf11b87133f3c0eda96433d |
| src/lib/guideSearch.ts | a852a1591b10d5033bdec45579b54647636c4635c8cbc4dbc0fe1dc382e4a13c |
| tests/guide-catalog.test.mjs | beb8dee5a327361178fa1b6d68147d79a3a0f18785efe5db689a23caf74d4948 |
| tests/guide-knowledge.test.mjs | fa85ead031cdb83fcf0b2db1d9ac53218aad920d3ee745f4e5573136835ad67c |
