"""Lead-only scoped queue administration; does not grant hardware permissions."""
import json,hashlib
from pathlib import Path
run=Path(__file__).resolve().parent
qpath=Path('D:/StartupOS/docs/agents/tasks.json')
raw=qpath.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-14')
assert t['status']=='in_progress' and t.get('write_lease') is None
proposal=run.parents[3]/'docs/hardware/mobot-v2-p0-14-aa-manual-interlock-proposal.md'
assert hashlib.sha256(proposal.read_bytes()).hexdigest()=='53f5f3bc95b6406ab58a623fc9924619c45889b677c200d5d659f530c71537c4'
configs=json.dumps(q['hardware_configurations'],sort_keys=True)
t['status']='in_review'
t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/review-request.json'}
t['history'].append({'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Both read-only advisors returned; integrated AA research proposal frozen at exact snapshot and dispatched once to independent Box08. No source-protection or mechanical gate acceptance inferred.'})
p13=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-13')
assert p13['status']=='waiting'
p13['waiting']['reason']='HISTORICAL_DIRECTION_FROZEN: Founder chose AA/manual research B, now tracked by MM-HW-P0-14. P0-13 Li-ion/electric guard and r12 evidence remain unchanged, not accepted for build.'
p13['waiting']['resume_condition']='Only explicit return to historical direction with new bounded evidence; continue AA research in MM-HW-P0-14, not by reopening failed P0-13 mechanisms.'
assert json.dumps(q['hardware_configurations'],sort_keys=True)==configs
assert qpath.read_bytes()==raw
(run/'queue-before-review.json').write_bytes(raw)
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'P0-14':'in_review','P0-13':'waiting/history updated','hardware_configurations_unchanged':True,'tasks':len(q['tasks'])}))
