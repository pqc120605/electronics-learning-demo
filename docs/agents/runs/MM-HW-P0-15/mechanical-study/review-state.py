import json,copy,hashlib
from pathlib import Path
here=Path(__file__).resolve().parent;p=Path('D:/StartupOS/docs/agents/tasks.json')
raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));configs=copy.deepcopy(q['hardware_configurations'])
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15');assert t['status']=='in_progress' and t['write_lease'] is None
packet=json.loads((here/'review-request.json').read_text(encoding='utf-8'))
root=here.parents[4]
for x in packet['files']:assert hashlib.sha256((root/x['path']).read_bytes()).hexdigest()==x['sha256'],x['path']
t['status']='in_review';t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/review-request.json'}
for ref in ['electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/REPORT.md','electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/m5-program-reference.xbf']:
 if ref not in t['deliverables']:t['deliverables'].append(ref)
t['history'].append({'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Approved M5 reference CAD executed; four static reference models, sampled collision study and adversarial cases returned. Exact artifact packet frozen for independent Box08. Product mechanism and electrical design still unaccepted; no gate or B1 change.'})
assert q['hardware_configurations']==configs and p.read_bytes()==raw
(here/'queue-before-review.json').write_bytes(raw)
p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'review_packet_files':len(packet['files']),'hardware_configurations_unchanged':True}))
