"""M5 reference cassette linkage built from the tested swept solids."""
import itertools
import json
from pathlib import Path

import build123d as bd
from cad import model

from cassette_geometry import PARK, cassette, endpoint_parts, preflight
from m5_endpoint_model import adapter_base, joined, moved, moving_parts, native, overlap_volume

HERE = Path(__file__).resolve().parent


def scene(distance, height, shutter, adapter=False):
    preflight()
    parts = moving_parts(height, height, shutter, shutter)
    parts.append(joined(cassette(distance, extension=14), 'Cassette and rigid tongues', '#34a384'))
    for a, b in itertools.combinations(parts, 2):
        assert overlap_volume(a, b) < 1e-7, (a.label, b.label)
    if adapter:
        for poly in adapter_base():
            solid = native(moved(poly, (0, 6.4, 0)))
            solid.color = '#82c6dc'
            assert all(overlap_volume(solid, part) < 1e-7 for part in parts[:5])
            parts.append(solid)
    return bd.Compound(children=parts)


@model
def cassette_reference_seated():
    return scene(0, 0, 0)


@model
def cassette_reference_program():
    return scene(22, PARK, 12, adapter=True)


if __name__ == '__main__':
    seated = cassette_reference_seated()
    program = cassette_reference_program()
    checks = []
    for name, absent in [('A', ('B',)), ('B', ('A',))]:
        for height, distance, expected in [(.09, 0, False), (.11, 0, True),
                                           (PARK, 16.79, True), (PARK, 16.81, False)]:
            endpoint = joined(endpoint_parts(name, height), 'Endpoint', '#327dcc')
            battery = joined(cassette(distance, absent, extension=14), 'Cassette', '#34a384')
            volume = overlap_volume(endpoint, battery)
            assert (volume > 1e-7) == expected, (name, height, distance, volume)
            checks.append({'endpoint':name, 'height_mm':height, 'withdrawal_mm':distance,
                           'intersection_mm3':volume})
    result = {'seated_id':str(seated.id), 'program_id':str(program.id), 'native_checks':checks}
    (HERE/'cassette-native-results.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'seated_id':str(seated.id), 'program_id':str(program.id), 'native_checks':len(checks)}))
