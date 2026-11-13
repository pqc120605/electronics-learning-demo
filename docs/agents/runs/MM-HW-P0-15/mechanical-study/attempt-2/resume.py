import json,copy,hashlib
from pathlib import Path
here=Path(__file__).resolve().parent
assert hashlib.sha256((here.parent.parent/'mechanical-study-proposal.json').read_bytes()).hexdigest()=='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));cfg=copy.deepcopy(q['hardware_configurations'])
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15');assert t['status']=='waiting' and t['writer']=='codex_lead' and t['write_lease'] is None
t['status']='in_progress';t['waiting']=None;t['review']=None;t['verification']=None;t['snapshot']={'kind':'pending','reference':None}
t['authorization']='Founder requested continuation in HQ. Continue exact approved reference M5 CAD scope edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28, profile/contact exploration only under mechanical-study/attempt-2. Lead sole writer; two read-only domain advisors. No product configuration/MPN/FE/B1 or device permission.'
t['input_refs'].append('electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-2/task.md')
t['history'].append({'event':'transition','from':'waiting','to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':t['attempt'],'reason':'Direct continuation request; bounded contact-derived CAD/profile study in existing approved scope and independent source-protection research. Preserve all historical study artifacts; no operational gate or hardware permission change.'})
assert cfg==q['hardware_configurations'] and p.read_bytes()==raw
(here/'queue-before.json').write_bytes(raw);p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'hardware_configurations_unchanged':True}))
