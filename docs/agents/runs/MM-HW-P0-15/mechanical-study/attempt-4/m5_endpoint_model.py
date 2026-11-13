"""M5 endpoint subassembly reference, approved parametric study r1."""
import itertools
import json
import sys
from pathlib import Path

import build123d as bd
from cad import model

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from preflight import preflight
from endpoint_geometry import PARK, adapter_base, endpoint_parts, gate_carriage, moved
from m5_contact_model import native


def joined(pieces, label, color):
    solids = [native(piece) for piece in pieces]
    shape = solids[0].fuse(*solids[1:])
    assert len(shape.solids()) == 1, label
    shape.label = label
    shape.color = color
    return shape


def moving_parts(ha, hb, sa, sb):
    return [
        joined(gate_carriage(1, sa), 'Upper door and rigid gate bar', '#ea8c1c'),
        joined(gate_carriage(-1, sb), 'Lower door and rigid gate bar', '#db5f3c'),
        joined(endpoint_parts('A', ha), 'Endpoint A with two slots', '#327dcc'),
        joined(endpoint_parts('B', hb), 'Endpoint B with two slots', '#7259b6'),
    ]


def overlap_volume(a, b):
    overlap = a & b
    return 0.0 if overlap is None else overlap.volume


@model
def endpoint_reference_parked():
    preflight()
    parts = moving_parts(PARK, PARK, 12, 12)
    for a, b in itertools.combinations(parts, 2):
        assert overlap_volume(a, b) < 1e-7, (a.label, b.label)
    for poly in adapter_base():
        adapter_part = native(moved(poly, (0, 6.4, 0)))
        adapter_part.color = '#20a89c'
        for mechanism_part in parts[:4]:
            assert overlap_volume(adapter_part, mechanism_part) < 1e-7
        parts.append(adapter_part)
    return bd.Compound(children=parts)


@model
def endpoint_reference_closed():
    preflight()
    parts = moving_parts(0, 0, 0, 0)
    for a, b in itertools.combinations(parts, 2):
        assert overlap_volume(a, b) < 1e-7, (a.label, b.label)
    return bd.Compound(children=parts)


def check_native_intersections():
    results = []
    for name in ('A', 'B'):
        for side in (1, -1):
            gate = joined(gate_carriage(side, 12), 'gate', '#ea8c1c')
            for height, expect_overlap in [(PARK, False), (16.01, False), (15.99, True), (12, True)]:
                endpoint = joined(endpoint_parts(name, height), 'endpoint', '#327dcc')
                overlap = overlap_volume(gate, endpoint)
                assert (overlap > 1e-7) == expect_overlap, (name, side, height, overlap)
                results.append({'endpoint': name, 'side': side, 'height_mm': height,
                                'overlap_mm3': overlap, 'expected_positive_overlap': expect_overlap})
    return results


if __name__ == '__main__':
    preflight()
    parked = endpoint_reference_parked()
    closed = endpoint_reference_closed()
    result = {'scope': 'Native kernel checks of the reference subassembly',
              'parked_model_id': str(parked.id), 'closed_model_id': str(closed.id),
              'native_intersections': check_native_intersections()}
    (HERE/'endpoint-native-results.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'native_intersection_checks': len(result['native_intersections']),
                      'parked_model_id': str(parked.id), 'closed_model_id': str(closed.id)}))
