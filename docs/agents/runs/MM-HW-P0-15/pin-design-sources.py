"""Pin declared public manufacturer/standards PDFs; data only, no execution."""
from pathlib import Path
import urllib.request,json,hashlib
root=Path(__file__).resolve().parents[4];out=root/'docs/research/downloads/p0-15';out.mkdir(parents=True,exist_ok=True)
items=[('ablic-s1009.pdf','https://www.ablic.com/en/doc/datasheet/voltage_detector/S1009_E.pdf',12000000),
 ('ti-lm66100.pdf','https://www.ti.com/lit/ds/symlink/lm66100.pdf',12000000),
 ('samtec-sfm-tfm-productspec.pdf','https://suddendocs.samtec.com/productspecs/sfm-tfm.pdf',12000000),
 ('samtec-sfm-drawing.pdf','https://suddendocs.samtec.com/prints/sfm-1xx-xx-xxx-d-xxx-x-xx-mkt.pdf',12000000),
 ('samtec-xfm-mated.pdf','https://suddendocs.samtec.com/prints/xfm%20mated%20document-mkt.pdf',12000000),
 ('amphenol-10171746.pdf','https://cdn.amphenol-cs.com/media/wysiwyg/files/drawing/10171746.pdf',12000000),
 ('usb-typec-r20-reference.pdf','https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019.pdf',48000000)]
records=[]
for name,url,limit in items:
    p=out/name;r={'url':url,'path':p.relative_to(root).as_posix(),'date':'2026-11-10','expected_format':'pdf'}
    try:
        assert not p.exists(),'refuse overwrite'
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=22) as response:
            data=response.read(limit+1);r['content_type']=response.headers.get('Content-Type')
        assert len(data)<=limit,'size limit';assert data.startswith(b'%PDF-'),'expected PDF'
        p.write_bytes(data);r.update(status='PINNED',sha256=hashlib.sha256(data).hexdigest(),bytes=len(data))
    except Exception as e:r.update(status='NOT_RUN',reason=str(e))
    records.append(r)
(out/'design-sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
