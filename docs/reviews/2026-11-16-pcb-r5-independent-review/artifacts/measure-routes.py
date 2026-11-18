"""Review only: shortest copper-centerline paths; no zone or via-barrel resistance model."""
import pcbnew,json,math,heapq,collections
from pathlib import Path
BASE=Path('docs/hardware/claude-support/2026-11-15-pcb-2layer-r5/kicad')
OUT=Path('docs/reviews/2026-11-16-pcb-r5-independent-review/artifacts')
PAIRS={'handset':[('U1','1','C2','1'),('U1','1','C3','1')], 'robot':[('U7','17','L2','2'),('U7','12','C7','1'),('U6','6','R28','1'),('U6','3','R27','1'),('R28','1','R30','1'),('J4','A4','U7','23'),('J15','2','U2','3'),('U8','7','U6','12'),('U6','5','J7','1')]}
reports=[]
for board,pairs in PAIRS.items():
 b=pcbnew.LoadBoard(str(BASE/board/f'mobot-{board}.kicad_pcb'));pads={(f.GetReference(),str(p.GetNumber())):p for f in b.GetFootprints() for p in f.Pads()}
 for ar,ap,zr,zp in pairs:
  a,z=pads[(ar,ap)],pads[(zr,zp)];net=a.GetNetCode();g=collections.defaultdict(list);nodes=set()
  def node(p,l):return(p.x,p.y,l)
  def edge(x,y,length,meta):g[x].append((y,length,meta));g[y].append((x,length,meta));nodes.update([x,y])
  for t in b.GetTracks():
   if t.GetNetCode()!=net:continue
   if isinstance(t,pcbnew.PCB_VIA):edge(node(t.GetPosition(),pcbnew.F_Cu),node(t.GetPosition(),pcbnew.B_Cu),0,{'via':True,'xy':[pcbnew.ToMM(t.GetPosition().x),pcbnew.ToMM(t.GetPosition().y)]})
   else:edge(node(t.GetStart(),t.GetLayer()),node(t.GetEnd(),t.GetLayer()),pcbnew.ToMM(t.GetLength()),{'start':[pcbnew.ToMM(t.GetStart().x),pcbnew.ToMM(t.GetStart().y)],'end':[pcbnew.ToMM(t.GetEnd().x),pcbnew.ToMM(t.GetEnd().y)],'widthMm':pcbnew.ToMM(t.GetWidth()),'layer':b.GetLayerName(t.GetLayer())})
  copperNodes=list(nodes)
  for idx,((ref,pin),p) in enumerate(pads.items()):
   if p.GetNetCode()!=net:continue
   virtual=(-1000000000-idx,0,-1)
   for x,y,l in copperNodes:
    if p.IsOnLayer(l) and p.HitTest(pcbnew.VECTOR2I(x,y)):edge(virtual,(x,y,l),0,None)
   if p==a:start=virtual
   if p==z:finish=virtual
  dist={start:0};prev={};queue=[(0,start)]
  while queue:
   d,n=heapq.heappop(queue)
   if d!=dist[n]:continue
   if n==finish:break
   for dest,length,meta in g[n]:
    nd=d+length
    if nd<dist.get(dest,float('inf')):dist[dest]=nd;prev[dest]=(n,meta,length);heapq.heappush(queue,(nd,dest))
  route=[];n=finish
  while n in prev:
   n,meta,length=prev[n]
   if meta is not None:route.append(dict(meta,lengthMm=length))
  route.reverse();length=dist.get(finish);r=sum(1.724e-5*t['lengthMm']/(t['widthMm']*.035) for t in route if not t.get('via'))
  reports.append({'board':board,'from':f'{ar}.{ap}','to':f'{zr}.{zp}','net':str(a.GetNetname()),'straightMm':pcbnew.ToMM((a.GetPosition()-z.GetPosition()).EuclideanNorm()),'trackPathMm':length,'vias':sum(1 for t in route if t.get('via')),'hypotheticalTrackOhmsAt35um':r,'route':route})
  print(board,f'{ar}.{ap}->{zr}.{zp}',length)
(OUT/'route-measurements.json').write_text(json.dumps({'method':'Shortest connected track-centerline path; pad interiors and vias zero length; no plane conduction; hypothetical35um R excludes vias/pads/ground/temperature; not measured voltage or heat','routes':reports},indent=2),encoding='utf-8')
