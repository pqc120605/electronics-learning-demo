"""Read-only evidence integrity checks; writes this attempt's verification result only."""
import json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[5]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
assert (ROOT/'AGENTS.md').is_file(),ROOT
checks=[]
for rel in ['docs/agents/runs/MM-HW-P0-15/snapshot.json',
            'docs/agents/runs/MM-HW-P0-15/mechanical-study/snapshot.json',
            'docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-2/checkpoint-snapshot.json',
            'docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-3/snapshot.json']:
    p=ROOT/rel; data=json.loads(p.read_text(encoding='utf-8-sig'))
    for row in data['files']:
        f=ROOT/row['path']; assert f.is_file() and sha(f)==row['sha256'],str(f)
    checks.append({'snapshot':rel,'files_unchanged':len(data['files'])})
for manifest in ['connector-source-manifest.json','tlv3502-source-manifest.json','tmux2821-source-manifest.json']:
    data=json.loads((HERE/manifest).read_text(encoding='utf-8'))
    rows=data if isinstance(data,list) else [data]
    for row in rows:
        f=ROOT/row['path']; assert sha(f)==row['sha256'] and f.stat().st_size==row['bytes'],str(f)
        assert f.read_bytes().startswith(b'%PDF-'),str(f)
        checks.append({'source':str(f.relative_to(ROOT)), 'sha256':sha(f),'bytes':f.stat().st_size})
r12=ROOT/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
assert sha(r12)=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
before=json.loads((HERE/'queue-before.json').read_text(encoding='utf-8-sig'))
now=json.loads(Path('D:/StartupOS/docs/agents/tasks.json').read_text(encoding='utf-8-sig'))
assert before['hardware_configurations']==now['hardware_configurations']
t=next(t for t in now['tasks'] if t['id']=='MM-HW-P0-15')
assert t['write_lease'] is None and t['writer']=='codex_lead'
capacity=json.loads((HERE/'interface-capacity-proposal.json').read_text())
total=sum(capacity[k] for k in ['retained_signal_roles','header_joy_power_routes','header_return_routes_max','usb_c_contact_routes_max','usb_shell_routes_max'])
assert total==capacity['proposed_route_bound']==46
assert capacity['candidate_contacts_per_breakpoint']-total==capacity['conditional_spare_capacity']==4
out={'scope':'Integrity/arithmetic only; no hardware/gate/B1 approval', 'prior_snapshots':checks,
     'r12_unchanged':sha(r12),'hardware_registry_unchanged':True,'P0_15_builder_lease':None,
     'conditional_interface_capacity':{'routes_max':total,'contacts_per_breakpoint':50,'spares':4}}
(HERE/'integrity-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'prior_snapshot_files_unchanged':sum(c.get('files_unchanged',0) for c in checks),'source_pdfs':sum('source' in c for c in checks),'r12_unchanged':True,'hardware_registry_unchanged':True,'conditional_routes':total}))
