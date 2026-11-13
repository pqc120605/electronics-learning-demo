from pathlib import Path
import hashlib,json
import pymupdf
product=Path(__file__).resolve().parents[4]
folder=product/'docs/research/downloads/p0-13'
items=[('iso674x-revg.pdf','SLLSFJ6G',[1,21]),('tps3760-reva.pdf','SBVS420A',[1,7,9]),
       ('iso7041-revd.pdf','SLLSF54D',[1,13,17,23]),('sn74lvc2g125-revq.pdf','SCES204Q',[1,7])]
records=[]
for name,revision,pages in items:
    path=folder/name
    doc=pymupdf.open(path)
    cover=doc[0].get_text()
    assert revision in cover,(name,revision)
    images=[]
    for page in pages:
        png=folder/(path.stem+'-p'+str(page)+'.png')
        doc[page-1].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4)).save(png)
        images.append({'page':page,'path':png.relative_to(product).as_posix(),'sha256':hashlib.sha256(png.read_bytes()).hexdigest()})
    records.append({'path':path.relative_to(product).as_posix(),'pages':len(doc),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'revision_cover_verified':revision,'images':images})
(folder/'pinned-page-evidence.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'documents':len(records),'rendered_pages':sum(len(x['images']) for x in records),'all_revision_covers_match':True}))
