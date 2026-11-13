"""Bounded documentary consolidation; no hardware artifacts, approval or gate closure."""
from pathlib import Path
import copy, hashlib, json, sys

root=Path(__file__).resolve().parents[4]
run=root/'docs/agents/runs/MM-HW-P0-10'
old=Path('D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,value):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
before=root/'docs/mission-control/hardware-config-mobot-v2-typec-r11-handset.json'
target=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
doc=json.loads(before.read_text(encoding='utf-8-sig'))
doc['id']='MOBOT-V2-CONFIG-r12-HANDSET'; doc['revision']=12
doc['supersedes']={'id':'MOBOT-V2-CONFIG-r11-HANDSET','sha256':sha(before),'reference':str(before.relative_to(root)).replace('\\','/')}
doc['blocking_unknowns_scope']=doc['blocking_unknowns_scope'].replace('r11','r12')
h=doc['handset']; h['candidate_configuration']['id']='MOBOT-HANDSET-P0-CANDIDATE-r12'
c=h['charger_proposal']
c['primary_candidate']='BQ25170'; c['candidate_mpn_options']=['BQ25170 family; suffix TBD (J/non-J not selected)']
c['mpn_status']='Founder accepted family as primary candidate only; no MPN/suffix/setpoint/BOM/hash approval'
c['constraints']='BQ25170 family primary candidate; BQ25186 historical alternative; BQ25185 excluded. Pack ceiling4.200V unchanged. Full I/O isolation in CHARGE/PROGRAM; no I2C. CV4.05V strap is screening, not approved BOM/setpoint. Missing thermal/profile/fault bounds TBD.'
c['cv_target_v']='TBD pending suffix/strap/setpoint review; Founder accepts reduced-capacity direction at nominal4.05V'
c['cv_screening']={'classification':'Conditional published limits, not complete pack terminal envelope','nominal_v':4.05,'full_temperature_accuracy_fraction':0.008,'conditional_min_v':4.0176,'conditional_max_v':4.0824,'headline_accuracy_fraction':0.005,'selected':None,'strap_candidate_ohm':47000,'source':'docs/research/downloads/c11-r12/bq25170.pdf SLUSDJ8A p6 (full-temperature limits),p14 Table7-1 (strap); J suffix remains undecided','trip_max_allocation_v':4.110,'static_window_v':0.0276,'full_application_guarantee':'TBD'}
c['historical_alternatives']=[{'part':'BQ25186','status':'Historical alternative, not primary','screening':copy.deepcopy(h['charger_proposal'].get('comparison_reference')),'profile_evidence':copy.deepcopy(c.get('profile_evidence'))}]
c['profile_evidence']={'timer':'BQ25170 SLUSDJ8A p8: precharge28.5..31.5min; fastcharge9.5..10.5h. J suffix not selected; applicable profile/TS restart timing TBD. No register/I2C configuration.', 'ntc':'BQ25170 p7/15..18; BQ25170J SLUSEF8 p7/15..18 differ in thermal/JEITA behavior. Jauch full R-T/tolerance/lag and independent veto TBD. TS_EN register policy is historical BQ25186 only.', 'protection':'Independent OV/thermal/fault path must cover hardware strap misconfiguration, valid-but-wrong strap, OUT reverse/bypass and TS failures; exact threshold/error/delay TBD.', 'source':'docs/research/downloads/c11-r12/bq25170.pdf and bq25170j.pdf, SHA256 in sources.json; fullapplication guarantee TBD'}
for entry in h['candidate_configuration']['electrical_candidates']:
    if entry[0]=='charger H3': entry[1]='BQ25170 family candidate; suffix/MPN/strap/setpoint/BOM not approved'
    if entry[0]=='I/O and JOY isolation': entry[1]='TMUX1511 two-stage signal isolation candidate; JOY_VCC separate power branch with inrush/reverse-bias analysis TBD; no approved quantity'
m=h.get('mcu_resource_proposal')
if m is None:
    m=next(v for v in h.values() if isinstance(v,dict) and 'demand_bounds' in v)
roles=[x for x in m['role_assignments'] if x['role'] not in ['LIVENESS_CHALLENGE_RESPONSE','H3_I2C_SCL','H3_I2C_SDA']]
roles.append({'role':'WATCHDOG_SOFTWARE_FEED_WDI','kind':'output','exact_gpio':'UNASSIGNED','reference_pool':'9 unused output-capable; no peripheral feed'})
m['role_assignments']=roles
b=m['demand_bounds']; b['roles']=[x for x in b['roles'] if x['role'] not in ['LIVENESS_CHALLENGE_RESPONSE','H3_I2C_SCL_SDA']]
b['roles'].append({'role':'WATCHDOG_SOFTWARE_FEED_WDI','min':1,'max':1,'kind':'output; W limited fault model'})
for role in b['roles']:
    if role['role']=='E1_E4': role['min']=4; role['max']=4; role['kind']='direction TBD; four-channel planning assumption retained, not product count approval'
b['roles'].append({'role':'JOYSTICK_AND_BUTTON_BASELINE','min':5,'max':5,'kind':'baseline GPIO JOY_X/JOY_Y/JOY_SW/BTN1/BTN2, already outside unused pool; not five extra unused pins'})
b.update(total_new_min=10,total_new_max=12,total_min_including_baseline=15,total_max_including_baseline=17,baseline_gpio=5,guaranteed_pool=11,conditional_pool=13,guaranteed_total_pool_including_baseline=16,conditional_total_pool_including_baseline=18,status='Upper-bound demand17 exceeds assured total16 by1; mandatory15 fits with1 spare before optional statuses. No assignment; optional-role aggregation or combined RUN/ARM would need reviewed contract.',proposal_not_approved=True)
m['fault_model']='W: software-only watchdog feed; valid heartbeat continuing during CPU hang is outside accepted detection guarantee. No challenge-response role.'
h['joy_power_contract']={'classification':'power branch, not GPIO or TMUX signal leakage','inrush_a':'TBD','capacitance_uf':'TBD','reverse_current_ua':'TBD','timing_max_ms':'TBD','signal_channels':5}
direction=c['constraints']
for g in doc['milestone_gates']:
    if g['id']=='D17-H3-CV-PROTECTION':g['selected_direction']=direction
doc['selected_design_directions']['D17-H3-CV-PROTECTION']['direction']=direction
for gate in doc['external_design_gates']:
    gate['scope']=gate['scope'].replace('Handset reference5used/13unused','Handset reference5used/11assured-unused (13unused only if conditional GPIO16/17 accepted)')
doc['founder_direction_record']='docs/hardware/mobot-v2-founder-decision-c11-r12.md'
doc['consolidation_packet']='docs/agents/runs/MM-HW-P0-10/RELAY-REVIEW_REQUEST.md'
doc['mechanical_analysis_proposal']={'id':'C11-MECH-P1','reference':'docs/hardware/mobot-v2-c11-mechanical-canonical.md','status':'PROPOSED, not approved geometry or MPN; CAD/FE NOT_RUN'}
assert len(doc['verification_items'])==14
assert all(g['status']=='OPEN' for g in doc['milestone_gates']+doc['external_design_gates'])
assert 'LIVENESS_CHALLENGE_RESPONSE' not in json.dumps(doc)
for key in ['approved_by','approved_sha256']: assert key not in doc
save(target,doc)

new_verbatim=[
'09/11/2026 founder chấp nhận BQ25170 làm ứng viên sạc H3 và chấp nhận đánh đổi dung lượng nạp do CV 4,05 V cố định theo strap.',
'Chưa duyệt MPN/suffix (J hay không J)/setpoint/BOM/hash.',
'BQ25186 chuyển sang phương án thay thế lịch sử.',
'Trần 4,200 V tại đầu cực pack giữ nguyên.',
'Cách ly toàn bộ I/O trong CHARGE/PROGRAM giữ nguyên (khớp BQ25170 không I2C).']
answers=[('W','Chọn W, ghi rõ giới hạn và review độc lập (đề xuất)','W limited detection, independent review'),('RETENTION','Chốt envelope để phân tích và review (đề xuất)','100N service/200N proof EACH independent retention path; release after OFF/unload, jam locked'),('DIRECT_RETURN','Duyệt hướng direct-return để hoàn thiện hồ sơ','direction only'),('MANUAL_RELEASE','Ấn/kéo bằng tay, tối đa 100 N mỗi nút nhả; không dùng dụng cụ','100N EACH release button, separate from retention'),('IO_ISOLATION','Giữ cách ly toàn bộ I/O; hoàn thiện cơ chế/default charger phù hợp','full IO isolation CHARGE/PROGRAM')]
receipts=[{'id':i,'date':'2026-11-09','answer_verbatim':a,'scope':s,'source':'Founder original reply supplied in HQ conversation context; exact timestamp/message ID unavailable','source_message_id':None} for i,a,s in answers]
receipts += [{'id':f'C11-H3-{i+1}','date':'2026-11-09','answer_verbatim':s,'source':'Founder current HQ instruction; received in 2026-11-10 session, states decision date09/11/2026','source_message_id':None} for i,s in enumerate(new_verbatim)]
save(run/'founder-input.json',{'decisions':receipts,'defaults_not_confirmed_decisions':{'vendor_contact':'No outgoing communication; founder forwards DATA-REQUEST-DRAFT/RFQ','mechanical_evidence':'CAD+FE proposal first; physical samples founder option later'},'exclusions':'No hash/MPN/setpoint/BOM/gate/lease/physical authorization'})
minutes='# Biên nhận Founder C11/r12\n\nNgày quyết định:09/11/2026. Nguồn: HQ, hội thoại hiện tại; không có message ID gốc để ghim. Không tạo ID hoặc timestamp giả.\n\n'
for r in receipts: minutes+=f"- {r['id']}: «{r['answer_verbatim']}»\n"
minutes+='\nHai envelope độc lập: retention100N vận hành/200N proof MỖI đường; nhả bằng tay100N MỖI nút, không dụng cụ. Không cộng/đồng nhất hai loại100N.\n\nMặc định chưa xác nhận: Founder tự chuyển nháp hỏi dữ liệu/RFQ; không liên hệ vendor. CAD+FE có giả thiết vật liệu trước; mẫu vật lý chỉ do Founder quyết sau. Mẫu bổ sung sai số gia công, ma sát/drag, lực nóng/lạnh, mỏi/mòn thực; chi phí mẫu, fixture, thiết bị và thời gian hiện TBD. Không suy quyết định hướng thành phê duyệt hash/MPN/lease.\n'
(root/'docs/hardware/mobot-v2-founder-decision-c11-r12.md').write_text(minutes,encoding='utf-8')

if '--shared' in sys.argv:
    qpath=Path('D:/StartupOS/docs/agents/tasks.json')
    q=json.loads(qpath.read_text(encoding='utf-8-sig'))
    reg=copy.deepcopy(q['hardware_configurations']['MOBOT-V2-CONFIG-r11-HANDSET'])
    for k in ['approved_by','approved_sha256']:reg.pop(k,None)
    reg.update(revision=12,status='proposed',reference='electronics-learning-demo/'+str(target.relative_to(root)).replace('\\','/'),configuration_sha256=sha(target),blocking_unknowns=doc['blocking_unknowns'],proposal_blocking_unknowns=doc['blocking_unknowns'],milestone_gates=doc['milestone_gates'],external_design_gates=doc['external_design_gates'],source='Founder C11 BQ25170 candidate receipt; r12 proposed only',gate_reviews={},blocking_unknowns_scope=doc['blocking_unknowns_scope'])
    q['hardware_configurations'][doc['id']]=reg
    task=next(t for t in q['tasks'] if t['id']=='MM-HW-P0-09')
    task['waiting'].update(owner='Codex lead + independent Box08 review; Founder for product tradeoffs',reason='C11 consolidated in MM-HW-P0-10; BQ25170 family now accepted candidate, no MPN/hash approval. Four schematic gates remain OPEN; max GPIO deficit1, H3 full error/timing and mechanical geometry/FE bounds unresolved.',resume_condition='Independent review of exact r12 packet and bounded alternatives; resolve missing circuit/mechanical evidence or Founder tradeoffs. No vendor contact required or authorized.')
    if not any(t['id']=='MM-HW-P0-10' for t in q['tasks']):
        task2=copy.deepcopy(task)
        task2.update(id='MM-HW-P0-10',title='C11 r12 documentary consolidation and pinned evidence',status='in_review',attempt=1,review=None,verification=None,waiting=None,completion_summary=None,input_refs=['electronics-learning-demo/docs/claude-support/2026-11-09-b1-readiness-checkpoint/review-result.md'],allowed_paths=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-10/**','electronics-learning-demo/docs/hardware/mobot-v2-c11-*','electronics-learning-demo/docs/hardware/mobot-v2-founder-decision-c11-r12.md','electronics-learning-demo/docs/research/downloads/c11-r12/**','electronics-learning-demo/docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'],deliverables=['electronics-learning-demo/docs/agents/runs/MM-HW-P0-10/RELAY-REVIEW_REQUEST.md'],snapshot={'kind':'file-hashes','reference':'electronics-learning-demo/docs/agents/runs/MM-HW-P0-10/packet-snapshot.json'},history=[{'event':'imported_snapshot','from':None,'to':'in_review','at':'2026-11-10','actor':'codex_lead','attempt':1,'reason':'Founder explicitly authorized C11 documentary consolidation; gates OPEN, no builder lease.'}],authorization='Current HQ C11 consolidation request; lead writer, advisors read-only. No build/CAD/FE/device/approval/lease inference.')
        q['tasks'].append(task2)
    q['updated_on']='2026-11-10'
    save(qpath,q)
print('r12',sha(target))
