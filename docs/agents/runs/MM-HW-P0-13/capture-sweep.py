"""Conservative independent corner sweep. All inputs are unproven design requirements."""
import itertools,json
rows=[]
for m,v0,force,delay,extra_work,ret,residual in itertools.product([.003,.005],[0,.02],[0,.45],[0,.001],[0,45e-6],[.25,.30],[0,.10]):
    acceleration=force/m
    d_delay=v0*delay+.5*acceleration*delay**2
    v1=v0+acceleration*delay
    kinetic=.5*m*v1*v1
    braking=ret-residual
    distance=d_delay+(kinetic+extra_work)/braking
    rows.append({'mass_kg':m,'v0_m_s':v0,'force_N':force,'delay_s':delay,
      'extra_stored_work_after_delay_J':extra_work,'return_N':ret,'residual_N':residual,
      'delay_distance_mm':d_delay*1000,'kinetic_after_delay_uJ':kinetic*1e6,
      'total_advance_mm':distance*1000})
worst=max(rows,key=lambda x:x['total_advance_mm'])
assert abs(worst['total_advance_mm']-.684)<1e-12
result={'classification':'Arithmetic of candidate requirements, not actual capture proof',
 'corners':len(rows),'worst_corner':worst,'allocated_distance_mm':.8,
 'allocation_margin_mm':.8-worst['total_advance_mm'],
 'energy_accounting_requirement':'extra_stored_work_after_delay excludes any coupling work already included in force during delay; actual disjoint partition remains unproven',
 'exclusions':['follower motion and100N hand work','actual decay timing and spring/drive data','fault envelope','near-throat counterexample']}
print(json.dumps(result,ensure_ascii=False,indent=2))
