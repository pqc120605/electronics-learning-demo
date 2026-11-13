"""Lead evidence checks for the research checkpoint, not a hardware preflight PASS."""
import hashlib,json,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone,timedelta
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[5]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    command=[sys.executable,'-B','-X','utf8',str(HERE/'verify_evidence.py')]
    r=subprocess.run(command,capture_output=True,text=True,encoding='utf-8')
    assert r.returncode==0,r.stdout+r.stderr
    original=json.loads(r.stdout)
    current=json.loads((HERE/'supplement-review-packet.json').read_text(encoding='utf-8'))
    assert current['revision']==2
    for x in current['files']:assert sha(ROOT/x['path'])==x['sha256'],x['path']
    sources=json.loads((HERE/'sources/manifest.json').read_text(encoding='utf-8'))
    for x in sources:assert sha(HERE/'sources'/x['file'])==x['sha256']
    logic=json.loads((HERE/'power-contract-results.json').read_text(encoding='utf-8'))
    arithmetic=json.loads((HERE/'power-bounds-results.json').read_text(encoding='utf-8'))
    assert logic['exhaustive_state_input_checks']==192 and len(logic['directed_traces'])==5
    assert arithmetic['calculated']['open_H_unclipped_delta_lower_V']>1.852
    assert arithmetic['calculated']['open_L_unclipped_delta_lower_V']>1.150
    names=['CHECKPOINT-2026-11-11.md','BOX08-REFERENCE-REVIEW.md','BOX08-SUPPLEMENT-REVIEW-1.md','DISPOSITION-SUPPLEMENT-REVIEW.md','SUPPLEMENT-REPORT.md','POWER-SOURCE-DISPOSITION.md','supplement-review-packet.json']
    if (HERE/'BOX08-SUPPLEMENT-REVIEW.md').exists():names.append('BOX08-SUPPLEMENT-REVIEW.md')
    out={'checked_at':datetime.now(timezone(timedelta(hours=7))).isoformat(),'scope':'Research/evidence checkpoint only; P0-15 incomplete, B1 not ready','old_and_CAD_manifests':original['manifests'],'supplement_revision':2,'supplement_files_verified':len(current['files']),'manufacturer_PDFs_verified':len(sources),'state_input_checks_recorded':192,'directed_traces_recorded':5,'state_and_arithmetic_execution':'Executed this continuation with exit0; unchanged scripts/results checked here, not claimed as hardware proof','queue_validation':original['queue_validation'],'r12_sha256':original['r12_sha256'],'hardware_registry_unchanged':original['hardware_registry_unchanged'],'hashes':{p:sha(HERE/p) for p in names},'not_run':['FE/strength','physical/bench','firmware/device','schematic/PCB/B1','browser/application tests; no application changes']}
    (HERE/'checkpoint-final-checks.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'exit_code':0,'supplement_files':len(current['files']),'PDFs':len(sources),'queue':json.loads(original['queue_validation']['stdout'])}))
if __name__=='__main__':main()
