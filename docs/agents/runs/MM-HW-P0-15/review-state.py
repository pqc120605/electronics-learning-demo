import json,copy,hashlib
from pathlib import Path
run=Path(__file__).resolve().parent;p=Path('D:/StartupOS/docs/agents/tasks.json')
raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));configs=copy.deepcopy(q['hardware_configurations'])
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15');assert t['status']=='in_progress' and t['write_lease'] is None
t['status']='in_review';t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/review-request.json'}
t['history'].append({'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Two bounded electrical/mechanical approaches and refinements returned, architecture separated accepted requirements from screening allocations. Integrated exact packet dispatched to independent Box08; design deficits remain, no gate acceptance or permission for CAD.'})
assert q['hardware_configurations']==configs and p.read_bytes()==raw
(run/'queue-before-review.json').write_bytes(raw)
p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'hardware_configurations_unchanged':True}))
