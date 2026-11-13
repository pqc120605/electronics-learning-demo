import hashlib, json
from pathlib import Path
run=Path(__file__).resolve().parent
product=run.parents[4]
root=product.parent
queue=root/'docs/agents/tasks.json'
(run/'queue-after-reconcile.json').write_bytes(queue.read_bytes())
paths=set(run.parent.glob('*.md'))|set(run.glob('*'))
paths.update([run.parent/'calculate.py',run.parent/'calculations.json',
    root/'docs/agents/validate.mjs',root/'docs/agents/validate.test.mjs',
    root/'docs/agents/runs/MM-HW-GATE-PREFLIGHT-003/snapshot.json',
    product/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json',
    product/'docs/claude-support/2026-11-09-relay-R20261109-PREFLIGHT-003/review-result.md',
    product/'docs/claude-support/2026-11-10-relay-R20261110-P0-10-P0-11/review-result.md',
    product/'docs/research/downloads/p0-11/adr4520_4525_4530_4533_4540_4550.pdf',
    product/'docs/research/downloads/p0-08-2026-11-09/esp32-series-v5.3.pdf'])
paths.update((product/'docs/research/downloads/p0-12').rglob('*'))
entries=[]
for p in sorted(paths):
    if not p.is_file() or p.name=='final-manifest.json':continue
    entries.append({'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
assert all(len(e['sha256'])==64 for e in entries)
config=next(e for e in entries if e['path'].endswith('hardware-config-mobot-v2-typec-r12-handset.json'))
assert config['sha256']=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
out={'date':'2026-11-10','scope':'P0-12 document/process REVIEW_REQUEST; no design gate verdict',
     'path_base':str(root),'relay_id':'R-20261110-P0-12-01','files':entries,
     'configuration_sha256':config['sha256'],'self_excluded':True}
(run/'final-manifest.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(entries),'manifest_sha256':hashlib.sha256((run/'final-manifest.json').read_bytes()).hexdigest()}))
