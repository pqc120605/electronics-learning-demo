"""Independent arithmetic only. Force/mass/time inputs are unproven candidate requirements."""
import math,json
r={
 'weak_guard_return_time_ms_at1g_1_2mm_net0_06N':math.sqrt(2*.001*.0012/.06)*1000,
 'weak_guard_even_if0_18N_gross_no_drag_time_ms':math.sqrt(2*.001*.0012/.18)*1000,
 'force_for1g_1_2mm_in1ms_N':2*.001*.0012/.001**2,
 'force_for1g_1_2mm_in0_5ms_N':2*.001*.0012/.0005**2,
 'max_mass_kg_if0_06N_1_2mm_1ms':.06*.001**2/(2*.0012),
 'max_travel_mm_if0_06N_1g_1ms':(.06*.001**2/(2*.001))*1000,
 'strong_spring_work_mJ':((72+60)/2*.0012)*1000,
 'average_cocking_force_N_with10mJloss_eta0_6_3mm':(((72+60)/2*.0012)+.010)/(.6*.003),
 'strong_guard_free_travel_ms':math.sqrt(2*.003*.0012/60)*1000,
 'trigger_free_travel_ms':math.sqrt(2*.000020*.0001/.10)*1000,
 'impact_screening_work_mJ':72*.0012*1000,
 'average_arrest_force_N_if0_2mm_stop':72*.0012/.0002,
 'old_actuator_net_work_mJ':.3*1.2,
 'follower_sensitivity_mm_in1ms_if3g_0_1m_s_100N':(.1*.001+.5*(100/.003)*.001**2)*1000}
r['strong_free_motion_budget_ms']=.15+r['strong_guard_free_travel_ms']+r['trigger_free_travel_ms']+.20
assert r['weak_guard_return_time_ms_at1g_1_2mm_net0_06N']>1
assert abs(r['strong_free_motion_budget_ms']-.8964101615137755)<1e-12
print(json.dumps({'classification':'Screening arithmetic only; NOT actual capture, physical timing or design acceptance','results':r,
 'unresolved':['source of opening work over full phase cycle','guard approach when follower occupies throat','bounded follower history/energy','actual decay/seat/return bounds','impact rebound/shared datum faults','fit/cost']},indent=2))
