"""Reproduce conditional advisory arithmetic; no component selection or hardware proof."""
import math,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
def main():
    guard_min=499*.999;test_min=100000*.999;test_max=100000*1.001
    rmin=40000*.8;rmax=40000*1.2
    tau=(test_max*2*rmax)/(test_max+2*rmax)*1e-9
    result={
      'test_current_upper_uA_at_abs_delta5_4V':5.4/test_min*1e6,
      'guard_one_resistor_shorted_upper_mA_at_abs_delta5_4V':5.4/guard_min*1e3,
      'open_H_unclipped_delta_lower_V':2*rmin*4.75/(test_max+2*rmin),
      'open_L_unclipped_delta_lower_V':rmin*4.75/(test_max+rmin),
      'healthy_pair_delta_upper_V_if_each_source2kOhm':2*5.25*2000/(test_min+2000),
      'passive_tau_upper_us_if_C_le1nF':tau*1e6,
      'passive_settling_to0_1percent_us':tau*math.log(1000)*1e6,
      'stuck_sense_nominal_uA_at3_6V':3.6/(80000+998)*1e6,
      'stuck_sense_nominal_mAh_per_day':3.6/(80000+998)*1000*24}
    assert 54<result['test_current_upper_uA_at_abs_delta5_4V']<54.1
    assert 10.8<result['guard_one_resistor_shorted_upper_mA_at_abs_delta5_4V']<10.84
    assert 1.852<result['open_H_unclipped_delta_lower_V']<1.854
    assert 1.150<result['open_L_unclipped_delta_lower_V']<1.152
    assert result['healthy_pair_delta_upper_V_if_each_source2kOhm']<.207
    assert 338<result['passive_settling_to0_1percent_us']<338.6
    out={'scope':'Arithmetic under explicit conditional assumptions only; no accepted threshold, timing or hardware topology','assumptions':{'guard_Ohm_each':499,'guard_count_per_line':2,'guard_tolerance':.001,'test_R_Ohm':100000,'test_R_tolerance':.001,'INA_internal_nominal_Ohm':40000,'INA_absolute_R_tolerance':.2,'test_rail_V':[4.75,5.25],'node_C_upper_F':1e-9,'healthy_source_upper_Ohm_each':2000,'reference':'0V for these formulas; not portable unchanged to midrail'},'calculated':result,'not_proven':['clipped output separation','cell reverse','DCIR guarantee','settling MAX of amplifier/comparator','all-temperature leakage','single stuck-on containment','total monitor current','physical fault timing']}
    (HERE/'power-bounds-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()
