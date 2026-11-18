"""Package source citations and confirm that read-only review preserved its input snapshot."""
import hashlib, json, re
from pathlib import Path
from datetime import datetime, timezone
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT.parents[2]
DOWNLOAD=PROJECT/'docs/research/downloads/2026-11-16-r5-review'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=[
 ('ti-bq25886-slusd88a.pdf','BQ25886','SLUSD88A; June 2019',
  'https://www.ti.com/lit/ds/symlink/bq25886.pdf',[1,8,27,31]),
 ('ti-tps631000-slvsfh3c.pdf','TPS631000','SLVSFH3C; August 2026',
  'https://www.ti.com/lit/ds/symlink/tps631000.pdf',[18]),
 ('diodes-2n7002-ds11303.pdf','2N7002','DS11303 Rev.40-2; July 2024',
  'https://www.diodes.com/_files/datasheets/2N7002.pdf',[2]),
 ('ti-tps54302-slvsdg6c.pdf','TPS54302','SLVSDG6C; March 2026',
  'https://www.ti.com/lit/ds/symlink/tps54302.pdf',[5]),
 ('ti-tps63070-slvsc58b.pdf','TPS63070','SLVSC58B; March 2019',
  'https://www.ti.com/lit/ds/symlink/tps63070.pdf',[10]),
 ('ti-drv8833-slvsar1e.pdf','DRV8833','SLVSAR1E; July 2015',
  'https://www.ti.com/lit/ds/symlink/drv8833.pdf',[3,4,5,6,10]),
 ('ti-qfn-son-slua271c.pdf','QFN and SON PCB Attachment','SLUA271C; December 2023',
  'https://www.ti.com/lit/an/slua271c/slua271c.pdf',[7,8,11]),
]
records=[]
lines=['# Nguồn hãng dùng trong review r5','',
       'Ngày truy cập/tải: 16/11/2026. Trang tính theo số trang PDF (bắt đầu 1). '
       'Nguồn tải từ hãng; không có trao đổi với vendor. Hash ghim đúng bytes đã đọc, '
       'không suy ra MPN/suffix TBD được duyệt.','',
       '| Tài liệu / revision | Trang đối chiếu | PDF local | SHA-256 |',
       '|---|---|---|---|']
for filename,title,revision,url,pages in sources:
    p=DOWNLOAD/filename
    with pymupdf.open(p) as doc:
        assert doc.is_pdf and len(doc)>max(pages)-1
        record=dict(file=p.relative_to(PROJECT).as_posix(),title=title,revision=revision,
                    url=url,pages=pages,pageCount=len(doc),sha256=sha(p),status='downloaded_and_read')
        records.append(record)
        if title in ['BQ25886','TPS631000','2N7002']:
            page={'BQ25886':8,'TPS631000':18,'2N7002':2}[title]
            doc[page-1].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4)).save(
                ROOT/'images'/f'source-{title.lower()}-p{page}.png')
    local='../../research/downloads/2026-11-16-r5-review/'+filename
    lines.append(f'| [{title}]({url}) — {revision} | {", ".join(map(str,pages))} '
                 f'| [PDF]({local}) | `{record["sha256"]}` |')
blocked=[
 ('XEL4030','Doc1321; revised 02/19/2026',
  'https://www.coilcraft.com/getmedia/8245f050-f190-4295-8c41-7c03d662ee3d/xel4030.pdf'),
 ('XFL4020','Doc745; revised 03/10/2026',
  'https://www.coilcraft.com/getmedia/50632d43-da1b-4cdb-8ab4-3029cab51df3/xfl4020.pdf'),
]
lines+=['','## Chưa ghim được bản local','',
        'Hai PDF Coilcraft đọc được text qua web; tải công khai trực tiếp gặp Cloudflare. '
        'Không thử vượt chặn. Recommended land pattern chưa được kiểm bằng hình gốc, '
        'không có hash local; không gán kích thước từ text PDF bị mất bố cục.','']
for title,revision,url in blocked:
    records.append(dict(title=title,revision=revision,url=url,status='local_download_blocked',
                        sha256=None,landPatternVisualVerification='NOT_RUN'))
    lines.append(f'- [{title}]({url}) — {revision}: cần PDF/ảnh trang land pattern hãng '
                 'để đối chiếu part, suffix, kích thước và dung sai; không hỏi mua/báo giá.')
lines+=['','## Ảnh trang nguồn để kiểm lấy mẫu','',
        '- [BQ25886 tr.8](images/source-bq25886-p8.png): hệ số ICHGSET.',
        '- [TPS631000 tr.18](images/source-tps631000-p18.png): layout guideline.',
        '- [2N7002 tr.2](images/source-2n7002-p2.png): ngưỡng và điều kiện bảo đảm.',
        '', 'Các ảnh là render từ PDF đã ghim, không phải phép đo phần cứng.']
(ROOT/'sources.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
(ROOT/'artifacts/source-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
before=json.loads((ROOT/'snapshot-before.json').read_text(encoding='utf-8'))
after={p:sha(PROJECT/p) for p in before['hashes']}
changed=[p for p in after if after[p]!=before['hashes'][p]]
supplement={p.relative_to(PROJECT).as_posix():sha(p) for p in
            (PROJECT/'docs/hardware/claude-support/2026-11-15-pcb-2layer-r5/kicad/lib').rglob('*') if p.is_file()}
(ROOT/'snapshot-after.json').write_text(json.dumps(dict(at=datetime.now(timezone.utc).isoformat(),
    hashes=after,changed=changed,comparedCount=len(after),supplementalLibraryHashes=supplement),indent=2)+'\n',encoding='utf-8')
assert not changed,changed
print(json.dumps(dict(snapshotFiles=len(after),changed=changed,pinnedPdfCount=len(sources),
                      blockedPdfCount=len(blocked),supplementalLibraries=len(supplement))))
