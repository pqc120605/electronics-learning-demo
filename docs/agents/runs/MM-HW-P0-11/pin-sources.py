from pathlib import Path
import urllib.request,hashlib,json,pymupdf
root=Path(__file__).resolve().parents[4];out=root/'docs/research/downloads/p0-11';out.mkdir(parents=True,exist_ok=True)
sources=[('adr45-revg','https://www.analog.com/media/en/technical-documentation/data-sheets/adr4520_4525_4530_4533_4540_4550.pdf'),('tps22919','https://www.ti.com/lit/ds/symlink/tps22919.pdf'),('tps22990','https://www.ti.com/lit/ds/symlink/tps22990.pdf')]
records=[]
for name,url in sources:
    r={'part':name,'url':url,'date':'2026-11-10'}
    try:
        path=out/(name+'.pdf')
        if not path.exists():
            with urllib.request.urlopen(url,timeout=40) as response:data=response.read()
            if not data.startswith(b'%PDF-'):raise ValueError('Not PDF')
            path.write_bytes(data)
        d=pymupdf.open(path);texts=[];images=[]
        for i,p in enumerate(d):
            text=p.get_text();texts.append(f'\n--- PDF PAGE {i+1} ---\n'+text)
            if i==0 or any(w in text.lower() for w in ['electrical characteristics','switching characteristics','terminology','long-term drift','thermal hysteresis','power cycle hysteresis']):
                img=out/f'{name}-p{i+1}.png';p.get_pixmap(matrix=pymupdf.Matrix(1.3,1.3)).save(img)
                images.append({'path':str(img.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(img.read_bytes()).hexdigest()})
        (out/(name+'.txt')).write_text(''.join(texts),encoding='utf-8')
        r.update(status='PINNED',path=str(path.relative_to(root)).replace('\\','/'),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),cover=texts[0],page_images=images)
    except Exception as e:r.update(status='NOT_RUN',reason=str(e))
    records.append(r);print(name,r['status'],flush=True)
(out/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
