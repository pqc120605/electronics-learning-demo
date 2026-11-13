import json,hashlib,copy
from pathlib import Path
run=Path(__file__).resolve().parent
root=run.parents[4]
proposal=run.parent/'mechanical-study-proposal.json'
assert hashlib.sha256(proposal.read_bytes()).hexdigest()=='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
receipt=json.loads((run/'founder-approval.json').read_text(encoding='utf-8'))
assert receipt['answer_verbatim']=='Duyệt nghiên cứu CAD M5'
p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
configs=copy.deepcopy(q['hardware_configurations'])
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15')
assert t['status']=='waiting' and t['execution_mode']=='lead' and t['write_lease'] is None
t['status']='in_progress';t['waiting']=None;t['review']=None;t['verification']=None
t['depth_change']='Reference CAD and bounded kinematic/collision research only; no product implementation, physical validation or live gate closure.'
t['authorization']='Direct Founder approved MOBOT-AA-M5-CAD-STUDY-r1 exact SHA256 edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28 in HQ. Receipt: electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/founder-approval.json. Lead-only reference CAD under the exact study folder; no B1 builder dispatch, physical build, MPN/handset approval, FE or dependency installation.'
t['input_refs']+=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study-proposal.json','electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/founder-approval.json']
t['snapshot']={'kind':'pending','reference':None}
t['history'].append({'event':'transition','from':'waiting','to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Founder approved exact-hash reference CAD study only. Previous research review remains in BOX08-REVIEW.md; new artifacts need fresh independent review. Operational hardware configuration registry and all live gates remain unchanged.'})
assert q['hardware_configurations']==configs and p.read_bytes()==raw
(run/'queue-before-resume.json').write_bytes(raw)
p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'study_hash_verified':True,'hardware_configurations_unchanged':True,'builder_lease':None,'scope':'lead reference CAD only'}))
