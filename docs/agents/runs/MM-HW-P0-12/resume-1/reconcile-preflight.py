"""Lead applies reviewed metadata only; hardware configuration bytes remain unchanged."""
import hashlib, json, subprocess, sys
from pathlib import Path
run=Path(__file__).resolve().parent
product=run.parents[4]
queue=Path('D:/StartupOS/docs/agents/tasks.json')
validator=queue.parent/'validate.mjs'
testfile=queue.parent/'validate.test.mjs'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(validator)=='c03af0c170eb1eb894852921b6899331a8434e4c1b833ff089d479e4fe064bd7'
assert sha(testfile)=='dd380346fe4140870d186aadc7d6aae1481240f921eeead5d345d9ef2845f2c6'
c10=product/'docs/claude-support/2026-11-09-relay-R20261109-PREFLIGHT-003/review-result.md'
assert sha(c10)=='80c9453f529cc39928c16d1c4ae2c6de02093312e50c30d846efb97db26c4964'
assert 'PASS ở cấp document-only' in (run/'BOX08-RESULT.md').read_text(encoding='utf-8')
checks=[]
def check(args,name,expected=0):
    result=subprocess.run(args,cwd=product,capture_output=True,text=True,encoding='utf-8')
    (run/name).write_text(result.stdout+result.stderr,encoding='utf-8')
    checks.append({'command':args,'exit_code':result.returncode,'expected_exit_code':expected,'output':name})
    assert result.returncode==expected,(args,result.returncode)
    return result.stdout
check(['node',str(validator)],'validate-before.json')
check(['node','--test',str(testfile)],'validate-tests.txt')
dispatch=json.loads(check(['node',str(validator),'--dispatch-task','MM-HW-MOBOT-REMOTE-KICAD-001'],'dispatch-refused.json',1))
assert dispatch['dispatch_eligible'] is False
assert any('authorization' in x for x in dispatch['errors'])
calc=json.loads(check([sys.executable,str(run.parent/'calculate.py')],'fresh-calculations.json'))
assert calc==json.loads((run.parent/'calculations.json').read_text(encoding='utf-8-sig'))
raw=queue.read_bytes(); data=json.loads(raw.decode('utf-8-sig'))
(run/'queue-before-reconcile.json').write_bytes(raw)
byid={t['id']:t for t in data['tasks']}
def move(t,new,reason):
    old=t['status']; assert new in data['allowed_transitions'][old],(old,new)
    t['history'].append({'event':'transition','from':old,'to':new,'at':'2026-11-10','actor':'codex_lead','attempt':t.get('attempt',1),'reason':reason})
    t['status']=new;t['waiting']=None
for suffix in ['001','002']:
    t=byid['MM-HW-GATE-PREFLIGHT-'+suffix]
    move(t,'cancelled','Historical implementation superseded by PREFLIGHT-003; C03/C08 findings carried forward and addressed in C10-reviewed bytes. No hardware gate closure.')
    t['execution_requested']=False
    t['completion_summary']='Superseded by MM-HW-GATE-PREFLIGHT-003. Historical evidence retained; no independent PASS created for obsolete snapshots.'
    if suffix=='001':t['snapshot']={'kind':'file-hashes','reference':'docs/agents/runs/MM-HW-GATE-PREFLIGHT-001/snapshot.json'}
t=byid['MM-HW-GATE-PREFLIGHT-003']
t['deliverables']=['docs/agents/validate.mjs','docs/agents/validate.test.mjs','docs/agents/runs/MM-HW-GATE-PREFLIGHT-003/snapshot.json','electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/resume-1/DISPOSITION.md']
t['acceptance']=['Typed stages and trusted required gate IDs fail closed.', 'PASS references require configuration hash and registry-bound raw-byte review SHA256.', 'Hardware output without a lease and Windows 8.3 aliases are rejected; helper contract preserves proposal-loader checks.', 'Exact C10-reviewed code retained, fresh validator and 61 tests pass; actual KiCad dispatch remains rejected.', 'C10 Low reviewer identity limitation retained; independent source receipt required by process before any real gate envelope.']
t['review']={'verdict':'pass','reference':'electronics-learning-demo/docs/claude-support/2026-11-09-relay-R20261109-PREFLIGHT-003/review-result.md','scope':'C10 exact validator bytes, confirmed by Box01/Box08; process Low retained, no hardware gate verdict.'}
t['verification']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/resume-1/checks.json','scope':'Fresh queue, validator regression tests and rejected actual KiCad dispatch only.'}
t['gates']={'software':'pass','public':'not_applicable','hardware':'not_applicable'}
t['completion_summary']='C10-reviewed validator implementation closed after fresh 61/61 tests and independent document reconciliation. C10 Low/O1-O3 retained. r12 is not a trusted execution target; no hardware approval or gate PASS.'
t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/resume-1/final-manifest.json'}
for stage in ['in_review','in_test','done']:move(t,stage,'Reviewed exact C10 bytes; fresh software verification and native Box01/Box08 results recorded. Administrative closure only.')
t=byid['MM-HW-P0-12'];assert t['status']=='in_progress'
t['acceptance']=['Four P0-12 dossiers, calculation source and result reviewed independently on exact hashes; findings disposition retained.', 'G-B remains 16 roles and UNASSIGNED; H3 verdicts preserve conditional versus guaranteed bounds; budget does not double count JOY/bleed.', 'Historical preflight tasks superseded, 003 metadata corrected, fresh validator/tests/dispatch checks retained with C10 residual limits.', 'Final report, snapshot manifest and manual review request present; r12 unchanged, four design gates OPEN, no r13 or builder lease.']
t['review']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/resume-1/BOX08-RESULT.md','scope':'Independent document-only review of six unchanged P0-12 artifacts; not final external review or gate PASS.'}
t['verification']={'verdict':'pass','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/resume-1/checks.json','scope':'Math reproducibility and process software checks; physical tests NOT_RUN.'}
t['snapshot']={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/resume-1/final-manifest.json'}
move(t,'in_review','P0-12 documentary packet completed; independent native QA returned. Manual external review request prepared for Founder transfer, not sent. Hardware design gates remain OPEN.')
candidate=run/'queue-candidate.json';candidate.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
code="import fs from 'node:fs'; import {validateQueue} from 'file:///D:/StartupOS/docs/agents/validate.mjs'; const errors=validateQueue(JSON.parse(fs.readFileSync(process.argv[1],'utf8'))); console.log(JSON.stringify({errors})); if(errors.length)process.exitCode=1;"
check(['node','--input-type=module','-e',code,str(candidate)],'candidate-validation.json')
assert queue.read_bytes()==raw,'Concurrent queue change; refuse overwrite'
queue.write_bytes(candidate.read_bytes())
check(['node',str(validator)],'validate-after.json')
(run/'checks.json').write_text(json.dumps({'checks':checks,'validator_tests':61,'hardware':'NOT_RUN','configuration_changed':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'001':'cancelled','002':'cancelled','003':'done','P0-12':'in_review','checks':len(checks)}))
