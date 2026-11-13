"""Native check of a static synthetic tail; not normally reachable insertion."""
import json,hashlib
from pathlib import Path
import build123d as bd
from cad import model
from functional_witness import preflight,native,frame,carriage,block,witness
from thin_tail import filaments
from geometry import adapter_base,moved,probe_boxes
HERE=Path(__file__).resolve().parent

def native_obstacles():
    return [frame(),carriage(1,0),carriage(-1,0)]+[native(p) for p in probe_boxes()]+[witness(1,.2),witness(-1,.2)]

@model
def static_thin_tail_research():
    preflight();pieces=native_obstacles()
    for p in filaments():
        s=native(p);s.color='#dc2626';pieces.append(s)
    s=native(moved(adapter_base(collar=False,key_a=False,key_b=False)[0],(0,6.4,0)))
    s.label='USB outer envelope at imposed depth; no insertion history';s.color='#94a3b8';pieces.append(s)
    result=bd.Compound(children=pieces);result.label='STATIC synthetic thin-tail reference only';return result

def main():
    preflight();targets=native_obstacles();rows=[]
    polygons=filaments()+[moved(adapter_base(collar=False,key_a=False,key_b=False)[0],(0,6.4,0))]
    for p in polygons:
        s=native(p)
        for target in targets:
            v=(s&target).volume
            assert v<1e-9,(p['label'],target.label,v)
            rows.append({'part':p['label'],'target':target.label,'intersection_mm3':v,'distance_mm':s.distance_to(target)})
    doc=static_thin_tail_research()
    out={'scope':'Native intersections in a static imposed configuration; not insertion history, commercial cable or fault-reachable system','native_pair_checks':len(rows),'rows':rows,'model_id':str(doc.id),'provenance':{p:hashlib.sha256((HERE/p).read_bytes()).hexdigest() for p in ('thin_tail.py','functional_witness.py','thin_tail_kernel.py')}}
    (HERE/'thin-tail-kernel-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'native_pair_checks':len(rows),'positive_interference':0,'model_id':str(doc.id)}))
if __name__=='__main__':main()
