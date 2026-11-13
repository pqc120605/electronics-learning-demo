import json,hashlib
from pathlib import Path
from m5_contact_model import native,frame,carriage,m5_contact_inserted
from geometry import *
HERE=Path(__file__).resolve().parent

def main():
    cells=frame_cells();f=frame();volume=sum(native(p).volume for p in cells)
    assert abs(volume-f.volume)<1e-6
    cell_differences=[(p['label'],native(p).volume-(native(p)&f).volume) for p in cells]
    assert all(abs(v)<1e-6 for _,v in cell_differences)
    checks=[]
    for pose,d in [({'lead':3.5},-7),({'lead':3.5},6.4),({'roll':180,'lead':3.5},-7),({'lead':3.5,'x':.25,'pitch':5,'yaw':5},-9),({'lead':3.5,'key_a':False},-6.3)]:
        base=adapter_base(**pose);parts=[moved(p,(0,d,0)) for p in base]
        for side in (1,-1):
            s,_=solve_slider([interval_template(cam(side),p,side) for p in base],d,0)
            if s is None:continue
            assert len(carriage(side,s).solids())==1
            for fixed in carriage_parts(side,s):
                a=native(fixed)
                for p in parts:
                    b=native(p);v=(a&b).volume;sat=classify(fixed,p)
                    assert (v>1e-7)==(sat=='interpenetrating'),(pose,d,fixed['label'],p['label'],v,sat)
                    if sat=='touching':assert a.distance_to(b)<2e-6
                    checks.append({'pose':pose,'d':d,'s':s,'pair':[fixed['label'],p['label']],'sat':sat,'native_intersection_mm3':v,'distance_mm':a.distance_to(b)})
        for p in parts:
            positive=any(classify(p,c)=='interpenetrating' for c in cells)
            v=(native(p)&f).volume
            assert positive==(v>1e-7),(p['label'],positive,v)
            checks.append({'pose':pose,'d':d,'pair':[p['label'],'frame'],'native_intersection_mm3':v,'sat_positive':positive})
    doc=m5_contact_inserted()
    result={'frame_cells':len(cells),'native_frame_volume_mm3':f.volume,'cell_volume_mm3':volume,'cell_containment_checks':len(cells),'native_frame_solid_count':len(f.solids()),'checks':checks,'model_id':str(doc.id),'geometry_sha256':hashlib.sha256((HERE/'geometry.py').read_bytes()).hexdigest()}
    (HERE/'kernel-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'frame_volume':f.volume,'cells':len(cells),'native_checks':len(checks),'touching':sum(c.get('sat')=='touching' for c in checks),'model_id':str(doc.id)}))
if __name__=='__main__':main()
