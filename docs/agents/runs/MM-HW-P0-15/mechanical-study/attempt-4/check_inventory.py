"""Check requirement bookkeeping, not a schematic/pin map or electrical proof."""
import json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
def main():
    p=HERE/'interface-inventory.json';a=json.loads(p.read_text(encoding='utf-8'))
    roles=a['signal_roles'];assert len(roles)==len(set(roles))==16
    assert all('E'+str(i) in roles for i in range(1,5))
    assert len(a['power_and_return_roles'])==3 and len(roles)+3==a['functional_lower_bound']==19
    battery=next(x for x in a['interfaces_to_close'] if x['id']=='BATTERY_CASSETTE_INTERFACE')
    assert 2+battery['proposed_sense_leads']==battery['result_if_no_aux']==8
    out={'scope':'Interface bookkeeping only, not physical conductor count closure','retained_signal_roles':16,'logical_lower_bound':19,'battery_paths_if_six_sense_no_aux':8,'physical_pin_assignment':'UNASSIGNED','physical_conductor_count':'TBD, not inferred from 19 logical roles','inventory_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    (HERE/'inventory-checks.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
if __name__=='__main__':main()
