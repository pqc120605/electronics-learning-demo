import json,itertools,time,hashlib
from pathlib import Path
from geometry import *
HERE=Path(__file__).resolve().parent
def main():
    t=time.monotonic();cells=frame_cells();cases=[]
    spatial=[{'x':0,'z':0,'pitch':0,'yaw':0}]+[dict(zip(('x','z','pitch','yaw'),p)) for p in itertools.product(C['input']['corner_x'],C['input']['corner_z'],C['input']['corner_pitch'],C['input']['corner_yaw'])]
    for spatial_pose,roll,lead in itertools.product(spatial,C['input']['rolls'],C['input']['leads']):
        pose={**spatial_pose,'roll':roll,'lead':lead}
        nominal=not any(spatial_pose.values());result=follow(pose,cells,all_rows=nominal)
        if result['stop'] is None:
            result['withdrawal']=follow(pose,cells,False,result['last_carriages'],all_rows=nominal)
        cases.append(result)
    missing=[]
    for missing_key,roll in itertools.product((0,1),(0,180)):
        pose={'key_a':missing_key!=0,'key_b':missing_key!=1,'roll':roll,'lead':3.5}
        result=follow(pose,cells,all_rows=True);missing.append(result)
    # Host-side mapping diagnostic independent of a blocked insertion path.
    mapping=[]
    for absent,roll in itertools.product((0,1),(0,180)):
        pose={'key_a':absent!=0,'key_b':absent!=1,'roll':roll,'lead':3.5};parts=adapter_base(**pose)
        mapped=[solve_slider([interval_template(cam(side),p,side) for p in parts],-6.3,0)[0] for side in (1,-1)]
        mapping.append({'missing_key':absent,'roll':roll,'cam_solved_at_d_minus6_3':mapped})
    assert mapping[0]['cam_solved_at_d_minus6_3']==[0,12]
    assert mapping[1]['cam_solved_at_d_minus6_3']==[12,0]
    nominal=[r for r in cases if not any(r['pose'][k] for k in ('x','z','pitch','yaw'))]
    out={'scope':'Contact-derived ideal reference CAD; not product or force proof','frame_cell_count':len(cells),'paths':cases,'missing_key_paths':missing,'host_mapping':mapping,
     'summary':{'paths':len(cases),'fully_inserted':sum(r['stop'] is None for r in cases),'nominal_paths':len(nominal),'nominal_fully_inserted':sum(r['stop'] is None for r in nominal),
      'potential_contact_samples':sum(r['potential_contact_samples'] for r in cases),'probe_misses':[sum(r['controlled_collar_probe_misses'][i] for r in cases) for i in (0,1)],
      'missing_key_potential_contact':sum(r['potential_contact_samples'] for r in missing)},
     'continuous_scope':'Only fixed-pose convex translation collision intervals are continuous; coupled path, poses and real mechanics are NOT continuously validated',
     'provenance':{p:hashlib.sha256((HERE/p).read_bytes()).hexdigest() for p in ['protocol.json','geometry.py','run_paths.py']},'seconds':round(time.monotonic()-t,3)}
    (HERE/'path-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out['summary']))
if __name__=='__main__':main()
