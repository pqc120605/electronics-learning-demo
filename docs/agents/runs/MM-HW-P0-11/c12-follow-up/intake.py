"""Pin founder-supplied PDF/review, preserve earlier sealed packets."""
from pathlib import Path
import json,hashlib,math
root=Path(__file__).resolve().parents[5]
out=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pdf=root/'docs/research/downloads/p0-11/adr4520_4525_4530_4533_4540_4550.pdf'
assert pdf.read_bytes().startswith(b'%PDF-')
review=Path('C:/Users/ACER/.codex/attachments/933f96c0-edee-452a-abde-45e875146899/Pasted text.txt')
(out/'REVIEW_RESULT-C12.md').write_bytes(review.read_bytes())
images=[{'path':str(p.relative_to(root)).replace('\\','/'),'sha256':sha(p)} for p in sorted(out.glob('adr45-p*.png'))]
metadata={'date':'2026-11-10','source':'Founder downloaded official PDF and placed it in workspace; local bytes verified','manufacturer':'Analog Devices','title':'ADR4520/ADR4525/ADR4530/ADR4533/ADR4540/ADR4550','revision':'G','revision_date':'July2025, page2','pages':41,'path':str(pdf.relative_to(root)).replace('\\','/'),'sha256':sha(pdf),'official_url':'https://www.analog.com/media/en/technical-documentation/data-sheets/adr4520_4525_4530_4533_4540_4550.pdf','status':'PINNED','supersedes_download_status_only':'docs/research/downloads/p0-11/sources.json ADR45 entry NOT_RUN is historical; do not rewrite sealed packet','review_source_sha256':sha(review),'page_images':images,'page4_visually_checked':True,'confirmed':{'B_initial_error_max_ppm':200,'B_TC_box_max_ppm_per_degC':2,'full_temperature_line_regulation_max_ppm_per_V':10,'source_load_max_ppm_per_mA':80,'sink_load_max_ppm_per_mA':120,'solder_heat_shift_typ_ppm':200,'solder_heat_shift_max_ppm':None,'reference_thermal_hysteresis_max_ppm':None,'reference_aging_max_ppm':None}}
(out/'source-verification.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
old=json.loads((root/'docs/agents/runs/MM-HW-P0-11/calculations.json').read_text(encoding='utf-8-sig'))
h=old['H3_precision_proposal'];row=h['partial_intervals'][1];margin=min(row['low_margin_V'],row['high_margin_V']);k=h['Kmax']
calc={'scope':'Sensitivity calculations only; TYP is never a guaranteed bound','H3':{'partial_margin_before_hysteresis_min_mV':margin*1000,'typ_hysteresis_input_mV':1.2,'typ_hysteresis_pack_mV_full':1.2*k,'remaining_if_full_typ_charged_to_margin_mV':margin*1000-1.2*k,'remaining_if_half_typ_mV':margin*1000-.6*k,'hysteresis_max_required':'TBD; combined full error budget must fit with positive guard','solder_shift':'200ppm is now confirmed TYP only, not MAX; the earlier provisional interval remains conditional'} ,'bleed_proposal':{'connection':'Continuous passive bleed proposed for these worksheets, not switched by MCU; r12/BOM unchanged','RUN_at5_25V_nominal_A':2*5.25/10000,'RUN_at5_25V_Rmin_A':2*5.25/9900,'RUN_max_power_W':2*5.25**2/9900,'JOY_at3_3V_nominal_A':2*3.3/22000,'JOY_at3_6V_Rmin_A':2*3.6/21780,'JOY_max_power_W':2*3.6**2/21780,'RUN_remaining_load_current_if_total500mA_A':.5-2*5.25/9900,'OFF_note':'Zero only if rail really zero; residual/external bias cases use rail-specific KCL; do not double-count JOY current already supplied by B01 within RUN total'},'GPIO':'G-B16/16; new roles require architecture/resource review, never automatically drop E-channel or change module'}
(out/'calculations.json').write_text(json.dumps(calc,ensure_ascii=False,indent=2),encoding='utf-8')
qpath=Path('D:/StartupOS/docs/agents/tasks.json');q=json.loads(qpath.read_text(encoding='utf-8-sig'))
ids=['MM-HW-P0-10','MM-HW-P0-11','MM-HW-GATE-PREFLIGHT-001','MM-HW-GATE-PREFLIGHT-002','MM-HW-GATE-PREFLIGHT-003','MM-HW-MOBOT-REMOTE-KICAD-001']
excerpt={'captured_date':'2026-11-10','source_path':str(qpath),'source_sha256_at_capture':sha(qpath),'kind':'frozen relevant queue excerpt, not live registry or authority to dispatch','tasks':[t for t in q['tasks'] if t['id'] in ids]}
(out/'queue-excerpt.json').write_text(json.dumps(excerpt,ensure_ascii=False,indent=2),encoding='utf-8')
config=root/'docs/mission-control/hardware-config-mobot-v2-typec-r12-handset.json'
assert sha(config)=='8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b'
print(json.dumps({'pdf':metadata['sha256'],'review':metadata['review_source_sha256'],'remaining_typ_sensitivity_mV':calc['H3']['remaining_if_full_typ_charged_to_margin_mV'],'r12_unchanged':True}))
