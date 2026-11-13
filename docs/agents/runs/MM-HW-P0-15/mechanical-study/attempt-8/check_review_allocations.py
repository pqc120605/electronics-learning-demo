"""Distinguish allocated budgets from whole-node and unmonitored-loop limits."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def evaluate():
    connector = json.loads((HERE.parent/'attempt-6'/'connector-allocation-results.json').read_text())
    source = json.loads((HERE.parent/'attempt-7'/'check-supply-results.json').read_text())
    whole_node = connector['previous_total_node_leak_budget_nA']
    connector_only = connector['remaining_connector_leak_nA_if_board_and_wiring_use_2p5nA']
    ir_cases = []
    for item in connector['test_floor_screen']:
        leakage = item['computed_sum_nA']
        ir_cases.append({'paths':item['hypothetical_parallel_leak_paths'], 'conditional_leakage_nA':leakage,
                         'within_whole_node_budget':leakage<=whole_node,
                         'within_connector_allocation':leakage<=connector_only})
    assert ir_cases[0]['within_whole_node_budget'] and not ir_cases[0]['within_connector_allocation']
    rail_min = source['rail_valid_min_allocation_v']
    rmax = 4_700*1.01
    extra_power = source['max_ingress_power_w_if_all_supply_loops_cross_guards']
    required_monitored_power = rail_min**2/rmax-extra_power
    fault_max = source['max_ingress_current_a_from_guard_model']
    loop_cases = []
    for monitored_vmax in (5.25, 7.2, 9., 14.4):
        lower = required_monitored_power/monitored_vmax
        loop_cases.append({'monitored_source_voltage_max_allocation_v':monitored_vmax,
                           'valid_current_lower_a':lower,'invalid_current_upper_a':fault_max,
                           'separation_before_measurement_error_a':lower-fault_max})
    assert loop_cases[1]['separation_before_measurement_error_a']>0>loop_cases[-1]['separation_before_measurement_error_a']
    return {'scope':'Lead corrected allocation labels and examined monitored source voltage sensitivity. Conditional arithmetic only.',
            'insulation_screen':{'whole_node_nA':whole_node,'connector_allocation_nA':connector_only,
                                 'cases':ir_cases},
            'current_screen':{'required_monitored_power_w':required_monitored_power,
                              'unmonitored_source_voltage_bound_v':source['allocated_max_driving_voltage_per_unmonitored_source_loop_v'],
                              'cases':loop_cases,
                              'ideal_separation_disappears_at_monitored_voltage_v':required_monitored_power/fault_max,
                              'limits':'Steady state and bounded unmonitored power only. The current monitor must see all intended-loop current, cannot share another domain return, and needs real accuracy and transition bounds.'}}


if __name__ == '__main__':
    result=evaluate()
    (HERE/'review-allocation-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
