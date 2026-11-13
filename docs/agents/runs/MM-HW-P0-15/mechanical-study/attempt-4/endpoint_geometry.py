"""Approved M5 parameter study: endpoint-slot/carriage subassembly only.

No frame, V/probe/witness latch or whole-product fit is claimed by this model.
All linear guides are ideal; no force, friction or material qualification.
"""
import sys
from pathlib import Path
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'attempt-2'))
from geometry import box,moved,carriage_parts,cam,adapter_base,interval_template,forbidden,solve_intervals,translation_interval,classify,contact_status

PARK=16.2
SLOT_HEIGHT=1.2
BAR_THICKNESS=.8

def prism(label,x0,x1,y0,y1,z0,z1):
    assert x1>x0 and y1>y0 and z1>z0
    return box(label,(x1-x0,y1-y0,z1-z0),((x0+x1)/2,(y0+y1)/2,(z0+z1)/2))

def lug_pieces(label,x,y,zlo,slot):
    # Through-X rectangular hole; side webs keep each lug connected.
    return [prism(label+' web front',x-.5,x+.5,y-2,y-.6,zlo,12),
            prism(label+' web rear',x-.5,x+.5,y+.6,y+2,zlo,12),
            prism(label+' below slot',x-.5,x+.5,y-.6,y+.6,zlo,slot-.6),
            prism(label+' above slot',x-.5,x+.5,y-.6,y+.6,slot+.6,12)]

def endpoint_parts(name,h):
    x=2. if name=='A' else 6.
    back=25. if name=='A' else 29.
    parts=lug_pieces(name+' upper lug',x,15,-12,8-PARK)
    parts+=lug_pieces(name+' lower lug',-x,21,-28,-8-PARK)
    parts += [prism(name+' upper rail',x-.5,x+.5,15,back+.4,11.2,12),
              prism(name+' lower rail',-x-.5,-x+.5,21,back+.4,11.2,12),
              prism(name+' cross rail',-x-.5,x+.5,back-.4,back+.4,11.2,12)]
    return [moved(p,(0,0,h)) for p in parts]

def gate_carriage(side,s):
    if side==1:
        extras=[prism('upper post',5.15,5.65,-4.0,-3.6,2.5,8.4),
                prism('upper cross arm',-16.4,5.65,-4.0,-3.6,7.6,8.4),
                prism('upper trailing stem',-16.4,-15.6,-4.0,15.4,7.6,8.4),
                prism('upper gate bar',-20,.4,14.6,15.4,7.6,8.4)]
    else:
        extras=[prism('lower post',-5.65,-5.15,-2.5,-2.1,-8.4,-2.5),
                prism('lower cross arm',-5.65,16.4,-2.5,-2.1,-8.4,-7.6),
                prism('lower trailing stem',15.6,16.4,-2.5,21.4,-8.4,-7.6),
                prism('lower gate bar',-.4,20,20.6,21.4,-8.4,-7.6)]
    return carriage_parts(side,s)+[moved(p,(side*s,0,0)) for p in extras]

def gate_intervals(side,ha,hb,omit=()):
    fixed=[p for n,h in [('A',ha),('B',hb)] if n not in omit for p in endpoint_parts(n,h)]
    moving=gate_carriage(side,0)
    return [r for a in fixed for b in moving if (r:=translation_interval(a,b,(side,0,0))) is not None]

def path(ha,hb,removed_side=None,omit=(),step=.1):
    sides=[s for s in (1,-1) if s!=removed_side]
    shapes=adapter_base()
    templates={s:[interval_template(cam(s),p,s) for p in shapes] for s in sides}
    gates={s:gate_intervals(s,ha,hb,omit) for s in sides}
    previous={s:0. for s in sides};stop=None;potential=[]
    for i in range(round(26.4/step)+1):
        d=round(-20+i*step,9);next_s={}
        for s in sides:
            intervals=[r for t in templates[s] if (r:=forbidden(t,d)) is not None]+gates[s]
            solved,_=solve_intervals(intervals,previous[s])
            if solved is None:stop={'kind':'endpoint or stroke','d':d,'side':s};break
            next_s[s]=solved
        if stop:break
        adapter=[moved(p,(0,d,0)) for p in shapes]
        doors=[p for s in sides for p in gate_carriage(s,next_s[s])]
        if any(classify(a,b)=='interpenetrating' for a in adapter for b in doors):
            stop={'kind':'carriage material','d':d};break
        previous=next_s
        if contact_status(adapter,d):potential.append({'d':d,'carriages':next_s})
    return {'ha':ha,'hb':hb,'removed_side':removed_side,'omitted_endpoint_material':list(omit),
            'step_mm':step,'stop':stop,'potential_contact_samples':len(potential),
            'first_potential_contact':potential[0] if potential else None,'last_carriages':previous,
            'scope':'Nominal intact controlled adapter; frame and all V/probe/cassette latches absent'}

def lowest_reachable_carriage(side, depth, **adapter_options):
    """Starting at s=12, close until the first actual adapter interference."""
    adapter=[moved(p,(0,depth,0)) for p in adapter_base(**adapter_options)]
    intervals=[r for a in adapter for b in gate_carriage(side,0)
               if (r:=translation_interval(a,b,(side,0,0))) is not None]
    assert not any(lo+1e-6<12<hi-1e-6 for lo,hi in intervals),(side,depth)
    return max([0.]+[hi for lo,hi in intervals if lo<12 and 0<hi<=12+1e-6])
