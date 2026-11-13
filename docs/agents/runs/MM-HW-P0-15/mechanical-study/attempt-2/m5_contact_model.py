"""Approved M5 reference study only; ideal slides, no force/material qualification."""
import sys
from pathlib import Path
import build123d as bd
from cad import model
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE));sys.path.insert(1,str(HERE.parent))
from geometry import C,cam,cut_boxes,adapter_base,interval_template,solve_slider
from preflight import preflight

def block(label,size,centre,color='#94a3b8'):
    s=bd.Box(*size).moved(bd.Location(centre));s.label=label;s.color=color;return s

def native(poly):
    # The first four vertices are a planar convex face; extrusion joins the next four.
    face=bd.Face(bd.Wire.make_polygon(poly['v'][:4],close=True))
    delta=tuple(b-a for a,b in zip(poly['v'][0],poly['v'][4]))
    length=sum(x*x for x in delta)**.5
    s=bd.extrude(face,amount=length,dir=delta);s.label=poly['label'];return s

def frame():
    s=block('frame',C['frame']['size'],C['frame']['centre'])
    for p in cut_boxes():s=s-native(p)
    s.label='RELIEVED study frame - no bearing/strength proof';s.color='#64748b'
    return s

def carriage(side,displacement):
    p=C['carriage'];i=0 if side==1 else 1;y=p['door_y'][i]
    door=block('door',(p['door_width'],p['door_depth'],p['door_height']),(0,y,0))
    xlo,xhi=p['rib_x'];zlo,zhi=p['rib_z']
    rib=block('rib',(xhi-xlo,p['rib_depth'],zhi-zlo),(side*(xlo+xhi)/2,y,side*(zlo+zhi)/2))
    bx0,bx1=p['rib_bridge_x'];bz0,bz1=p['rib_bridge_z']
    bridge=block('rib bridge',(bx1-bx0,p['rib_depth'],bz1-bz0),(side*(bx0+bx1)/2,y,side*(bz0+bz1)/2))
    body=native(cam(side))+rib+bridge+door
    assert len(body.solids())==1,'Cam/rib/door must be a connected native solid'
    body=body.moved(bd.Location((side*displacement,0,0)))
    body.label=('A' if side==1 else 'B')+' rigid cam-rib-door; ideal slide'
    body.color='#f59e0b' if side==1 else '#ec6c32'
    return body

def scene(d,with_adapter=True):
    preflight();parts0=adapter_base();s=[]
    for side in (1,-1):
        templates=[interval_template(cam(side),p,side) for p in parts0]
        solved,_=solve_slider(templates,d,0) if with_adapter else (0,[])
        assert solved is not None;s.append(solved)
    parts=[frame(),carriage(1,s[0]),carriage(-1,s[1])]
    if with_adapter:
        for poly in parts0:
            part=native(poly).moved(bd.Location((0,d,0)))
            part.label=poly['label']+' - controlled reference' if poly['label']!='shell-outer' else 'USB OUTER envelope; not guaranteed metal'
            part.color={'collar':'#14b8a6','crossbar':'#0f766e','key0':'#eab308','key1':'#eab308'}.get(poly['label'],'#cbd5e1');parts.append(part)
    for i,y in enumerate(C['probes']['planes_y']):
        parts.append(block('probe '+str(i+1)+' shown retracted; interlock NOT modeled',(11.4,.3,5.4),(0,y,7.5 if i==0 else -7.5),'#3b82f6'))
    return bd.Compound(children=parts)

@model
def m5_contact_closed():return scene(-20,False)

@model
def m5_contact_partial():return scene(-7)

@model
def m5_contact_inserted():return scene(6.4)

if __name__=='__main__':
    m5_contact_closed();m5_contact_partial();m5_contact_inserted()
