import json,copy
from pathlib import Path
run=Path(__file__).resolve().parent
p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15')
assert t['status']=='scoped' and t['execution_mode']=='lead' and t['write_lease'] is None
configs=copy.deepcopy(q['hardware_configurations'])
t['input_refs'].append('electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/task.md')
t['readiness']={'scope_complete':True,'inputs_available':True,'acceptance_defined':True,'missing':[]}
t['authorization']='Founder explicitly requested continuing P0-15 in HQ after P0-14 report. Bounded research/design proposals only; lead sole writer, two read-only domain branches; no configuration/hash/gate/build approval.'
t['execution_requested']=True
for a,b,reason in [('scoped','ready','Research inputs available; unresolved topology/geometry are outputs to investigate, not a demand for new Founder data.'),('ready','in_progress','Direct Founder continuation request; two independent read-only technical branches, no hardware builder lease.')]:
 t['history'].append({'event':'transition','from':a,'to':b,'at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':reason})
t['status']='in_progress'
assert q['hardware_configurations']==configs and p.read_bytes()==raw
(run/'queue-before.json').write_bytes(raw)
p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'hardware_configurations_unchanged':True,'lease':None}))
