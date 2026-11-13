import json,hashlib,subprocess
from pathlib import Path
from datetime import datetime,timezone,timedelta
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[5]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    old=json.loads((HERE.parent/'attempt-2/checkpoint-snapshot.json').read_text(encoding='utf-8'))
    packet=json.loads((HERE/'review-packet.json').read_text(encoding='utf-8'))
    sources=json.loads((HERE/'source-manifest.json').read_text(encoding='utf-8'))
    for manifest in (old,packet,sources):
        for x in manifest['files']:assert sha(ROOT/x['path'])==x['sha256'],x['path']
    for result,script in (('sense-cutsets-results.json','sense_cutsets.py'),('functional-witness-results.json','functional_witness.py'),('thin-tail-results.json','thin_tail.py'),('supply-allocation-results.json','supply_allocation.py')):
        data=json.loads((HERE/result).read_text(encoding='utf-8'));digest=data.get('source_sha256',data.get('script_sha256'))
        assert digest==sha(HERE/script),script
    native=json.loads((HERE/'thin-tail-kernel-results.json').read_text(encoding='utf-8'))
    for p,digest in native['provenance'].items():assert sha(HERE/p)==digest,p
    cfg=ROOT/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
    assert sha(cfg)=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
    before=json.loads((HERE/'queue-before.json').read_text(encoding='utf-8-sig'))
    qpath=Path('D:/StartupOS/docs/agents/tasks.json');q=json.loads(qpath.read_text(encoding='utf-8-sig'))
    assert before['hardware_configurations']==q['hardware_configurations']
    task=next(x for x in q['tasks'] if x['id']=='MM-HW-P0-15');assert task['status']=='in_progress' and task['write_lease'] is None
    r=subprocess.run(['node','D:/StartupOS/docs/agents/validate.mjs'],capture_output=True,text=True,encoding='utf-8');assert r.returncode==0,r.stdout+r.stderr
    out={'at':datetime.now(timezone(timedelta(hours=7))).isoformat(),'scope':'P0-15 bounded research checkpoint, not B1 readiness or physical proof','old_attempt2_files_verified':len(old['files']),'current_packet_files_verified':len(packet['files']),'reused_manufacturer_PDFs_verified':len(sources['files']),'source_and_result_provenance_matches':True,'r12_sha256':sha(cfg),'hardware_registry_unchanged':True,'task':{'id':task['id'],'status':task['status'],'write_lease':task['write_lease']},'queue_sha256':sha(qpath),'queue_validation':{'exit_code':r.returncode,'stdout':r.stdout,'stderr':r.stderr},'executed_this_attempt':{'sense_cutsets.py':0,'functional_witness.py via cad.cmd':0,'thin_tail.py':0,'thin_tail_kernel.py via cad.cmd':0,'supply_allocation.py':0},'not_run':['physical/bench','FE/force/materials','firmware/device','schematic/PCB/B1','application/browser tests; source unchanged']}
    if (HERE/'BOX08-SCOPE-DISPOSITION.md').exists():
        out['scope_matrix_sha256']=sha(HERE/'OBLIGATIONS-AND-FAULT-SCOPE.md')
        assert out['scope_matrix_sha256']=='2036d4c07f97551a66aba6ee796882cb25c4ae042152977567325fb70166a039'
        out['review_file_hashes']={p:sha(HERE/p) for p in ('BOX08-RESEARCH-REVIEW.md','BOX01-SCOPE-AUDIT.md','BOX08-SCOPE-DISPOSITION.md')}
    (HERE/'final-checks.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'old_files':len(old['files']),'packet_files':len(packet['files']),'source_PDFs':len(sources['files']),'queue':json.loads(r.stdout)}))
if __name__=='__main__':main()
