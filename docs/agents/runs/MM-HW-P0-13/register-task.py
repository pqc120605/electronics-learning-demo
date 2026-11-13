import json
from pathlib import Path
root=Path('D:/StartupOS');qpath=root/'docs/agents/tasks.json'
run=Path(__file__).resolve().parent
raw=qpath.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
assert not any(t['id']=='MM-HW-P0-13' for t in q['tasks'])
(run/'queue-before.json').write_bytes(raw)
t=json.loads(json.dumps(next(t for t in q['tasks'] if t['id']=='MM-HW-P0-12')))
t.update(id='MM-HW-P0-13',title='Engineering closure proposals for H3/OFF/MCU and M-A actuator toward B1',
    status='in_progress',kind='design',owner_role='hardware_kit_designer',writer='codex_lead',
    advisory_roles=['electronics_firmware_engineer','product_system_architect'],
    input_refs=['electronics-learning-demo/docs/hardware/HARDWARE-HANDOFF-2026-11-10.md',
      'electronics-learning-demo/docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json',
      'electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/task.md'],
    allowed_paths=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/**',
      'electronics-learning-demo/docs/hardware/mobot-v2-p0-13-closure-proposal.md',
      'electronics-learning-demo/docs/research/downloads/p0-13/**'],
    deliverables=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/REPORT.md',
      'electronics-learning-demo/docs/hardware/mobot-v2-p0-13-closure-proposal.md'],
    acceptance=['Integrated candidate topology/geometry, static and dynamic error/fault bounds and exact sources; missing values remain TBD.',
      'Independent Box08 review on exact snapshot, no lead gate PASS; concrete Founder decision packet if required.',
      'G-B16 roles UNASSIGNED, approved product directions unchanged; no hardware configuration approval or build lease.',
      'B1 is ready only after real design-gate closure, exact Founder hash approval and trusted eligible dispatch.'],
    execution_requested=True,attempt=1,review=None,verification=None,waiting=None,completion_summary=None,
    snapshot={'kind':'pending','reference':None},required_gates=[],
    gates={'software':'not_applicable','public':'not_applicable','hardware':'unknown'},
    authorization='Founder directly requests completion of engineering gaps toward four design-gate closures and B1 readiness. Proposal/research only until explicit exact configuration/hash and build scope approvals; lead sole writer, two read-only advisors.',
    history=[{'event':'imported_snapshot','from':None,'to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':1,
      'reason':'Explicit Founder request for remaining engineering work; bounded proposal scope, no pin/CAD/FE/KiCad/physical implementation approval.'}],
    execution_mode='lead',write_lease=None)
q['tasks'].append(t);q['updated_on']='2026-11-10'
assert qpath.read_bytes()==raw
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'id':t['id'],'status':t['status'],'scope':'proposal only','task_count':len(q['tasks'])}))
