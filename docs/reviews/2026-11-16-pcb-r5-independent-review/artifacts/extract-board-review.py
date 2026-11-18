"""Read-only pcbnew inspection; exports review evidence, never saves a board."""
import json,sys,math,collections
from pathlib import Path
import pcbnew
BASE=Path('docs/hardware/claude-support/2026-11-15-pcb-2layer-r5/kicad')
OUT=Path('docs/reviews/2026-11-16-pcb-r5-independent-review/artifacts')
mm=lambda v:pcbnew.ToMM(v)
def point(p):return [mm(p.x),mm(p.y)]
result={}
for name in ['handset','robot']:
 path=BASE/name/f'mobot-{name}.kicad_pcb';b=pcbnew.LoadBoard(str(path));fps=[];tracks=[];nets={}
 for f in b.GetFootprints():
  pads=[{'pin':str(p.GetNumber()),'net':str(p.GetNetname()),'xy':point(p.GetPosition()),'size':point(p.GetSize()),'drill':point(p.GetDrillSize()),'layers':str(p.GetLayerSet().FmtBin())} for p in f.Pads()]
  fps.append({'ref':f.GetReference(),'value':f.GetValue(),'footprint':str(f.GetFPID().GetLibNickname())+':'+str(f.GetFPID().GetLibItemName()),'xy':point(f.GetPosition()),'rotation':f.GetOrientationDegrees(),'pads':pads})
 for t in b.GetTracks():
  net=str(t.GetNetname());d=nets.setdefault(net,{'lengthMm':0,'widthsMm':set(),'vias':0,'layers':collections.Counter()})
  if isinstance(t,pcbnew.PCB_VIA):
   d['vias']+=1;tracks.append({'net':net,'via':True,'xy':point(t.GetPosition()),'diameter':mm(t.GetWidth(pcbnew.F_Cu)),'drill':mm(t.GetDrillValue())})
  else:
   length=mm(t.GetLength());width=mm(t.GetWidth());layer=b.GetLayerName(t.GetLayer());d['lengthMm']+=length;d['widthsMm'].add(width);d['layers'][layer]+=length
   tracks.append({'net':net,'start':point(t.GetStart()),'end':point(t.GetEnd()),'width':width,'layer':layer,'lengthMm':length})
 for d in nets.values():d['widthsMm']=sorted(d['widthsMm']);d['layers']=dict(d['layers'])
 box=b.GetBoardEdgesBoundingBox();pro=json.loads(path.with_suffix('.kicad_pro').read_text(encoding='utf-8'))
 ignores={k:v for k,v in pro.get('board',{}).get('design_settings',{}).get('rule_severities',{}).items() if v=='ignore'}
 result[name]={'kicad':pcbnew.Version(),'sizeMm':[mm(box.GetWidth()),mm(box.GetHeight())],'footprints':sorted(fps,key=lambda f:f['ref']),'tracks':tracks,'nets':nets,'ignoredDrc':ignores,'netclasses':pro.get('net_settings',{}),'zones':[{'name':z.GetZoneName(),'net':z.GetNetname(),'layers':str(z.GetLayerSet().FmtBin()),'keepout':z.GetIsRuleArea()} for z in b.Zones()]}
 print(name,len(fps),'footprints',sum(1 for t in tracks if not t.get('via')),'segments',sum(1 for t in tracks if t.get('via')),'vias')
(OUT/'board-analysis.json').write_text(json.dumps(result,ensure_ascii=True,indent=2),encoding='utf-8')
