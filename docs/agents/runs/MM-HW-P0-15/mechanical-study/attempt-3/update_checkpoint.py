"""Canonical P0-15 checkpoint only; no approval, gate or builder lease changes."""
import json,copy
from pathlib import Path
HERE=Path(__file__).resolve().parent
PREFIX='electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-3/'
def main():
    for name in ('BOX08-RESEARCH-REVIEW.md','BOX08-SCOPE-DISPOSITION.md','final-checks.json','snapshot.json'):assert (HERE/name).is_file(),name
    p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));cfg=copy.deepcopy(q['hardware_configurations'])
    t=next(x for x in q['tasks'] if x['id']=='MM-HW-P0-15')
    assert t['status']=='in_progress' and t['writer']=='codex_lead' and t['write_lease'] is None
    for name in ('REPORT.md','BOX01-SCOPE-AUDIT.md','OBLIGATIONS-AND-FAULT-SCOPE.md','BOX08-RESEARCH-REVIEW.md','BOX08-SCOPE-DISPOSITION.md'):
        ref=PREFIX+name
        if ref not in t['input_refs']:t['input_refs'].append(ref)
    for name in ('REPORT.md','centered-witness-reference.xbf','OBLIGATIONS-AND-FAULT-SCOPE.md'):
        ref=PREFIX+name
        if ref not in t['deliverables']:t['deliverables'].append(ref)
    t['review']={'verdict':'insufficient_evidence','reference':PREFIX+'BOX08-RESEARCH-REVIEW.md','scope':'Bounded research snapshot accepted; whole P0-15 design, exact AA configuration and B1 remain unaccepted.'}
    t['verification']={'verdict':'insufficient_evidence','reference':PREFIX+'final-checks.json','scope':'Executed limited graph/arithmetic/native-CAD fixtures, not complete circuit/kinematic/physical protection.'}
    t['snapshot']={'kind':'file-hashes','reference':PREFIX+'snapshot.json'}
    t['history'].extend([
      {'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-11','actor':'codex_lead','attempt':t['attempt'],'reason':'Freeze21-file research attempt3 and independently review electrical cut-sets, native face-witness refinement, synthetic static-tail limits; architecture audit traces requirements without creating gates.'},
      {'event':'transition','from':'in_review','to':'in_progress','at':'2026-11-11','actor':'codex_lead','attempt':t['attempt'],'reason':'Record bounded research acceptance and scope disposition. Keep complete topology/fault-domain/MAX timing and transition/contact-gap/fit/BOM work open in same task. No r12 or D10 supersession, product adoption or B1 lease.'}])
    assert cfg==q['hardware_configurations'] and p.read_bytes()==raw
    (HERE/'queue-checkpoint-before.json').write_bytes(raw)
    p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'task':t['id'],'status':t['status'],'hardware_registry_unchanged':True,'write_lease':None}))
if __name__=='__main__':main()
