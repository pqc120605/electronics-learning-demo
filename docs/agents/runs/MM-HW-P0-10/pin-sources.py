"""Download public TI datasheets and pin PDF bytes, text and page images. Never execute downloads."""
from pathlib import Path
import hashlib, json, urllib.request
import fitz

root = Path(__file__).resolve().parents[4]
out = root / 'docs/research/downloads/c11-r12'
out.mkdir(parents=True, exist_ok=True)
parts = ['bq25170','bq25170j','tps3430','tmux1511','tlv6710','tps22916','tps61023','tps25810','tps3808','sn74lvc1g74','tps25947','ref33','tlv3201','csd25402q3a','tps2553','tps3890']
records=[]
for part in parts:
    url=f'https://www.ti.com/lit/ds/symlink/{part}.pdf'
    path=out/f'{part}.pdf'
    rec={'part':part,'url':url,'access_date':'2026-11-10'}
    try:
        if not path.exists():
            with urllib.request.urlopen(url,timeout=35) as response:
                data=response.read()
            if not data.startswith(b'%PDF-'): raise ValueError('Response is not PDF')
            path.write_bytes(data)
        data=path.read_bytes()
        if not data.startswith(b'%PDF-'): raise ValueError('Saved content is not PDF')
        doc=fitz.open(path)
        text=[]; images=[]
        # Pin every technical page through the packaging appendix. Page refs are printed PDF pages (1-based).
        for i,p in enumerate(doc):
            txt=p.get_text()
            text.append(f'\n--- PDF PAGE {i+1} ---\n'+txt)
            if i==0 or any(s in txt.lower() for s in ['electrical characteristics','typical characteristics','detailed description','vset','safety timer','thermistor','functional modes','application information']):
                img=out/f'{part}-p{i+1}.png'
                p.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(img)
                images.append({'page':i+1,'path':str(img.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(img.read_bytes()).hexdigest()})
        (out/f'{part}.txt').write_text(''.join(text),encoding='utf-8')
        rec.update(status='PINNED',path=str(path.relative_to(root)).replace('\\','/'),sha256=hashlib.sha256(data).hexdigest(),pages=len(doc),cover_text=text[0],page_images=images)
    except Exception as e:
        rec.update(status='NOT_RUN',reason=str(e))
    records.append(rec)
    (out/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    print(part,rec['status'],flush=True)
