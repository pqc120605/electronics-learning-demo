"""Conditional arithmetic only. None of these results closes a hardware gate."""
import json, math
cv=4.05; accuracy=.008; k=1+.6*1.001/.999
ip=(5.5-2.9)/1.089; cap=.010; esr=.010; parasitic=.020; od=.020; trip=4.110
headroom=4.2-trip-k*od-ip*esr-parasitic
imax=(4.2-trip-k*od-parasitic)/(esr+310e-6/cap)
mechanical=[]
for force in [100,200,300]:
    b=12;t=8;span=24; E=210000;nu=.30
    z=b*t*t/6; inertia=b*t**3/12;estar=1/(2*(1-nu**2)/E)
    rr=[]
    for rc,rs in [(19.9,20.6),(20.1,20.4)]:
        reff=1/(1/rc-1/rs);a=(3*force*reff/(4*estar))**(1/3)
        rr.append({'effective_radius_mm':reff,'contact_radius_mm':a,'peak_pressure_MPa':3*force/(2*math.pi*a*a)})
    mechanical.append({'force_per_path_N':force,'moment_Nmm':force*span/4,'key_bending_MPa':force*span/4/z,'key_full_force_shear_MPa':1.5*force/(b*t),'frame_normal_MPa':force/(16*8)+force*5/(16*8*8/6),'ideal_deflection_mm':force*span**3/(48*E*inertia),'hertz':rr})
result={'classification':'Conditional analytic screening, not FE or physical PASS',
'H3':{'cv_min_V':cv*(1-accuracy),'cv_max_V':cv*(1+accuracy),'trip_max_allocation_V':trip,'window_V':trip-cv*(1+accuracy),'threshold_center_V':(trip+cv*(1+accuracy))/2,'Kmax':k,'global_current_bound_A':ip,'cutoff_allowable_us':headroom*cap/ip*1e6,'Cmin_for_310us_F':ip*310e-6/headroom,'Imax_for_310us_A':imax,'Rmin_for_310us_ohm':2.6/imax,'full_threshold_error_budget_V':None,'hardware_cutoff_max_s':None,'correlated_current_A':(5.5-trip)/1.089},
'actuator':{'pulse_nominal_s':3,'pulse_max_s':None,'Rmin_ohm':None,'two_coil_nominal_R_ohm':7.5,'energy_5V_3s_J':2*25/7.5*3,'energy_5_25V_3s_J':2*5.25**2/7.5*3},
'GPIO':{'baseline5':5,'distinct_safety_outputs':4,'mandatory_inputs':2,'optional_inputs':[0,2],'E_channels_assumed':4,'total':[15,17],'unused_pool':11,'assured_total':16,'conditional_total':18,'upper_deficit':1},
'mechanical':mechanical,'gate_freebody_allocations_N':{'spring':[.16,.18],'guide_drag_max':.05,'feedback_max':.02,'gravity_max':.01,'unpowered_actuator_drag_max':.02,'opening_external_max':.26,'return_net_min':.06,'required_return_min':.05},'concave_depth_mm':20.4-math.sqrt(20.4**2-4**2),'FE':'NOT_RUN','bench':'NOT_RUN'}
print(json.dumps(result,indent=2))
