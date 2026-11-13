"""Analytic screening of M-A-P1 allocations, not assembly/CAD/FE validation."""
import json, math
E=190000.0
results={
 'classification':'Conditional proposal arithmetic; no gate PASS or physical proof',
 'key_bending_at200N_MPa':6*(200*24/4)/(12*8**2),
 'key_shear_conservative_at200N_MPa':1.5*200/(12*8),
 'frame_stress_at200N_MPa':200/(16*8)+6*(200*5)/(16*8**2),
 'button_stem_stress_at100N_MPa':100/64+6*100*8/(8*8**2),
 'button_tab_stress_at100N_MPa':6*100*2/(8*8**2),
 'ideal_stem_deflection_mm':100*8**3/(3*E*(8*8**3/12)),
 'ideal_tab_deflection_mm':100*2**3/(3*E*(8*8**3/12)),
 'unload_separation_mm':.9*math.cos(math.radians(5))-.3,
 'separation_margin_mm':.9*math.cos(math.radians(5))-.3-.5,
 'follower_gate_allocated_clearance_mm':.8-.1-.05-.1-.15-.1,
 'neutral_allocated_clearance_mm':1-.1-.1-.1-.15,
 'interlock_remaining_engagement_mm':3-.1-.1-.1-.15,
 'gate_release_clearance_mm':1.2-.9-.1-.05,
 'external_opening_force_N':.18+.05+.02+.01,
 'net_return_force_allocation_N':.16-.05-.02-.01-.02,
 'actuator_requirement_work_mJ':.3*1.2,
 'two_key_blanks_mass_g':2*40*12*10/1000*7.85,
 'actuator_nominal_screening':[]}
for label,resistance in [('Takaha',7.5),('Adafruit',4.5)]:
    results['actuator_nominal_screening'].append({'candidate':label,'resistance_nominal_ohm':resistance,
        'two_coils_current_A_at5V':2*5/resistance,'power_W_at5V':2*25/resistance,
        'energy_J_3s_at5V':2*25/resistance*3,'guaranteed_MAX':False})
assert abs(results['separation_margin_mm']-.096575228282571)<1e-12
assert abs(results['key_bending_at200N_MPa']-9.375)<1e-12
print(json.dumps(results,ensure_ascii=False,indent=2))
