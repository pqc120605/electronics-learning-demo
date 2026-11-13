import json,copy
from pathlib import Path
HERE=Path(__file__).resolve().parent
p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));cfg=copy.deepcopy(q['hardware_configurations'])
t=next(x for x in q['tasks'] if x['id']=='MM-HW-P0-15');assert t['status']=='in_progress' and t['writer']=='codex_lead' and t['write_lease'] is None
ref='electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-4/task.md';assert ref not in t['input_refs']
t['input_refs'].append(ref);t['authorization']+=' Founder requested finish on2026-11-11: integrate decision-ready source/conductor/interlock proposal under mechanical-study/attempt-4; lead-only writer, two read-only advisors, unchanged hardware/gate/approval/B1 boundaries.'
t['snapshot']={'kind':'pending','reference':None}
assert cfg==q['hardware_configurations'] and p.read_bytes()==raw
(HERE/'queue-before.json').write_bytes(raw);p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'id':t['id'],'status':t['status'],'hardware_registry_unchanged':True}))
