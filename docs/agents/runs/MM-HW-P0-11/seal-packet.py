from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parents[4];run=root/'docs/agents/runs/MM-HW-P0-11'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
config=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
expected='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
assert sha(config)==expected
doc=json.loads(config.read_text(encoding='utf-8-sig'))
assert len(doc['verification_items'])==14
assert all(g['status']=='OPEN' for g in doc['milestone_gates']+doc['external_design_gates'])
assert 'approved_by' not in doc and 'approved_sha256' not in doc
v=json.loads((run/'validate.json').read_text(encoding='utf-8-sig'))
assert v['errors']==[]
test=(run/'validate-tests.txt').read_text(encoding='utf-8-sig')
assert re.search(r'pass\s+61\b',test) and re.search(r'fail\s+0\b',test)
verification={'commands':[{'command':'python docs/agents/runs/MM-HW-P0-11/calculate.py','exit_code':0,'scope':'conditional arithmetic only; QA independently reran and matched JSON'},{'command':'node D:/StartupOS/docs/agents/validate.mjs','exit_code':0,'tasks':v['tasks'],'errors':v['errors'],'warnings':v.get('warnings',[])},{'command':'node --test D:/StartupOS/docs/agents/validate.test.mjs','exit_code':0,'tests':61,'pass':61,'fail':0,'note':'Validator code unchanged; tests ran during P0-11. Later changes were proposal documentation and queue history; queue validator reran after final registration.'}],'r12_unchanged_sha256':expected,'gates_unchanged_OPEN':7,'verification_items_unchanged_count':14,'G_B_M_A':'Founder direction confirmed; no configuration/hash/MPN approval','CAD':'NOT_RUN','FE':'NOT_RUN','bench':'NOT_RUN','ADR45_download':'NOT_RUN after two timeouts; primary web source only'}
(run/'verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2),encoding='utf-8')
paths=list(run.rglob('*'))+list((root/'docs/hardware').glob('mobot-v2-p0-11-*'))+list((root/'docs/research/downloads/p0-11').rglob('*'))+[config,Path('D:/StartupOS/docs/agents/tasks.json')]
for name in ['ref33','tlv3201','tlv6710','tps3430','tps3808','tmux1511','tps22916']:
    paths.append(root/f'docs/research/downloads/c11-r12/{name}.pdf')
paths.append(root/'docs/research/downloads/c11-r12/sources.json')
manifest=run/'packet-snapshot.json'
items=[{'path':str(p).replace('\\','/'),'sha256':sha(p)} for p in paths if p.is_file() and p.name not in ['packet-snapshot.json','RELAY-REVIEW_REQUEST.md']]
manifest.write_text(json.dumps({'configuration_sha256':expected,'excludes':['packet-snapshot.json (self)','RELAY-REVIEW_REQUEST.md (pins manifest)'],'files':items},ensure_ascii=False,indent=2),encoding='utf-8')
relay=f'''# RELAY CODEX → CLAUDE — chưa gửi

relay_id: R-20261110-P0-11-01
reply_to: R-20261109-C11
type: REVIEW_REQUEST
delivery: Founder tự chuyển nếu muốn; không gọi Claude/vendor
configuration: r12 giữ nguyên proposed, SHA256 {expected}
packet_manifest: docs/agents/runs/MM-HW-P0-11/packet-snapshot.json
packet_manifest_sha256: {sha(manifest)}

Xin review proposal, không tự suy đủ bằng chứng đóng cổng. Đọc REPORT.md, QA-REVIEW.md, calculations.json và ba tài liệu mobot-v2-p0-11-*.md. Founder đã chọn G-B16GPIO và M-A neutral-only; receipt có nguyên văn. Chưa duyệt configuration/hash/MPN/CAD/FE/lease.

H3: REF33 không đủ biên dưới full-temperature worksheet. Precision-reference proposal còn khoảng2,17mV/side partial; thiếu fullT hysteresis/CMRR/PSRR, aging/ripple, source/bypass/energy và fullMAX. K mới yêu cầu55,922051µs hoặc51,733589µs khi guard1mV. ADR45RevG đọc primaryweb nhưng hai downloadtimeout, chưa localpin; không coi numericalworksheet là guarantee.

OFF: qualifier100ms làMIN, đã sửa lỗi diễn giải. Proposal100–250ms cho tổng có điều kiện2,973167s, còn1,026833s trước các delay chưa cóbound. JOYbleed2×22k là proposal chưaBOM. Current/bias/isolation thực chưa khép.

Cơ khí:0,80mm ở5° thiếumargin;0,90mm là hướng phân tích chưasửa r12. M-A phải chứng minh không để100N kẹp gate ởmidstroke; contract tách precommit/no-newrelease và postcommit/sustainedOFF. Clearance0,25mm chỉlàallocation. CAD/FE/benchNOT_RUN.

Validator exit0/errors=[]; tests61/61exit0; independentQA accepts conditional documentation consistency only. Hash đầy đủ tất cả file và nguồn trong manifest, không dùng review cũ làm gatePASS mới.
'''
(run/'RELAY-REVIEW_REQUEST.md').write_text(relay,encoding='utf-8')
assert all(sha(Path(x['path']))==x['sha256'] for x in items)
print(json.dumps({'files':len(items),'mismatches':0,'r12':expected,'manifest_sha256':sha(manifest)}))
