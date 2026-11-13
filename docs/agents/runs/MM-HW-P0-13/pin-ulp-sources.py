from pathlib import Path
import urllib.request,hashlib,json
product=Path(__file__).resolve().parents[4]
out=product/'docs/research/downloads/p0-13';out.mkdir(parents=True,exist_ok=True)
records=[]
for name,url,rev in [('iso7041-revd.pdf','https://www.ti.com/lit/ds/symlink/iso7041.pdf','SLLSF54D'),('sn74lvc2g125-revq.pdf','https://www.ti.com/lit/ds/symlink/sn74lvc2g125.pdf','SCES204Q')]:
    p=out/name;item={'url':url,'manufacturer':'TI','revision_expected':rev,'date':'2026-11-10','path':p.relative_to(product).as_posix()}
    try:
        assert not p.exists(),'Refuse overwrite'
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as response:data=response.read(10000001)
        assert data.startswith(b'%PDF-') and len(data)<=10000000
        p.write_bytes(data);item.update(status='PINNED',sha256=hashlib.sha256(data).hexdigest(),bytes=len(data))
    except Exception as e:item.update(status='NOT_RUN',reason=str(e))
    records.append(item)
(out/'ulp-sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records))
