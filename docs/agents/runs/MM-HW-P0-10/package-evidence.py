from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parents[4]; run=root/'docs/agents/runs/MM-HW-P0-10'
old=Path('D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
# Revision identifiers are read from the downloaded PDF cover, not invented.
sources=json.loads((root/'docs/research/downloads/c11-r12/sources.json').read_text(encoding='utf-8'))
index='# Nguồn ghim C11/r12\n\nTruy cập2026-11-10. PDF công khai từ hãng; không thực thi nội dung tải. Revision/document ID đọc từ cover_text trong sources.json và ảnh p1. Hash dưới đây ghim đúng bytes, symlink hãng có thể đổi sau này.\n\n| Part | Document ID/revision/date từ cover | SHA-256 | PDF |\n|---|---|---|---|\n'
for r in sources:
    cover=r.get('cover_text','')
    ids=re.findall(r'(?:SLUS|SBVS|SNVS|SCDS|SLVS|SCES|SBOS|SLPS)[A-Z0-9]+',cover)
    lines=[x for x in cover.splitlines() if any(i in x for i in ids)]
    index+=f"|{r['part']}|{' / '.join(lines) if lines else 'Xem cover PDF, chưa gán revision'}|{r.get('sha256','NOT_RUN')}|[{r['part']}]({r.get('url')})|\n"
index+='\nẢnh trang: sources.json → page_images (path và hash từng ảnh). Text trích xuất là bản trợ đọc; kiểm bảng qua ảnh/PDF. Bảng số liệu/điều kiện và trang áp dụng nằm trong mobot-v2-c11-electrical-consolidation.md. Một PDF được ghim không đồng nghĩa mọi số/timing ứng dụng đã được chứng minh.\n\nNguồn cơ khí: mechanical-sources.json ghim HTML SSAB, HTML Adafruit và PDF Takaha; revision HTML không công bố, thời điểm tải là mốc. E/ν/S–N chưa có nguồn áp dụng, giữ giả thiết/TBD.\n'
(run/'source-index.md').write_text(index,encoding='utf-8')
reissued=run/'reissued';reissued.mkdir(exist_ok=True)
for name in ['box08-mechanical-review.md','box08-final-checkpoint-review.md','box08-charger-candidate-review.md']:
    original=old/name
    txt=original.read_text(encoding='utf-8-sig')
    # Retain reviewer text as explicitly historical quotation, not refreshed reviewer verdict.
    txt=txt.replace('dbа9ae','dba9ae')
    for pattern in ['**PASS','Verdict: PASS','`PASS`']:
        txt=txt.replace(pattern,pattern.replace('PASS','HISTORICAL_ACCEPTANCE_WITHDRAWN'))
    if name=='box08-mechanical-review.md':
        correction='C11 sửa5/5: danh sách gốc chỉ có4 advisory hashes. Hash ASCII hiện tại của4 đầu vào ở bảng dưới. Review cũ không bao hình học canonical lớn; không tái ký verdict cho r12.'
        inputs=['box03-cassette-advisory.md','box03-cassette-supplement.md','box01-cassette-review.md','box09-actuator-shortlist.md','box03-direct-return-geometry.md']
    elif name=='box08-final-checkpoint-review.md':
        correction='Founder đã chốt cách ly toàn bộ I/O trong CHARGE/PROGRAM. BQ25170 không I2C là candidate đã chấp nhận; câu hỏi bus và budget11 cũ superseded. Đây là hiệu đính của lead, chưa phải Box08 review snapshot mới.'
        inputs=['box02-crossings-and-ti-request.md','box03-fit-and-rfq-spec.md','box03-direct-return-geometry.md']
    else:
        correction='Bỏ nhãn chấp nhận candidate như kết luận thiết kế. BQ25170 family được Founder chấp nhận hướng, chưa suffix/MPN/setpoint; H3 trip/MAX fault chain chưa đủ. Không có PASS hiện hành hoặc review nguồn mới của Box08.'
        inputs=['box03-direct-return-geometry.md','box02-hardware-configured-charger-candidates.md']
    header=f'# Bản hiệu đính lead — {name}\n\n{correction}\n\nOriginal SHA256 ASCII: `{sha(original)}`. Bản gốc được giữ nguyên. Các hash bên dưới là input thực tế hiện tại, không suy độc lập review mới.\n\n'
    header+='\n'.join(f'- {p}: `{sha(old/p)}`' for p in inputs)+'\n\n## Nội dung lịch sử (mọi nhãn chấp nhận trong trích dẫn đều hết hiệu lực cho r12)\n\n'
    (reissued/name).write_text(header+txt,encoding='utf-8')
lines=['# Supersession map C11\n','Canonical electrical: docs/hardware/mobot-v2-c11-electrical-consolidation.md; canonical mechanical: docs/hardware/mobot-v2-c11-mechanical-canonical.md. Old artifact/review bytes are immutable history; none is an exact-snapshot approval of r12.\n']
for n in ['calculate.py','box03-direct-return-geometry.md','box03-direct-return-proposal.md','box03-cassette-advisory.md','box03-cassette-supplement.md','box09-actuator-shortlist.md','box03-fit-and-rfq-spec.md','box02-crossings-and-ti-request.md','box08-direction-review.md']:
    lines.append(f'- `{n}` SHA256 `{sha(old/n)}`: conflicting geometry, old pulse/role/charger calculations or old review superseded by new canonical documents for this packet; original retained.\n')
(run/'SUPERSESSION.md').write_text('\n'.join(lines),encoding='utf-8')
