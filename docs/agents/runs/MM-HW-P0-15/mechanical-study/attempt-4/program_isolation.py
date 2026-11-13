"""Conservative inter-island connectivity, not circuit simulation or physical guards.

Each island is collapsed for ANY conductive connection, so no numeric current or
polarity is inferred. Actual conductor inventory and enforced endpoint sequencing
remain obligations. This checks why PROGRAM need not depend on electronic tOFF.
"""
import json,hashlib
from collections import deque
from pathlib import Path
HERE=Path(__file__).resolve().parent

def path(edges,source,target):
    adj={}
    for a,b,label in edges:adj.setdefault(a,[]).append((b,label));adj.setdefault(b,[]).append((a,label))
    pending=deque([(source,[])]);seen={source}
    while pending:
        node,p=pending.popleft()
        if node==target:return p
        for other,label in adj.get(node,[]):
            if other not in seen:seen.add(other);pending.append((other,p+[label]))
    return None

def connections(n,closedA,closedB,cassette_closed=(),pc=False,bypass=False):
    edges=[]
    for i in range(n):
        if i in closedA:edges.append(('CARRIER',f'BRIDGE_{i}',f'breakpointA conductor{i}'))
        if i in closedB:edges.append((f'BRIDGE_{i}','B01',f'breakpointB conductor{i}'))
    for i in cassette_closed:edges.append(('CASSETTE','CARRIER',f'cassette conductor{i}'))
    if pc:edges.append(('PC','B01','PC USB interface'))
    if bypass:edges.append(('CARRIER','B01','unaccounted shield/debug/metal bypass'))
    return edges

def main():
    rows=[]
    for n in (19,50):
        allroutes=set(range(n))
        for electronic_switch_stuck_on in (False,True):
            e=connections(n,[],[],pc=True)
            assert path(e,'PC','CARRIER') is None
            rows.append({'conductors':n,'case':'PROGRAM bridgepark','electronic_switch_stuck_on':electronic_switch_stuck_on,'carrier_can_have_stored_energy':True,'PC_to_carrier_path':None})
        # Single pulled/welded contact on either physical breakpoint.
        for side in ('A','B'):
            for i in range(n):
                e=connections(n,{i} if side=='A' else (),{i} if side=='B' else (),pc=True)
                assert path(e,'PC','CARRIER') is None
                rows.append({'conductors':n,'case':'single physical contact remains conductive','side':side,'route':i,'PC_to_carrier_path':None})
        for side in ('A','B'):
            e=connections(n,allroutes if side=='A' else (),allroutes if side=='B' else (),pc=True)
            assert path(e,'PC','CARRIER') is None
            rows.append({'conductors':n,'case':'one entire breakpoint remains closed','side':side,'PC_to_carrier_path':None})
        # Battery removed does not remove stored carrier-to-B01 connectivity yet.
        e=connections(n,allroutes,allroutes,pc=False)
        assert path(e,'CARRIER','B01') is not None and path(e,'CASSETTE','B01') is None
        # Deliberate negative controls: early PC or an uncounted bypass.
        for name,edges in [('PC before physical bridgepark',connections(n,allroutes,allroutes,pc=True)),('bypass after bridgepark',connections(n,[],[],pc=True,bypass=True))]:
            p=path(edges,'PC','CARRIER');assert p is not None
            rows.append({'conductors':n,'case':name,'PC_to_carrier_path':p,'expected':'counterexample'})
    out={'scope':'Inter-island connectivity under stated physical-cut assumptions; not implemented sequencing, energy/current, fault containment of a real assembly or B1','cases':rows,'unverified_physical_assumptions':['all actual conductors inventoried','two actual gap envelopes','no unaccounted shield/control/test/mounting path','PC cannot reach electrical contact before bridgepark','reconnect prevented while PC connected','terminal faults do not create cross-route bypass'],'RUN_protection':'Not evaluated or waived by this PROGRAM analysis','source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    (HERE/'program-isolation-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'recorded_cases':len(rows),'single_contact_fault_cases':2*(19+50),'scope':'connectivity only, not physical mechanism proof'}))
if __name__=='__main__':main()
