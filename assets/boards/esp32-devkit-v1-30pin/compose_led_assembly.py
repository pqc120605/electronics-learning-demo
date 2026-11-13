"""Append an educational breadboard LED assembly to the KiCad reference GLB.

The scene is a visual teaching aid. The extra parts have no electrical netlist.
Uses only Python's standard library; dimensions below are generic millimetres.
"""
from __future__ import annotations

import json
import math
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "public/models/esp32-devkit-v1-30pin.glb"
TARGET = ROOT / "public/models/esp32-led-assembly.glb"
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


class Mesh:
    def __init__(self):
        self.p: list[tuple[float, float, float]] = []
        self.n: list[tuple[float, float, float]] = []
        self.i: list[int] = []

    def tri(self, a, b, c, normal=None):
        if normal is None:
            u = tuple(b[k] - a[k] for k in range(3)); v = tuple(c[k] - a[k] for k in range(3))
            normal = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
            length = math.sqrt(sum(q*q for q in normal)) or 1
            normal = tuple(q/length for q in normal)
        base = len(self.p); self.p.extend((a, b, c)); self.n.extend((normal, normal, normal)); self.i.extend((base, base+1, base+2))

    def box(self, center, size):
        x,y,z = center; sx,sy,sz = (v/2 for v in size)
        corners = [(x+dx*sx,y+dy*sy,z+dz*sz) for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        for face, normal in [((0,3,2,1),(0,0,-1)),((4,5,6,7),(0,0,1)),((0,1,5,4),(0,-1,0)),((3,7,6,2),(0,1,0)),((0,4,7,3),(-1,0,0)),((1,2,6,5),(1,0,0))]:
            a,b,c,d = [corners[j] for j in face]; self.tri(a,b,c,normal); self.tri(a,c,d,normal)

    def cylinder(self, start, end, radius, sides=10):
        direction = tuple(end[k]-start[k] for k in range(3)); length = math.sqrt(sum(q*q for q in direction)) or 1
        axis = tuple(q/length for q in direction); ref = (0,1,0) if abs(axis[1]) < .9 else (1,0,0)
        u = (axis[1]*ref[2]-axis[2]*ref[1], axis[2]*ref[0]-axis[0]*ref[2], axis[0]*ref[1]-axis[1]*ref[0]); ul=math.sqrt(sum(q*q for q in u)) or 1; u=tuple(q/ul for q in u)
        v = (axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0])
        rings=[]
        for point in (start,end):
            rings.append([tuple(point[k]+radius*(u[k]*math.cos(2*math.pi*j/sides)+v[k]*math.sin(2*math.pi*j/sides)) for k in range(3)) for j in range(sides)])
        for j in range(sides):
            k=(j+1)%sides; self.tri(rings[0][j],rings[0][k],rings[1][k]); self.tri(rings[0][j],rings[1][k],rings[1][j])
        self.tri(start,*reversed(rings[0][:2]),tuple(-q for q in axis)); self.tri(end,rings[1][0],rings[1][1],axis)


def read_glb(path):
    data=path.read_bytes(); magic,version,total=struct.unpack_from('<III',data)
    if magic != 0x46546c67 or version != 2 or total != len(data): raise ValueError('Input must be a complete GLB v2 file.')
    off=12; doc=None; binary=None
    while off < len(data):
        size,kind=struct.unpack_from('<II',data,off); chunk=data[off+8:off+8+size]; off+=8+size
        if kind==JSON_CHUNK: doc=json.loads(chunk.decode('utf-8').rstrip(' \0'))
        elif kind==BIN_CHUNK: binary=bytearray(chunk)
    if not doc or binary is None: raise ValueError('Input GLB must contain JSON and BIN chunks.')
    if doc.get('extensionsUsed') or any(p.get('attributes',{}).keys() - {'POSITION','NORMAL'} for m in doc.get('meshes',[]) for p in m.get('primitives',[])): raise ValueError('Unsupported source GLB feature.')
    return doc,binary


def align(blob, boundary=4):
    blob.extend(b'\0' * ((-len(blob)) % boundary)); return len(blob)


def main():
    if not SOURCE.exists(): raise FileNotFoundError(f'Missing source model: {SOURCE}')
    doc, binary=read_glb(SOURCE)
    for key in ('nodes','meshes','materials','accessors','bufferViews','scenes'):
        doc.setdefault(key,[])
    material_map={}
    def material(name, color):
        if name in material_map: return material_map[name]
        material_map[name]=len(doc['materials']); doc['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[*color,1],'metallicFactor':0.02,'roughnessFactor':0.72}}); return material_map[name]

    def add_mesh(name, mesh, color):
        start=align(binary); pos_offset=start
        for point in mesh.p: binary.extend(struct.pack('<3f',*point))
        pos_len=len(binary)-pos_offset; align(binary); normal_offset=len(binary)
        for normal in mesh.n: binary.extend(struct.pack('<3f',*normal))
        normal_len=len(binary)-normal_offset; align(binary); index_offset=len(binary)
        if len(mesh.p) > 65535: raise ValueError(f'{name} has too many vertices for the viewer profile.')
        for index in mesh.i: binary.extend(struct.pack('<H',index))
        index_len=len(binary)-index_offset
        views=[]; accessors=[]
        for offset,length,target in ((pos_offset,pos_len,34962),(normal_offset,normal_len,34962),(index_offset,index_len,34963)):
            views.append(len(doc['bufferViews'])); doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':length,'target':target})
        mins=[min(v[k] for v in mesh.p) for k in range(3)]; maxs=[max(v[k] for v in mesh.p) for k in range(3)]
        for view,component,count,kind,extra in ((views[0],5126,len(mesh.p),'VEC3',{'min':mins,'max':maxs}),(views[1],5126,len(mesh.n),'VEC3',{}),(views[2],5123,len(mesh.i),'SCALAR',{})):
            accessors.append(len(doc['accessors'])); doc['accessors'].append({'bufferView':view,'componentType':component,'count':count,'type':kind,**extra})
        mesh_idx=len(doc['meshes']); doc['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':accessors[0],'NORMAL':accessors[1]},'indices':accessors[2],'material':material(name,color),'mode':4}]})
        doc['nodes'].append({'name':name,'mesh':mesh_idx})

    # Breadboard: generic 82 x 55 mm body with marked rails and a center trench.
    board=Mesh(); board.box((.012, .002, 0),(.082,.009,.055)); board.box((.012,.0066,0),(.078,.0005,.051))
    board.box((.012,.0069,0),(.078,.0007,.002))
    for z in (-.023,.023): board.box((.012,.0072,z),(.078,.0005,.0007))
    # tie-point field: shallow dark disks made as small faceted cylinders
    for row in range(10):
        z=-.018 + row*.004
        for col in range(25):
            x=-.025 + col*.003
            if abs(z)<.003: continue
            board.cylinder((x,.0070,z),(x,.00725,z),.00048,6)
    add_mesh('BREADBOARD',board,(.82,.84,.78))
    rail=Mesh(); rail.box((.012,.00755,.0224),(.078,.00025,.00035)); add_mesh('BREADBOARD_RAIL_RED',rail,(.88,.18,.16))
    rail=Mesh(); rail.box((.012,.00755,-.0224),(.078,.00025,.00035)); add_mesh('BREADBOARD_RAIL_BLUE',rail,(.16,.40,.86))

    # LED and resistor sit above the breadboard; wires are separate selectable nodes.
    led=Mesh(); led.cylinder((.005,.008,-.005),(.005,.013,-.005),.0025,12); led.cylinder((.005,.013,-.005),(.005,.018,-.005),.0024,12)
    led.cylinder((.004,.008,-.006),(.004,.002,-.006),.00032,8); led.cylinder((.006,.008,-.004),(.006,.002,-.004),.00032,8)
    add_mesh('LED_EXT',led,(.92,.12,.12))
    resistor=Mesh(); resistor.cylinder((-.009,.009,.008),(-.001,.009,.008),.0012,10)
    resistor.cylinder((-.009,.009,.008),(-.008,.009,.008),.00123,10); resistor.cylinder((-.006,.009,.008),(-.0055,.009,.008),.00124,10); resistor.cylinder((-.004,.009,.008),(-.0035,.009,.008),.00124,10)
    resistor.cylinder((-.009,.009,.008),(-.015,.002,.008),.00025,8); resistor.cylinder((-.001,.009,.008),(.005,.002,.008),.00025,8)
    add_mesh('R_LED',resistor,(.72,.56,.32))

    # Source-board pads in KiCad coordinates (converted to the exported GLB axes).
    # The board is rotated -90 degrees around Y and moved so its center is x=-55 mm.
    def board_pin(x, z): return (-z + .0510577, .0023, x - .1501492)
    gpio=board_pin(.1289508,.093345)  # J2 pad 15, net /D23
    gnd=board_pin(.1619708,.093345)   # J2 pad 2, net GND
    resistor_input=(-.015,.002,.008); resistor_output=(.005,.002,.008); led_anode=(.004,.002,-.006)
    start=gpio
    wire=Mesh(); wire.cylinder(start,resistor_input,.00045,8); wire.cylinder(resistor_output,led_anode,.00045,8); add_mesh('WIRE_GPIO23',wire,(.10,.34,.92))
    start=(.006,.002,-.004); end=gnd
    wire=Mesh(); wire.cylinder(start,end,.00045,8); add_mesh('WIRE_GND',wire,(.18,.20,.22))

    # Add a parent translation to all original scene roots; added parts remain in assembly coordinates.
    scene=doc['scenes'][doc.get('scene',0)]; original_roots=list(scene['nodes'])
    added_roots=[index for index,node in enumerate(doc['nodes']) if node.get('name') in {'BREADBOARD','BREADBOARD_RAIL_RED','BREADBOARD_RAIL_BLUE','LED_EXT','R_LED','WIRE_GPIO23','WIRE_GND'}]
    wrapper=len(doc['nodes']); doc['nodes'].append({'name':'PCB_ASSEMBLY_OFFSET','translation':[.0510577,0,-.1501492],'rotation':[0,-.7071067811865475,0,.7071067811865475],'children':original_roots})
    scene['nodes']=[wrapper,*added_roots]
    binary_len=len(binary); doc['buffers'][0]['byteLength']=binary_len
    json_bytes=json.dumps(doc,separators=(',',':')).encode('utf-8'); json_bytes+=b' ' * ((-len(json_bytes))%4); binary+=b'\0' * ((-len(binary))%4)
    total=12+8+len(json_bytes)+8+len(binary)
    out=bytearray(struct.pack('<III',0x46546c67,2,total)); out.extend(struct.pack('<II',len(json_bytes),JSON_CHUNK)); out.extend(json_bytes); out.extend(struct.pack('<II',len(binary),BIN_CHUNK)); out.extend(binary)
    TARGET.parent.mkdir(parents=True,exist_ok=True); temporary=TARGET.with_suffix('.glb.tmp'); temporary.write_bytes(out)
    read_glb(temporary); temporary.replace(TARGET)
    print(f'Wrote {TARGET} ({TARGET.stat().st_size} bytes)')

if __name__=='__main__':
    try: main()
    except Exception as exc: print(f'Assembly GLB generation failed: {exc}',file=sys.stderr); raise
