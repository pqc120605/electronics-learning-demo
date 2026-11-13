"""Lead administration for the P0-15 research checkpoint."""
import hashlib
import json
import os
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
QUEUE = Path('D:/StartupOS/docs/agents/tasks.json')
PREFIX = 'electronics-learning-demo/' + HERE.relative_to(ROOT).as_posix() + '/'


def main():
    raw = QUEUE.read_bytes()
    queue = json.loads(raw.decode('utf-8-sig'))
    task = next(item for item in queue['tasks'] if item['id'] == 'MM-HW-P0-15')
    assert task['status'] == 'in_progress' and task['write_lease'] is None and task['writer'] == 'codex_lead'
    snapshot = json.loads((HERE/'snapshot.json').read_text(encoding='utf-8'))
    for row in snapshot['files']:
        data = (ROOT/row['path']).read_bytes()
        assert len(data) == row['bytes'] and hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
    for name in ('REPORT.md', 'mechanical-review-packet.json', 'BOX08-ENDPOINT-REVIEW.md', 'guarded-carriage-results.json'):
        ref = PREFIX + name
        if ref not in task['input_refs']:
            task['input_refs'].append(ref)
    for name in ('REPORT.md', 'm5_endpoint_model.py', 'endpoint-parked.png', 'endpoint-closed.png'):
        ref = PREFIX + name
        if ref not in task['deliverables']:
            task['deliverables'].append(ref)
    task['snapshot'] = {'kind': 'file-hashes', 'reference': PREFIX + 'snapshot.json'}
    task['review'] = {'verdict': 'insufficient_evidence', 'reference': PREFIX + 'BOX08-ENDPOINT-REVIEW.md',
                      'scope': 'Box 08 passes the pinned 29-file M5 endpoint research packet. Full source, sequencer, hardware configuration and B1 readiness require further evidence.'}
    task['verification'] = {'verdict': 'insufficient_evidence', 'reference': PREFIX + 'final-checks.json',
                            'scope': 'Conditional connector and source calculations, native reference geometry, guarded replay and manifest integrity verified. Physical integration and electrical protection remain open.'}
    before = json.loads(raw.decode('utf-8-sig'))
    assert queue['hardware_configurations'] == before['hardware_configurations']
    assert task['gates'] == next(item for item in before['tasks'] if item['id'] == task['id'])['gates']
    temp = QUEUE.with_name('tasks.p015-attempt4.tmp')
    assert not temp.exists() and QUEUE.read_bytes() == raw
    (HERE/'queue-checkpoint-before.json').write_bytes(raw)
    with temp.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(queue, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    assert QUEUE.read_bytes() == raw
    os.replace(temp, QUEUE)
    result = subprocess.run(['node', 'D:/StartupOS/docs/agents/validate.mjs'], capture_output=True,
                            text=True, encoding='utf-8')
    out = {'task': task['id'], 'status': task['status'], 'write_lease': task['write_lease'],
           'snapshot_files': len(snapshot['files']), 'hardware_registry_unchanged': True,
           'validate_exit_code': result.returncode, 'validate_stdout': result.stdout,
           'validate_stderr': result.stderr}
    (HERE/'post-queue-validation.json').write_text(json.dumps(out, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(out))
    assert result.returncode == 0


if __name__ == '__main__':
    main()
