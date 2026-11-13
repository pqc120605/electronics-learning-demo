"""Conditional CHECK supply limits for a cassette-local dual monitor."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def evaluate():
    previous = HERE.parent/'attempt-5'/'passive-sense-results.json'
    sense = json.loads(previous.read_text(encoding='utf-8'))
    current = sense['aggregate_one_guard_short_a']
    guard_delta = sense['assumed_delta_v_max']
    loop_drive_max = 7.2  # Independent allocation for each unmonitored energy source.
    max_power = current * loop_drive_max
    valid_min = 2.7  # Study allocation, not a selected supervisor threshold.
    cap_max = 22e-6  # Total stored-energy allocation expressed as equivalent capacitance.
    initial_max = 5.5
    max_energy = .5 * cap_max * initial_max**2
    rows = []
    for nominal in (10_000, 4_700):
        rmax = nominal * 1.01
        rmin = nominal * .99
        threshold_loss = valid_min**2 / rmax
        net_loss = threshold_loss - max_power
        assert net_loss > 0
        normal_loop_current_floor = net_loss / loop_drive_max
        rows.append({
            'bleeder_nominal_ohm': nominal,
            'direct_injection_dc_ceiling_v': current * rmax,
            'power_bounded_dc_ceiling_v': (max_power * rmax)**.5,
            'max_continuous_time_at_or_above_threshold_s': max_energy / net_loss,
            'two_bleeders_current_at_5v_a': 2*5/rmin,
            'steady_intended_loop_current_floor_a': normal_loop_current_floor,
            'conditional_return_detection_margin_a': normal_loop_current_floor-current,
        })
    assert rows[1]['max_continuous_time_at_or_above_threshold_s'] < rows[0]['max_continuous_time_at_or_above_threshold_s']
    assert rows[0]['conditional_return_detection_margin_a'] < 0 < rows[1]['conditional_return_detection_margin_a']
    counterexample = valid_min / (4_700 * 1.01)
    assert counterexample > current
    return {
        'scope': 'Conditional rail energy bound. No selected components, relay timing or hardware qualification.',
        'max_ingress_current_a_from_guard_model': current,
        'allocated_max_guard_voltage_drop_v': guard_delta,
        'allocated_max_driving_voltage_per_unmonitored_source_loop_v': loop_drive_max,
        'max_ingress_power_w_if_all_supply_loops_cross_guards': max_power,
        'rail_valid_min_allocation_v': valid_min,
        'total_usable_stored_energy_allocation_j': max_energy,
        'cases': rows,
        'counterexample': {'description': 'An alternate return that bypasses guards can sustain the rail despite the bleed.',
                           'bleeder_only_sustain_current_at_2p7v_a': counterexample},
        'wire_budget': {'two_main': 2, 'two_monitor_supplies_and_returns': 4,
                        'two_floating_status_loops': 4, 'functional_lower_bound': 10},
        'limits': [
            'Current times resistance applies only when current is directly bounded at the bleeder node.',
            'Power bound includes every independently energized path and assumes every alternate loop crosses accounted guards.',
            'The energy limit covers all reservoirs able to sustain this rail, including upstream and shared capacitors.',
            'The return-detection comparison is steady-state only. It assumes every unmonitored supply loop fits the same power cap and the monitor measures the intended loop current without a bypass.',
            'Continuous above-threshold interval is not a total trip deadline or proof against later re-arming.',
            'Rail-invalid must force local permit off with a separately verified circuit.',
        ],
    }


if __name__ == '__main__':
    result = evaluate()
    (HERE/'check-supply-results.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result))
