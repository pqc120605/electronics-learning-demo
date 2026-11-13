from pathlib import Path
import urllib.request,json,hashlib,pymupdf
root=Path(__file__).resolve().parents[4];out=root/'docs/research/downloads/p0-12';out.mkdir(parents=True,exist_ok=True)
records=[]
for name,url in [('tlv9021-family','https://www.ti.com/lit/ds/symlink/tlv9021.pdf'),('ltc6702','https://www.analog.com/media/en/technical-documentation/data-sheets/6702fa.pdf')]:
    rec={'name':name,'source_url':url,'access_date':'2026-11-10'}
    try:
        p=out/(name+'.pdf')
        if not p.exists():
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=25) as response:data=response.read()
            assert data.startswith(b'%PDF-'),'not PDF';p.write_bytes(data)
        doc=pymupdf.open(p);txt=[];imgs=[]
        for i,page in enumerate(doc):
            s=page.get_text();txt.append(f'\n--- PAGE {i+1} ---\n'+s)
            if i==0 or any(x in s.lower() for x in ['electrical characteristics','switching characteristics','hysteresis','propagation delay']):
                image=out/f'{name}-p{i+1}.png';page.get_pixmap(matrix=pymupdf.Matrix(1.35,1.35)).save(image)
                imgs.append({'path':str(image.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(image.read_bytes()).hexdigest()})
        (out/(name+'.txt')).write_text(''.join(txt),encoding='utf-8')
        rec.update(status='PINNED',path=str(p.relative_to(root)).replace('\\','/'),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),pages=len(doc),page_images=imgs)
    except Exception as e:rec.update(status='NOT_RUN',reason=str(e))
    records.append(rec);print(name,rec['status'],flush=True)
    (out/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
esp=root/'docs/research/downloads/p0-08-2026-11-09/esp32-series-v5.3.pdf'
doc=pymupdf.open(esp)
for n in [19,22,23,61,62,69]:doc[n-1].get_pixmap(matrix=pymupdf.Matrix(1.3,1.3)).save(out/f'esp32-v5_3-p{n}.png')
print('ESP32 pages rendered')
