"""Corner analysis of proposed biased divider, not a guaranteed comparator design."""
import itertools,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
def main():
    trips=[];with_switch_leakage=[];pn=[]
    # Four allocated 1uA terminal injections, each upstream of the main divider resistor.
    # The data sheet conditions do not prove this budget at every application voltage.
    input_error_each=4e-6*1001*.5005
    differential_error=2*input_error_each
    for rp,rrp,rn,rrn in itertools.product((9990.,10010.),repeat=4):
        a=rrp/(rp+rrp);b=rrn/(rn+rrn)
        for B,T in itertools.product((1.998,2.002),(3.098,3.102)):
            for low,error in itertools.product((0.,4.35),(-.010,.010)):
                trips.append((error-(a-b)*low-(1-a)*B+(1-b)*T)/a)
                expanded=error+(-differential_error if error<0 else differential_error)
                with_switch_leakage.append((expanded-(a-b)*low-(1-a)*B+(1-b)*T)/a)
            for high,low in itertools.product((-1.8,5.4),repeat=2):pn.append((a*high+(1-a)*B,b*low+(1-b)*T))
    faults=[{'case':'H open, first cell L=0','delta_V':2-(0+3.1)/2},
      {'case':'L open, H=5.4','delta_V':(5.4+2)/2-3.1},
      {'case':'high reference lost, cell0.8 L=0','delta_V':(.8+2)/2},
      {'case':'both references scale0.5, cell0.8','delta_V':(.8+1-1.55)/2}]
    assert all(x['delta_V']>0 for x in faults),'Known false-healthy counterexamples must remain visible'
    result={'scope':'DC research corners under explicit allocations; not temperature/bias/hysteresis or physical protection proof',
      'allocation':{'total_arm_Ohm':10000,'total_arm_tolerance':.001,'B_V':[1.998,2.002],'T_V':[3.098,3.102],'total_comparator_input_error_V':[-.010,.010],'monitor_rail_V':[4.75,5.25],'total_arm_includes':'guard + switch Ron + conductor + main resistor'},
      'trip_corner_count':len(trips),'trip_interval_V':[min(trips),max(trips)],'P_interval_V':[min(x[0] for x in pn),max(x[0] for x in pn)],'N_interval_V':[min(x[1] for x in pn),max(x[1] for x in pn)],'common_mode_ceiling_from_monitor_min_V':4.75-.2,'known_false_healthy':faults,'not_proven':['10mV total comparator error','B/T references and independent validity','continuity and selector failures','all-temperature behavior','complete startup/freshness','source cutoff','physical fixture','B1']}
    result['alternate_switch_leakage_allocation']={
        'scope':'Conditional current injection calculation, not a guaranteed TMUX2821 leakage bound',
        'assumptions':'At most four 1uA terminal contributions per sense arm, within 1001 ohms of ideal tap including guard; divider arm totals unchanged',
        'max_input_error_each_V':input_error_each,
        'max_differential_error_V':differential_error,
        'conditional_trip_V':[min(with_switch_leakage),max(with_switch_leakage)],
        'exclusions':['nonideal cell/tap impedance','supply-ramp current paths','actual bias/source voltage and temperature validation','terminal clamp and cross-channel faults'],
    }
    assert result['P_interval_V'][0]>0 and result['N_interval_V'][1]<result['common_mode_ceiling_from_monitor_min_V']
    (HERE/'direct-frontend-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:result[k] for k in ('trip_corner_count','trip_interval_V','P_interval_V','N_interval_V','common_mode_ceiling_from_monitor_min_V')}))
if __name__=='__main__':main()
