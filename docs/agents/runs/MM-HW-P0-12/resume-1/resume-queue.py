"""Lead-only resume of P0-12 documentary scope after direct Founder request."""
import hashlib
import json
from pathlib import Path

queue = Path('D:/StartupOS/docs/agents/tasks.json')
run = Path(__file__).resolve().parent
raw = queue.read_bytes()
data = json.loads(raw.decode('utf-8-sig'))
task = next(t for t in data['tasks'] if t['id'] == 'MM-HW-P0-12')
assert task['status'] == 'waiting' and task['execution_requested'] is False
assert task['writer'] == 'codex_lead' and task.get('write_lease') is None
assert 'USER_PAUSED' in task['waiting']['reason']
pause = data['policy']['hardware_work_pause']
assert pause['active'] is True
(run / 'queue-before-resume.json').write_bytes(raw)
pause.update(active=False, resumed_by='user', resumed_on='2026-11-10',
             resume_request_verbatim='sau đó cho triển khai tiếp theo tài liệu bàn giao này',
             resumed_scope='P0-12 documentary QA and preflight reconciliation only. Hardware build approval boundaries remain intact.')
task['status'] = 'in_progress'
task['execution_requested'] = True
task['waiting'] = None
task['history'].append({'event':'transition', 'from':'waiting', 'to':'in_progress',
    'at':'2026-11-10', 'actor':'codex_lead', 'attempt':task.get('attempt',1),
    'reason':'Founder explicitly resumed Hardware using HARDWARE-HANDOFF-2026-11-10.md. Lead sole writer; independent read-only Box08 QA and Box01 reconciliation. No approval, gate PASS, GPIO assignment or build lease.'})
data['updated_on'] = '2026-11-10'
queue.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
result = {'task':task['id'], 'status':task['status'], 'execution_requested':True,
          'queue_sha256':hashlib.sha256(queue.read_bytes()).hexdigest()}
(run / 'resume-receipt.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
