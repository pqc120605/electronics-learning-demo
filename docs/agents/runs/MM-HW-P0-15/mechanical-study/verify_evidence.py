"""Final READ checks plus one scoped output file; never re-runs CAD or changes gates."""
import json,hashlib,subprocess,shutil
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
EXPECTED='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(HERE.parent/'mechanical-study-proposal.json')==EXPECTED
receipt=json.loads((HERE/'founder-approval.json').read_text(encoding='utf-8'))
assert receipt['approved_proposal_sha256']==EXPECTED and receipt['answer_verbatim']=='Duyệt nghiên cứu CAD M5'
snapshots={}
for task in ('MM-HW-P0-14','MM-HW-P0-15'):
    snap=json.loads((ROOT/f'docs/agents/runs/{task}/snapshot.json').read_text(encoding='utf-8'))
    for x in snap['files']:assert sha(ROOT/x['path'])==x['sha256'],x['path']
    snapshots[task]=len(snap['files'])
for name in ('sweep-results.json','kernel-results.json','adversarial-results.json'):
    out=json.loads((HERE/name).read_text(encoding='utf-8'))
    for path,h in out['provenance'].items():assert sha(HERE/path)==h,(name,path)
sweep=json.loads((HERE/'sweep-results.json').read_text(encoding='utf-8'))
assert isinstance(sweep['candidate_probe_miss_examples'],list)
assert sweep['candidate_probe_miss_counts']==[0,0]
assert sweep['candidate_probe_samples']==31590 and sweep['potential_contact_samples']==31536
packet=json.loads((HERE/'review-request.json').read_text(encoding='utf-8'))
for x in packet['files']:
    path=ROOT/x['path']
    if path==HERE/'REPORT.md':path=HERE/'REPORT.review1.md'
    assert sha(path)==x['sha256'],x['path']
assert sha(HERE/'m5-program-reference.xbf')=='fdb71c9938a2c05fe9d99680d2bc2c8d2e8bc594753242809074ceefc9f9fc05'
assert sha(ROOT/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json')=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
validator=subprocess.run([shutil.which('node'),'D:/StartupOS/docs/agents/validate.mjs'],capture_output=True,text=True,encoding='utf-8')
assert validator.returncode==0,(validator.returncode,validator.stdout,validator.stderr)
q=json.loads(validator.stdout)
summary={'date':'2026-11-10','approved_study_hash_verified':EXPECTED,'historical_snapshots_unchanged':snapshots,
 'result_provenance_matches_current_source':True,'initial_review_17_file_bytes_preserved':True,
 'report_revision':'Doc-only corrections; original report retained under REPORT.review1.md',
 'XBF_unchanged_after_review1':True,'r12_unchanged':True,
 'fresh_queue_validation':{'command':'node D:/StartupOS/docs/agents/validate.mjs','exit_code':validator.returncode,**q},
 'observed_execution_record':{'CAD_model_build_exit':0,'finite_sweep_exit':0,'kernel_crosscheck_exit':0,'adversarial_checks_exit':0,'XBF_export_and_inspect':'observed succeeded'},
 'fresh_check_scope':'Hashes/provenance/schema and queue validation; no repeated CAD build or physical test',
 'tangency_coverage':'NOT_SEPARATELY_REPORTED; protocol deviation explicitly retained, no boundary-coverage claim',
 'physical_tests':'NOT_RUN','B1':'NOT_READY'}
(HERE/'final-checks.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary))
