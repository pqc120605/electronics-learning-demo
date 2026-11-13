"""Reference OBB collision math (15 separating axes), no CAD or external packages."""
import math,json
from pathlib import Path
P=json.loads((Path(__file__).resolve().parent/'protocol.json').read_text(encoding='utf-8'))
EPS=1e-6
IDENTITY=((1.,0.,0.),(0.,1.,0.),(0.,0.,1.))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def mmul(a,b):return tuple(tuple(sum(a[i][k]*b[k][j] for k in range(3)) for j in range(3)) for i in range(3))
def rotation(pitch=0,yaw=0,roll=0):
    a,b,c=map(math.radians,(pitch,yaw,roll));ca,sa=math.cos(a),math.sin(a);cb,sb=math.cos(b),math.sin(b);cc,sc=math.cos(c),math.sin(c)
    rx=((1,0,0),(0,ca,-sa),(0,sa,ca));ry=((cc,0,sc),(0,1,0),(-sc,0,cc));rz=((cb,-sb,0),(sb,cb,0),(0,0,1))
    return mmul(rz,mmul(rx,ry))
def box(label,size,centre,R=IDENTITY,translate=(0,0,0)):
    c=tuple(dot(row,centre)+t for row,t in zip(R,translate))
    axes=tuple(tuple(R[i][j] for i in range(3)) for j in range(3));half=tuple(x/2 for x in size)
    aabb=tuple(sum(abs(axes[j][i])*half[j] for j in range(3)) for i in range(3))
    return {'label':label,'size':size,'centre':c,'axes':axes,'half':half,'aabb':aabb}
def overlap(a,b):
    delta=tuple(y-x for x,y in zip(a['centre'],b['centre']))
    if any(abs(delta[i])>=a['aabb'][i]+b['aabb'][i]-EPS for i in range(3)):return False
    candidates=list(a['axes'])+list(b['axes'])+[cross(x,y) for x in a['axes'] for y in b['axes']]
    for n in candidates:
        norm=math.sqrt(dot(n,n))
        if norm<1e-10:continue
        n=tuple(x/norm for x in n)
        radius=sum(h*abs(dot(ax,n)) for h,ax in zip(a['half'],a['axes']))+sum(h*abs(dot(ax,n)) for h,ax in zip(b['half'],b['axes']))
        if radius-abs(dot(delta,n))<=EPS:return False
    return True
def solids(d,x=0,z=0,pitch=0,yaw=0,roll=0,lead=3.5,key_a=True,key_b=True,collar=True,crossbar=None):
    p=P['profiles'];R=rotation(pitch,yaw,roll);trans=(x,d,z);L=p['shell_length']
    parts=[box('shell',(p['shell_width'],L,p['shell_height']),(0,-L/2,0),R,trans)]
    if collar:
        f,r=p['collar_front_distance_from_tip'],p['collar_rear_distance_from_tip'];a,b=p['rear_crossbar_Y_interval']
        parts.append(box('collar',(p['collar_width'],r-f,p['collar_height']),(0,-(f+r)/2,0),R,trans))
    if (collar if crossbar is None else crossbar):
        a,b=p['rear_crossbar_Y_interval']
        parts.append(box('crossbar',(p['rear_crossbar_width'],b-a,p['rear_crossbar_height']),(0,(a+b)/2,0),R,trans))
    for i,present in enumerate((key_a,key_b)):
        if present:
            cx,cz=p['key_centres_XZ'][i];r=p['key_rear_Y']
            parts.append(box(f'key{i}',(p['key_width'],lead-r,p['key_height']),(cx,(lead+r)/2,cz),R,trans))
    return parts
def probes():
    p=P['profiles']
    return [box(f'probe{i}',(p['probe_width'],p['probe_depth'],p['probe_height']),(0,y,0)) for i,y in enumerate(p['probe_planes_Y'])]
def shutters(a=0,b=0):
    p=P['profiles']
    return [box('shutterA',(p['shutter_width'],p['shutter_depth'],p['shutter_height']),(a,p['shutter_planes_Y'][0],0)),box('shutterB',(p['shutter_width'],p['shutter_depth'],p['shutter_height']),(-b,p['shutter_planes_Y'][1],0))]
def potential_contact(parts):
    # Bounding contact domain, deliberately NOT a model of USB spring contacts.
    return overlap(parts[0],box('contact-domain',(9.4,6.4,3.4),(0,3.2,0)))
def prescribed_motion(d,lead,present=True):
    k=P['prescribed_kinematics']
    return max(0,min(1,(d+lead-k['actuation_trigger_plane_Y'])/k['key_ramp_insertion']))*12 if present else 0
