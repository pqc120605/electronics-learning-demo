"""Reference T-guide geometry, reused M5 endpoints and fixed-pose sweeps."""
import itertools
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent), str(HERE.parent/'attempt-4')]
from preflight import preflight
from endpoint_geometry import PARK, endpoint_parts, moved, prism, translation_interval
from geometry import box, rotation, dot

TRAVEL = 22.
PIVOT = (0., 49., 9.1)


def rail_parts():
    parts = []
    for name, x, head, mouth in [('datum', -30.5, 2.10, 1.10), ('relieved', 30.5, 2.40, 1.40)]:
        parts.append(prism(name+' base',x-1.5,x+1.5,34,86,8,8.43))
        for axis_label, low, high in [('left',x-1.5,x-head/2),('right',x+head/2,x+1.5)]:
            parts.append(prism(name+' web '+axis_label,low,high,34,86,8.43,9.77))
        for axis_label, low, high in [('left',x-1.5,x-mouth/2),('right',x+mouth/2,x+1.5)]:
            parts.append(prism(name+' lip '+axis_label,low,high,34,86,9.77,10.4))
        parts.append(prism(name+' park stop',x-head/2,x+head/2,85,86,8.43,9.77))
        parts.append(prism(name+' seated stop',x-.8,x+.8,33.5,34,10.6,11.2))
    return parts


def cassette_parts(distance=0, absent=(), pose=(0.,0.,0.,0.,0.)):
    body = [prism('cassette upper body',-32,32,34,88,10.55,30),
            prism('cassette floor core',-28.85,28.85,34,88,8,10.60)]
    for name, x in [('datum',-30.5),('relieved',30.5)]:
        for index, y in enumerate((38,60)):
            body.append(prism(f'{name} shoe {index}',x-1,x+1,y-3,y+3,8.5,9.7))
            body.append(prism(f'{name} neck {index}',x-.5,x+.5,y-3,y+3,9.6,10.65))
    if 'A' not in absent:
        body.append(prism('A tongue',-.9,-.2,8.6,34.2,12.7,30))
    if 'B' not in absent:
        body.append(prism('B tongue',4.3,5.2,12.6,34.2,12.7,30))
    pitch,yaw,roll,dx,dz=pose
    r=rotation(pitch,yaw,roll)
    posed=[]
    for p in body:
        size=[hi-lo for lo,hi in p['bounds']]
        local=[(lo+hi)/2-ref for (lo,hi),ref in zip(p['bounds'],PIVOT)]
        center=[dot(row,local)+ref+shift for row,ref,shift in zip(r,PIVOT,(dx,distance,dz))]
        posed.append(box(p['label'],size,center,r))
    return posed


def hits(fixed, parts, lo, hi):
    collisions=[]
    for a,b in itertools.product(fixed,parts):
        ax,ay,az=a['bounds']; bx,by,bz=b['bounds']
        if ax[1]<=bx[0] or bx[1]<=ax[0] or az[1]<=bz[0] or bz[1]<=az[0]:
            continue
        if by[0]+lo>=ay[1] or by[1]+hi<=ay[0]:
            continue
        span=translation_interval(a,b,(0,1,0))
        if span and max(lo,span[0])<min(hi,span[1])-1e-6:
            collisions.append((a['label'],b['label'],span))
    return collisions


def sweep(poses, cut, rails, lowered, parked):
    clear=[]
    blocked=[]
    for pose in poses:
        pieces=cassette_parts(pose=pose)
        forbidden=hits(rails+lowered,pieces,.2,21.8)
        if forbidden:
            blocked.append({'pose':pose,'first_pair':forbidden[0][:2]})
            continue
        rows=[]
        for name,missing in [('A','B'),('B','A')]:
            surviving=cassette_parts(absent=(missing,),pose=pose)
            tongue=next(p for p in surviving if p['label']==f'{name} tongue')
            rail=next(p for p in endpoint_parts(name,1.25) if p['label']==f'{name} cross rail')
            lift_interval=translation_interval(rail,tongue,(0,1,0))
            assert lift_interval and lift_interval[0]<.2 and lift_interval[1]>cut,(pose,name,lift_interval)
            reverse=hits(parked,surviving,.2,21.8)
            assert reverse and not hits(parked,surviving,21.8,22.2),(pose,name)
            stop=max(span[1] for _,_,span in reverse)
            assert stop>cut,(pose,name,stop)
            rows.append({'surviving_tongue':name,'lift_barrier_interval_mm':lift_interval,'parked_return_stop_mm':stop})
        clear.append({'pose':pose,'single_tongue_cases':rows})
    return {'guide_pose_count':len(poses),'clear_fixed_poses':clear,'blocked_fixed_poses':blocked}


def evaluate():
    preflight()
    cut=json.loads((HERE.parent/'attempt-6'/'connector-allocation-results.json').read_text())['conditional_last_cut_with_2mm_gap_mm']
    rails=rail_parts()
    lowered=[p for n in ('A','B') for p in endpoint_parts(n,0)]
    parked=[p for n in ('A','B') for p in endpoint_parts(n,PARK)]
    wide=list(itertools.product((-.5,0.,.5),(-.5,0.,.5),(-.2,0.,.2),(-.05,0.,.05),(-.07,0.,.07)))
    narrow=list(itertools.product((-.05,0.,.05),(-.05,0.,.05),(-.05,0.,.05),(-.02,0.,.02),(-.02,0.,.02)))
    wide_check=sweep(wide,cut,rails,lowered,parked)
    narrow_check=sweep(narrow,cut,rails,lowered,parked)
    assert not hits(rails+lowered,cassette_parts(),0,TRAVEL)
    assert wide_check['clear_fixed_poses'] and wide_check['blocked_fixed_poses']
    assert not hits(parked,cassette_parts(absent=('A','B')),.2,21.8)
    return {'scope':'Reference rigid guides. Continuous axial sweep at each listed fixed pose only.',
            'wide_pose_screen':wide_check,'narrow_pose_screen':narrow_check,
            'conditional_connector_cut_mm':cut,
            'allocation_check':{'earliest_release_mm':16.8-.60,'release_margin_mm':16.8-.60-cut,
                                'park_clearance_mm':21.8-(20.8+.60),'lowered_vertical_clearance_mm':.7-.55},
            'limitations':['No continuous search of simultaneous rotations and translations.',
                           'A blocked pose can be a jam and must not be treated as a proved tolerance limit.',
                           'No force, fracture, guide wear, terminal pull-out, real connector mating or holder fit proof.',
                           'V/probe/witness and complete housing are separate unresolved assemblies.']}


if __name__=='__main__':
    result=evaluate()
    (HERE/'guide-sweep-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({name:{'poses':result[name]['guide_pose_count'],
                            'clear':len(result[name]['clear_fixed_poses']),
                            'blocked':len(result[name]['blocked_fixed_poses'])}
                      for name in ('wide_pose_screen','narrow_pose_screen')}))
