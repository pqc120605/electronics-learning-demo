"""Find where the off-current and measurement-error allocations overlap."""
import itertools
import json
from pathlib import Path

from check_passive_sense import GUARD, TOLERANCE, BIAS_ALLOCATION_A, SENSE_ROUTES, check


def injected_current_limit():
    """Worst opposing node currents allowed by the 1.05–1.15 V study window."""
    arms = [2 * GUARD * (1 + sign*TOLERANCE) for sign in (-1, 1)]
    limits = []
    for rh, rb, rl, rt in itertools.product(arms, repeat=4):
        a, b = rb/(rh+rb), rt/(rl+rt)
        for low, bias, threshold, direction in itertools.product(
            (0., 4.35), (1.998, 2.002), (3.098, 3.102), (-1, 1)
        ):
            trip = (direction*.010 - (a-b)*low - (1-a)*bias + (1-b)*threshold) / a
            margin = 1.15-trip if direction==1 else trip-1.05
            limits.append(margin*a/(rh*a+rl*b))
    return min(limits)


if __name__ == '__main__':
    current_limit = injected_current_limit()
    off_budget = check()['aggregate_one_guard_short_a']
    rows = []
    for voltage, board_nA in itertools.product((7.2, 9., 12.), (2.5, 5., 10.)):
        minimum = (SENSE_ROUTES + 1)*voltage/(2*(1-TOLERANCE)*off_budget)
        maximum = GUARD*current_limit/(BIAS_ALLOCATION_A + board_nA*1e-9)
        rows.append({'delta_v':voltage, 'allocated_board_leak_nA':board_nA,
                     'guard_each_min_ohm_from_off':minimum,'guard_each_max_ohm_from_uv':maximum,
                     'allocation_overlap':minimum<=maximum})
    assert rows[0]['allocation_overlap'] and not rows[2]['allocation_overlap']
    out = {'scope':'Conditional sensitivity, same topology and fixed reference/comparator allocations',
           'allocated_sense_off_budget_A':off_budget,
           'board_leak_limit_at_604k_nA':(current_limit-BIAS_ALLOCATION_A)*1e9,'cases':rows}
    target=Path(__file__).with_name('sense-feasibility-results.json')
    target.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(out))
