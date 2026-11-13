"""Create a scoped, inert hardware checkpoint. Never executes archived scripts."""
from pathlib import Path
import hashlib,json,zipfile

base=Path('D:/StartupOS').resolve();root=base/'electronics-learning-demo'
run=root/'docs/agents/runs/MM-HW-P0-12';out=root/'docs/hardware/handoffs/2026-11-10'
out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
queue=base/'docs/agents/tasks.json';qbytes=queue.read_bytes();q=json.loads(qbytes.decode('utf-8-sig'))
assert q['policy']['hardware_work_pause']['active'] is True
task=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-12')
assert task['status']=='waiting' and task['execution_requested'] is False
cfg=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
assert sha(cfg.read_bytes())=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
validation=json.loads((run/'pause-queue-validation.json').read_text(encoding='utf-8-sig'))
assert validation['errors']==[]
(out/'QUEUE-SNAPSHOT.json').write_bytes(qbytes)

entries={}
def add(p):
    p=p.resolve()
    if not p.is_file():return
    rel=p.relative_to(base).as_posix()
    pieces=rel.lower().split('/')
    if any(x in ['.git','.codex','.aws','node_modules','app'] or x.startswith('.env') for x in pieces):return
    if p.is_relative_to(out):return
    entries[rel]=p
def tree(folder):
    if folder.exists():
        for p in folder.rglob('*'):add(p)

for name in ['MM-HW-P0-10','MM-HW-P0-11','MM-HW-P0-12']:tree(root/'docs/agents/runs'/name)
for p in (root/'docs/hardware').glob('mobot-v2*'):
    if p.is_file():add(p)
add(root/'docs/hardware/HARDWARE-HANDOFF-2026-11-10.md')
for p in (root/'docs/mission-control').glob('hardware-config-mobot-v2*.json'):add(p)
for name in ['c11-r12','p0-11','p0-12','p0-08-2026-11-09']:tree(root/'docs/research/downloads'/name)
for p in (root/'docs/research/downloads').glob('*.pdf'):add(p)
for folder in (base/'docs/agents/runs').glob('MM-HW-P0-*'):tree(folder)
for folder in (base/'docs/agents/runs').glob('MM-HW-GATE-PREFLIGHT-*'):tree(folder)
for name in ['AGENTS.md','README.md','docs/mission-control/README.md','docs/mission-control/parallel-build-policy.md','docs/research/README.md']:add(root/name)
for name in ['AGENTS.md','docs/agents/README.md','docs/agents/roles.md','docs/agents/validate.mjs','docs/agents/validate.test.mjs','docs/mach-mo-product-master-2026-11-05.md','.github/instructions/mach-mo.instructions.md']:add(base/name)
for folder in ['2026-11-09-b1-readiness-checkpoint','2026-11-09-relay-R20261109-01','2026-11-09-relay-R20261109-PREFLIGHT-002','2026-11-09-relay-R20261109-PREFLIGHT-003']:
    add(root/'docs/claude-support'/folder/'review-result.md')
# Canonical queue bytes are frozen in both the package path and separate snapshot.
entries['docs/agents/tasks.json']=queue

readme='''# Hardware checkpoint — 10/11/2026

Hardware is USER_PAUSED. B1 is NOT_READY. Read electronics-learning-demo/docs/hardware/HARDWARE-HANDOFF-2026-11-10.md first.

This ZIP is a scoped documentary checkpoint, not a complete application checkout. It includes P0-10/P0-11/P0-12, relevant earlier hardware/preflight runs, configuration proposals, manufacturer evidence and a frozen queue snapshot. It excludes secrets, dependency caches, app source and sibling ReTrack/StartupOS app. It does not authorize running scripts, resuming work, writing hardware or sending content externally.

Current r12 remains proposed, SHA256 8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b. G-B and M-A directions are retained. P0-12 peer QA, preflight status reconciliation, full H3/OFF/MCU/mechanical proof and r13 remain unfinished. No CAD/FE/bench or new lease.

Two read-only Sol advisors returned results: c12_h3_bound researched TLV9031/LTC6702, and c12_gpio_constraints supplied role/reset/domain matrices. Their results are integrated into the four P0-12 documents; no new P0-12 QA was completed. The previous P0-11 QA must not be reused as P0-12 approval.

Paths inside ZIP are relative to D:/StartupOS. Prefer continuing in the existing workspace. Do not extract over a newer queue or source without comparing it. manifest.json hashes archive-entry bytes, not future live files. Old packet manifests remain historical and may include their then-live tasks.json hash.
'''
(out/'README-PACKAGE.md').write_text(readme,encoding='utf-8')
archive=out/'MACH-MO-HARDWARE-PAUSED-2026-11-10.zip'
records=[]
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
    for name,p in sorted(entries.items()):
        data=qbytes if name=='docs/agents/tasks.json' else p.read_bytes()
        z.writestr(name,data)
        records.append({'archive_entry':name,'sha256':sha(data),'bytes':len(data)})
    extras={'README-PACKAGE.md':readme.encode('utf-8'),'QUEUE-SNAPSHOT.json':qbytes}
    for name,data in extras.items():
        z.writestr(name,data);records.append({'archive_entry':name,'sha256':sha(data),'bytes':len(data)})
    manifest={'date':'2026-11-10','scope':'Hardware checkpoint only; USER_PAUSED, no auto-resume','configuration_sha256':sha(cfg.read_bytes()),'queue_sha256_at_pause':sha(qbytes),'files':records,'self_exclusion':'manifest.json not self-hashed; ZIP hash is in SHA256SUMS.txt'}
    mbytes=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    (out/'manifest.json').write_bytes(mbytes);z.writestr('manifest.json',mbytes)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert all(sha(z.read(r['archive_entry']))==r['sha256'] for r in records)
    assert z.read('manifest.json')==(out/'manifest.json').read_bytes()
ziphash=sha(archive.read_bytes())
(out/'SHA256SUMS.txt').write_text(f'{ziphash}  {archive.name}\n{sha(mbytes)}  manifest.json\n',encoding='utf-8')
summary={'archive':str(archive),'archive_sha256':ziphash,'archive_bytes':archive.stat().st_size,'entries_including_manifest':len(records)+1,'zip_CRC_check':'PASS','all_entry_hashes_match':True,'pause_queue_validation':validation,'source_r12_unchanged':True,'no_hardware_resume':True,'unfinished':['P0-12 independent QA','preflight001/002/003 registry reconciliation','fullH3/OFF/MCU/mechanical evidence','r13','B1 authorization/preflight']}
(out/'PACKAGE-VERIFICATION.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
