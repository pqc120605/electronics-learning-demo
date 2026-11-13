"""Compare ideal coil feed isolation at both conductors against a feed-only cut."""
import json
from pathlib import Path


def reaches(edges, source, target):
    visit = [source]
    seen = set()
    while visit:
        point = visit.pop()
        if point == target:
            return True
        if point in seen:
            continue
        seen.add(point)
        for a, b in edges:
            if a == point:
                visit.append(b)
            if b == point:
                visit.append(a)
    return False


def powered(name, positive, returns, bypass):
    endpoints = (f'{name}+', f'{name}-')
    links = list(bypass)
    if positive:
        links.append(('pack+', endpoints[0]))
    if returns:
        links.append(('pack-', endpoints[1]))
    return any(reaches(links, 'pack+', start) and reaches(links, end, 'pack-')
               for start, end in (endpoints, endpoints[::-1]))


def evaluate():
    rows = []
    for name, a, b, shorts, unintended_return in [
        ('authorized RUN', True, True, [], ()),
        ('healthy trip', False, False, [], ()),
        ('A falsely keeps permission', True, False, [], ()),
        ('B falsely keeps permission', False, True, [], ()),
        ('one coil positive bridged to pack positive', False, False, [('pack+', 'A+')], ()),
        ('one coil negative bridged to pack return', False, False, [('pack-', 'A-')], ()),
        ('negative, both conductors bridged', False, False, [('pack+', 'A+'), ('pack-', 'A-')], ()),
        ('negative, auxiliary return defeats low-side cut', False, False, [('pack+', 'A+')], ('A',)),
    ]:
        split = {coil: powered(coil, a, b or coil in unintended_return, shorts) for coil in ('A', 'B')}
        feed_only = {coil: powered(coil, a and b, True, shorts) for coil in ('A', 'B')}
        rows.append({'case':name,'unintended_fixed_returns':unintended_return,
                     'split_cut_powered_coils':split,'feed_only_powered_coils':feed_only})
    assert all(rows[0]['split_cut_powered_coils'].values())
    assert all(not any(row['split_cut_powered_coils'].values()) for row in rows[1:6])
    assert rows[4]['feed_only_powered_coils']['A']
    assert all(row['split_cut_powered_coils']['A'] for row in rows[6:])
    return {
        'scope':'Ideal low-impedance power paths only. The coil, clamp and regulator stay local to each isolated pair.',
        'cases':rows,
        'limits':['Independent feed and return cuts need verified default-off and reverse blocking.',
                  'Clamp, enable, scope/debug, shield, or regulator ground connections must not restore the cut return.',
                  'The stored energy of the coil and capacitors can keep a contact closed after both cuts.',
                  'The model does not bound leakage, switch failures other than the stated paths, or common physical faults.'],
    }


if __name__=='__main__':
    result=evaluate()
    Path(__file__).with_name('coil-cutset-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'cases':len(result['cases']),'split_cut_single_path_counterexample_removed':True}))
