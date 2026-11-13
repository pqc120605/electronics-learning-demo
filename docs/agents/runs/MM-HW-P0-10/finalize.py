from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[4];run=root/'docs/agents/runs/MM-HW-P0-10'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r11=root/'docs/mission-control/hardware-config-mobot-v2-typec-r11-handset.json'
r12=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
a=json.loads(r11.read_text(encoding='utf-8-sig'));b=json.loads(r12.read_text(encoding='utf-8-sig'))
qpath=Path('D:/StartupOS/docs/agents/tasks.json');q=json.loads(qpath.read_text(encoding='utf-8-sig'))
assert sha(r11)=='b4a7a5aedcd9012ca75df93a973f0517d86f28a13249632c1ea2a576f945e887'
assert a['verification_items']==b['verification_items'] and len(b['verification_items'])==14
for x,y in zip(a['milestone_gates']+a['external_design_gates'],b['milestone_gates']+b['external_design_gates']):
    assert (x['id'],x['stage'],x['status'],x['pass_fail'])==(y['id'],y['stage'],y['status'],y['pass_fail'])
    assert y['status']=='OPEN'
assert a['required_gate_ids']==b['required_gate_ids']
assert 'approved_by' not in b and 'approved_sha256' not in b
assert q['hardware_configurations'][b['id']]['configuration_sha256']==sha(r12)
source_dir=root/'docs/research/downloads/c11-r12'
for source in json.loads((source_dir/'sources.json').read_text(encoding='utf-8')):
    assert source['status']=='PINNED'
    assert sha(root/source['path'])==source['sha256']
    for image in source['page_images']:assert sha(root/image['path'])==image['sha256']
(run/'invariants.json').write_text(json.dumps({'r11_unchanged':True,'r12_sha256':sha(r12),'verification_items_unchanged':14,'all_gates_OPEN':7,'gate_stages_criteria_unchanged':True,'source_hashes_match':True,'approved':False,'hardware_execution':'NOT_AUTHORIZED','CAD':'NOT_RUN','FE':'NOT_RUN','bench':'NOT_RUN'},indent=2),encoding='utf-8')
report=f'''# Báo cáo hợp nhất C11/r12

Ngày10/11/2026. Phạm vi document/proposal. Sol điện/cơ và QA đã trả advisory; Luna trả kiểm tra tài liệu/queue. Lead là writer duy nhất; không builder lease, không gọi Claude, không gửi vendor.

- r12 proposed SHA256: `{sha(r12)}`; r11 giữ nguyên `{sha(r11)}`.
- Receipt từng câu Founder được ghi riêng; chưa gán hash/MPN/setpoint/BOM approval.
- 16 PDF TI,177 ảnh trang điện và nguồn cơ khí được ghim; source-index.md/sources.json có tên tài liệu/revision/trang/hash. Ảnh BQ25170p6 đã xem trực tiếp, sốCV±0,8% toàn nhiệt khác±0,5% ở25°C.
- Một canonical geometry C11-MECH-P1; hình học/phép tính/review cũ có mapping supersession, không tái dùng approval cũ. Sửa nguồnSSAB8mm; bổ sung phôi≥10mm để giữ core8mm, chưa là lựa chọn vật liệu/chế tạo đã duyệt.
- H3 window27,6mV/cutoff59,060915µs là allocation; GPIO15..17 vs16 bảo đảm, upper thiếu1; E4 giữ nguyên; JOY power/inrushTBD; pulse3s,20/22,05J nominal.
- QA đã kiểm đúng snapshot trước hiệu đính profile: phát hiện active BQ25186 timer/I2C còn sót, đã sửa sang profileBQ25170/J và chuyển nội dung cũ vào historical. Pool scope đã làm rõ11assured/13conditional; máy kiểm lại invariants sau sửa.

## Lệnh và kết quả

`python docs/agents/runs/MM-HW-P0-10/calculate.py`: exit0, kết quả calculations.json.
`node D:/StartupOS/docs/agents/validate.mjs`: exit0;56tasks;errors=[];warnings=[].
`node --test D:/StartupOS/docs/agents/validate.test.mjs`: exit0;61/61,0fail,0skip.
`python docs/agents/runs/MM-HW-P0-10/finalize.py`: exit0 khi invariants.json/packet-snapshot.json được tạo thành công.
Download đầu tiên lỗi DNS trong môi trường hạn chế; retry được phép thành công. Không lặp vô hạn hoặc cài package.

## Chưa đủ đích đóng cổng

1. H3 chưa chứng minh full threshold error/thermal/aging/hysteresis và detect→isolateMAX; cần chọn/hoàn thiện một phương án có cận. Không tự đổi trần4,200V.
2. Cận GPIO có thiếu1 khi dùng cả hai optional observations; cần review yêu cầu quan sát/kiến trúc trước chọn giải pháp, không tự bỏ E-channel.
3. Geometry chỉ thống nhất proposal: free-body tách lực100N khỏi permission gate, swept interference, local contact/fillet/frame, actuator netMIN/return/duty và landed cost còn thiếu. CAD/FE chưa chạy vì thiếu exact approved configuration/finite geometry và quyền build tương ứng; analytic không thay FE. Life/drop/vibration/aging chưa được chứng minh.
4. OFF/W còn mixed-bias KCL, qualifier/reset dominance và MAX toàn tuyến; nguồn ghim không tự đóng thiết kế.

Do đó **B1 NOT_READY**, không tuyên bố goal đóng cả4cổng hoàn tất. Packet sẵn sàng xin review phần hồ sơ/phương án; không hứa reviewer có đủ cơ sở PASS. RELAY do Founder tự chuyển nếu muốn; lead không gọi Claude.
'''
(run/'REPORT.md').write_text(report,encoding='utf-8')
files=[r12,r11,qpath]+list((root/'docs/hardware').glob('mobot-v2-c11-*'))+[root/'docs/hardware/mobot-v2-founder-decision-c11-r12.md']
files+=sorted(source_dir.rglob('*'))+sorted(run.rglob('*'))
records=[]
for f in files:
    if not f.is_file() or f.name in ['packet-snapshot.json','RELAY-REVIEW_REQUEST.md']:continue
    records.append({'path':str(f).replace('\\','/'),'sha256':sha(f)})
manifest=run/'packet-snapshot.json'
manifest.write_text(json.dumps({'configuration_sha256':sha(r12),'excludes':['packet-snapshot.json (self)','RELAY-REVIEW_REQUEST.md (lists this manifest)'],'files':records},ensure_ascii=False,indent=2),encoding='utf-8')
relay=f'''# RELAY CODEX → CLAUDE

relay_id: R-20261110-C11-R12-01
reply_to: R-20261109-C11
type: REVIEW_REQUEST
delivery: Founder tự chuyển; chưa gửi/gọi Claude
scope: documentary consolidation + conditional design analysis; no gate/MPN/hash/lease approval
configuration: MOBOT-V2-CONFIG-r12-HANDSET
configuration_sha256: {sha(r12)}
packet_manifest: docs/agents/runs/MM-HW-P0-10/packet-snapshot.json
packet_manifest_sha256: {sha(manifest)}

## Đọc và kiểm

Đọc REPORT.md, DISPOSITION-C11.md, founder-input.json, SUPERSESSION.md, source-index.md, calculations.json, invariants.json và reissued/*.md trong packet; hai hồ sơ mobot-v2-c11-electrical-consolidation.md/mobot-v2-c11-mechanical-canonical.md; biên nhậnFounder mới; r12. Mọi file và hash đầy đủ gồm PDF/ảnh nguồn/queue có trong manifest đã ghim. Các review cũ là lịch sử, không gán verdict mới. Hash r11 bất biến;14verification items/7gates/stage/pass_fail giữ nguyên. r12proposed, khôngapproved.

Xin phân xử C11F1–F9 và tính phù hợp của nguồn/điều kiện; đặc biệt H3 window27,6mV/error/cutoff59,06µs; GPIO15..17/16; canonical core/dogleg/free-body; tiêu chí SF/life/environment là proposal. Ghi verdict từng cổng, không suy nguồn đầy đủ là thiết kế đạt. H3 errorchain, complete geometry/load isolation, FE/fatigue và OFF mixed-biasMAX còn thiếuTBD/NOT_RUN.

Validationexit0/errors=[]/warnings=[]; tests61/61exit0. Không có CAD/FE/bench execution. Founder chấp nhậnBQ25170family/capacitytradeoff, chưa suffix/setpoint/BOM/hash; trần4,200V và fullIOisolation giữ. Vendor không được liên hệ; DATA-REQUEST-DRAFT/RFQ-DRAFT là nháp.

## Tệp chính và SHA256

'''
for f in [r12,root/'docs/hardware/mobot-v2-founder-decision-c11-r12.md',root/'docs/hardware/mobot-v2-c11-electrical-consolidation.md',root/'docs/hardware/mobot-v2-c11-mechanical-canonical.md',run/'founder-input.json',run/'DISPOSITION-C11.md',run/'calculate.py',run/'calculations.json',run/'REPORT.md']:
    relay+=f'- `{str(f.relative_to(root)).replace(chr(92),"/")}` — `{sha(f)}`\n'
(run/'RELAY-REVIEW_REQUEST.md').write_text(relay,encoding='utf-8')
print('invariants verified; packet files',len(records),'r12',sha(r12))
