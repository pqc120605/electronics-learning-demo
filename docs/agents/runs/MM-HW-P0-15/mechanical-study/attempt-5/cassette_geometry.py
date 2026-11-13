"""Parametric M5 study of cassette withdrawal against the reviewed endpoint rails."""
import itertools
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent), str(HERE.parent/'attempt-4')]
from preflight import preflight
from endpoint_geometry import PARK, endpoint_parts, moved, prism, translation_interval

WITHDRAWN = 8.0
TOP_OF_TRAVEL = 16.4
CONTACT_LAST_ALLOCATION = 2.0


def cassette(distance, absent=(), extension=0.):
    pieces = [prism('cassette envelope', -32, 32, 34, 88, 8, 30)]
    if 'A' not in absent:
        pieces.append(prism('A cassette tongue', -.9, -.2, 22.6-extension, 34.2, 12.1, 30))
    if 'B' not in absent:
        pieces.append(prism('B cassette tongue', 4.3, 5.2, 26.6-extension, 34.2, 12.1, 30))
    return [moved(part, (0, distance, 0)) for part in pieces]


def first_motion_contact(fixed, moving, direction, limit):
    hits = []
    for a, b in itertools.product(fixed, moving):
        span = translation_interval(a, b, direction)
        if span and max(0, span[0]) < min(limit, span[1]):
            hits.append((max(0, span[0]), a['label'], b['label']))
    return min(hits) if hits else None


def sweep(extension, withdrawal, last_contact):
    endpoints = ('A', 'B')
    rows = []
    # Analytic overlap across the entire distance/height rectangle. Each own
    # tongue covers its cross rail throughout the contact-connected interval.
    for endpoint in endpoints:
        tongue = next(p for p in cassette(0, extension=extension) if p['label'] == f'{endpoint} cassette tongue')
        rail = next(p for p in endpoint_parts(endpoint, 0) if p['label'] == f'{endpoint} cross rail')
        (tx, ty, tz), (rx, ry, rz) = tongue['bounds'], rail['bounds']
        assert max(tx[0], rx[0]) < min(tx[1], rx[1])
        assert ty[0] + last_contact < ry[1] and ty[1] > ry[0]
        assert rz[0] + TOP_OF_TRAVEL < tz[1]
        lowest_blocked_height = tz[0] - rz[1]
        earliest_release = ry[1] - ty[0]
        assert 0 < lowest_blocked_height < PARK
        assert earliest_release > last_contact
        rows.append({'endpoint':endpoint, 'blocking_above_mm':lowest_blocked_height,
                     'own_tongue_release_mm':earliest_release,
                     'margin_to_last_contact_allocation_mm':earliest_release-last_contact})

    cases = []
    for absent in [(), ('A',), ('B',), ('A','B')]:
        seated = cassette(0, absent, extension)
        withdrawn = cassette(withdrawal, absent, extension)
        parked = [p for endpoint in endpoints for p in endpoint_parts(endpoint, PARK)]
        lowered = [p for endpoint in endpoints for p in endpoint_parts(endpoint, 0)]
        lift = first_motion_contact(seated, lowered, (0,0,1), PARK)
        insert = first_motion_contact(parked, withdrawn, (0,-1,0), withdrawal)
        assert first_motion_contact(lowered, seated, (0,1,0), withdrawal) is None
        assert first_motion_contact(withdrawn, lowered, (0,0,1), PARK) is None
        assert first_motion_contact(withdrawn, parked, (0,0,-1), PARK) is None
        if len(absent) < 2:
            assert lift and lift[0] < .11
            assert insert and withdrawal - insert[0] > last_contact
        else:
            assert lift is None and insert is None
        cases.append({'absent_tongues':absent,'seated_lift_first_collision':lift,
                      'parked_insertion_first_collision':insert,
                      'insertion_stop_withdrawal_mm':withdrawal-insert[0] if insert else None})
    return {'extension_mm':extension, 'withdrawal_mm':withdrawal, 'last_contact_allocation_mm':last_contact,
            'analytic_barriers':rows, 'sweeps':cases,
            'normal_route_mm':[[0,0],[withdrawal,0],[withdrawal,PARK],[withdrawal,0],[0,0]]}


def check():
    preflight()
    baseline = sweep(0, WITHDRAWN, CONTACT_LAST_ALLOCATION)
    prior = HERE.parent/'attempt-4'/'connector-bounds-results.json'
    reference_cut = json.loads(prior.read_text())['values']['required_lift_without_mated_separation_credit_mm']
    extended = sweep(14, 22, reference_cut)
    # An actual connector that conducts past the allocated distance breaks the argument.
    partial = cassette(2.9, ('A',))
    endpoints = [p for endpoint in ('A','B') for p in endpoint_parts(endpoint, 0)]
    assert first_motion_contact(partial, endpoints, (0,0,1), PARK) is None
    return {'scope':'Rigid reference shapes and ideal linear guides', 'baseline':baseline, 'extended':extended,
            'counterexample':{'assumed_last_contact_mm':3.,'cassette_withdrawal_mm':2.9,
                              'absent_tongue':'A','park_reachable':True},
            'limitations':['2 mm baseline is hypothetical. Extended allocation reuses the Samtec bound only for a cassette interface that satisfies every referenced geometric assumption',
                           'Geometry does not prove electrical reconnection at h <= 0.1 mm',
                           'Ideal axes and travel limits require actual guides and stops',
                           'Frame, common-root fracture, terminal pullout, tolerance and force remain open']}


if __name__ == '__main__':
    result = check()
    (HERE/'cassette-geometry-results.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result))
