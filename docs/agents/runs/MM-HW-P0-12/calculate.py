"""Reproducible C12 screening; no simulated or physical hardware PASS."""
import json,math
kmin=1.638288484727291;kmax=1.6386715727359105;reference_error=651.2e-6
def tlv9031_partial(extra_ref_ppm=0):
    e=reference_error+extra_ref_ppm*1e-6
    vmin=2.5*(1-e);vmax=2.5*(1+e)
    cm=vmax*10**(-60/20) # offset test reference is ground, not midsupply
    ps=.25*10**(-75/20) # conditional extrapolation worksheet, not full supply proof
    leak=6384.8*1.00015*105e-9 # allocation; this comparator has no published IB MAX
    lo=kmin*(vmin-.002-cm-ps)-leak
    hi=kmax*(vmax+.002+cm+ps)+leak
    return {'extra_reference_allowance_ppm':extra_ref_ppm,'trip_partial_min_V':lo,'trip_partial_max_V':hi,'low_margin_V':lo-4.0824,'high_margin_V':4.110-hi,'CMRR_input_error_V':cm,'PSRR_input_error_V':ps,'full_bound_proven':False}
ltc_lo=kmin*(2.5*(1-reference_error)-.006+.0016/2)
ltc_hi=kmax*(2.5*(1+reference_error)+.006+.0082/2)
ip=(5.5-2.9)/1.089
def cutoff(trip,cap=.01,esr=.01):
    h=4.2-trip-kmax*.020-ip*esr-.020
    return {'trip_max_V':trip,'Cmin_F':cap,'ESRmax_ohm':esr,'voltage_headroom_after_allocations_V':h,'allowable_time_us':max(0,h*cap/ip*1e6),'model_has_positive_headroom':h>0,'timing_chain_proven':False}
run_i=2*5.25/9900
joy_i=2*3.6/21780
run_p=5.25*run_i;joy_p=3.6*joy_i
r={'classification':'Conditional worksheet. Missing MAX and topology remain unknown; not gate closure.',
'H3_candidates':{'TLV9031':{'partial_intervals':[tlv9031_partial(),tlv9031_partial(200)],'internal_hysteresis':'manufacturer states none','input_bias_MAX_A':None,'propagation_delay_MAX_s':None,'supply_condition':'CMRRmin at5V, PSRRmin over1.8..5V;4.75..5.25V not fully covered','verdict':'conditional static candidate only'},'LTC6702H':{'rising_offset_min_V':-.006+.0016/2,'rising_offset_max_V':.006+.0082/2,'rising_only_ref_divider_min_V':ltc_lo,'rising_only_ref_divider_max_V':ltc_hi,'rising_interval_width_mV':(ltc_hi-ltc_lo)*1000,'allowed_window_mV':27.6,'rejected_for_existing_window':ltc_hi-ltc_lo>.0276}},
'H3_tradeoff_sensitivity':[cutoff(4.110),cutoff(4.110,.02),cutoff(4.120),cutoff(4.125,.01,.001)],
'bleed':{'connection':'continuous passive proposal, no BOM approval','RUN_current_MAX_A':run_i,'RUN_power_MAX_W':run_p,'JOY_current_MAX_A':joy_i,'JOY_power_MAX_W':joy_p,'RUN_other_load_remaining_A':.5-run_i,'RUN_fixed_envelope_MAX_W':5.25*.5,'pack_run_requirement_if_bleed_reserved_inside500mA_A':5.25*.5/(3.2*.8)+.020,'pack_run_requirement_if_extra_bleed_outside500mA_A':(5.25*.5+run_p)/(3.2*.8)+.020,'extra_bleed_outside500mA_is_allowed':False,'JOY_double_count_rule':'JOY supplied via B01 belongs within total RUN envelope; conversion efficiency is stillTBD'},
'H3_bias_budget_if_simultaneously_powered':{'two_ADR4525_IQ_MAX_A':2*.000950,'two_TLV9031_IQ_MAX_A':2*.000035,'total_IC_IQ_MAX_A':2*.000950+2*.000035,'power_at_assumed5V_W':5*(2*.000950+2*.000035),'pack_equivalent_at3_2V_eta0_8_A':5*(2*.000950+2*.000035)/(3.2*.8),'mode_topology_coverage':'TBD. No proof devices actually share5V/RUN/pack branch; otherICloads not included.'},
'gpio':{'total_roles':16,'baseline':5,'new_control_outputs':4,'E_output_reserve':4,'new_status_inputs':3,'new_output_capable_pool':9,'new_input_only_pool':2,'spare':0,'actual_GPIO_assignments':'UNASSIGNED'}}
assert r['H3_candidates']['LTC6702H']['rejected_for_existing_window']
assert r['gpio']['new_control_outputs']+r['gpio']['E_output_reserve']+r['gpio']['new_status_inputs']==11
assert abs(r['bleed']['pack_run_requirement_if_bleed_reserved_inside500mA_A']-1.045390625)<1e-12
print(json.dumps(r,indent=2))
