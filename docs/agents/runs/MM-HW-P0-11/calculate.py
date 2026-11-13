"""Paper-design requirements; not measurements or hardware acceptance."""
import json,math
def decay(v0,target,resistance,capacitance,injected_current):
    plateau=resistance*injected_current
    reachable=target>plateau
    return {'V0_V':v0,'target_V':target,'Rmax_ohm':resistance,'Cmax_F':capacitance,'Imax_A':injected_current,'plateau_V':plateau,'time_to_target_s':resistance*capacitance*math.log((v0-plateau)/(target-plateau)) if reachable and v0>target else (0 if reachable else None),'reachable':reachable}
run=decay(5.25,.693404-.050,10100,100e-6,30e-6)
joy=decay(3.6,.643404,22220,10e-6,20e-6)
qualifier_min=.100
qualifier_max_proposal=.250
available=4-.020-.100
exp=math.exp(-available/(10100*100e-6))
imax=(.643404-5.25*exp)/(10100*(1-exp))
geo=[]
for stroke in [.8,.85,.9,1.0]:
    sep=stroke*math.cos(math.radians(5))-.3
    geo.append({'stroke_mm':stroke,'angular_error_deg':5,'loss_max_mm':.30,'separation_min_mm':sep,'margin_to_half_mm':sep-.5})
record={'classification':'Conditional calculations, no engineering PASS','RUN_OUT_single_bleed_open':run,'RUN_timeout_allocation_s':run['time_to_target_s']+.020+.100,'RUN_additional_allocation_margin_s':4-run['time_to_target_s']-.020-.100,'RUN_allowed_total_injection_at4s_A':imax,'JOY_proposed_2x22k_one_open':joy,'JOY_both_bleeds_run_current_at3_3V_A':2*3.3/22000,'JOY_old100k_at12uA_plateau_V':100000*12e-6,'watchdog_followon_allocation_ms':20-12.65,'geometry_direction_sensitivity':geo,'gpio_options':{'omit_optional_total':15,'one_optional_total':16,'aggregate_two_total':16,'all_separate_total':17,'assured_total':16},'hardware_MAX_chain':'TBD','physical_checks':'NOT_RUN'}
record['qualification_timing_caveat']='100ms is existing MIN only; RUN_timeout_allocation/margin and53.701uA sensitivity assume actual100ms and are not MAX bounds. Additional sensing/logic delays need separate bounds.'
record['qualification_proposal']={'min_s':qualifier_min,'max_target_s':qualifier_max_proposal,'component_proven':False,'conditional_RUN_total_s':run['time_to_target_s']+.020+qualifier_max_proposal,'remaining_sensing_logic_margin_s':4-run['time_to_target_s']-.020-qualifier_max_proposal}
record['selected_G_B']={'total':16,'baseline_inputs':5,'control_outputs':4,'E_reserved_worst_case_outputs':4,'mandatory_status_inputs':2,'optional_second_position_input':1,'optional_charger_export':0,'unused_output_capable_needed':9,'unused_input_only_needed':2,'hardware_sensors_veto_preserved':True,'pin_assignments':'UNASSIGNED','diagnostic_fault_coverage':'TBD; direction approval not designPASS'}
record['neutral_selector_clearance_example']={'nominal_clearance_mm':.50,'tolerance_stack_max_mm':.15,'assembly_deflection_max_requirement_mm':.05,'wear_allowance_mm':.05,'other_debris_cable_allowance_mm':None,'calculated_clearance_mm':.25,'classification':'hypothetical envelope requirements, not measured or proven finite geometry'}
rt=6384.8; rb=10000; er=150e-6
kmin=1+rt*(1-er)/(rb*(1+er));kmax=1+rt*(1+er)/(rb*(1-er))
eps=(200+330+120+1.2)*1e-6
def interval(additional_reference_ppm=0):
    e=eps+additional_reference_ppm*1e-6
    vmin=2.5*(1-e);vmax=2.5*(1+e)
    cm=max(abs(vmin-5.25/2),abs(vmax-4.75/2))*10**(-60/20)
    ps=.25*10**(-65/20)
    bias=rt*(1+er)*105e-9
    lo=kmin*(vmin-.004-cm-ps)-bias
    hi=kmax*(vmax+.004+cm+ps)+bias
    return {'reference_extra_allowance_ppm':additional_reference_ppm,'input_CMRR_error_V':cm,'input_PSRR_error_V':ps,'trip_partial_min_V':lo,'trip_partial_max_V':hi,'low_margin_V':lo-4.0824,'high_margin_V':4.110-hi,'full_bound_proven':False}
ip=(5.5-2.9)/1.089
limit=lambda guard: (4.2-4.110-kmax*.020-ip*.010-.020-guard)*.010/ip
record['H3_precision_proposal']={'Rt_nominal_ohm':rt,'Rb_nominal_ohm':rb,'resistor_error_bound_requirement':er,'Kmin':kmin,'Kmax':kmax,'reference_error_ppm_before_shift':eps*1e6,'partial_intervals':[interval(),interval(200)],'cutoff_requirement_us_new_ratio':limit(0)*1e6,'cutoff_requirement_us_with_1mV_guard':limit(.001)*1e6,'REF33_reference_only_error_at4_0962V':4.0962*(.0015+30e-6*165),'missing':['hysteresisMAX','full-temperatureCMRR/PSRR','aging/thermalhistory','ripple','chosen resistor lifetime bounds','complete fault topology','reference ready veto','actual cell-side C/ESR topology']}
assert not decay(3.6,.8,100000,10e-6,12e-6)['reachable']
assert joy['reachable'] and run['reachable']
assert 0<record['RUN_timeout_allocation_s']<4
assert geo[0]['margin_to_half_mm']<0<geo[2]['margin_to_half_mm']
print(json.dumps(record,indent=2))
