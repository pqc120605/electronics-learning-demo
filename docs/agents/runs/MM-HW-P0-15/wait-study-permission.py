import json,copy,hashlib
from pathlib import Path
run=Path(__file__).resolve().parent;p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
configs=copy.deepcopy(q['hardware_configurations']);t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15')
assert t['status']=='in_review' and t['write_lease'] is None
assert hashlib.sha256((run/'mechanical-study-proposal.json').read_bytes()).hexdigest()=='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
assert (run/'BOX08-REVIEW.md').exists()
t['review']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/BOX08-REVIEW.md',
 'scope':'Research/disposition accepted only. Adoption/config/B1 insufficient_evidence; no live gate acceptance. Optional reference CAD study is sufficiently scoped to ask Founder exact-hash permission.'}
t['verification']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/REPORT.md',
 'scope':'Fresh documentary hashes and conditional arithmetic only, not hardware or CAD proof.'}
t['status']='waiting'
t['waiting']={'owner':'Founder for optional exact-hash CAD-study permission; Codex lead/Box02 for unresolved electrical design',
 'reason':'Separate reference-CAD study requires exact permission before any artifact. Current source-protection and M3/M4 topology are not accepted; electrical faults remain independently unresolved. No claim of completed P0-15 design or B1 readiness.',
 'resume_condition':'Founder explicitly authorizes MOBOT-AA-M5-CAD-STUDY-r1 bytes edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28, followed by bounded queue/config/preflight review before CAD; or lead has a genuinely different bounded electrical-research direction. Do not rerun rejected topology or treat permission as gate PASS.',
 'resume_state':'in_progress'}
t['history'].append({'event':'transition','from':'in_review','to':'waiting','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Independent Box08 accepted research disposition and permission-proposal scope. Preserve same P0-15 with design deficits, no new task or false completion; wait for exact reference-study permission before CAD. No source/config/gate/build approval inferred.'})
assert q['hardware_configurations']==configs and p.read_bytes()==raw
(run/'queue-before-waiting.json').write_bytes(raw)
p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out={'task':t['id'],'status':t['status'],'hardware_configurations_unchanged':True,'B1':'NOT_READY','CAD':'NOT_RUN / permission pending','tasks':len(q['tasks']),'queue_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(run/'queue-final-result.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
