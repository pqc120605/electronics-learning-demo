"""Finite adversarial checks, with exact SAT only on each interpolated fixed-pose segment."""
import json,itertools,time
from pathlib import Path
from geometry import *
HERE=Path(__file__).resolve().parent

def segment_hits(pose,rows):
    base=adapter_base(**pose);hits=[];tested=0
    for a,b in zip(rows,rows[1:]):
        dd=b['d']-a['d']
        for side,sa,sb in zip((1,-1),a['carriages'],b['carriages']):
            for fixed in carriage_parts(side,sa):
                for part in base:
                    moving=moved(part,(0,a['d'],0))
                    iv=translation_interval(fixed,moving,(-side*(sb-sa),dd,0))
                    tested+=1
                    if iv and max(0,iv[0])<min(1,iv[1]):hits.append({'d':[a['d'],b['d']],'pair':[part['label'],fixed['label']],'parameter_interval':iv})
    return {'segment_pair_checks':tested,'interpenetration_segments':hits}

def main():
    tests=[([(3,5),(6,8)],4,5), ([(3,7),(5,8)],4,8), ([(2,9),(3,5)],4,9), ([(2,4),(4,6)],4,4), ([(3,5),(6,8)],9,8), ([],7,0)]
    for iv,previous,expected in tests:assert solve_intervals(iv,previous)[0]==expected
    cells=frame_cells();sensitivity=[]
    for step,pose in itertools.product((.1,.05,.01),({'lead':3.5,'roll':0},{'lead':3.5,'roll':180},{'lead':3.5,'x':.25,'z':.15,'pitch':5,'yaw':5})):
        r=follow(pose,cells,all_rows=True,step_override=step)
        r['step']=step;r['interpolated_segments']=segment_hits(pose,r.pop('rows'));sensitivity.append(r)
    faults=[]
    for locked in ((0,None),(None,0),(12,None),(None,12),(12,12)):
        r=follow({'lead':3.5},cells,locked=locked);r['locked']=locked;faults.append(r)
    # Separate material contributors; a crossbar cannot substitute for controlled collar.
    contributors=[]
    for d in (0,4,6.4):
        parts=[moved(p,(0,d,0)) for p in adapter_base()]
        for baseline in (False,True):
            contributors.append({'d':d,'baseline':baseline,'hits':{probe['label']:{p['label']:classify(p,probe) for p in parts} for probe in probe_boxes(baseline)}})
    # Synthetic simultaneous-door fault: a bare shell can pass the open reference tunnel.
    shell_only=[p for p in adapter_base(collar=False,key_a=False,key_b=False) if p['label']=='shell-outer']
    bypass=[]
    for s,d in itertools.product((0,12),(-3.5,6.4)):
        part=moved(shell_only[0],(0,d,0))
        blockers=[p['label'] for side in (1,-1) for p in carriage_parts(side,s) if classify(part,p)=='interpenetrating']
        path_blockers=[]
        for target in cells+[p for side in (1,-1) for p in carriage_parts(side,s)]:
            iv=translation_interval(target,shell_only[0],(0,1,0))
            if iv and max(-20,iv[0])<min(d,iv[1]):path_blockers.append(target['label'])
        bypass.append({'both_carriages':s,'d':d,'static_blockers':blockers,'path_blockers':path_blockers})
    assert bypass[0]['static_blockers'] and bypass[1]['path_blockers']
    assert not bypass[2]['path_blockers'] and not bypass[3]['path_blockers']
    out={'interval_unit_cases':len(tests),'sensitivity':sensitivity,'locked_cases':faults,'probe_contributors':contributors,'synthetic_bypass':bypass,
         'limits':'Fixed orientation and ideal sliders only. Finite paths; interpolation checked only for the listed sensitivity cases, not continuous pose/dynamics/hardware proof.'}
    (HERE/'adversarial-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'interval_tests':len(tests),'sensitivity':[(r['step'],r['pose'],r['stop'],len(r['interpolated_segments']['interpenetration_segments'])) for r in sensitivity],'locked_stops':[(r['locked'],r['stop']) for r in faults]}))
if __name__=='__main__':main()
