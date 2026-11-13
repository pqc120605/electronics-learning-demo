"""Document/hash and conditional arithmetic checks only; no physical proof."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[4];run=Path(__file__).resolve().parent
old=json.loads((root/'docs/agents/runs/MM-HW-P0-14/snapshot.json').read_text(encoding='utf-8'))
for x in old['files']:
    assert hashlib.sha256((root/x['path']).read_bytes()).hexdigest()==x['sha256'],x['path']
src=json.loads((root/'docs/research/downloads/p0-15/cost-sources.json').read_text(encoding='utf-8'))
src+=json.loads((root/'docs/research/downloads/p0-15/design-sources.json').read_text(encoding='utf-8'))
for x in src:
    if x['status']!='PINNED':continue
    p=root/x['path'];assert len(p.read_bytes())==x['bytes']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==x['sha256']
r12=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
assert hashlib.sha256(r12.read_bytes()).hexdigest()=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
thermal_delta=1.1*370e-6*65
numbers={'detector_threshold_min_V_25C':1.1-.012,'detector_threshold_max_V_25C':1.1+.012,
 'conditional_threshold_min_V_full_T':1.1-.012-thermal_delta,
 'conditional_threshold_max_V_full_T':1.1+.012+thermal_delta,
 'release_min_V_25C':(1.1-.012)*1.04,'release_max_V_25C':(1.1+.012)*1.06,
 'conditional_detector_uAh_per_day_each_at_0_9uA':.9*24,
 'conditional_detector_mAh_per_30_days_each_at_0_9uA':.9*24*30/1000,
 'M4_proposed_probe_force_N':.055+.007*15+.025,
 'M4_proposed_remaining_engagement_mm':2.5-.10-.10-.15-.15,
 'M4_nominal_pawl_stress_MPa':100/(8*8)+6*(100*2)/(8*8**2),
 'conditional_generic_exposed_shell_margin_mm':6.51-6.4,
 'conditional_controlled_collar_margin_mm':12.5-6.4,
 'gpio_role_conductors_if_all_connected':5+3+1+3+4,
 'bridge_conductors_without_aux':5+3+1+3+4+2+1}
assert abs(numbers['M4_proposed_probe_force_N']-.185)<1e-12
assert abs(numbers['M4_nominal_pawl_stress_MPa']-3.90625)<1e-12
assert numbers['bridge_conductors_without_aux']==19
assert numbers['conditional_generic_exposed_shell_margin_mm']<.15
out={'kind':'documentary checks, not hardware validation','old_snapshot_files':len(old['files']),
 'old_snapshot_unchanged':True,'pinned_new_sources':sum(x['status']=='PINNED' for x in src),
 'source_failures':[{'path':x['path'],'reason':x.get('reason')} for x in src if x['status']!='PINNED'],
 'conditional_arithmetic':numbers,
 'r12_unchanged':True,'conditional_budget':{'VND_limit':1000000,'one_specific_out_of_stock_charger_bundle_VND':800000,
 'remaining_if_that_bundle_were_selected_VND':1000000-800000,'meaning':'Not an approved BOM or a claim that every charger costs this amount'},
 'hardware':'NOT_RUN'}
(run/'checks.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
