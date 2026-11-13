"""Download fixed public manufacturer PDFs; never execute downloaded material."""
import urllib.request,hashlib,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
SOURCES={
 'ti-ina152-SBOS184.pdf':'https://www.ti.com/lit/ds/symlink/ina152.pdf',
 'ti-tlv803e-SLVSEH0J.pdf':'https://www.ti.com/lit/ds/symlink/tlv803e.pdf',
 'panasonic-AQY21-ASCTB126E.pdf':'https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_ge1a_aqy21_e_dip4.pdf'
}
def main():
    dest=HERE/'sources';dest.mkdir(exist_ok=True);out=[]
    for name,url in SOURCES.items():
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=35) as response:data=response.read(12_000_001)
        assert data.startswith(b'%PDF-') and len(data)<12_000_000,(name,'not a bounded PDF')
        (dest/name).write_bytes(data)
        out.append({'file':name,'url':url,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'revision_status':'Revision checked against title/table by lead; vendor URLs may change','use':'Untrusted technical reference, not executed or adopted hardware'})
    (dest/'manifest.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
if __name__=='__main__':main()
