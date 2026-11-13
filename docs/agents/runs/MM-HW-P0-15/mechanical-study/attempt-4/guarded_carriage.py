"""Keep a trial slider update on its current side of all stationary gate material."""

import json
from pathlib import Path

from endpoint_geometry import (
    adapter_base, cam, classify, contact_status, forbidden, gate_carriage,
    gate_intervals, interval_template, moved, solve_intervals, translation_interval,
)


def advance_carriage(cam_intervals, gate_intervals, previous, tolerance=1e-6):
    """Return the next displacement, or None if material separates it from the prior state.

    This checks a fixed-orientation, one-axis update. A moving gate or a changing
    input pose needs its own swept-motion check.
    """
    if any(lo + tolerance < previous < hi - tolerance for lo, hi in gate_intervals):
        return None
    proposed, _ = solve_intervals([*cam_intervals, *gate_intervals], previous)
    if proposed is None:
        return None
    start, end = sorted((previous, proposed))
    for lo, hi in gate_intervals:
        if max(start, lo) < min(end, hi) - tolerance:
            return None
    return proposed


def replay_case(case):
    """Replay the reviewed path and check each accepted linear segment."""
    sides = [side for side in (1, -1) if side != case['removed_side']]
    adapter = adapter_base()
    templates = {side: [interval_template(cam(side), part, side) for part in adapter]
                 for side in sides}
    gates = {side: gate_intervals(side, case['ha'], case['hb'], case['omitted_endpoint_material'])
             for side in sides}
    previous = dict.fromkeys(sides, 0.)
    previous_depth = -20.
    step = case['step_mm']
    contacts = segments = 0
    for index in range(round(26.4 / step) + 1):
        depth = round(-20 + index * step, 9)
        next_positions = {}
        for side in sides:
            intervals = [bound for item in templates[side]
                         if (bound := forbidden(item, depth)) is not None]
            next_positions[side] = advance_carriage(intervals, gates[side], previous[side])
        if any(position is None for position in next_positions.values()):
            break
        current_adapter = [moved(part, (0, depth, 0)) for part in adapter]
        current_doors = [part for side in sides for part in gate_carriage(side, next_positions[side])]
        if any(classify(a, b) == 'interpenetrating' for a in current_adapter for b in current_doors):
            break
        if index:
            for side in sides:
                direction = (-side * (next_positions[side] - previous[side]), depth - previous_depth, 0)
                for door in gate_carriage(side, previous[side]):
                    for part in adapter:
                        start = moved(part, (0, previous_depth, 0))
                        interval = translation_interval(door, start, direction)
                        assert interval is None or max(0, interval[0]) >= min(1, interval[1]) - 1e-6, (
                            case['case'], previous_depth, depth, door['label'], part['label'], interval)
            segments += 1
        contacts += contact_status(current_adapter, depth)
        previous, previous_depth = next_positions, depth
    assert contacts == case['potential_contact_samples'], case['case']
    return {'case': case['case'], 'contact_samples': contacts, 'checked_linear_segments': segments}


if __name__ == '__main__':
    # Box 08's finite forbidden interval. The previous solver jumps across it.
    cams = [(0.0, 1.5)]
    gates = [(1.0, 2.0)]
    assert solve_intervals(cams + gates, .5)[0] == 2.0
    assert advance_carriage(cams, gates, .5) is None
    assert advance_carriage([(0.0, .9)], gates, .5) == .9
    assert advance_carriage([(0.0, 1.0)], gates, .5) == 1.0
    assert advance_carriage([], gates, 1.5) is None
    here = Path(__file__).resolve().parent
    reviewed = json.loads((here/'endpoint-geometry-results.json').read_text(encoding='utf-8'))
    cases = [replay_case(case) for case in reviewed['cases']]
    result = {'scope': 'Guarded replay of the nine reviewed reference paths', 'cases': cases,
              'checks_passed': 4, 'original_counterexample_rejected': True,
              'total_checked_linear_segments': sum(case['checked_linear_segments'] for case in cases)}
    (here/'guarded-carriage-results.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in result.items() if key != 'cases'}))
