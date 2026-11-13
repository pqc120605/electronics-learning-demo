"""Requirements-state analysis only. Not firmware or a hardware timing/safety proof."""
import itertools,json
from pathlib import Path
STATES=('OFF','WAIT_RELEASE','READY','CHECK','RUN','LOCKED')
KEYS=('power_valid','start','fault','healthy_fresh','timeout')
def advance(state,e):
    if not e['power_valid']:return 'OFF'
    if state=='OFF':return 'WAIT_RELEASE'
    if e['fault']:return 'LOCKED'
    if state=='WAIT_RELEASE':return 'READY' if not e['start'] else state
    if state=='READY':return 'CHECK' if e['start'] else state
    if state=='CHECK':return 'LOCKED' if e['timeout'] else 'RUN' if e['healthy_fresh'] else state
    if state=='RUN':return state if e['healthy_fresh'] else 'LOCKED'
    if state=='LOCKED':return 'READY' if not e['start'] else state
    raise ValueError(state)
def event(**kwargs):
    return dict(power_valid=True,start=True,fault=False,healthy_fresh=False,timeout=False,**kwargs) if not kwargs else {**dict(power_valid=True,start=True,fault=False,healthy_fresh=False,timeout=False),**kwargs}
def trace(events):
    s='OFF';states=[]
    for e in events:s=advance(s,e);states.append(s)
    return states
def main():
    count=0
    for s,values in itertools.product(STATES,itertools.product((False,True),repeat=5)):
        e=dict(zip(KEYS,values));n=advance(s,e);count+=1
        assert n in STATES
        if not e['power_valid']:assert n=='OFF'
        if e['power_valid'] and s!='OFF' and e['fault']:assert n=='LOCKED'
        if s=='CHECK' and e['timeout'] and e['power_valid']:assert n!='RUN'
        if s=='RUN' and not e['healthy_fresh']:assert n!='RUN'
        if s=='WAIT_RELEASE' and e['start']:assert n not in ('CHECK','RUN')
        if n=='RUN' and s!='RUN':assert s=='CHECK' and e['healthy_fresh'] and not e['fault'] and not e['timeout']
    cases={
      'held_across_battery_reconnect':[event(),event(power_valid=False),event(),event(),event()],
      'release_press_fresh_then_fault':[event(),event(start=False),event(),event(healthy_fresh=True),event(fault=True,healthy_fresh=True),event(healthy_fresh=True)],
      'timeout_wins_healthy':[event(),event(start=False),event(),event(timeout=True,healthy_fresh=True)],
      'stale_measurement':[event(),event(start=False),event(),event(healthy_fresh=True),event()],
      'held_after_run_brownout':[event(),event(start=False),event(),event(healthy_fresh=True),event(power_valid=False),event(healthy_fresh=True),event(healthy_fresh=True)]}
    expected={
      'held_across_battery_reconnect':['WAIT_RELEASE','OFF','WAIT_RELEASE','WAIT_RELEASE','WAIT_RELEASE'],
      'release_press_fresh_then_fault':['WAIT_RELEASE','READY','CHECK','RUN','LOCKED','LOCKED'],
      'timeout_wins_healthy':['WAIT_RELEASE','READY','CHECK','LOCKED'],
      'stale_measurement':['WAIT_RELEASE','READY','CHECK','RUN','LOCKED'],
      'held_after_run_brownout':['WAIT_RELEASE','READY','CHECK','RUN','OFF','WAIT_RELEASE','WAIT_RELEASE']}
    results={name:trace(events) for name,events in cases.items()}
    assert results==expected
    out={'meaning':'Finite requirements model only, not implemented hardware/firmware','exhaustive_state_input_checks':count,'directed_traces':results,'not_proven':['physical logic','POR below guaranteed range','timer independence','measurement diagnostics','GPIO/MPN assignment','MAX current/delay','fault containment']}
    (Path(__file__).resolve().parent/'power-contract-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'state_input_checks':count,'directed_traces':len(cases),'scope':'requirements only'}))
if __name__=='__main__':main()
