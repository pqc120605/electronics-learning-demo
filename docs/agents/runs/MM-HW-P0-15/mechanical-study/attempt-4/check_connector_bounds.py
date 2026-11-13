import json,math,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
def main():
    path=HERE/'connector-bounds.json';p=json.loads(path.read_text(encoding='utf-8'));a=p['screening_allocations']
    socket=(p['socket_height_inch']['nominal']+p['socket_height_inch']['plus'])*25.4
    header=(p['header_height_inch']['nominal']+p['header_height_inch']['plus'])*25.4
    assembled=socket+header+2*(a['solder_standoff_max_each_mm']+a['additional_protrusion_budget_each_mm'])
    radial=math.hypot(*a['conductive_bridge_envelope_mm'])/2
    tilt=radial*math.sin(math.radians(a['relative_bridge_tilt_max_deg']))
    required=assembled+tilt+a['other_relative_loss_max_mm']+a['gap_required_mm']
    gap=a['proposed_lift_min_mm']-assembled-tilt-a['other_relative_loss_max_mm']
    values={'socket_finished_height_max_from_print_mm':socket,'header_K_height_max_from_print_mm':header,'assembled_envelope_sum_with_allocations_mm':assembled,'global_radial_extent_allocation_mm':radial,'tilt_loss_allocation_mm':tilt,'required_lift_without_mated_separation_credit_mm':required,'conditional_gap_at_lift16_mm':gap,'conditional_margin_over_screening_gap2_mm':gap-a['gap_required_mm'],'conditional_gap_at_historical_lift11_8_mm':11.8-assembled-tilt-a['other_relative_loss_max_mm'],'counterexample_gap_with_edge_pivot_mm':a['proposed_lift_min_mm']-assembled-2*tilt-a['other_relative_loss_max_mm'],'counterexample_gap_with_relative10deg_mm':a['proposed_lift_min_mm']-assembled-radial*math.sin(math.radians(10))-a['other_relative_loss_max_mm'],'nominal_socket_length_reference_mm':25*1.27+3.94,'depth_reserve_with_allocations_mm':p['mated_stack_mm']['max']+a['bridge_PCB_thickness_max_mm']+a['proposed_lift_max_mm']+a['park_clearance_mm']}
    assert p['mated_stack_mm']['min'] is None
    assert gap>2 and values['conditional_gap_at_historical_lift11_8_mm']<2
    assert values['nominal_socket_length_reference_mm']>35
    assert values['counterexample_gap_with_edge_pivot_mm']<2 and values['counterexample_gap_with_relative10deg_mm']<2
    out={'scope':'Conditional geometry calculation, not hardware or isolation PASS','allocations_are_unverified':True,'values':values,'input_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'not_proven':['all-metal envelope qualification','actual mated datum geometry','solder/tilt/deflection budgets','physical endpoints','pulled terminal fault','whole-kit fit or cost','approved travel/configuration','B1']}
    (HERE/'connector-bounds-results.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(values))
if __name__=='__main__':main()
