"""Proposal conductor connectivity, not an electronic schematic or analog simulation.

Only explicit DC branches are represented. Cells are voltage sources, NEVER wire edges.
Open switches are ideal here; real leakage, capacitance and component failure physics
are separate obligations. A path between different taps is a potential discharge path.
"""
import itertools,json,hashlib
from collections import deque
from pathlib import Path
HERE=Path(__file__).resolve().parent
TAPS=('T0','T1','T2','T3')
LINES=(('L1','T0'),('H1','T1'),('L2','T1'),('H2','T2'),('L3','T2'),('H3','T3'))

def edge(a,b,label,switch=None):return dict(a=a,b=b,label=label,switch=switch)

def network(topology):
    edges=[];switches=[]
    for name,tap in LINES:
        near='guard_'+name;edges.append(edge(tap,near,'two guard resistors '+name))
        count=2 if topology=='dual' else 1 if topology in ('single','floating_full_boundary') else 0
        for j in range(count):
            sw=f'{name}.cut{j+1}';out=f'{name}.node{j+1}'
            edges.append(edge(near,out,sw,sw));switches.append(sw);near=out
        edges.append(edge(near,'in_'+name,'sense conductor '+name))
    # A guaranteed passive path in the INA152 positive-input network:
    # external H ->40k->opamp+ ->40k->reference. No powered op-amp assumption.
    for name in ('H1','H2','H3'):
        edges.append(edge('in_'+name,'MREF','INA152 passive positive network '+name))
    if topology=='floating_full_boundary':
        edges +=[edge('T3','MPLUS','monitor supply boundary','boundary.supply'),edge('MREF','T0','monitor return boundary','boundary.return'),edge('MPLUS','MREF','monitor load domain (not a rated resistance)')]
        switches+=['boundary.supply','boundary.return']
    elif topology!='floating_return_only':edges.append(edge('MREF','T0','reference/monitor return'))
    return edges,switches

def paths(edges,closed):
    adjacency={}
    for e in edges:
        if e['switch'] is not None and e['switch'] not in closed:continue
        adjacency.setdefault(e['a'],[]).append((e['b'],e['label']))
        adjacency.setdefault(e['b'],[]).append((e['a'],e['label']))
    out=[]
    for source,target in itertools.combinations(TAPS,2):
        q=deque([(source,[])]);seen={source}
        while q:
            node,path=q.popleft()
            if node==target:out.append(dict(taps=[source,target],edges=path));break
            for nxt,label in adjacency.get(node,[]):
                if nxt not in seen:seen.add(nxt);q.append((nxt,path+[label]))
    return out

def run_case(topology,name,closed):
    edges,_=network(topology)
    return dict(topology=topology,case=name,closed_switches=sorted(closed),tap_paths=paths(edges,set(closed)))

def main():
    cases=[];counts={}
    for topology in ('single','dual','floating_return_only','floating_full_boundary'):
        _,switches=network(topology)
        cases.append(run_case(topology,'normal_OFF',[]))
        single=[run_case(topology,'one switch stuck closed: '+sw,[sw]) for sw in switches]
        cases+=single
        counts[topology]=dict(switch_count=len(switches),single_switch_fault_cases=len(single),single_switch_fault_cases_with_path=sum(bool(r['tap_paths']) for r in single))
    dual_edges,dual_switches=network('dual')
    groupA=[s for s in dual_switches if s.endswith('cut1')]
    groupB=[s for s in dual_switches if s.endswith('cut2')]
    cases +=[run_case('dual','only enable A stuck high',groupA),run_case('dual','only enable B stuck high',groupB),run_case('dual','shared enable drives both groups high',dual_switches),run_case('floating_full_boundary','sense bank enable stuck high',[name+'.cut1' for name,_ in LINES])]
    double_faults=[]
    for pair in itertools.combinations(dual_switches,2):
        r=run_case('dual','two switches stuck closed',pair)
        if r['tap_paths']:double_faults.append(r)
    assert not next(r for r in cases if r['topology']=='single' and r['case']=='normal_OFF')['tap_paths']
    assert counts['single']['single_switch_fault_cases_with_path']==3
    assert counts['dual']['single_switch_fault_cases_with_path']==0
    assert next(r for r in cases if r['topology']=='floating_return_only')['tap_paths'],'Opening only supply/return does not disconnect inter-tap resistor paths'
    assert counts['floating_full_boundary']['single_switch_fault_cases_with_path']==0
    assert next(r for r in cases if r['case']=='sense bank enable stuck high')['tap_paths']
    for label in ('only enable A stuck high','only enable B stuck high'):assert not next(r for r in cases if r['case']==label)['tap_paths']
    assert next(r for r in cases if r['case']=='shared enable drives both groups high')['tap_paths']
    assert len(double_faults)==3
    supply_edges=[edge('T3','FEED1','supply inhibit1','SUP1'),edge('FEED1','LED_MON_RAIL','supply inhibit2','SUP2'),
      edge('LED_MON_RAIL','T0','monitor finite load, value TBD'),edge('LED_MON_RAIL','LED_A','LED bankA driver','DRV_A'),
      edge('LED_A','T0','LED bankA load'),edge('LED_MON_RAIL','LED_B','LED bankB driver','DRV_B'),edge('LED_B','T0','LED bankB load')]
    supply_cases=[]
    for name,closed in [('normal_OFF',[]),*[(f'one element stuck closed {s}',[s]) for s in ('SUP1','SUP2','DRV_A','DRV_B')],
                        ('both bank drivers stuck high',['DRV_A','DRV_B']),('both supply inhibits stuck closed',['SUP1','SUP2']),
                        ('one common override closes everything',['SUP1','SUP2','DRV_A','DRV_B'])]:
        supply_cases.append({'case':name,'closed':closed,'tap_paths':paths(supply_edges,set(closed))})
    assert all(not x['tap_paths'] for x in supply_cases[:6])
    assert supply_cases[6]['tap_paths'] and supply_cases[7]['tap_paths']
    result={'scope':'Ideal passive conductor counterexample/cut-set analysis only; no physical protection PASS','network_minimum_branches_only':True,'counts':counts,'cases':cases,'two_switch_fault_cases_with_path':double_faults,'supply_inhibit_cases':supply_cases,
     'arithmetic':{'two_branch_witness_only_delta1_2V_uA_nominal':1.2/(160000+2*998)*1e6,'three_equal_positive_branches_only_H_V':[1.2,2.4,3.6],'three_equal_positive_branches_only_floating_reference_V':2.4,'three_equal_positive_branches_only_current_into_reference_uA':[(v-2.4)/(80000+998)*1e6 for v in (1.2,2.4,3.6)],'note':'Nominal passive subnetwork calculations, not total island-current or MAX bounds; other silicon/clamp branches are not quantified','one_off_switch_per_each6sense_uA_budget_at_Panasonic_table_conditions_only':6},
     'not_proven':['complete circuit graph','leakage and switch capacitance','common enable independence','monitor supply/control/output bypass','healthy measurement/freshness','cell reversal/clamps','transients/MAX timing','physical faults','BOM/fit/cost'],
     'source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    (HERE/'sense-cutsets-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'counts':counts,'return_only_floating_intertap_paths':len(next(r for r in cases if r['topology']=='floating_return_only')['tap_paths']),'dual_two_faults_with_path':len(double_faults),'nominal_positive_subnetwork_current_uA':result['arithmetic']['three_equal_positive_branches_only_current_into_reference_uA']}))
if __name__=='__main__':main()
