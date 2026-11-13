"""Reproduce the CHECK candidate and screen a physical return routing contract."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def reachable(edges, start, target):
    seen = set()
    remaining = [start]
    while remaining:
        node = remaining.pop()
        if node == target:
            return True
        if node in seen:
            continue
        seen.add(node)
        remaining.extend(right for left, right in edges if left == node)
    return False


def evaluate():
    old = json.loads((HERE.parent/'attempt-7'/'check-supply-results.json').read_text())
    guard = old['max_ingress_current_a_from_guard_model']
    alternative = guard+5e-6
    bleeder_max = 4_700*1.01
    valid_current = 2.7/bleeder_max-alternative
    to_output = lambda current: .2+current*7.5*25
    low,high=to_output(250e-6),to_output(7.25e-3)
    lower_error=.017
    upper_error=.022
    margins=[low-to_output(alternative)-lower_error,to_output(valid_current)-low-lower_error,
             high-to_output(.0065)-upper_error,to_output(.0075)-high-upper_error]
    assert min(margins)>0
    ina_min=1.85*.985
    linear_margin=ina_min-.1-to_output(.0075)-upper_error
    assert linear_margin>0
    loop_drop=2*7.5*1.004*.0065
    extra_power=alternative*7.2
    energy=old['total_usable_stored_energy_allocation_j']
    loss=2.7**2/bleeder_max-extra_power
    max_valid_time=energy/loss
    min_dwell_margin=.400-max_valid_time-.040
    assert min_dwell_margin>0

    # Any physical route tied to star after the shunt is deliberately a
    # counterexample to 'no backfeed', but it cannot fake current through A shunt.
    rows=[]
    for name,a_link,extra in [
        ('normal A return',True,()),
        ('open A return',False,()),
        ('status or shield tied to source-side star',False,(('cassette_A_return','star'),)),
        ('return transfers to B pre-shunt',False,(('cassette_A_return','B_pre_shunt'),)),
        ('negative, shield rejoins A pre-shunt',False,(('cassette_A_return','A_pre_shunt'),)),
    ]:
        edges=[('A_pre_shunt','star'),('B_pre_shunt','star'),('cassette_B_return','B_pre_shunt')]
        if a_link:
            edges.append(('cassette_A_return','A_pre_shunt'))
        edges.extend(extra)
        rows.append({'case':name,
                     'low_impedance_return_reaches_star':reachable(edges,'cassette_A_return','star'),
                     'low_impedance_return_can_reach_A_shunt':reachable(edges,'cassette_A_return','A_pre_shunt')})
    assert rows[0]['low_impedance_return_can_reach_A_shunt']
    assert not any(row['low_impedance_return_can_reach_A_shunt'] for row in rows[1:4])
    assert rows[-1]['low_impedance_return_can_reach_A_shunt']
    assert rows[2]['low_impedance_return_reaches_star']
    return {'scope':'Conditional component candidate arithmetic and directed return-path contract, no physical implementation',
            'alternative_current_cap_allocation_a':alternative,'valid_current_min_a':valid_current,
            'nominal_thresholds_v':[low,high],'decision_margins_after_allocated_error_v':margins,
            'linear_output_headroom_at_7p5mA_v':linear_margin,'loop_shunt_drop_upper_v':loop_drop,
            'supply_after_shunt_drop_from_4p75_v':4.75-loop_drop,
            'rail_valid_time_upper_s':max_valid_time,'dwell_margin_after_allocated_latency_s':min_dwell_margin,
            'return_paths':rows,
            'limits':['Edges assume current return direction and source-side star without a second upstream injection.',
                      'A shunt only sees current through its own conductor. A path to star can still sustain current and must be counted.',
                      'Caps, clamp, shield, test pads and optical breakdown must be inventoried in actual layout.',
                      'Allocation 5uA for unguarded paths and 40ms latency need qualified evidence.',
                      'Component ratings, transient recovery, load budget and physical fault separation remain open.']}


if __name__=='__main__':
    result=evaluate()
    (HERE/'check-design-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
