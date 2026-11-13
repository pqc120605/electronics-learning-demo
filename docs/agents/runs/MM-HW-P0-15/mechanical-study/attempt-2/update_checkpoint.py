"""Lead-only canonical queue update for this checkpoint; no gate or approval mutations."""
import json,copy,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[5]
QUEUE=Path('D:/StartupOS/docs/agents/tasks.json')
PREFIX='electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-2/'
def main():
    assert (HERE/'BOX08-SUPPLEMENT-REVIEW.md').is_file(),'Independent supplemental review required'
    assert (HERE/'checkpoint-final-checks.json').is_file(),'Fresh verification required'
    raw=QUEUE.read_bytes();q=json.loads(raw.decode('utf-8-sig'));cfg=copy.deepcopy(q['hardware_configurations'])
    t=next(x for x in q['tasks'] if x['id']=='MM-HW-P0-15')
    assert t['status']=='in_progress' and t['write_lease'] is None and t['writer']=='codex_lead'
    for name in ('CHECKPOINT-2026-11-11.md','supplement-review-packet.json','BOX08-REFERENCE-REVIEW.md','BOX08-SUPPLEMENT-REVIEW.md'):
        ref=PREFIX+name
        if ref not in t['input_refs']:t['input_refs'].append(ref)
    for name in ('CHECKPOINT-2026-11-11.md','m5-contact-reference.xbf'):
        ref=PREFIX+name
        if ref not in t['deliverables']:t['deliverables'].append(ref)
    t['authorization']+=' Founder continued on2026-11-11; conditional power-source/state and endpoint research completed for checkpoint, without product adoption or B1 permission.'
    t['review']={'verdict':'insufficient_evidence','reference':PREFIX+'BOX08-SUPPLEMENT-REVIEW.md','scope':'Bounded research disposition only; full P0-15 design and B1 not accepted.'}
    t['verification']={'verdict':'insufficient_evidence','reference':PREFIX+'checkpoint-final-checks.json','scope':'Source hashes, state-contract and arithmetic checked; physical/electrical design, force, total timing/current and gate closure remain unverified.'}
    t['snapshot']={'kind':'file-hashes','reference':PREFIX+'checkpoint-snapshot.json'}
    t['history'].extend([
      {'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-11','actor':'codex_lead','attempt':t['attempt'],'reason':'Freeze and independently review contact-CAD packet plus supplemental state/source/arithmetic/endpoint analysis. No live gate, MPN or configuration approval.'},
      {'event':'transition','from':'in_review','to':'in_progress','at':'2026-11-11','actor':'codex_lead','attempt':t['attempt'],'reason':'Bounded research recorded; carry forward concrete sense stuck-on, clipping/timing and lost-panel/proof-tab counterexamples in same P0-15. Overall design remains incomplete, not waiting on repeat study consent or a fabricated Founder measurement.'}])
    assert cfg==q['hardware_configurations'] and QUEUE.read_bytes()==raw
    (HERE/'queue-checkpoint-before.json').write_bytes(raw)
    QUEUE.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'task':t['id'],'status':t['status'],'hardware_registry_unchanged':True,'write_lease':t['write_lease']}))
if __name__=='__main__':main()
