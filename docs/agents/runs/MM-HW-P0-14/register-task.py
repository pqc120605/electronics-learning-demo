import json,hashlib
from pathlib import Path
run=Path(__file__).resolve().parent
qpath=Path('D:/StartupOS/docs/agents/tasks.json')
raw=qpath.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
assert not any(t['id']=='MM-HW-P0-14' for t in q['tasks'])
(run/'queue-before.json').write_bytes(raw)
t=json.loads(json.dumps(next(t for t in q['tasks'] if t['id']=='MM-HW-P0-13')))
t.update(id='MM-HW-P0-14',title='Three-AA NiMH and manual source/interface interlock research direction',
 status='in_progress',attempt=1,depends_on=[],
 input_refs=['electronics-learning-demo/docs/hardware/mobot-v2-p0-14-aa-founder-direction.json',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/task.md',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX01-SIMPLIFICATION-OPTION.md',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX08-SIMPLIFICATION-REVIEW.md'],
 allowed_paths=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/**',
 'electronics-learning-demo/docs/hardware/mobot-v2-p0-14-aa-founder-direction.json',
 'electronics-learning-demo/docs/hardware/mobot-v2-p0-14-aa-manual-interlock-proposal.md',
 'electronics-learning-demo/docs/research/downloads/p0-14/**'],
 deliverables=['electronics-learning-demo/docs/hardware/mobot-v2-p0-14-aa-manual-interlock-proposal.md',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/REPORT.md'],
 acceptance=['One source/cell/converter and mandatory source/interface separation proposal with bounded conditions, exact sources and explicit TBDs.',
 'No manual unplug instruction is represented as a proven interlock; full residual energy, bypass and single/common-fault cases identified.',
 'Wireless runtime, B01 family and G-B16/E1-E4 retained; fit, usability and whole-kit budget claims evidenced or unresolved.',
 'Independent exact-snapshot Box08 review; proposed gate migration only, no configuration approval, gate PASS/N/A or lease inferred.'],
 execution_requested=True,review=None,verification=None,waiting=None,completion_summary=None,
 snapshot={'kind':'pending','reference':None},
 authorization='Founder directly chose B: research three-AA NiMH/external charging/manual interlock Q2/Q3 direction. Lead sole writer, two read-only advisors; no final gate criteria, cell/MPN, configuration/hash or hardware build approval.',
 history=[{'event':'imported_snapshot','from':None,'to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Direct Founder B research-direction reply; bounded proposal work only, no inherited historical AA approval or gate/build authorization.'}])
assert qpath.read_bytes()==raw
q['tasks'].append(t);q['updated_on']='2026-11-10'
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':t['id'],'status':t['status'],'tasks':len(q['tasks']),'queue_sha256':hashlib.sha256(qpath.read_bytes()).hexdigest()}))
