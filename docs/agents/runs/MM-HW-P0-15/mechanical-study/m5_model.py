"""M5 REFERENCE ONLY. Imposed poses, no material, linkage or safety qualification."""
import json
from pathlib import Path
import build123d as bd
from cad import model
from preflight import preflight

HERE=Path(__file__).resolve().parent

def params():
    return json.loads((HERE/'protocol.json').read_text(encoding='utf-8'))

def block(label,size,centre,color='#94a3b8'):
    part=bd.Box(*size).moved(bd.Location(centre))
    part.label=label;part.color=color
    return part

def transform(part,d=0,x=0,z=0,pitch=0,yaw=0,roll=0):
    return part.rotate(bd.Axis.Y,roll).rotate(bd.Axis.X,pitch).rotate(bd.Axis.Z,yaw).moved(bd.Location((x,d,z)))

def adapter_parts(d=6.4,x=0,z=0,pitch=0,yaw=0,roll=0,lead=3.5,key_a=True,key_b=True,collar=True,crossbar=None,hollow_reference=False):
    p=params()['profiles'];L=p['shell_length']
    if hollow_reference:
        # Sensitivity geometry, NOT a guaranteed minimum material set from USB-IF.
        w,h,L,wall=8.22,2.37,6.51,.15
        def capsule(width,height,length):
            middle=bd.Box(width-height,length,height)
            for side in (-1,1):
                cap=bd.Cylinder(height/2,length).rotate(bd.Axis.X,90).moved(bd.Location((side*(width-height)/2,0,0)))
                middle=middle+cap
            return middle
        shell=(capsule(w,h,L)-capsule(w-2*wall,h-2*wall,L+.2)).moved(bd.Location((0,-L/2,0)))
        shell.label='HOLLOW ILLUSTRATIVE shell - wall assumption';shell.color='#b4bcc8'
    else:
        shell=block('USB OUTER envelope - not guaranteed metal',(p['shell_width'],L,p['shell_height']),(0,-L/2,0),'#b4bcc8')
    pieces=[shell]
    if collar:
        front=p['collar_front_distance_from_tip'];rear=p['collar_rear_distance_from_tip']
        pieces.append(block('controlled collar - exploratory',(p['collar_width'],rear-front,p['collar_height']),(0,-(front+rear)/2,0),'#16a085'))
    if (collar if crossbar is None else crossbar):
        a,b=p['rear_crossbar_Y_interval']
        pieces.append(block('captive rear crossbar - reference',(p['rear_crossbar_width'],b-a,p['rear_crossbar_height']),(0,(a+b)/2,0),'#0f766e'))
    for i,present in enumerate((key_a,key_b)):
        if not present:continue
        cx,cz=p['key_centres_XZ'][i];rear=p['key_rear_Y']
        pieces.append(block(f'leading key {i+1} - no linkage',(p['key_width'],lead-rear,p['key_height']),(cx,(lead+rear)/2,cz),'#eab308'))
    return [transform(s,d,x,z,pitch,yaw,roll) for s in pieces]

def shutter_parts(a=0,b=0):
    p=params()['profiles']
    return [block('shutter A - prescribed pose',(p['shutter_width'],p['shutter_depth'],p['shutter_height']),(a,p['shutter_planes_Y'][0],0),'#d97706'),
            block('shutter B - prescribed pose',(p['shutter_width'],p['shutter_depth'],p['shutter_height']),(-b,p['shutter_planes_Y'][1],0),'#ea580c')]

def probe_parts(docked=False):
    p=params()['profiles']
    return [block(f'empty-port probe {i+1}',(p['probe_width'],p['probe_depth'],p['probe_height']),(0,py,0 if docked else p['probe_park_Z'][i]),'#3b82f6') for i,py in enumerate(p['probe_planes_Y'])]

def frame_part():
    p=params()['profiles'];frame=block('cutaway frame - reference only',(p['frame_width'],p['frame_depth'],p['frame_height']),tuple(p['frame_centre']),'#64748b')
    tunnel=block('tool',(p['central_tunnel_width'],9,p['central_tunnel_height']),(0,-2.5,0))
    frame=frame-tunnel
    for x,z in p['key_centres_XZ']:
        frame=frame-block('tool',(2.1,9,2.1),(x,-2.5,z))
    for y in p['shutter_planes_Y']:
        frame=frame-block('tool',(42,1.15,6.0),(0,y,0))
    for y in p['probe_planes_Y']:
        frame=frame-block('tool',(12.0,.55,22),(0,y,0))
    frame.label='cutaway frame - reference only';frame.color='#64748b'
    bb=frame.bounding_box().size
    assert abs(bb.X-p['frame_width'])<1e-6
    assert abs(bb.Z-p['frame_height'])<1e-6
    return frame

def host_part():
    # Reference shell only, no clone measurement or electrically accurate contacts.
    outer=block('reference host shell',(9.4,6.4,3.4),(0,3.2,0),'#94a3b8')
    inner=block('tool',(8.6,6.6,2.8),(0,3.2,0))
    body=outer-inner;body.label='reference receptacle - not B01 geometry';body.color='#94a3b8'
    return body

def motion(d,lead=3.5,key=True):
    k=params()['prescribed_kinematics']
    return max(0,min(1,(d+lead-k['actuation_trigger_plane_Y'])/k['key_ramp_insertion']))*12 if key else 0

def scene(kind):
    preflight();p=params()['profiles']
    if kind=='inserted':
        shutters=shutter_parts(12,12);adapter=adapter_parts();probes=probe_parts()
    elif kind=='tilted':
        shutters=shutter_parts(12,12);adapter=adapter_parts(x=.25,z=-.15,pitch=-5,yaw=5,roll=180);probes=probe_parts()
    elif kind=='blocked':
        shutters=shutter_parts();adapter=adapter_parts(d=-4.4,lead=3.5,key_a=False,key_b=False,collar=False);probes=probe_parts()
    elif kind=='closed':
        shutters=shutter_parts();adapter=[];probes=probe_parts()
    else:raise ValueError(kind)
    parts=[frame_part(),host_part()]+shutters+probes+adapter
    # Reference bridge envelope, not a connector or a physical gap proof.
    parts.append(block('bridge reserve - shown lifted12, overlap unknown',(35,25,1.6),(0,24,12),'#8b5cf6'))
    for s in shutter_parts(12,12):
        assert abs(abs(s.bounding_box().center().X)-12)<1e-6
    assembly=bd.Compound(children=parts);assembly.label=f'M5 {kind} REFERENCE - NOT FOR FABRICATION'
    return assembly

@model
def m5_program_reference():
    return scene('inserted')

@model
def m5_generic_blocked_reference():
    return scene('blocked')

@model
def m5_closed_reference():
    return scene('closed')

@model
def m5_tilted_interference_reference():
    return scene('tilted')

if __name__=='__main__':
    m5_program_reference();m5_generic_blocked_reference();m5_closed_reference();m5_tilted_interference_reference()
