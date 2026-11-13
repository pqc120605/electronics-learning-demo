"""Independent screening calculations; inputs are allocations unless sourced in dossier."""
import json
Kmin=1+41750*(1-.0002)/(10000*(1+.0002))
Kmax=1+41750*(1+.0002)/(10000*(1-.0002))
Rmax=41750*(1+.0002)
lo=.792*Kmin-Rmax*100e-9;hi=.808*Kmax+Rmax*100e-9
Rlow=7.5*.9;Rhigh=7.5*1.1
Imax=2*5.25/Rlow;Imin=2*4.75/Rhigh
Emax=2*5.25**2/Rlow*3
r={'classification':'Conditional arithmetic and rejected candidate screening, no gate proof',
   'monitor_partial_trip_V':[lo,hi], 'monitor_exceeds_existing_trip_max':hi>4.110,
   'monitor_nominal_plusminus1pct_width_V':2*.01*4.14,
   'OFF_time_if_isolation20ms_qualifier420ms_s':2.703167+.020+.420,
   'OFF_remaining_if_above_s':4-(2.703167+.020+.420),
   'watchdog_remaining_if12_65ms_ms':20-12.65,
   'coil_sensitivity_NOT_manufacturer_bound':{'assumed_Rtolerance':.1,'min_rail_V':4.75,'max_rail_V':5.25,
     'two_coil_current_A':[Imin,Imax],'energy_3s_J_MAX':Emax,
     'pack_current_A_assuming3_2V_eta0_8_aux20mA':(Emax/3)/(3.2*.8)+.020},
   'missing':['device MAX for intended conditions','full topology and fault bounds','actual coil Rmin/force/duty','mode bias/aux partition']}
assert hi>4.110
assert abs(Emax-24.5)<1e-12
assert r['coil_sensitivity_NOT_manufacturer_bound']['pack_current_A_assuming3_2V_eta0_8_aux20mA']>3
print(json.dumps(r,ensure_ascii=False,indent=2))
