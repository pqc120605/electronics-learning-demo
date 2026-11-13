"""Native CAD for the bounded guided cassette reference."""
import json
import sys
from pathlib import Path

import build123d as bd
from cad import model

from guide_geometry import PARK, TRAVEL, cassette_parts, endpoint_parts, preflight, rail_parts
from m5_endpoint_model import joined, moving_parts, native, overlap_volume

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent


def scene(distance, height):
    preflight()
    carriage=joined(cassette_parts(distance),'Cassette, shoes and lock tongues','#34a384')
    fixed=[]
    for name in ('datum','relieved'):
        rail=[p for p in rail_parts() if p['label'].startswith(name+' ') and 'seated stop' not in p['label']]
        fixed.append(joined(rail,name+' guide and parked stop','#64748b'))
        stop=next(p for p in rail_parts() if p['label']==name+' seated stop')
        fixed.append(native(stop))
    endpoints=moving_parts(height,height,12 if height else 0,12 if height else 0)
    for part in fixed+endpoints:
        assert overlap_volume(carriage,part)<1e-7,part.label
    return bd.Compound(children=[carriage]+fixed+endpoints)


@model
def guided_cassette_seated():
    return scene(0,0)


@model
def guided_cassette_parked():
    return scene(TRAVEL,PARK)


if __name__=='__main__':
    a=guided_cassette_seated()
    b=guided_cassette_parked()
    rows=[]
    for name,missing in [('A','B'),('B','A')]:
        for distance, height, expected in [(0,.69,False),(0,.71,True),(16.79,PARK,True),(16.81,PARK,False)]:
            body=joined(cassette_parts(distance,absent=(missing,)),'cassette','#34a384')
            bridge=joined(endpoint_parts(name,height),'endpoint','#327dcc')
            volume=overlap_volume(body,bridge)
            assert (volume>1e-7)==expected,(name,distance,height,volume)
            rows.append({'endpoint':name,'distance_mm':distance,'lift_mm':height,'overlap_mm3':volume})
    result={'native_checks':rows,'seated_id':str(a.id),'parked_id':str(b.id),
            'scope':'Reference guides and cassette stops. Frame anchoring and connector are not modeled.'}
    (HERE/'guide-native-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'checks':len(rows),'seated_id':str(a.id),'parked_id':str(b.id)}))
