import json,copy,hashlib
from pathlib import Path
here=Path(__file__).resolve().parent;p=Path('D:/StartupOS/docs/agents/tasks.json')
raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));configs=copy.deepcopy(q['hardware_configurations'])
t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15');assert t['status']=='in_review' and t['write_lease'] is None
assert (here/'BOX08-STUDY-REVIEW.md').exists()
assert hashlib.sha256((here.parent/'mechanical-study-proposal.json').read_bytes()).hexdigest()=='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
t['review']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/BOX08-STUDY-REVIEW.md',
 'scope':'Independent closure for approved reference CAD research and documentary corrections only. Product adoption, physical mechanism and B1 remain insufficient_evidence.'}
t['verification']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/final-checks.json',
 'scope':'Artifact/provenance checks and observed finite sampled CAD/collision tests only. Tangency/continuous coverage and physical tests not proved.'}
t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/review-request-v2.json'}
t['status']='waiting'
t['waiting']={'owner':'Codex lead with Box02 electrical and Box03 mechanical evidence',
 'reason':'Approved M5 reference CAD study executed and independently accepted as research only. Current imposed-motion geometry is not adopted; real key/cam/pawl sequencing, tilted clearances, material/contact envelope, source fail-off/reset/reverse and product fit/BOM remain unresolved. No new Founder CAD approval is pending.',
 'resume_condition':'A bounded new mechanically realized proposal within the existing authorized reference-study scope, or a genuinely different bounded source-protection proposal, is ready for investigation. Do not replay rejected topology or treat study/queue checks as B1 approval. Material scope changes and product adoption require their own applicable approval.',
 'resume_state':'in_progress'}
t['history'].append({'event':'transition','from':'in_review','to':'waiting','at':'2026-11-10','actor':'codex_lead','attempt':1,
 'reason':'Reference CAD study completed within exact Founder permission; independent Box08 closed two documentary findings. Preserve same task and technical deficits; no false design completion, no pending repeat CAD-consent request and no live gate/MPN/B1 approval.'})
assert q['hardware_configurations']==configs and p.read_bytes()==raw
(here/'queue-before-checkpoint.json').write_bytes(raw)
p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out={'task':t['id'],'status':t['status'],'study_phase':'complete and independently reviewed','design':'not complete','B1':'NOT_READY','CAD_permission':'already granted and exercised, no repeat consent pending','hardware_configurations_unchanged':True,'queue_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(here/'queue-checkpoint.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
