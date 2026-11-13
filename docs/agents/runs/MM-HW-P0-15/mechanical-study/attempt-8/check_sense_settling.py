"""Bound first-order settling under explicit input capacitance allocations."""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent


def evaluate():
    previous = HERE.parent/'attempt-5'/'passive-sense-results.json'
    values = json.loads(previous.read_text(encoding='utf-8'))
    rth = values['hypothetical_allocations']['max_rth_ohm']
    initial_error_each = 5.5  # Separate upper bound for the magnitude at each node.
    initial_diff_error = 2*initial_error_each
    settled_diff_error = .002  # Study allocation for remaining dynamic error, in volts.
    trip_dc_lower = values['normal_trip_v'][0]
    minimum_gain = (1 - values['guard_tolerance'])/2
    # A low cell 20 mV below the lower DC trip remains at least 9.99 mV
    # below threshold at the differential input after the analog network settles.
    tested_cell_delta = .020
    final_diff_margin = tested_cell_delta * minimum_gain
    cases = []
    for cap_pf in (25, 100, 330, 1_000):
        tau = rth*cap_pf*1e-12
        t_settle = tau*math.log(initial_diff_error/settled_diff_error)
        cases.append({'capacitance_allocation_each_pf':cap_pf,
                      'pole_time_constant_s':tau,'dynamic_error_settling_upper_s':t_settle})
    assert final_diff_margin > settled_diff_error
    return {
        'scope':'Passive divider with two independent first-order input nodes, stiff tap and reference steps; allocations only',
        'rth_each_upper_ohm':rth,
        'initial_error_each_upper_v':initial_error_each,
        'dynamic_differential_error_allocation_v':settled_diff_error,
        'cases':cases,
        'finite_overdrive_case':{'cell_voltage_at_most_v':trip_dc_lower-tested_cell_delta,
                                 'settled_margin_at_least_v':final_diff_margin,
                                 'margin_after_allocated_dynamic_error_at_least_v':final_diff_margin-settled_diff_error},
        'limits':['Requires separate bounded input capacitances and source/reference impedance already included or negligible.',
                  'Input coupling, source ramps and comparator internal dynamics need separate bounds.',
                  'The finite overdrive test is an engineering example and changes no product threshold.',
                  'Arbitrarily small overdrive or slow approach gives no universal detection deadline.',
                  'Total trip also includes validity detector, latch, switching element and load current decay.'],
    }


if __name__ == '__main__':
    result = evaluate()
    (HERE/'sense-settling-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
