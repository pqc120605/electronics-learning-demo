from pathlib import Path
import hashlib,json
run=Path(__file__).resolve().parent;product=run.parents[3];root=product.parent
assert product.name=='electronics-learning-demo'
config=product/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(config)=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
c=json.loads(config.read_text(encoding='utf-8-sig'))
assert len(c['verification_items'])==14
assert all(g['status']=='OPEN' for g in c['milestone_gates'] if g['stage']=='schematic')
external=c['external_design_gates']
assert isinstance(external,list) and len(external)==1
assert all(g['status']=='OPEN' for g in external)
paths=set(run.rglob('*'))|set((product/'docs/research/downloads/p0-13').rglob('*'))
paths.update([config,product/'docs/hardware/mobot-v2-p0-13-closure-proposal.md',
    product/'docs/hardware/mobot-v2-founder-decision-q1-q8.md',product/'docs/hardware/mobot-v2-founder-decision-q2-off.md',
    root/'docs/agents/validate.mjs',root/'docs/agents/validate.test.mjs'])
entries=[{'path':p.relative_to(root).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths) if p.is_file() and p.name!='snapshot.json']
result={'date':'2026-11-10','task':'MM-HW-P0-13','scope':'Documented engineering proposals, source pins, bounded arithmetic/logical models and independent review; NOT_READY',
        'configuration_sha256':sha(config),'hardware_gates_changed':False,'self_excluded':True,'files':entries}
(run/'snapshot.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert all(sha(root/e['path'])==e['sha256'] for e in entries)
print(json.dumps({'files':len(entries),'hash_mismatches':0,'four_schematic_gates':'OPEN','verification_items':14,'snapshot_sha256':sha(run/'snapshot.json')}))
