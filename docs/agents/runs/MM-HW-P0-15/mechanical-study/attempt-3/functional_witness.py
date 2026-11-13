"""M5 functional-face witness/reference-fault study, not a built interlock."""
import sys,json,hashlib
from pathlib import Path
import build123d as bd
from cad import model
HERE=Path(__file__).resolve().parent
BASE=HERE.parent/'attempt-2'
sys.path.insert(0,str(BASE));sys.path.insert(1,str(HERE.parent))
from m5_contact_model import block,native,frame,carriage
from geometry import C,carriage_parts
from preflight import preflight

def panel(side,aperture=False,offset=(0,0)):
    y=C['carriage']['door_y'][0 if side==1 else 1]
    s=block('functional panel',(11.4,.8,5.4),(0,y,0),'#f59e0b')
    if aperture:s=s-block('damage tool',(8.5,1.0,2.5),(offset[0],y,offset[1]))
    s.label=('DAMAGED aperture panel ' if aperture else 'intact panel ')+('A' if side==1 else 'B');s.color='#f59e0b'
    return s

def witness(side,stroke,z=.7):
    start=-3.4 if side==1 else -1.9
    p=bd.Cylinder(.3,.4).rotate(bd.Axis.X,90).moved(bd.Location((0,start-stroke+.2,side*z)))
    p.label='functional-face witness '+('A' if side==1 else 'B')+'; prescribed test stroke'
    p.color='#0ea5e9';return p

def first_stop(side,targets):
    def hits(stroke):
        w=witness(side,stroke)
        return [p.label for p in targets if (w&p).volume>1e-9]
    assert not hits(0),'Initial witness must be collision-free'
    for k in range(1,201):
        hi=k*.01
        if hits(hi):
            lo=hi-.01
            for _ in range(24):
                mid=(lo+hi)/2
                if hits(mid):hi=mid
                else:lo=mid
            return dict(stroke=hi,contributors=hits(hi),kind='solid_contact',in_window=.15<=hi<=.25)
    return dict(stroke=2.,contributors=[],kind='full_overtravel',in_window=False)

def targets(side,missing=False,aperture=False,offset=(0,0)):
    out=[frame()]
    for s in (1,-1):
        for p in carriage_parts(s,0):
            if p['label'].startswith('door'):
                if s!=side or not missing:out.append(panel(s,aperture and s==side,offset))
            else:out.append(native(p))
    return out

@model
def damaged_panel_false_witness():
    preflight();p=panel(1,True);w=witness(1,.2,z=1)
    # A shell envelope fits through the hole, but a crescent of witness still meets panel.
    shell=block('USB OUTER envelope - interference only',(8.28,6.55,2.43),(0,-4,0),'#94a3b8')
    assert (shell&p).volume<1e-9
    return bd.Compound(children=[p,w,shell])

@model
def centered_witness_aperture_reject():
    preflight();return bd.Compound(children=[panel(1,True),witness(1,2)])

def main():
    preflight();results=[]
    for side in (1,-1):
        for missing,aperture in ((False,False),(True,False),(False,True)):
            r=first_stop(side,targets(side,missing,aperture));r.update(side=side,panel_missing=missing,aperture=aperture)
            assert r['in_window']==(not missing and not aperture)
            if aperture:
                shell=block('outer envelope',(8.28,6.55,2.43),(0,C['carriage']['door_y'][0 if side==1 else 1],0))
                r['shell_panel_intersection_mm3']=(shell&panel(side,True)).volume
                assert r['shell_panel_intersection_mm3']<1e-9
            results.append(r)
        for offset in ((-.25,-.15),(-.25,.15),(.25,-.15),(.25,.15)):
            r=first_stop(side,targets(side,False,True,offset));r.update(side=side,panel_missing=False,aperture=True,aperture_offset=offset)
            assert not r['in_window'],r
            results.append(r)
    doc=damaged_panel_false_witness()
    refined=centered_witness_aperture_reject()
    out={'scope':'Prescribed witness collision fixture only; not full interlock or fault-reachable system','cases':results,'model_id':str(doc.id),
      'initial_edge_test_ref':'functional-witness-edge-results.json',
      'refinement':{'witness_axis_abs_Z_mm':.7,'radius_mm':.3,'minimum_common_solid_shell_envelope_half_height_mm':1.215-.15,'reference_disk_vertical_margin_mm':1.215-.15-(.7+.3),'meaning':'Disk now lies inside the common OUTER BOX footprint over the reference offset range. Not a proof of real shell material or arbitrary panel integrity.'},
      'refined_model_id':str(refined.id),
      'finding':'Z=+/-1mm witness has a false-contact crescent on the tested aperture. Moving to+/-0.7mm rejects the tested lost/apertured panels, including four offset apertures per side. One point still does not prove arbitrary barrier integrity or a real cable-free port.',
      'not_proven':['actual cycle-completion latch','force/friction/spring','system bridge-reconnect reachability','USB contact/material fit','single-fault safety','fault probability','B1'],
      'provenance':{p:hashlib.sha256((BASE/p).read_bytes()).hexdigest() for p in ('geometry.py','protocol.json','m5_contact_model.py')},'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    (HERE/'functional-witness-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'cases':len(results),'stops':[(r['side'],r['panel_missing'],r['aperture'],round(r['stroke'],6),r['in_window'],r['contributors']) for r in results],'model_id':str(doc.id)}))
if __name__=='__main__':main()
