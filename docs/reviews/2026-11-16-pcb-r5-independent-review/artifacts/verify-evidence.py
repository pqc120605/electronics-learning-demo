"""Verify the review package, not electrical or manufacturing correctness."""
import hashlib,json,re
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT.parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before=json.loads((ROOT/'snapshot-before.json').read_text(encoding='utf-8'))
assert all(sha(PROJECT/p)==h for p,h in before['hashes'].items()),'Review input changed'
checks=[]
cli='D:/StartupOS/.tools/kicad-10.0.7/bin/kicad-cli.exe'
base='docs/hardware/claude-support/2026-11-15-pcb-2layer-r5/kicad'
for board in ['handset','robot']:
    d=json.loads((ROOT/f'artifacts/{board}-drc.json').read_text())
    e=json.loads((ROOT/f'artifacts/{board}-erc.json').read_text())
    ec=sum(len(s.get('violations',[])) for s in e.get('sheets',[]))
    assert len(d['violations'])==len(d['unconnected_items'])==len(d['schematic_parity'])==ec==0
    for command,typ,result in [
      (f'"{cli}" sch erc --severity-all --exit-code-violations --format json -o <artifacts/{board}-erc.json> {base}/{board}/mobot-{board}.kicad_sch','erc',{'violations':ec}),
      (f'"{cli}" pcb drc --refill-zones --schematic-parity --severity-all --exit-code-violations --format json -o <artifacts/{board}-drc.json> {base}/{board}/mobot-{board}.kicad_pcb','drc',{'violations':0,'unconnected':0,'parity':0}),
      (f'"{cli}" sch export netlist --format kicadxml -o <artifacts/{board}-netlist.xml> {base}/{board}/mobot-{board}.kicad_sch','netlist',{'annotationWarning':board=='robot'}),
    ]:
        checks.append(dict(board=board,command=command,exitCode=0,result=result,
                           artifact=f'artifacts/{board}-{typ}.json' if typ!='netlist' else f'artifacts/{board}-netlist.xml'))
    strict=json.loads((ROOT/f'artifacts/{board}-strict-drc.json').read_text())
    assert not strict['ignored_checks'] and not strict['unconnected_items'] and not strict['schematic_parity']
    assert len(strict['violations'])=={'handset':4,'robot':2}[board]
    assert all(v['severity']=='warning' for v in strict['violations'])
    checks.append(dict(board=board,command=f'"{cli}" pcb drc --schematic-parity --severity-all --exit-code-violations --format json -o <artifacts/{board}-strict-drc.json> .tmp/agent-checks/MM-HW-R5-REVIEW-001/strict/{board}/mobot-{board}.kicad_pcb',
                       exitCode=5,expected='Diagnostic: source ignore levels promoted to warnings only in copy; libraries copied',
                       result={'warnings':len(strict['violations']),'unconnected':0,'parity':0},artifact=f'artifacts/{board}-strict-drc.json'))
    checks[-1]['warnings']=[{'type':v['type'],'items':[i['description'] for i in v['items']]} for v in strict['violations']]
sources=json.loads((ROOT/'artifacts/source-manifest.json').read_text(encoding='utf-8'))
for s in sources:
    if s.get('file'): assert sha(PROJECT/s['file'])==s['sha256']
broken=[]
for p in [ROOT/'report.md',ROOT/'sources.md']:
    for dest in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
        if re.match(r'https?://',dest): continue
        target,_,fragment=dest.partition('#')
        file=(p.parent/target).resolve()
        if not file.exists(): broken.append(str(file))
        elif re.fullmatch(r'L[0-9]+',fragment):
            assert int(fragment[1:])<=len(file.read_text(encoding='utf-8').splitlines()),dest
assert not broken,broken
report=(ROOT/'report.md').read_text(encoding='utf-8')
assert all(f'R5-0{i} —' in report for i in range(1,9))
assert 'CHANGES_REQUESTED' in report and 'NOT_RUN' in report
queue=json.loads((ROOT/'artifacts/queue-validation.json').read_text(encoding='utf-8-sig'))
assert not queue['errors'] and not queue['warnings']
data=dict(task='MM-HW-R5-REVIEW-001',at=datetime.now(timezone.utc).isoformat(),
    scope='Read-only design review and its evidence package; not a manufacturing release or hardware PASS',
    sourceSnapshot={'compared':len(before['hashes']),'changed':[],'reference':'snapshot-after.json'},
    checks=checks,readOnlyExtraction={'board-analysis':'exit 0 after API fixes','route-measurements':'exit 0'},
    gui={'application':'KiCad PCB Editor 10.0.7','bothBoardsOpened':True,'sourceCopiesOnly':True,
         'screenshots':['images/handset-kicad-gui.png','images/robot-kicad-gui.png']},
    designVerdict='changes_requested',findings={'high':1,'medium':6,'low':1},
    notRun={'physical':'No samples or measuring instruments: electrical, thermal, EMI, reverse-polarity, regen, USB backfeed, enclosure fit',
            'applicationTests':'No application software change','manufacturingRelease':'Not authorized; exact MPN, DFM and open design evidence unresolved'},
    documentationChecks={'localLinks':'pass','lineReferencesInRange':'pass','sourcePdfHashes':'pass'},
    queueValidation={'command':'node D:/StartupOS/docs/agents/validate.mjs','exitCode':0,
                     'tasks':queue['tasks'],'capabilities':queue['capabilities'],'errors':[],
                     'artifact':'artifacts/queue-validation.json',
                     'note':'Corrected this review task input references to include product directory; no hardware gate/config approval changed.'},
    pinnedPdfCount=sum(bool(s.get('file')) for s in sources),
    blockedPdfDownloads=[s['title'] for s in sources if s['status']=='local_download_blocked'])
(ROOT/'verification.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
hashes={p.relative_to(ROOT).as_posix():sha(p) for p in ROOT.rglob('*') if p.is_file() and p.name!='artifact-sha256.json'}
(ROOT/'artifact-sha256.json').write_text(json.dumps(hashes,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(inputFilesUnchanged=len(before['hashes']),commands=len(checks),
                     originalErcDrcExitCodes=[0,0,0,0],diagnosticExitCodes=[5,5],
                     localLinks='pass',artifacts=len(hashes))))
