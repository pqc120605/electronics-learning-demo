"""Retrieve only declared public reference documents, never execute content."""
from pathlib import Path
import urllib.request,json,hashlib
root=Path(__file__).resolve().parents[4]
out=root/'docs/research/downloads/p0-15';out.mkdir(parents=True,exist_ok=True)
items=[('panasonic-bq-cc17-instructions-20250319.pdf','https://www.panasonicbatteryproducts.com/wp-content/uploads/BQ-CC17A-Instructions-3.19.2025.pdf','pdf','manufacturer manual'),
 ('slab-bq-cc17-listing-20261110.html','https://slab.vn/bo-sac-pin-panasonic-eneloop-bq-cc17-aa-p5924044.html','html','seller price only'),
 ('liitokala-lii-s1-reference.html','https://cn.liitokala.com.cn/charger/Cylindricalbatterycharger/344.html','html','manufacturer candidate; verify content before use')]
records=[]
for name,url,kind,role in items:
    p=out/name;r={'url':url,'path':p.relative_to(root).as_posix(),'expected_format':kind,'role':role,'date':'2026-11-10'}
    try:
        assert not p.exists(),'refuse overwrite'
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=18) as response:
            data=response.read(10000001);r['content_type']=response.headers.get('Content-Type')
        assert len(data)<=10000000
        if kind=='pdf':assert data.startswith(b'%PDF-'),'expected PDF'
        else:assert b'<html' in data[:10000].lower() or b'<!doctype html' in data[:10000].lower(),'expected HTML'
        p.write_bytes(data);r.update(status='PINNED',sha256=hashlib.sha256(data).hexdigest(),bytes=len(data))
    except Exception as e:r.update(status='NOT_RUN',reason=str(e))
    records.append(r)
(out/'cost-sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
