from pathlib import Path
import urllib.request,hashlib,json,fitz
root=Path(__file__).resolve().parents[4]
dest=root/'docs/research/downloads/c11-r12'
sources=[('ssab-355mc.html','https://www.ssab.com/en/brands-and-products/ssab-domex/product-offer/355mc'),('adafruit-2776.html','https://www.adafruit.com/product/2776'),('takaha-ssbh0830.pdf','https://www.takaha.co.jp/product/ss/pdf/SSBH-0830.pdf')]
out=[]
for name,url in sources:
    record={'url':url,'path':str((dest/name).relative_to(root)).replace('\\','/'),'access_date':'2026-11-10'}
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=35) as r:data=r.read()
        if name.endswith('.pdf') and not data.startswith(b'%PDF-'):raise ValueError('not PDF')
        (dest/name).write_bytes(data)
        record.update(status='PINNED',sha256=hashlib.sha256(data).hexdigest())
        if name.endswith('.pdf'):
            d=fitz.open(dest/name); d[0].get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(dest/'takaha-ssbh0830-p1.png')
    except Exception as e:record.update(status='NOT_RUN',reason=str(e))
    out.append(record)
    print(name,record['status'],flush=True)
(dest/'mechanical-sources.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
