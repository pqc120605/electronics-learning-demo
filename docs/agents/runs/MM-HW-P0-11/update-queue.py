from pathlib import Path
import copy,json,hashlib,sys
root=Path(__file__).resolve().parents[4];run=root/'docs/agents/runs/MM-HW-P0-11'
qpath=Path('D:/StartupOS/docs/agents/tasks.json')
q=json.loads(qpath.read_text(encoding='utf-8-sig'))
config=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if not (run/'before-snapshot.json').exists():
    (run/'before-snapshot.json').write_text(json.dumps({'queue_sha256':digest(qpath),'configuration_sha256':digest(config),'source':'Current user authorizes bounded paper design continuation; r12 remains frozen'},indent=2),encoding='utf-8')
task=next((x for x in q['tasks'] if x['id']=='MM-HW-P0-11'),None)
if task is None:
    task=copy.deepcopy(next(x for x in q['tasks'] if x['id']=='MM-HW-P0-10'))
    task.update(id='MM-HW-P0-11',title='Bounded H3/OFF analysis and GPIO/mechanical alternatives after C11',status='in_progress',execution_requested=True,review=None,verification=None,waiting=None,snapshot={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-11/packet-snapshot.json'},input_refs=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-10/REPORT.md'],allowed_paths=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-11/**','electronics-learning-demo/docs/hardware/mobot-v2-p0-11-*','electronics-learning-demo/docs/research/downloads/p0-11/**'],deliverables=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-11/REPORT.md'],authorization='Founder ok làm đi after lead proposed H3/OFF paper analysis plus GPIO/mechanical alternatives; no config/gate/MPN/lease/build/CAD/device changes.',history=[{'event':'imported_snapshot','from':None,'to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':'Explicit founder continuation authorizes lead documentary design; frozen r12, no builder lease.'}])
    q['tasks'].append(task)
if '--resume-directions' in sys.argv:
    task['status']='in_progress'
    task['review']=None
    task['input_refs'].append('electronics-learning-demo/docs/hardware/mobot-v2-p0-11-founder-directions.json')
    task['history'].append({'event':'transition','from':'in_review','to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':'Founder selected G-B and M-A analysis direction in HQ; implement documentary proposal details, no config/hash approval.'})
if '--review' in sys.argv:
    task['status']='in_review'
    task['history'].append({'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':'Bounded evidence and alternatives ready; engineering gaps remain, no design gate closure.'})
q['updated_on']='2026-11-10'
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(task['id'],task['status'],'r12',digest(config))
