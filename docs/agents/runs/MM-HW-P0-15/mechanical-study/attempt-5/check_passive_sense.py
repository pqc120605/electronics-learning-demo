"""Conditional design-space calculation for a current-limited sense harness."""
import itertools
import json
from pathlib import Path

GUARD = 604_000.0
TOLERANCE = .001
DRIVE_BOUND = 7.2
SENSE_ROUTES = 12
BIAS_ALLOCATION_A = 1.2e-9
BOARD_LEAK_ALLOCATION_A = 2.5e-9


def check():
    pair_min = 2 * GUARD * (1 - TOLERANCE)
    one_arm = DRIVE_BOUND / pair_min
    total_single_short = (SENSE_ROUTES + 1) * one_arm
    total_single_open = (SENSE_ROUTES - 1) * one_arm
    # The second resistor stays at the tap for one resistor-short fault.
    # Off-state paths may pull against a tap even with main load switches open.
    arm_min = pair_min
    arm_max = 2 * GUARD * (1 + TOLERANCE)
    error_current = BIAS_ALLOCATION_A + BOARD_LEAK_ALLOCATION_A
    trips = []
    for rh, rb, rl, rt in itertools.product((arm_min, arm_max), repeat=4):
        a = rb / (rh + rb)
        b = rt / (rl + rt)
        extra_error = error_current * (rh*a + rl*b)
        for low, bias, threshold, direction in itertools.product(
            (0., 4.35), (1.998, 2.002), (3.098, 3.102), (-1, 1)
        ):
            error = direction * (.010 + extra_error)
            trips.append((error - (a-b)*low - (1-a)*bias + (1-b)*threshold) / a)
    assert total_single_short < 100e-6
    assert min(trips) > 1.05 and max(trips) < 1.15
    # One shorted guard is an OFF-current case, not a normal precision case.
    # Cell at 0.8 V on an upper tap. The upper divider's tap arm halves.
    false_healthy = (2*4.0+2)/3 - (3.2+3.1)/2
    # High tap shorted after its intact guard to 3.3V is a stronger example.
    short_to_rail_false_healthy = 3.3 - 3.1/2
    assert false_healthy > 0 and short_to_rail_false_healthy > 0
    return {
        'scope':'Conditional sense architecture only. Main load cutoff, AON and safe storage duration are separate.',
        'guard_each_nominal_ohm':GUARD, 'guard_tolerance':TOLERANCE, 'assumed_delta_v_max':DRIVE_BOUND,
        'sense_routes':SENSE_ROUTES, 'per_route_normal_a':one_arm,
        'aggregate_intact_a':SENSE_ROUTES*one_arm, 'aggregate_one_guard_short_a':total_single_short,
        'aggregate_one_guard_open_a':total_single_open,
        'sense_only_remaining_to_research_100uA_a':100e-6-total_single_short,
        'charge_per_day_sense_only_mAh':total_single_short*24*1000,
        'normal_trip_corner_count':len(trips), 'normal_trip_v':[min(trips),max(trips)],
        'hypothetical_allocations':{
            'comparator_voltage_error_excluding_input_bias_v':.010,
            'input_bias_a':BIAS_ALLOCATION_A,'board_leakage_per_input_a':BOARD_LEAK_ALLOCATION_A,
            'max_rth_ohm':arm_max/2,
            'equivalent_insulation_ohm_at_7p2v':DRIVE_BOUND/BOARD_LEAK_ALLOCATION_A,
        },
        'fault_examples':{'cell_0p8_one_high_guard_short_delta_v':false_healthy,
                          'P_node_forced_3p3_delta_v':short_to_rail_false_healthy},
        'obligations':['Each route must cross both passive guards at the cell before exposed routing',
                       '7.2V must cover rail transients, clamps and stored energy during faults',
                       'A guard bridge that bypasses both resistors is outside the one-resistor-short model',
                       'Independent UV channels must detect faults that make one input falsely healthy',
                       'Board leakage, full-domain bias/offset and settling need evidence',
                       'No absolute safe storage time follows from this current limit'],
    }


if __name__ == '__main__':
    result = check()
    target = Path(__file__).with_name('passive-sense-results.json')
    target.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result))
