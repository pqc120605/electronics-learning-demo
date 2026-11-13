"""Crosscheck SAT against the OCCT CAD solids at explicit independent cases."""
import json,hashlib
from pathlib import Path
from preflight import preflight
from collision import solids,probes,shutters,overlap,prescribed_motion
from m5_model import adapter_parts,probe_parts,shutter_parts,frame_part,m5_program_reference
HERE=Path(__file__).resolve().parent
def volume_intersection(a,b):
    shape=a & b
    if shape is None:return 0.0
    if isinstance(shape,list):return sum(float(x.volume) for x in shape)
    return float(shape.volume)
def valid(s):
    result=s.is_valid
    return bool(result() if callable(result) else result)
def main():
    preflight()
    cases=[
      {'name':'inserted_nominal','d':6.4},
      {'name':'inserted_180_tilt','d':6.4,'roll':180,'pitch':-5,'yaw':5,'x':.25,'z':-.15},
      {'name':'early_tilt','d':-.2,'pitch':5,'yaw':5,'x':-.25,'z':.15},
      {'name':'shell_only_baseline','d':6.4,'key_a':False,'key_b':False,'collar':False},
      {'name':'generic_forced_after_first_door','d':-4.3,'key_a':False,'key_b':False,'collar':False},
      {'name':'missing_key_forced_pose','d':-2,'key_a':False}]
    frame=frame_part();results=[];comparisons=0
    assert valid(frame)
    for original in cases:
        case=dict(original);name=case.pop('name');native=adapter_parts(**case);boxes=solids(**case)
        assert len(native)==len(boxes)
        assert all(valid(s) and s.volume>0 for s in native)
        a=prescribed_motion(case['d'],case.get('lead',3.5),case.get('key_a',True));b=prescribed_motion(case['d'],case.get('lead',3.5),case.get('key_b',True))
        native_targets=probe_parts(docked=True)+shutter_parts(a,b);box_targets=probes()+shutters(a,b)
        details=[]
        for i,(s,obb) in enumerate(zip(native,boxes)):
            for j,(target,tbox) in enumerate(zip(native_targets,box_targets)):
                v=volume_intersection(s,target);kernel=v>1e-7;sat=overlap(obb,tbox);comparisons+=1
                assert kernel==sat,(name,i,j,v,sat)
                if kernel:details.append({'part':obb['label'],'target':tbox['label'],'volume_mm3':round(v,9)})
        frame_hits=[]
        for shape,obb in zip(native,boxes):
            v=volume_intersection(shape,frame)
            if v>1e-7:frame_hits.append({'part':obb['label'],'volume_mm3':round(v,9)})
        results.append({'case':name,'parameters':case,'SAT_OCCT_match':True,'target_collisions':details,'frame_collisions':frame_hits,'note':'Forced collision poses are diagnostic, not reachable accepted states'})
    doc=m5_program_reference();tree=doc.shape
    bounds=tree.bounding_box().size
    out={'kind':'Exact kernel checks at six cases; NOT continuous coverage or real mechanism proof','comparisons':comparisons,
      'cases':results,'native_model_id':doc.id,'native_model_bounds_mm':[bounds.X,bounds.Y,bounds.Z],
      'frame_shape_valid':True,'all_adapter_solids_checked_valid':True,'physical_tests':'NOT_RUN'}
    out['provenance']={name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in ['protocol.json','kernel_check.py','m5_model.py','collision.py']}
    (HERE/'kernel-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'comparisons':comparisons,'cases':len(results),'all_SAT_OCCT_match':True,'frame_collision_cases':[r['case'] for r in results if r['frame_collisions']],'model_bounds_mm':out['native_model_bounds_mm']}))
if __name__=='__main__':main()
