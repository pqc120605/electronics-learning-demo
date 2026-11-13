"""Public manufacturer PDF retrieval only; downloaded files are never executed."""
import urllib.request,hashlib,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
DEST=HERE.parents[5]/'docs/research/downloads/p0-15/attempt-4'
SOURCES={'samtec-tfm-drawing.pdf':'https://suddendocs.samtec.com/prints/tfm-1xx-xx-xxx-d-xxx-x-xx-mkt.pdf','samtec-pair-cycle-report.pdf':'https://suddendocs.samtec.com/testreports/1170762_report_rev_1_elp.pdf'}
def main():
    DEST.mkdir(parents=True,exist_ok=True);out=[]
    for name,url in SOURCES.items():
        request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(request,timeout=35) as r:data=r.read(12_000_001)
        assert data.startswith(b'%PDF-') and len(data)<12_000_000
        p=DEST/name;p.write_bytes(data)
        out.append({'path':p.as_posix(),'url':url,'publisher':'Samtec','access_date':'2026-11-11','sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'purpose':'Candidate comparison/bounding only, not approved part or manufacturing input'})
    (HERE/'connector-source-manifest.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
if __name__=='__main__':main()
