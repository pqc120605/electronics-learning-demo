"""Record the reviewed research evidence on the existing task."""
import hashlib
import json
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
QUEUE = Path('D:/StartupOS/docs/agents/tasks.json')
PREFIX = 'electronics-learning-demo/' + HERE.relative_to(ROOT).as_posix() + '/'
PACKET_HASH = '7b8c37ed3b90c7bfe94d087f4b30d1993cb153f6f176bd6739bddb35cef25d30'


def verify_packet():
    packet_path = HERE/'review-packet.json'
    assert hashlib.sha256(packet_path.read_bytes()).hexdigest() == PACKET_HASH
    for row in json.loads(packet_path.read_text(encoding='utf-8'))['files']:
        data = (ROOT/row['path']).read_bytes()
        assert len(data) == row['bytes'] and hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
    review = (HERE/'BOX08-REVIEW.md').read_text(encoding='utf-8')
    assert PACKET_HASH in review
    revision = hashlib.sha256((HERE/'REPORT-r2.md').read_bytes()).hexdigest()
    assert revision in (HERE/'BOX08-DISPOSITION-REVIEW.md').read_text(encoding='utf-8').lower()
    for row in json.loads((HERE/'snapshot.json').read_text(encoding='utf-8'))['files']:
        assert hashlib.sha256((ROOT/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']


def record():
    verify_packet()
    raw = QUEUE.read_bytes()
    queue = json.loads(raw.decode('utf-8-sig'))
    task = next(item for item in queue['tasks'] if item['id']=='MM-HW-P0-15')
    assert task['status']=='in_progress' and task['writer']=='codex_lead' and task['write_lease'] is None
    for field, names in {
        'input_refs':['review-packet.json','BOX08-REVIEW.md','BOX08-DISPOSITION-REVIEW.md','DISPOSITION.md'],
        'deliverables':['REPORT-r2.md','m5_cassette_model.py','cassette-program.png'],
    }.items():
        for name in names:
            ref = PREFIX + name
            if ref not in task[field]:
                task[field].append(ref)
    task['snapshot']={'kind':'file-hashes','reference':PREFIX+'snapshot.json'}
    task['review']={'verdict':'insufficient_evidence','reference':PREFIX+'BOX08-DISPOSITION-REVIEW.md',
                    'scope':'Attempt-5 cassette and passive-sense research. Product integration, full RUN bounds and B1 remain open.'}
    task['verification']={'verdict':'insufficient_evidence','reference':PREFIX+'final-verification.json',
                          'scope':'Reference geometry, arithmetic and hash checks verified. Physical evidence NOT_RUN.'}
    assert queue['hardware_configurations']==json.loads(raw.decode('utf-8-sig'))['hardware_configurations']
    temp=QUEUE.with_name('tasks.p015-attempt5.tmp')
    assert not temp.exists() and QUEUE.read_bytes()==raw
    (HERE/'queue-before-checkpoint.json').write_bytes(raw)
    with temp.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(queue,stream,ensure_ascii=False,indent=2)
        stream.write('\n')
    assert QUEUE.read_bytes()==raw
    os.replace(temp,QUEUE)
    print(json.dumps({'task':task['id'],'status':task['status'],'snapshot':task['snapshot']}))


if __name__=='__main__':
    record()
