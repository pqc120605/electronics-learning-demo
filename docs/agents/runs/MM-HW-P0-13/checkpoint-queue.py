import json,hashlib,subprocess
from pathlib import Path
run=Path(__file__).resolve().parent;root=Path('D:/StartupOS');queue=root/'docs/agents/tasks.json'
raw=queue.read_bytes();q=json.loads(raw.decode('utf-8-sig'))
(run/'queue-before-checkpoint.json').write_bytes(raw)
registry_before=json.dumps(q['hardware_configurations'],sort_keys=True)
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-13');assert t['status']=='in_progress'
assert 'waiting' in q['allowed_transitions'][t['status']]
t['history'].append({'event':'transition','from':'in_progress','to':'waiting','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Bounded engineering cycles and independent reviews returned. Logical findings resolved only; current mechanical capture and H3/domain evidence insufficient. New material architecture direction, or a viable bounded topology/source-data path, is needed; no repeated dispatch of failed mechanisms.'})
t['status']='waiting'
t['waiting']={'owner':'Founder — possible material study-direction change; Codex lead — bounded topology/source evidence',
 'reason':'DESIGN_EVIDENCE_REQUIRED: four schematic gates remain OPEN after engineering proposals and reviews. Current guard paths do not prove actual capture; H3/source-domain bounds unresolved. See P0-13 REPORT and NEXT-DIRECTION. No build approval.',
 'resume_condition':'Founder chooses next research direction (AA alternative requires explicit Q2/Q3/scope change), or new applicable bounded topology/manufacturer evidence is available for the retained direction; lead scopes the next finite work without granting a lease.',
 'resume_state':'in_progress'}
t['review']={'verdict':'changes_requested','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX08-FEASIBILITY-FINAL.md',
 'scope':'Independent proposal feasibility review; separate logical fixes accepted in BOX08-STATE-MODEL-FINAL.md. No hardware gate acceptance.'}
t['verification']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/REPORT.md',
 'scope':'Reproducible conditional arithmetic and logical-model checks only; no physical timing, device or gate proof.'}
t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/snapshot.json'}
b=next(t for t in q['tasks'] if t['id']=='MM-HW-MOBOT-REMOTE-KICAD-001')
assert b['status']=='waiting' and not b.get('write_lease')
b['waiting']['reason']='B1 NOT_READY. Current engineering dossier is P0-13 after r12 proposed; four schematic design gates OPEN, H3/domain/capture evidence incomplete. G-B/M-A study directions already chosen;1ms exception only authorized for analysis. Existing r11 task configuration binding is historical and must be reconciled to an independently reviewed, Founder-approved final target and trusted baseline before any lease.'
assert json.dumps(q['hardware_configurations'],sort_keys=True)==registry_before
assert queue.read_bytes()==raw
written=(json.dumps(q,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
queue.write_bytes(written)
r=subprocess.run(['node',str(root/'docs/agents/validate.mjs')],capture_output=True,text=True,encoding='utf-8')
(run/'queue-validation.json').write_text(r.stdout+r.stderr,encoding='utf-8')
if r.returncode:
    if queue.read_bytes()==written:queue.write_bytes(raw)
    raise RuntimeError('Queue validation failed; reverted own checkpoint mutation')
(run/'queue-after-checkpoint.json').write_bytes(written)
print(json.dumps({'task':t['id'],'status':t['status'],'queue_validator_exit':r.returncode,'configuration_registry_unchanged':True,'queue_sha256':hashlib.sha256(written).hexdigest()}))
