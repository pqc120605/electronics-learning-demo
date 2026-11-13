"""Replay the Box 02 DC proposal and screen amplifier output headroom."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def evaluate():
    old=json.loads((HERE.parent/'attempt-7'/'check-supply-results.json').read_text())
    stray=old['max_ingress_current_a_from_guard_model']
    resistor=4_700*1.01
    local_valid=2.7
    bleed=local_valid/resistor
    valid=bleed-stray
    shunt=24.9
    gain=25
    ref=.200
    low_threshold_current=250e-6
    lower_decision_error=.040
    signal=lambda current: ref+current*shunt*gain
    threshold=signal(low_threshold_current)
    invalid_max=signal(stray)+lower_decision_error
    valid_min=signal(valid)-lower_decision_error
    assert invalid_max<threshold<valid_min
    # TI specifies gain only in the stated linear output region. The low-
    # current decision budget must not be transferred to the upper limit.
    trial_max_current=.0065
    nominal_max_out=signal(trial_max_current)
    nominal_min_ina_supply=nominal_max_out+.1
    assert nominal_min_ina_supply>1.8 and nominal_min_ina_supply<4.75
    lower_range_shunt_drop=2*shunt*1.001*trial_max_current
    dwell_allocation=.400
    rail_loss_latency_allocation=.040
    stored_energy_time=old['cases'][1]['max_continuous_time_at_or_above_threshold_s']
    min_shunt_at_1p8=2*lower_decision_error/(gain*(valid-stray))
    max_shunt_at_1p8=(1.8-.1-ref)/(gain*trial_max_current)
    trial_low_voltage_shunt=8.2
    assert min_shunt_at_1p8<trial_low_voltage_shunt<max_shunt_at_1p8
    return {'scope':'Conditional DC and headroom arithmetic, not approved thresholds or qualified timing',
            'assumptions':['Bleeder sits directly across the monitored local input pair before conversion',
                           'Every alternate current path fits the 77.5611uA allocation',
                           'The two carrier shunts measure the actual distinct supply and return conductors'],
            'direct_bleeder_current_min_a':bleed,'valid_intended_current_min_a':valid,
            'lower_current_threshold_allocation_a':low_threshold_current,'lower_threshold_output_v':threshold,
            'bad_output_upper_with_allocated_error_v':invalid_max,'valid_output_lower_with_allocated_error_v':valid_min,
            'min_lower_decision_margin_v':min(threshold-invalid_max,valid_min-threshold),
            'trial_current_max_a':trial_max_current,'nominal_amplifier_out_at_trial_max_v':nominal_max_out,
            'nominal_ina_supply_floor_for_linear_output_v':nominal_min_ina_supply,
            'max_two_shunt_drop_at_trial_current_v':lower_range_shunt_drop,
            'remaining_input_before_other_drops_from_4p75_v':4.75-lower_range_shunt_drop,
            'alternative_1p8v_nominal_screen':{
                'minimum_shunt_for_nonoverlap_ohm':min_shunt_at_1p8,
                'maximum_shunt_for_nominal_linear_output_ohm':max_shunt_at_1p8,
                'trial_shunt_ohm':trial_low_voltage_shunt,
                'centered_threshold_current_a':(valid+stray)/2,
                'remaining_each_side_v':(valid-stray)*gain*trial_low_voltage_shunt/2-lower_decision_error,
                'scope':'Fixed allocated errors and nominal output range only. Neither selection nor verified tolerance budget.'},
            'dwell_margin_s_under_allocations':dwell_allocation-stored_energy_time-rail_loss_latency_allocation,
            'limits':['1.8V offset condition cannot be transferred to a 4.75V analog supply without bounding the change',
                      'Upper current comparator needs a separate error/overload budget and actual current envelope',
                      'An unintended return rejoining before the shunt can satisfy both current checks indefinitely',
                      'No measured timing or whole-matrix device max has been shown']}


if __name__=='__main__':
    result=evaluate()
    (HERE/'shunt-headroom-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
