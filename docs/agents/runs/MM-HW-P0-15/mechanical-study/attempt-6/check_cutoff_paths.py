"""Check a two-domain cutoff contract with explicit bypass and residual paths."""
import json
from pathlib import Path


def connected(edges, source, target):
    pending = [source]
    seen = set()
    while pending:
        node = pending.pop()
        if node == target:
            return True
        if node in seen:
            continue
        seen.add(node)
        pending.extend(right for left, right in edges if left == node)
    return False


def evaluate():
    # Stage OFF is a contract: no high-current path in either direction.
    # Quantitative off leakage is tracked outside this ideal graph.
    rows = []
    for mode, a, b, bypass, aux in [
        ('fresh authorized RUN', 'ON', 'ON', False, False),
        ('weak cell, both trip', 'OFF', 'OFF', False, False),
        ('weak cell, A falsely healthy', 'ON', 'OFF', False, False),
        ('weak cell, B falsely healthy', 'OFF', 'ON', False, False),
        ('weak cell, A body diode reverse only', 'REV', 'OFF', False, False),
        ('weak cell, B body diode reverse only', 'OFF', 'REV', False, False),
        ('negative, shared bias makes both healthy', 'ON', 'ON', False, False),
        ('negative, bypass around both', 'OFF', 'OFF', True, False),
        ('negative, independent auxiliary left on', 'OFF', 'OFF', False, True),
    ]:
        edges = []
        for state, left, right in [(a, 'pack', 'middle'), (b, 'middle', 'load')]:
            if state == 'ON':
                edges.append((left, right))
            if state in ('ON', 'REV'):
                edges.append((right, left))
        if bypass:
            edges.extend([('pack','load'),('load','pack')])
        if aux:
            edges.append(('pack','auxiliary'))
        rows.append({'case':mode, 'stages':[a,b],
                     'main_power_path':connected(edges,'pack','load'),
                     'reverse_power_path':connected(edges,'load','pack'),
                     'unbounded_auxiliary_path':connected(edges,'pack','auxiliary')})
    assert all(not r['main_power_path'] and not r['reverse_power_path'] for r in rows[1:6])
    assert all(r['main_power_path'] for r in (rows[0],rows[6],rows[7]))
    assert rows[8]['unbounded_auxiliary_path'] and not rows[8]['main_power_path']
    # Opposite valid polarities for two cassette-local UV outputs. Thresholds
    # are allocations for the functional contract, not selected receiver limits.
    low_limit, high_limit, ground_offset = .4, 1.4, .2
    assert low_limit + ground_offset < high_limit
    tied_voltage, ground_a, ground_b = 1.4, 1.1, 0.
    assert tied_voltage - ground_a <= low_limit and tied_voltage - ground_b >= high_limit
    coil_cases = []
    for name, a, b, coil_bypass, welded in [
        ('RUN', True, True, (), ()),
        ('A false healthy', True, False, (), ()),
        ('B false healthy', False, True, (), ()),
        ('A contact welded', False, False, (), ('A',)),
        ('one post-gate coil branch bridged to pack', False, False, ('A',), ()),
        ('negative, shared coil feed bypass', False, False, ('A','B'), ()),
    ]:
        powered = {name: (a and b) or name in coil_bypass for name in ('A','B')}
        load = all(powered[name] or name in welded for name in ('A','B'))
        coil_cases.append({'case':name,'load_connected':load,'powered_coils':powered})
    assert all(not r['load_connected'] for r in coil_cases[1:5])
    assert all(not any(r['powered_coils'].values()) for r in coil_cases[1:4])
    assert coil_cases[4]['powered_coils']['A'] and coil_cases[5]['load_connected']
    return {'scope':'Ideal path contract for high-current routes. Contains no component or independent-fault qualification.',
            'cases':rows,
            'cross_gated_coil_cases':coil_cases,
            'opposite_polarity_interface_trial':{
                'A_valid_low_max_v':low_limit,'B_valid_high_min_v':high_limit,
                'ground_difference_allocation_v':ground_offset,
                'same_voltage_cannot_grant_both_if': 'Vhigh_min - Vlow_max > max(GND_A - GND_B)',
                'loss_of_reference_counterexample':{'tied_outputs_v':tied_voltage,'ground_a_v':ground_a,'ground_b_v':ground_b},
            },
            'implementation_obligations':[
                'Each UV channel has separate tap routing, reference, valid supply, latch and direct authority over one series stage',
                'A healthy stage can block in both directions at any relevant input and output voltage',
                'Lost or partial bias, backfeed, and rail ramp cannot maintain stage enable',
                'AON, coil/gate driver and monitor supply currents have separate OFF bounds',
                'Cell-to-cell and ground/connector paths are independently inventoried. The passive-sense current is not zero.',
                'A local fault must not drive both stages ON or bridge across both in the physical implementation',
            ]}


if __name__ == '__main__':
    result = evaluate()
    Path(__file__).with_name('cutoff-path-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'main_path_cases':len(result['cases']),'cross_gated_coil_cases':len(result['cross_gated_coil_cases'])}))
