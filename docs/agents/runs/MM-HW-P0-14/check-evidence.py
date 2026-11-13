"""Offline documentary checks; never hardware qualification or gate PASS."""
import hashlib,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[4]
sources=json.loads((root/'docs/research/downloads/p0-14/sources.json').read_text(encoding='utf-8'))
checks=[]
for row in sources:
    p=root/row['path']; data=p.read_bytes()
    assert hashlib.sha256(data).hexdigest()==row['sha256'],p
    assert len(data)==row['bytes'],p
    if row['expected_format']=='pdf': assert data.startswith(b'%PDF-'),p
    checks.append({'path':row['path'],'sha256':row['sha256'],'bytes':len(data),'hash_match':True})
r12=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
assert hashlib.sha256(r12.read_bytes()).hexdigest()=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
c=100e-6;v=5.25;r=10100;i=10e-6;target=.8
values={'allocated_output_power_W':v*.5,'allocated_eta':.8,
 'allocated_input_A_at_3V':v*.5/(.8*3),
 'allocated_input_A_at_3V3':v*.5/(.8*3.3),
 'conditional_C_100uF_energy_J':.5*c*v*v,
 'conditional_C_1mF_energy_J':.5*.001*v*v,
 'conditional_one_bleed_open_no_injection_s':r*c*math.log(v/target),
 'conditional_one_bleed_open_10uA_injection_s':r*c*math.log((v-i*r)/(target-i*r)),
 'conditional_residual_equilibrium_V':i*r,
 'weak_cell_counterexample_V':3.3-1.45-1.45,
 'M2_allocated_gap_mm':11.8-9.6-.2}
assert abs(values['allocated_input_A_at_3V']-1.09375)<1e-12
assert values['weak_cell_counterexample_V']<1.0
out={'meaning':'source hashes and conditional arithmetic only; hardware NOT_RUN, no gate PASS',
 'sources':checks,'r12_unchanged':True,'conditional_values':values}
(Path(__file__).parent/'evidence-check.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
