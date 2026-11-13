"""Geometry-derived endpoint/carriage intervals; no Boolean park permission."""
import json,sys
from pathlib import Path
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
from preflight import preflight
preflight()
from endpoint_geometry import path,endpoint_parts,gate_carriage,translation_interval,lowest_reachable_carriage,PARK

cases=[]
for label,ha,hb,remove,omit in [
    ('parked reference',PARK,PARK,None,()),
    ('A not parked',0,PARK,None,()),
    ('B not parked',PARK,0,None,()),
    ('historical12 sensitivity',12,12,None,()),
    ('A not parked, upper barrier absent',0,PARK,1,()),
    ('A not parked, lower barrier absent',0,PARK,-1,()),
    ('B not parked, upper barrier absent',PARK,0,1,()),
    ('B not parked, lower barrier absent',PARK,0,-1,()),
    ('negative: both endpoint bodies absent',0,0,None,('A','B')),
]:
    row=path(ha,hb,remove,omit);row['case']=label;cases.append(row)
assert cases[0]['potential_contact_samples']>0
assert all(r['potential_contact_samples']==0 for r in cases[1:8])
assert cases[-1]['potential_contact_samples']>0
# The slot wall physically arrests downward endpoint movement, each independently.
# Union of exact axis-aligned convex pieces, continuous one-axis intervals.
holds=[]
for name in ('A','B'):
    for side in (1,-1):
        for s in (6.6,12.):
            intervals=[r for a in gate_carriage(side,s) for b in endpoint_parts(name,PARK)
                       if (r:=translation_interval(a,b,(0,0,-1))) is not None and r[1]>0]
            first=min(max(0,r[0]) for r in intervals)
            assert abs(first-.2)<1e-5,(name,side,s,first)
            holds.append({'endpoint':name,'remaining_carriage':side,'carriage_s_mm':s,
                          'downward_contact_after_mm':first,'conditional_h_at_contact_mm':PARK-first})
retention=[]
for name,opts in [('intact',{}),('key A removed',{'key_a':False}),('key B removed',{'key_b':False}),
                  ('both keys removed, collar remains',{'key_a':False,'key_b':False}),
                  ('negative, bare shell placed in port',{'key_a':False,'key_b':False,'collar':False})]:
    rows=[]
    for index in range(65):
        depth=index/10
        positions=[lowest_reachable_carriage(s,depth,**opts) for s in (1,-1)]
        rows.append({'depth_mm':depth,'carriage_minima_mm':positions,'holds_both_endpoints':max(positions)>=6.6})
    retained=sum(r['holds_both_endpoints'] for r in rows)
    if name.startswith('negative'):
        assert retained<len(rows)
    else:
        assert retained==len(rows),(name,retained)
    retention.append({'case':name,'samples_held':retained,'samples':len(rows),
                      'first_unheld':next((r for r in rows if not r['holds_both_endpoints']),None)})
out={'scope':'Endpoint-slot/M5-carriage subassembly research, not complete sequencer or B1',
     'cases':cases,'continuous_downward_collision_intervals':holds,
     'retention_at_sampled_fixed_depths':retention,
     'retention_limit':'At s=6.6..12 the straight bar crosses both 1 mm plates. This is a one-axis interval argument; removal cases change material at a fixed pose and do not establish a physical insertion or fracture trajectory.',
     'modeled_constraints':['Ideal translation-only guides','Nominal intact controlled adapter','Rigid connected gate extensions','No frame/guide clearance qualification'],
     'not_proven':['V/probe/witness cycle-completion','cassette removal enforcement','whole M5 frame collision and generic-plug routes','broken keys/collar and terminal escape','source electrical protection','strength/friction/fit/cost','product/B1 readiness']}
(HERE/'endpoint-geometry-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'cases':len(cases),'parked_contact_samples':cases[0]['potential_contact_samples'],
                  'blocked_cases':7,'negative_control_contact_samples':cases[-1]['potential_contact_samples'],
                  'continuous_hold_cases':len(holds),'retention_samples':[r['samples_held'] for r in retention]}))
