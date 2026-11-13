"""Conditional discharge/pull-down arithmetic only; no source-off deadline proof."""
import math,json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
def main():
    rmax=10100;cmax=120e-6;injection=1e-6;v0=5.4;target=.1
    floor=injection*rmax
    values={'pull_down_high_current_uA_at1_8V':1.8/99000*1e6,'max_node_injection_uA_for_VIL0_35_with101k':.35/101000*1e6,
      'bleed_floor_V':floor,'discharge_after_source_already_disconnected_s':rmax*cmax*math.log((v0-floor)/(target-floor)),
      'bleed_RUN_current_mA_at5_4V_Rmin9900':5.4/9900*1e3,'bank_A_LED_current_sum_mA':[12*5,12*30],
      'bank_B_boundary_LED_current_sum_mA':[8*5,8*30],'bank_B_with_one_output_LED_current_sum_mA':[9*5,9*30]}
    assert 4.96<values['discharge_after_source_already_disconnected_s']<4.963
    assert values['bleed_floor_V']<target
    out={'scope':'Conditional allocations, not total system current, bill of materials or guaranteed turn-off time','allocations':{'R_bleed_nominal_Ohm':10000,'R_tolerance':.01,'C_upper_F':cmax,'I_injection_upper_A':injection,'V_initial_upper':v0,'V_target':target,'pull_down_nominal_Ohm':100000,'pull_down_tolerance':.01},'values':values,'not_proven':['source isolation MAX time','injection allocation','capacitor inventory','logic rail VOH/VOL loaded','unpowered load-switch behavior','reverse and clamp faults','full battery-current conversion','thermal','physical hardware'], 'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    (HERE/'supply-allocation-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(values))
if __name__=='__main__':main()
