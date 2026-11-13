"""Reference convex geometry. Pure Python, exact SAT displacement intervals at fixed pose."""
import json,math,sys,itertools
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
from collision import rotation,dot,cross
C=json.loads((HERE/'protocol.json').read_text(encoding='utf-8'))
EPS=C['tolerance_mm']
I=((1.,0.,0.),(0.,1.,0.),(0.,0.,1.))
def axes_unique(items):
    out=[]
    for a in items:
        n=math.sqrt(dot(a,a))
        if n<1e-10:continue
        a=tuple(x/n for x in a)
        if not any(abs(dot(a,b))>1-1e-9 for b in out):out.append(a)
    return out
def poly(label,vertices,faces):
    normals=[];edges=[]
    for face in faces:
        a,b,c=[vertices[i] for i in face[:3]]
        normals.append(cross(tuple(bi-ai for ai,bi in zip(a,b)),tuple(ci-ai for ai,ci in zip(a,c))))
        for i,j in zip(face,face[1:]+face[:1]):edges.append(tuple(vertices[j][k]-vertices[i][k] for k in range(3)))
    return {'label':label,'v':vertices,'normals':axes_unique(normals),'edges':axes_unique(edges),
      'bounds':tuple((min(v[k] for v in vertices),max(v[k] for v in vertices)) for k in range(3))}
FACES=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]
def box(label,size,centre=(0,0,0),R=I):
    hx,hy,hz=[x/2 for x in size]
    raw=[(-hx,-hy,-hz),(hx,-hy,-hz),(hx,hy,-hz),(-hx,hy,-hz),(-hx,-hy,hz),(hx,-hy,hz),(hx,hy,hz),(-hx,hy,hz)]
    return poly(label,[tuple(dot(row,v)+c for row,c in zip(R,centre)) for v in raw],FACES)
def moved(p,shift):
    return {'label':p['label'],'v':[tuple(x+y for x,y in zip(v,shift)) for v in p['v']],
      'normals':p['normals'],'edges':p['edges'],'bounds':tuple((a+x,b+x) for (a,b),x in zip(p['bounds'],shift))}
def axes(a,b):return axes_unique(a['normals']+b['normals']+[cross(x,y) for x in a['edges'] for y in b['edges']])
def classify(a,b):
    if any(a1<b0-EPS or b1<a0-EPS for (a0,a1),(b0,b1) in zip(a['bounds'],b['bounds'])):return 'separated'
    best=-math.inf
    for n in axes(a,b):
        av=[dot(v,n) for v in a['v']];bv=[dot(v,n) for v in b['v']]
        gap=max(min(av)-max(bv),min(bv)-max(av));best=max(best,gap)
        if gap>EPS:return 'separated'
    return 'touching' if best>=-EPS else 'interpenetrating'
def adapter_base(x=0,z=0,pitch=0,yaw=0,roll=0,lead=3.5,key_a=True,key_b=True,collar=True):
    s=C['shell'];a=C['adapter'];R=rotation(pitch,yaw,roll)
    # Centres must rotate with the object before host-space x/z offset.
    def item(label,size,local):
        centre=tuple(dot(row,local)+t for row,t in zip(R,(x,0,z)))
        return box(label,size,centre,R)
    out=[item('shell-outer',(s['width'],s['length'],s['height']),(0,-s['length']/2,0))]
    if collar:
        f,r=a['collar_front'],a['collar_rear'];lo,hi=a['crossbar_y']
        out +=[item('collar',(a['collar_width'],r-f,a['collar_height']),(0,-(f+r)/2,0)),item('crossbar',(a['crossbar_width'],hi-lo,a['crossbar_height']),(0,(lo+hi)/2,0))]
    for i,present in enumerate((key_a,key_b)):
        if present:
            cx,cz=a['key_centres'][i]
            out.append(item(f'key{i}',(a['key_width'],lead-a['key_rear'],a['key_height']),(cx,(lead+a['key_rear'])/2,cz)))
    return out
def cam(side):
    p=C['carriage'];xmin,xmax=p['cam_x'];t=p['cam_thickness'];zc=side*p['cam_z']
    front=lambda x:p['cam_front_y']+(p['cam_xref']-x)/p['cam_ratio']
    xy=[(xmin,front(xmin)),(xmax,front(xmax)),(xmax,p['cam_back_y']),(xmin,p['cam_back_y'])]
    vertices=[(side*x,y,zc+dz) for dz in (-t/2,t/2) for x,y in xy]
    return poly('camA' if side==1 else 'camB',vertices,FACES)
def carriage_parts(side,s):
    p=C['carriage'];i=0 if side==1 else 1;dy=p['door_y'][i];xlo,xhi=p['rib_x'];zlo,zhi=p['rib_z']
    bx0,bx1=p['rib_bridge_x'];bz0,bz1=p['rib_bridge_z']
    return [moved(cam(side),(side*s,0,0)),
      box('doorA' if side==1 else 'doorB',(p['door_width'],p['door_depth'],p['door_height']),(side*s,dy,0)),
      box('ribA' if side==1 else 'ribB',(xhi-xlo,p['rib_depth'],zhi-zlo),(side*((xlo+xhi)/2+s),dy,side*(zlo+zhi)/2)),
      box('bridgeA' if side==1 else 'bridgeB',(bx1-bx0,p['rib_depth'],bz1-bz0),(side*((bx0+bx1)/2+s),dy,side*(bz0+bz1)/2))]
def cut_boxes():
    p=C['frame'];cuts=[box('tunnel',p['central_tunnel'],(0,-4.5,0))]
    for x,z in C['adapter']['key_centres']:cuts.append(box('key-slot',p['key_slot'],(x,-4.5,z)))
    for y in C['carriage']['door_y']:cuts.append(box('door-pocket',(42,1.15,6),(0,y,0)))
    for y in C['probes']['planes_y']:cuts.append(box('probe-pocket',(12,.55,22),(0,y,0)))
    cuts +=[box('cam-A-pocket',(24.4,3.10,1.8),(7.8,-3.60,4)),box('cam-B-pocket',(24.4,3.10,1.8),(-7.8,-3.60,-4)),
       box('rib-A-pocket',(15.8,1.2,5.2),(12.7,-4,2.3)),box('rib-B-pocket',(15.8,1.2,5.2),(-12.7,-2.5,-2.3))]
    return cuts
def frame_cells():
    f=box('frame',C['frame']['size'],C['frame']['centre']);cuts=cut_boxes();grid=[]
    for k,(lo,hi) in enumerate(f['bounds']):grid.append(sorted({lo,hi,*[x for c in cuts for x in c['bounds'][k] if lo<x<hi]}))
    cells=[]
    for ys,zs in itertools.product(zip(grid[1],grid[1][1:]),zip(grid[2],grid[2][1:])):
        run=None
        for x0,x1 in zip(grid[0],grid[0][1:]):
            centre=((x0+x1)/2,sum(ys)/2,sum(zs)/2)
            occupied=not any(all(lo-EPS<=v<=hi+EPS for v,(lo,hi) in zip(centre,c['bounds'])) for c in cuts)
            if occupied and run is None:run=x0
            if run is not None and (not occupied or x1==grid[0][-1]):
                end=x0 if not occupied else x1
                cells.append((run,end,*ys,*zs));run=None
    # Merge coplanar runs along Y and then Z; cells remain disjoint.
    for dim in (1,2,0,1,2):
        groups={}
        for c in cells:
            pairs=[c[0:2],c[2:4],c[4:6]];key=tuple(tuple(pairs[k]) for k in range(3) if k!=dim)
            groups.setdefault(key,[]).append(pairs[dim])
        merged=[]
        for key,segments in groups.items():
            spans=[]
            for lo,hi in sorted(segments):
                if spans and abs(spans[-1][1]-lo)<EPS:spans[-1]=(spans[-1][0],hi)
                else:spans.append((lo,hi))
            for span in spans:
                others=iter(key);pairs=[span if k==dim else next(others) for k in range(3)];merged.append(tuple(v for pair in pairs for v in pair))
        cells=merged
    return [box(f'frame-cell-{i}',(x1-x0,y1-y0,z1-z0),((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)) for i,(x0,x1,y0,y1,z0,z1) in enumerate(cells)]
def interval_template(cam_poly,part0,side):
    rows=[]
    for n in axes(cam_poly,part0):
        cv=[dot(v,n) for v in cam_poly['v']];kv=[dot(v,n) for v in part0['v']]
        v=side*n[0];dy=n[1];low=min(kv)-max(cv);high=max(kv)-min(cv)
        if abs(v)<1e-12 and abs(dy)<1e-12 and (low>=EPS or high<=-EPS):return None
        rows.append((v,dy,low,high))
    return rows
def forbidden(template,d):
    if template is None:return None
    lo,hi=-math.inf,math.inf
    for v,dy,a,b in template:
        a+=d*dy;b+=d*dy
        if abs(v)<1e-12:
            if a>=EPS or b<=-EPS:return None
        else:
            x,y=a/v,b/v
            lo=max(lo,min(x,y));hi=min(hi,max(x,y))
            if lo>=hi-EPS:return None
    return lo,hi
def solve_intervals(intervals,previous):
    """Keep the free component adjacent to the old displacement, not a global minimum."""
    intervals=sorted(intervals)
    merged=[]
    for lo,hi in intervals:
        # Open collision intervals that only touch must not erase their feasible boundary.
        if merged and lo<merged[-1][1]-EPS:merged[-1]=(merged[-1][0],max(hi,merged[-1][1]))
        else:merged.append((lo,hi))
    s=previous
    for lo,hi in merged:
        if lo+EPS<s<hi-EPS:s=hi
    if s>C['carriage']['stroke']+EPS:return None,merged
    s=max(0,min(C['carriage']['stroke'],s));lower=0.
    for lo,hi in merged:
        if hi<=s+EPS:lower=max(lower,hi)
    lower=max(0,lower)
    if lower>C['carriage']['stroke']+EPS:return None,merged
    return min(C['carriage']['stroke'],lower),merged

def solve_slider(templates,d,previous):
    return solve_intervals([x for t in templates if (x:=forbidden(t,d)) is not None],previous)
def contact_status(parts,d):
    region=box('potential-contact',(9.4,6.4,3.4),(0,3.2,0))
    return d>=0 or classify(parts[0],region)!='separated'
def probe_boxes(baseline=False):
    p=C['probes'];planes=p['baseline_planes_y'] if baseline else p['planes_y']
    return [box(f'probe{i}',(p['width'],p['depth'],p['height']),(0,y,0)) for i,y in enumerate(planes)]

def translation_interval(fixed,moving,direction,positive=True):
    """Interval of scalar t with overlap for moving+t*direction; fixed orientation."""
    lo,hi=-math.inf,math.inf
    pad=EPS if positive else -EPS
    for n in axes(fixed,moving):
        fv=[dot(v,n) for v in fixed['v']];mv=[dot(v,n) for v in moving['v']]
        a=min(fv)-max(mv)+pad;b=max(fv)-min(mv)-pad;speed=dot(direction,n)
        if abs(speed)<1e-12:
            if a>0 or b<0 or (positive and (a>=0 or b<=0)):return None
        else:
            x,y=a/speed,b/speed;lo=max(lo,min(x,y));hi=min(hi,max(x,y))
            if lo>hi or (positive and lo>=hi):return None
    return lo,hi

def follow(pose,cells,forward=True,initial=(0.,0.),all_rows=False,step_override=None,locked=None):
    parts0=adapter_base(**pose);cams=[cam(1),cam(-1)]
    templates=[[interval_template(c,p,s) for p in parts0] for c,s in zip(cams,(1,-1))]
    frame_intervals=[]
    for p in parts0:
        for c in cells:
            interval=translation_interval(c,p,(0,1,0))
            if interval is not None:frame_intervals.append((*interval,p['label'],c['label']))
    start,end,step=C['input']['start_d'],C['input']['end_d'],C['input']['step']
    if step_override is not None:step=step_override
    depths=[round(start+i*step,8) for i in range(round((end-start)/step)+1)]
    if not forward:depths.reverse()
    state=list(initial);rows=[];touches=0;potential=0;miss=[0,0];last_d=depths[0];stop=None
    probes=probe_boxes();contact_region=box('potential-contact',(9.4,6.4,3.4),(0,3.2,0))
    # Carriage/frame intervals are continuous in this one ideal translation DOF only.
    carr_frame=[]
    for side in (1,-1):
        values=[]
        for part in carriage_parts(side,0):
            for cell in cells:
                interval=translation_interval(cell,part,(side,0,0))
                if interval and max(0,interval[0])<min(12,interval[1]):values.append((*interval,part['label']))
        carr_frame.append(values)
    for index,d in enumerate(depths):
        if index:
            low,high=sorted((last_d,d));hits=[r for r in frame_intervals if max(low,r[0])<min(high,r[1])-EPS]
            if hits:
                first=min(hits,key=lambda r:r[0]) if forward else max(hits,key=lambda r:r[1])
                stop={'kind':'frame','sample_bracket':[last_d,d],'continuous_interval_boundary':first[0] if forward else first[1],'part':first[2]};break
        candidate=[]
        for side_index,(t,s) in enumerate(zip(templates,state)):
            result,_=solve_slider(t,d,s)
            if result is None:stop={'kind':'stroke_exhausted','sample_bracket':[last_d,d]};break
            if locked and locked[side_index] is not None:
                result=locked[side_index]
                if any((interval:=forbidden(template,d)) is not None and interval[0]+EPS<result<interval[1]-EPS for template in t):
                    stop={'kind':'locked_cam','sample_bracket':[last_d,d]};break
            candidate.append(result)
        if stop:break
        parts=[moved(p,(0,d,0)) for p in parts0]
        cp=[carriage_parts(side,s) for side,s in zip((1,-1),candidate)]
        bad=next(((p['label'],target['label']) for group in cp for target in group[1:] for p in parts if classify(p,target)=='interpenetrating'),None)
        if bad:stop={'kind':'door_or_rib','sample_bracket':[last_d,d],'parts':bad};break
        if any(any(lo+EPS<s<hi-EPS for lo,hi,_ in values) for values,s in zip(carr_frame,candidate)):
            stop={'kind':'carriage_frame','sample_bracket':[last_d,d]};break
        # Validate that the interval solver has not permitted cam penetration.
        for group in cp:
            for p in parts:
                result=classify(p,group[0])
                if result=='interpenetrating':raise AssertionError(('solver allowed cam penetration',pose,d,candidate,p['label']))
                if result=='touching':touches+=1
        connected=d>=0 or classify(parts[0],contact_region)!='separated'
        probe_class=[];collar=next((p for p in parts if p['label']=='collar'),None)
        for i,probe in enumerate(probes):
            cl=classify(collar,probe) if collar else 'separated';probe_class.append(cl)
            if connected and cl=='separated':miss[i]+=1
        if connected:potential+=1
        row={'d':d,'carriages':candidate,'potential_contact':connected,'controlled_collar_probe_class':probe_class}
        if all_rows:rows.append(row)
        state=candidate;last_d=d
    return {'pose':pose,'direction':'insert' if forward else 'withdraw','last_reachable_d':last_d,'last_carriages':state,
      'stop':stop,'potential_contact_samples':potential,'controlled_collar_probe_misses':miss,'cam_touch_events':touches,
      'carriage_frame_forbidden_intervals':carr_frame,'rows':rows}
