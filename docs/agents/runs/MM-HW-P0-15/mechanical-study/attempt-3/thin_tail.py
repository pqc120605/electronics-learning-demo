"""Synthetic static corridor witness; NOT an insertion trajectory or real USB cable."""
import sys,json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'attempt-2'))
from geometry import box,moved,adapter_base,frame_cells,carriage_parts,probe_boxes,classify

POINTS=[(0,-.15,0),(1,-.15,0),(1,-1.98,0),(1,-1.98,2.85),(1,-3.02,2.85),(1,-3.02,0),
 (1,-3.48,0),(1,-3.48,2.85),(1,-4.52,2.85),(1,-4.52,0),
 (1,-7.29,0),(1,-7.29,3.0),(1,-7.72,3.0),(1,-7.72,0),
 (1,-8.39,0),(1,-8.39,3.0),(1,-8.82,3.0),(1,-8.82,0),(1,-12,0)]

def filaments():
    out=[]
    for i,(a,b) in enumerate(zip(POINTS,POINTS[1:])):
        assert sum(x!=y for x,y in zip(a,b))==1
        out.append(box('synthetic tail segment '+str(i),tuple(abs(x-y)+.1 for x,y in zip(a,b)),tuple((x+y)/2 for x,y in zip(a,b))))
    return out

def obstacles():
    out=frame_cells()+[p for side in (1,-1) for p in carriage_parts(side,0)]+probe_boxes()
    # AABB around the positive-witness test heads; separation is conservative here.
    out +=[box('witnessA bbox',(.6,.4,.6),(0,-3.4,.7)),box('witnessB bbox',(.6,.4,.6),(0,-1.9,-.7))]
    return out

def main():
    segments=filaments();targets=obstacles();collisions=[];touches=[]
    shell=moved(adapter_base(collar=False,key_a=False,key_b=False)[0],(0,6.4,0))
    for part in segments+[shell]:
        for target in targets:
            c=classify(part,target)
            if c=='interpenetrating':collisions.append([part['label'],target['label']])
            if c=='touching':touches.append([part['label'],target['label']])
    assert all(classify(a,b)=='interpenetrating' for a,b in zip(segments,segments[1:])), 'tail must be one continuous solid chain'
    assert classify(segments[0],shell)=='interpenetrating','tail must meet shell envelope'
    assert not collisions and not touches,(collisions,touches)
    out={'scope':'Synthetic STATIC configuration only; NOT normally reachable insertion, commercial cable, conductive performance or system single-fault bypass',
      'shell_depth':6.4,'tail_square_section_mm':.1,'tail_has_sharp_prescribed_bends':True,'points_mm':POINTS,'segments':len(segments),'obstacle_count':len(targets),
      'positive_interference_pairs':collisions,'touching_pairs':touches,'static_indications':{'shutters_home':True,'probe_corridors_empty_of_shell_and_tail':True,'face_witness_test_heads_clear_of_tail':True,'reference_shell_inside_potential_contact_region':True},
      'finding':'The static combination of closed functional panels and empty remote collar probes does not alone prove absence of an arbitrarily thin prescribed tail plus a shell already at contact depth.',
      'not_proven':['insertion history with healthy shutters','manufacturable cable/bend radius','actual USB contact/cable geometry','force/strength/tolerance','single-fault system reachability','B1'],
      'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    (HERE/'thin-tail-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'static_segments':len(segments),'obstacles':len(targets),'positive_interference':len(collisions),'touching':len(touches),'scope':'static synthetic counterexample only'}))
if __name__=='__main__':main()
