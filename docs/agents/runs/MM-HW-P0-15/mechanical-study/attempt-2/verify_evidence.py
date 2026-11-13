import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[6]
HERE=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    manifests=[HERE.parent/'snapshot.json',HERE.parent.parent/'snapshot.json',ROOT/'docs/agents/runs/MM-HW-P0-14/snapshot.json',HERE/'review-packet.json']
    counts=[]
    for m in manifests:
        data=json.loads(m.read_text(encoding='utf-8-sig'));files=data['files']
        for item in files:assert sha(ROOT/item['path'])==item['sha256'],item['path']
        counts.append({'manifest':str(m.relative_to(ROOT)).replace('\\','/'),'verified_files':len(files)})
    cfg=ROOT/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
    assert sha(cfg)=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
    proposal=HERE.parent.parent/'mechanical-study-proposal.json'
    assert sha(proposal)=='edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28'
    before=json.loads((HERE/'queue-before.json').read_text(encoding='utf-8-sig'))
    q=json.loads(Path('D:/StartupOS/docs/agents/tasks.json').read_text(encoding='utf-8-sig'))
    assert before['hardware_configurations']==q['hardware_configurations']
    p=json.loads((HERE/'path-results.json').read_text(encoding='utf-8'))
    for name,digest in p['provenance'].items():assert sha(HERE/name)==digest,name
    result=subprocess.run(['node','D:/StartupOS/docs/agents/validate.mjs'],capture_output=True,text=True,encoding='utf-8')
    assert result.returncode==0,result.stderr+result.stdout
    out={'manifests':counts,'proposal_sha256':sha(proposal),'r12_sha256':sha(cfg),'hardware_registry_unchanged':True,'path_source_provenance_matches':True,'queue_validation':{'command':'node D:/StartupOS/docs/agents/validate.mjs','exit_code':result.returncode,'stdout':result.stdout,'stderr':result.stderr},'not_run':['FE','bench','physical fit','firmware','frontend/browser/npm; application unchanged']}
    (HERE/'final-checks.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':main()
