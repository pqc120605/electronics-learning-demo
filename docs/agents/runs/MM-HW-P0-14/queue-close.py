"""Close the reviewed research deliverable, carry all design deficits forward."""
import json,hashlib,copy
from pathlib import Path
run=Path(__file__).resolve().parent
qpath=Path('D:/StartupOS/docs/agents/tasks.json')
raw=qpath.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
configs=copy.deepcopy(q['hardware_configurations'])
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-14')
assert t['status']=='in_review' and t.get('write_lease') is None
assert not any(x['id']=='MM-HW-P0-15' for x in q['tasks'])
review=run/'BOX08-REVIEW.md'
assert review.exists() and '53f5f3bc95b6406ab58a623fc9924619c45889b677c200d5d659f530c71537c4' in review.read_text(encoding='utf-8')
assert 'insufficient_evidence' in review.read_text(encoding='utf-8')
t['review']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/BOX08-REVIEW.md',
 'scope':'Research-document quality only. Topology/configuration and hardware gates/B1 remain insufficient_evidence. No gate PASS or build approval.'}
t['verification']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/REPORT.md',
 'scope':'Six pinned source hashes, eight review packet hashes, conditional arithmetic and unchanged r12 checked fresh. No physical qualification.'}
t['completion_summary']='Research direction B documented and independently reviewed; AA architecture/MPN/fit/budget not accepted. All unresolved design obligations carried to MM-HW-P0-15; B1 NOT_READY.'
for a,b,reason in [('in_review','in_test','Independent Box08 accepted documentary research quality only; no hardware gate acceptance.'),
 ('in_test','done','Fresh source/packet hash and conditional arithmetic checks completed for the bounded research deliverable; design deficits are explicit follow-up, not waived.')]:
 t['history'].append({'event':'transition','from':a,'to':b,'at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':reason})
t['status']='done'
n=copy.deepcopy(t)
n.update(id='MM-HW-P0-15',title='AA source-protection and mandatory manual-isolation design closure after P0-14',
 status='scoped',attempt=1,depends_on=['MM-HW-P0-14'],execution_requested=False,
 input_refs=['electronics-learning-demo/docs/hardware/mobot-v2-p0-14-aa-founder-direction.json',
 'electronics-learning-demo/docs/hardware/mobot-v2-p0-14-aa-manual-interlock-proposal.md',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/BOX08-REVIEW.md',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-14/REPORT.md'],
 allowed_paths=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/**',
 'electronics-learning-demo/docs/hardware/mobot-v2-p0-15-aa-design-closure.md',
 'electronics-learning-demo/docs/research/downloads/p0-15/**'],
 deliverables=['electronics-learning-demo/docs/hardware/mobot-v2-p0-15-aa-design-closure.md',
 'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/REPORT.md'],
 acceptance=['Bound source protection including post-trip monitor/sense drain, finite startup, weak-cell, tap-open/reverse/short/fuse-open/default faults; no extra MCU GPIO or unreviewed D10 expansion.',
 'Mandatory manual isolation with real conductor inventory, independent double-break coverage, partial-plug corridor, force paths and single/common-fault cases; physical build remains forbidden.',
 'Define connector service-life requirement, traceable candidates, fit and complete robot+handset+external charger BOM; prices and missing evidence explicit.',
 'Independent exact-snapshot review; any new product/material tradeoff presented concretely to Founder before adoption; no live gate changes, configuration approval, lease or KiCad inferred.'],
 review=None,verification=None,waiting=None,completion_summary=None,
 snapshot={'kind':'pending','reference':None},
 readiness={'scope_complete':True,'inputs_available':False,'acceptance_defined':True,
 'missing':['A viable bounded low-drain source-protection direction after two P0-14 candidates failed; do not repeat the failed topology as if accepted.',
 'Exact connector and plug/contact envelope plus constrained mechanical proof plan; no unapproved CAD/FE.']},
 authorization='Follow-up scope under Founder AA/manual research direction. Scoped only, not dispatched; exact configuration/hash and resolved blockers still required before hardware build.',
 history=[{'event':'imported_snapshot','from':None,'to':'scoped','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Carry every P0-14 independent review design deficit forward with accountable owners; this task is not ready or active and is not a hardware lease.'}])
q['tasks'].append(n)
assert q['hardware_configurations']==configs
assert qpath.read_bytes()==raw
(run/'queue-before-close.json').write_bytes(raw)
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
result={'P0-14':'done: bounded research only','P0-15':'scoped: not dispatched','B1':'NOT_READY',
 'hardware_configurations_unchanged':True,'tasks':len(q['tasks']),'queue_sha256':hashlib.sha256(qpath.read_bytes()).hexdigest()}
(run/'queue-close-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
