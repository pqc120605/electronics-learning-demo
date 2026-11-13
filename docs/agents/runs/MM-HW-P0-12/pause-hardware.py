from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[4];run=Path(__file__).resolve().parent
qpath=Path('D:/StartupOS/docs/agents/tasks.json')
q=json.loads(qpath.read_text(encoding='utf-8-sig'))
before=run/'before-founder-pause-tasks.json'
if not before.exists():before.write_bytes(qpath.read_bytes())
q['policy']['hardware_work_pause']={'active':True,'requested_by':'user','date':'2026-11-10','request_verbatim':'Tạm dừng và đóng gói lại tiến độ Hardware hiện tại','scope':'Hardware execution/research/design/dispatch paused; packaging only. Software unrelated to hardware unchanged.','resume_condition':'Founder explicitly resumes hardware; inspect handoff/current queue and reissue only the authorized scope.'}
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-12')
if t['status']!='waiting':
    old=t['status'];t['status']='waiting'
    t['history'].append({'event':'transition','from':old,'to':'waiting','at':'2026-11-10','actor':'codex_lead','attempt':t.get('attempt',1),'reason':'Founder explicitly paused hardware and requested packaging. Work unfinished; no preflight queue reconciliation or engineering closure inferred.'})
t['execution_requested']=False
t['waiting']={'owner':'Founder — resume authorization; Codex lead — handoff recovery','reason':'USER_PAUSED: hardware temporarily stopped. P0-12 documents/calculations prepared; independent QA and preflight registry reconciliation not completed. No r13 or lease.','resume_condition':'Founder explicitly resumes hardware; read HARDWARE-HANDOFF-2026-11-10.md, verify artifacts then scope the remaining work.','resume_state':'in_progress'}
t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/hardware/handoffs/2026-11-10/manifest.json'}
q['updated_on']='2026-11-10'
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'execution_requested':False,'hardware_pause':True,'queue_sha256':hashlib.sha256(qpath.read_bytes()).hexdigest()}))
