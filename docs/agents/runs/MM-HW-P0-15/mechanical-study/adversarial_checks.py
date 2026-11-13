"""Explicit critiques from Box03: never equate imposed logic or envelopes with proof."""
import json,math,hashlib
from pathlib import Path
import build123d as bd
from preflight import preflight
from collision import rotation,dot,prescribed_motion
from m5_model import adapter_parts,probe_parts,block,params
from kernel_check import volume_intersection,valid
HERE=Path(__file__).resolve().parent
def main():
    preflight();p=params()['profiles'];mapping=[]
    for key in (0,1):
        for roll,pitch,yaw in ((0,0,0),(180,0,0),(0,5,5),(180,5,5)):
            cx,cz=p['key_centres_XZ'][key];lead=3.5;R=rotation(pitch,yaw,roll)
            tip=tuple(dot(row,(cx,lead,cz)) for row in R)
            vertex=bd.Vertex(cx,lead,cz).rotate(bd.Axis.Y,roll).rotate(bd.Axis.X,pitch).rotate(bd.Axis.Z,yaw)
            measured=vertex.center();assert max(abs(a-b) for a,b in zip(tip,(measured.X,measured.Y,measured.Z)))<1e-9
            distances=[math.hypot(tip[0]-x,tip[2]-z) for x,z in p['key_centres_XZ']]
            channel=min(range(2),key=distances.__getitem__)
            mapping.append({'only_key':key,'roll':roll,'pitch':pitch,'yaw':yaw,
               'tip_xyz_at_d0':tip,'closest_channel_NOT_engagement_proof':channel,
               'imposed_shutter_identity':key,'mapping_differs':channel!=key,
               'geometric_tip_trigger_d':-4.8-tip[1],'scalar_imposed_trigger_d':-4.8-lead,
               'channel_distance_mm':distances[channel]})
    assert any(x['mapping_differs'] for x in mapping if x['roll']==180)
    shape_comparisons=[]
    for case in ({'d':6.4},{'d':6.4,'x':.25,'z':-.15,'pitch':-5,'yaw':5,'roll':180},{'d':-.2,'x':-.25,'z':.15,'pitch':5,'yaw':5}):
        outer=adapter_parts(**case);hollow=adapter_parts(**case,hollow_reference=True)
        assert valid(hollow[0]) and hollow[0].volume>0
        for i,target in enumerate(probe_parts(docked=True)):
            ov=volume_intersection(outer[0],target);hv=volume_intersection(hollow[0],target)
            shape_comparisons.append({'pose':case,'probe':i,'outer_shell_volume_mm3':ov,'illustrative_hollow_shell_volume_mm3':hv,
             'outer_only_collision':ov>1e-7 and hv<=1e-7,'presence_proof':'NOT_PROVEN: hollow wall/profile is an assumption, outer box is not material'})
    # Deliberately small detector at a bounding-box corner: a known outer-envelope false positive.
    corner=block('diagnostic small corner probe',(.02,.2,.02),(4.12,-1,1.20))
    outer=adapter_parts(d=0)[0];hollow=adapter_parts(d=0,hollow_reference=True)[0]
    corner_outer=volume_intersection(outer,corner);corner_hollow=volume_intersection(hollow,corner)
    assert corner_outer>1e-7 and corner_hollow<=1e-7
    fault_results=[]
    for collar,crossbar in ((True,True),(False,True),(True,False),(False,False)):
        pieces=adapter_parts(d=6.4,collar=collar,crossbar=crossbar)
        dock=[];closure=[]
        for i,target in enumerate(probe_parts(docked=True)):
            dock.append([{'part':s.label,'volume_mm3':volume_intersection(s,target)} for s in pieces if volume_intersection(s,target)>1e-7])
            samples=[]
            for n in range(13):
                z=p['probe_park_Z'][i]*(1-n/12)
                target=block('closure test',(p['probe_width'],p['probe_depth'],p['probe_height']),(0,p['probe_planes_Y'][i],z))
                if any(volume_intersection(s,target)>1e-7 for s in pieces):samples.append(n)
            closure.append(samples)
        fault_results.append({'collar':collar,'crossbar':crossbar,'synthetic_fault_geometry':not(collar and crossbar),
          'same_pose_d':6.4,'same_imposed_shutters':'open','docked_collisions':dock,'closure_collision_sample_indices':closure})
    assert all(fault_results[0]['docked_collisions'])
    assert not any(fault_results[1]['docked_collisions'])
    assert all(fault_results[2]['docked_collisions'])
    assert not any(fault_results[3]['docked_collisions'])
    out={'kind':'Adversarial reference sensitivity, NOT hardware or linkage qualification',
      'key_mapping_diagnostics':mapping,'outer_vs_illustrative_hollow':shape_comparisons,
      'diagnostic_corner_false_positive':{'outer_volume_mm3':corner_outer,'hollow_volume_mm3':corner_hollow,'not_current_full_aperture_probe':True},
      'separated_component_faults':fault_results,
      'findings':['Scalar key law differs from host-space mapping at roll180 and tilted trigger coordinates; linkage remains unmodelled.',
      'Outer-envelope intersection is not proof of metal presence; illustrative hollow checks do not establish a guaranteed material set.',
      'At this deep pose, removing only collar defeats detection even with crossbar retained; crossbar removal alone does not. Faults are synthetic, not assumed buildable adapters.']}
    out['provenance']={name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in ['protocol.json','adversarial_checks.py','m5_model.py','collision.py','kernel_check.py']}
    (HERE/'adversarial-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'key_cases':len(mapping),'outer_hollow_probe_cases':len(shape_comparisons),'component_fault_cases':len(fault_results),'corner_false_positive_detected':True,'all_expected_adversarial_findings_detected':True}))
if __name__=='__main__':main()
