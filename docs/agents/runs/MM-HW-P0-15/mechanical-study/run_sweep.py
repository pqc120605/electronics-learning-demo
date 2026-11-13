"""Finite reference samples; reports failures instead of changing assertions to hide them."""
import json,itertools,time,hashlib
from pathlib import Path
from preflight import preflight
from collision import P,solids,probes,shutters,overlap,potential_contact,prescribed_motion
HERE=Path(__file__).resolve().parent
def main():
    preflight();started=time.monotonic();domain=P['domains'];probe=probes()
    samples=list(itertools.product(domain['lateral_offsets'],domain['vertical_offsets'],domain['pitch_degrees'],domain['yaw_degrees'],domain['roll_degrees']))
    missing=[];count=0;hits=[0,0];contacts=0
    for lead in domain['key_lead_trials']:
        for n in range(65):
            d=n/10
            for x,z,pitch,yaw,roll in samples:
                pieces=solids(d,x,z,pitch,yaw,roll,lead);count+=1
                if not potential_contact(pieces):continue
                contacts+=1
                for i,p in enumerate(probe):
                    found=any(overlap(s,p) for s in pieces)
                    if found:hits[i]+=1
                    elif len(missing)<10:missing.append({'probe':i,'d':d,'x':x,'z':z,'pitch':pitch,'yaw':yaw,'roll':roll,'lead':lead})
    # Conservative early/tilted contact while the tip centre is still in front of the mouth.
    early_total=0;early_miss=[]
    for n in range(-10,0):
        d=n/10
        for x,z,pitch,yaw,roll in samples:
            pieces=solids(d,x,z,pitch,yaw,roll)
            if potential_contact(pieces):
                early_total+=1
                for i,p in enumerate(probe):
                    if not any(overlap(s,p) for s in pieces) and len(early_miss)<10:early_miss.append({'probe':i,'d':d,'pitch':pitch,'yaw':yaw,'roll':roll,'x':x,'z':z})
    paths={}
    for fault in ('none','A_stuck_open','B_stuck_open','both_stuck_open'):
        failures=[];blocked=0;reached=0
        for x,z,pitch,yaw,roll in samples:
            first_block=None;first_contact=None
            for n in range(-140,65):
                d=n/10;pieces=solids(d,x,z,pitch,yaw,roll,key_a=False,key_b=False,collar=False)
                sa=12 if fault in ('A_stuck_open','both_stuck_open') else 0
                sb=12 if fault in ('B_stuck_open','both_stuck_open') else 0
                if any(overlap(p,s) for p in pieces for s in shutters(sa,sb)):
                    first_block=d;break
                if potential_contact(pieces):first_contact=d;break
            if first_block is not None:blocked+=1
            if first_contact is not None:
                reached+=1
                if len(failures)<3:failures.append({'d':first_contact,'x':x,'z':z,'pitch':pitch,'yaw':yaw,'roll':roll})
            if first_block is None and first_contact is None:raise AssertionError('Path reached neither event')
        paths[fault]={'sample_paths':len(samples),'blocked_before_potential_contact':blocked,'potential_contact_reached':reached,'examples':failures}
    # Solid OUTER envelope, not a guaranteed material set or a complete cable.
    baseline=solids(6.4,key_a=False,key_b=False,collar=False)
    baseline_hits=[any(overlap(s,p) for s in baseline) for p in probe]
    assert baseline_hits==[False,False],'Expected inadequate outer-envelope tail coverage'
    assert paths['none']['potential_contact_reached']==0
    assert paths['A_stuck_open']['potential_contact_reached']==0
    assert paths['B_stuck_open']['potential_contact_reached']==0
    assert paths['both_stuck_open']['potential_contact_reached']>0,'Negative control must detect bypass'
    missing_key_paths=[]
    for missing_key in (0,1):
        for own_stuck_open in (False,True):
            for lead in domain['key_lead_trials']:
                event=None
                for n in range(-140,65):
                    d=n/10;ka=missing_key!=0;kb=missing_key!=1
                    pieces=solids(d,lead=lead,key_a=ka,key_b=kb)
                    a=prescribed_motion(d,lead,ka);b=prescribed_motion(d,lead,kb)
                    if own_stuck_open:
                        if missing_key==0:a=12
                        else:b=12
                    if any(overlap(part,target) for part in pieces for target in shutters(a,b)):
                        event={'kind':'blocked','d':d};break
                    if potential_contact(pieces):event={'kind':'potential_contact','d':d};break
                assert event is not None
                assert event['kind']==('potential_contact' if own_stuck_open else 'blocked')
                missing_key_paths.append({'missing_key':missing_key,'own_shutter_stuck_open':own_stuck_open,'lead':lead,'nominal_roll_only':True,'event':event,'note':'Imposed identity law only; combined fault is not a physical independence proof'})
    assert isinstance(missing,list) and isinstance(early_miss,list)
    out={'meaning':'Finite rigid-envelope study only; prescribed shutter motion, no physical key/latch/force/whole-kit validation',
      'candidate_probe_samples':count,'potential_contact_samples':contacts,'candidate_probe_hits':hits,
      'candidate_probe_miss_examples':missing,'early_tilted_potential_contact_samples':early_total,'early_probe_miss_examples':early_miss,
      'candidate_probe_miss_counts':[contacts-h for h in hits],
      'generic_paths_imposed_shutter_positions':paths,'baseline_outer_envelope_only_docked_probe_hits':baseline_hits,
      'missing_key_paths_imposed_identity_law':missing_key_paths,
      'continuous_coverage':'NOT_PROVEN','frame_and_real_linkage':'Not included in this sweep; kernel crosschecks separate',
      'elapsed_seconds':round(time.monotonic()-started,3)}
    out['provenance']={name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in ['protocol.json','run_sweep.py','collision.py']}
    (HERE/'sweep-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'samples':count,'potential_contact_samples':contacts,'probe_miss_counts':out['candidate_probe_miss_counts'],'early_tilt_cases':early_total,'generic_fault_path_groups':len(paths),'missing_key_paths':len(missing_key_paths),'negative_controls_detected':True,'elapsed_seconds':out['elapsed_seconds']}))
    # A candidate miss is a research finding, not an instruction to alter the protocol.
if __name__=='__main__':main()
