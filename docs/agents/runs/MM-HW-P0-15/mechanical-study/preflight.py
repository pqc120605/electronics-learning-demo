import hashlib,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
EXPECTED='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
def preflight():
    raw=(HERE.parent/'mechanical-study-proposal.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==EXPECTED,'Approved proposal changed'
    receipt=json.loads((HERE/'founder-approval.json').read_text(encoding='utf-8'))
    assert receipt['approved_proposal_sha256']==EXPECTED
    assert receipt['answer_verbatim']=='Duyệt nghiên cứu CAD M5'
    proposal=json.loads(raw)
    protocol=json.loads((HERE/'protocol.json').read_text(encoding='utf-8'))
    assert protocol['study']==proposal['id']
    assert protocol['profiles']['shutter_travel']==proposal['reference_inputs_mm']['shutter_sweep_reference']
    assert protocol['domains']['connected_insertion_samples']['max']==6.4
    q=json.loads(Path('D:/StartupOS/docs/agents/tasks.json').read_text(encoding='utf-8-sig'))
    t=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-15')
    assert t['status']=='in_progress' and t['writer']=='codex_lead' and t['execution_mode']=='lead'
    assert t['write_lease'] is None,'No delegated builder or B1 lease in this study'
    assert EXPECTED in t['authorization']
    return protocol
if __name__=='__main__':
    preflight();print('Reference-study preflight: exact consent, active lead scope and protocol checked; not a B1 builder dispatch.')
