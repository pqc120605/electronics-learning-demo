"""Logical sequencing study; no physical mechanism or fault-rate claim."""
import json
from collections import deque
from pathlib import Path
HERE = Path(__file__).resolve().parent
# A/B are actual all-route gap endpoints, not scalar movement commands.
# Cassette removal does NOT mean carrier energy has disappeared.
# Two independent full-path USB barriers are an explicit unproven requirement.
INITIAL = (1, 0, 0, 0, 0, 0)  # cassette, A, B, barrier1-open, barrier2-open, PC

def next_states(s, stuck=None, common_false_park=False, bypass=False):
    c, a, b, u, v, pc = s
    out = []
    def add(name, i, value):
        t = list(s); t[i] = value
        out.append((name, tuple(t)))
    if c and not pc: add('remove all cassette paths', 0, 0)
    if not c and not pc and not u and not v:
        if not a: add('park A actual endpoint', 1, 1)
        if not b: add('park B actual endpoint', 2, 1)
        if a: add('reconnect A', 1, 0)
        if b: add('reconnect B', 2, 0)
    permit = (a and b and not c) or common_false_park
    if not pc:
        for name, idx, open_now in [('barrier1', 3, u), ('barrier2', 4, v)]:
            if not open_now and (permit or stuck == name): add('open '+name, idx, 1)
            if open_now and stuck != name: add('close '+name, idx, 0)
        if (u and v) or bypass: add('insert PC', 5, 1)
    else:
        add('remove PC', 5, 0)
    if not c and not a and not b and not u and not v and not pc:
        add('insert cassette last', 0, 1)
    return out

def explore(**opts):
    q = deque([INITIAL]); paths = {INITIAL: []}; unsafe = []; sequence_violations = []
    while q:
        s = q.popleft()
        c,a,b,u,v,pc = s
        # Carrier may remain energized even with cassette=0.
        if pc and not (a or b): unsafe.append({'state':s, 'trace':paths[s]})
        if pc and not (a and b and not c):
            sequence_violations.append({'state':s, 'trace':paths[s]})
        for action, t in next_states(s, **opts):
            if t not in paths:
                paths[t] = paths[s] + [action]; q.append(t)
    return {'states':len(paths), 'unsafe':unsafe, 'sequence_violations':sequence_violations,
            'pc_reachable':any(s[5] for s in paths)}

cases = {name:explore(**opts) for name,opts in [
    ('ideal independent actual endpoints', {}),
    ('one USB barrier stuck open', {'stuck':'barrier1'}),
    ('other USB barrier stuck open', {'stuck':'barrier2'}),
    ('common false park indication', {'common_false_park':True}),
    ('unguarded generic cable bypass', {'bypass':True}),
]}
for name in list(cases)[:3]:
    assert not cases[name]['unsafe'] and not cases[name]['sequence_violations'] and cases[name]['pc_reachable']
for name in list(cases)[3:]: assert cases[name]['unsafe']
result = {
    'scope':'Exhaustive finite abstraction of a proposed sequencing contract, NOT actual M5 proof',
    'state_fields':['cassette_connected','A_all_routes_gap','B_all_routes_gap','USB_barrier1_open','USB_barrier2_open','PC_inserted'],
    'cases':cases,
    'unproven_implementation_obligations':[
        'Each USB barrier alone prevents a real plug from establishing any hazardous conductor',
        'A/B endpoint observations are independent of shared commands or one common false indication',
        'Bridge cannot reconnect while PC remains inserted or either barrier remains open',
        'Actual inventory, clearance, tilt, deformation and routes match the abstraction',
        'Cassette removal means all eight paths, not only battery positive',
        'The not-PC guard in the state transition is a declared mechanical obligation, not a modeled physical PC-presence lock',
    ],
    'predicates':{'electrical_path_violation':'PC AND NOT(gap_A OR gap_B)',
                  'sequence_violation':'PC AND NOT(cassette_absent AND gap_A AND gap_B)'},
    'not_in_scope':['physical tests','strength/FE','force','fault probability','B1 approval'],
}
(HERE/'transition-contract-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:{'states':v['states'],'unsafe':len(v['unsafe']),'sequence_violations':len(v['sequence_violations'])} for k,v in cases.items()}))
