"""Fetch only public manufacturer PDFs into the approved research scope; never execute them."""
from pathlib import Path
import hashlib,json,urllib.request
product=Path(__file__).resolve().parents[4]
out=product/'docs/research/downloads/p0-13';out.mkdir(parents=True,exist_ok=True)
sources=[('iso674x-revg.pdf','https://www.ti.com/lit/ds/symlink/iso6741.pdf','TI','SLLSFJ6G'),
 ('tps3760-reva.pdf','https://www.ti.com/lit/ds/symlink/tps3760.pdf','TI','SBVS420A'),
 ('ltc4079-reva.pdf','https://www.analog.com/media/en/technical-documentation/data-sheets/ltc4079.pdf','Analog Devices','Rev A')]
records=[]
for name,url,maker,revision in sources:
    p=out/name
    item={'url':url,'manufacturer':maker,'revision_expected':revision,'access_date':'2026-11-10','path':p.relative_to(product).as_posix()}
    try:
        assert not p.exists(),'Refuse overwrite of pinned source'
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as response:
            data=response.read(10000001)
        assert data.startswith(b'%PDF-') and len(data)<=10000000,'Not bounded expected PDF'
        p.write_bytes(data)
        item.update(status='PINNED',sha256=hashlib.sha256(data).hexdigest(),bytes=len(data))
    except Exception as e:item.update(status='NOT_RUN',reason=str(e))
    records.append(item)
(out/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
