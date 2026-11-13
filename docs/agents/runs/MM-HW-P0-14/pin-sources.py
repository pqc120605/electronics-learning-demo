"""Public manufacturer research copies; no external document is executed."""
from pathlib import Path
import urllib.request,json,hashlib
product=Path(__file__).resolve().parents[4]
out=product/'docs/research/downloads/p0-14';out.mkdir(parents=True,exist_ok=True)
items=[('fdk-hr3utg.pdf','https://www.fdk.com/product_e/nimh_e/tech_info/HR-3UTG.pdf','pdf'),
 ('fdk-20260327-material-update.html','https://www.fdk.com/whatsnew-e/release20260327-e.html','html'),
 ('mpd-ba3aaw-revg.pdf','https://www.batteryholders.com/uploads/parts/BA3AAW/datasheets/BA3AAW-datasheet.pdf','pdf'),
 ('pololu-s7v8f5-specs.html','https://www.pololu.com/product/2123/specs','html'),
 ('pololu-s7v8x-reference.pdf','https://www.pololu.com/file/0J791/s7v8x-schematic.pdf','pdf'),
 ('keystone-aa-holder-catalogue.pdf','https://www.keyelco.com/pdfs/prod04-plasticholders.pdf','pdf')]
records=[]
for name,url,kind in items:
    path=out/name;r={'url':url,'path':path.relative_to(product).as_posix(),'date':'2026-11-10','expected_format':kind}
    try:
        assert not path.exists(),'Refuse overwrite of source'
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=18) as response:
            data=response.read(10000001);r['content_type']=response.headers.get('Content-Type')
        assert len(data)<=10000000
        if kind=='pdf':assert data.startswith(b'%PDF-'),'Expected PDF'
        else:assert b'<html' in data[:10000].lower() or b'<!doctype html' in data[:10000].lower(),'Expected HTML'
        path.write_bytes(data);r.update(status='PINNED',sha256=hashlib.sha256(data).hexdigest(),bytes=len(data))
    except Exception as e:r.update(status='NOT_RUN',reason=str(e))
    records.append(r)
(out/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
