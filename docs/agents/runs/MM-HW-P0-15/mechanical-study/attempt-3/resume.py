import json,copy,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
def main():
    proposal=HERE.parent.parent/'mechanical-study-proposal.json'
    assert hashlib.sha256(proposal.read_bytes()).hexdigest()=='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
    p=Path('D:/StartupOS/docs/agents/tasks.json');raw=p.read_bytes();q=json.loads(raw.decode('utf-8-sig'));cfg=copy.deepcopy(q['hardware_configurations'])
    t=next(x for x in q['tasks'] if x['id']=='MM-HW-P0-15')
    assert t['status']=='in_progress' and t['write_lease'] is None and t['writer']=='codex_lead'
    ref='electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-3/task.md'
    assert ref not in t['input_refs'],'Continuation already recorded; do not duplicate'
    t['input_refs'].append(ref)
    t['authorization']+=' Founder requested further continuation on2026-11-11: lead-only containment/reference-profile analysis under mechanical-study/attempt-3, same approved M5 study hash. Two read-only domain advisors; no product adoption, FE, configuration/MPN approval or B1 lease.'
    t['snapshot']={'kind':'pending','reference':None}
    assert cfg==q['hardware_configurations'] and p.read_bytes()==raw
    (HERE/'queue-before.json').write_bytes(raw)
    p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'task':t['id'],'status':t['status'],'hardware_registry_unchanged':True,'write_lease':None}))
if __name__=='__main__':main()
