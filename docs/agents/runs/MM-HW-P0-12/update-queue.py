from pathlib import Path
import copy,json,hashlib,sys
root=Path(__file__).resolve().parents[4];run=root/'docs/agents/runs/MM-HW-P0-12'
qpath=Path('D:/StartupOS/docs/agents/tasks.json');q=json.loads(qpath.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if not (run/'before-tasks.json').exists():
    (run/'before-tasks.json').write_bytes(qpath.read_bytes())
task=next((t for t in q['tasks'] if t['id']=='MM-HW-P0-12'),None)
if task is None:
    task=copy.deepcopy(next(t for t in q['tasks'] if t['id']=='MM-HW-P0-11'))
    task.update(id='MM-HW-P0-12',title='C12 closure work: bounded H3 alternative, GPIO constraints, bleed budget and preflight reconciliation',status='in_progress',review=None,verification=None,waiting=None,completion_summary=None,attempt=1,input_refs=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-11/c12-follow-up/DISPOSITION-C12.md'],allowed_paths=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/**','electronics-learning-demo/docs/hardware/mobot-v2-p0-12-*','electronics-learning-demo/docs/research/downloads/p0-12/**'],deliverables=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/REPORT.md'],authorization='Founder ok triển khai after C12 disposition; lead documentary engineering and queue reconciliation, advisors read-only. No actual pin assignment/config approval/hardware gate closure/lease/build/device operation.',snapshot={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/packet-snapshot.json'},history=[{'event':'imported_snapshot','from':None,'to':'in_progress','at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':'Explicit Founder authorization to execute C12 follow-up work; lead sole writer, no hardware lease.'}],execution_requested=True)
    q['tasks'].append(task)
task['allowed_paths']=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-12/**','electronics-learning-demo/docs/hardware/mobot-v2-p0-12-gpio-constraints.md','electronics-learning-demo/docs/hardware/mobot-v2-p0-12-h3-candidate-verdict.md','electronics-learning-demo/docs/hardware/mobot-v2-p0-12-mode-power-budget.md','electronics-learning-demo/docs/hardware/mobot-v2-p0-12-preflight-disposition.md','electronics-learning-demo/docs/research/downloads/p0-12/**']
if '--review' in sys.argv:
    task['status']='in_review'
    task['history'].append({'event':'transition','from':'in_progress','to':'in_review','at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':'C12 proposal documents and fresh evidence prepared; engineering gates remain OPEN.'})
q['updated_on']='2026-11-10'
qpath.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(task['id'],task['status'])
