# Report GND connectivity components (zone fragments, vias, pads, tracks). Usage: gnd_comp.py name
import os, sys, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
b = pcbnew.LoadBoard(os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n))
T = pcbnew.ToMM
g = b.FindNet("/GND").GetNetCode()
nodes = []   # (desc, layerset, kind, obj)
par = []
def add(d, k, o, lay):
    nodes.append((d, k, o, lay)); par.append(len(par)); return len(par) - 1
def find(i):
    while par[i] != i:
        par[i] = par[par[i]]; i = par[i]
    return i
def uni(a, c):
    par[find(a)] = find(c)
frs = []
for z in b.Zones():
    if z.GetIsRuleArea():
        continue
    lay = z.GetLayer(); ps = z.GetFilledPolysList(lay)
    for i in range(ps.OutlineCount()):
        o = ps.Outline(i); bb = o.BBox()
        ps1 = pcbnew.SHAPE_POLY_SET(); ps1.AddOutline(o)
        for h in range(ps.HoleCount(i)):
            ps1.AddHole(ps.Hole(i, h))
        k = add("%s frag (%.1f,%.1f)-(%.1f,%.1f)" % (b.GetLayerName(lay), T(bb.GetLeft()), T(bb.GetTop()), T(bb.GetRight()), T(bb.GetBottom())), "f", ps1, lay)
        frs.append(k)
def touch(pt, lays, k):
    for f in frs:
        if nodes[f][3] in lays and nodes[f][2].Contains(pt, -1, 1000):
            uni(k, f)
pts = []
for t in b.GetTracks():
    if t.GetNetCode() != g:
        continue
    if t.GetClass() == "PCB_VIA":
        p = t.GetPosition(); k = add("via (%.2f,%.2f)" % (T(p.x), T(p.y)), "v", None, None)
        touch(p, (pcbnew.F_Cu, pcbnew.B_Cu), k); pts.append((p, (pcbnew.F_Cu, pcbnew.B_Cu), k))
    else:
        s, e = t.GetStart(), t.GetEnd(); k = add("trk (%.2f,%.2f)" % (T(s.x), T(s.y)), "t", None, None)
        for p in (s, e):
            touch(p, (t.GetLayer(),), k); pts.append((p, (t.GetLayer(),), k))
pads = []
for fp in b.GetFootprints():
    for p in fp.Pads():
        if p.GetNetCode() != g:
            continue
        lays = tuple(l for l in (pcbnew.F_Cu, pcbnew.B_Cu) if p.IsOnLayer(l))
        k = add("pad %s.%s" % (fp.GetReference(), p.GetNumber()), "p", p, lays)
        c = p.GetPosition(); touch(c, lays, k)
        bb = p.GetBoundingBox()
        for q in (pcbnew.VECTOR2I(bb.GetLeft(), c.y), pcbnew.VECTOR2I(bb.GetRight(), c.y), pcbnew.VECTOR2I(c.x, bb.GetTop()), pcbnew.VECTOR2I(c.x, bb.GetBottom())):
            touch(q, lays, k)
        pads.append((p, lays, k))
for (p, lays, k) in pts:
    for (pd, pl, pk) in pads:
        if set(lays) & set(pl) and pd.HitTest(p):
            uni(k, pk)
    for (q, ql, qk) in pts:
        if qk != k and set(lays) & set(ql) and abs(p.x - q.x) < 150000 and abs(p.y - q.y) < 150000:
            uni(k, qk)
comp = {}
for i in range(len(nodes)):
    comp.setdefault(find(i), []).append(i)
cs = sorted(comp.values(), key=len, reverse=True)
print("components", len(cs), "main size", len(cs[0]))
for c in cs[1:]:
    print("--", len(c)); print("   " + "; ".join(nodes[i][0] for i in c[:14]))

# --bridge: join each small component to the main one with a via placed where an isolated
# fragment on one layer overlaps a main-component fragment on the other layer.
if "--bridge" in sys.argv:
    main = set(cs[0]); MMf = pcbnew.FromMM; added = 0
    def inside(f, x, y, m=float(os.environ.get("M", "0.33"))):
        for (dx, dy) in ((0, 0), (m, 0), (-m, 0), (0, m), (0, -m), (m * .7, m * .7), (-m * .7, m * .7), (m * .7, -m * .7), (-m * .7, -m * .7)):
            if not nodes[f][2].Contains(pcbnew.VECTOR2I(MMf(x + dx), MMf(y + dy)), -1, 0):
                return False
        return True
    for c in cs[1:]:
        ok = False
        for f in [i for i in c if nodes[i][1] == "f"]:
            other = pcbnew.B_Cu if nodes[f][3] == pcbnew.F_Cu else pcbnew.F_Cu
            mains = [m for m in frs if m in main and nodes[m][3] == other]
            bb = nodes[f][2].BBox()
            y = T(bb.GetTop())
            while y < T(bb.GetBottom()) and not ok:
                x = T(bb.GetLeft())
                while x < T(bb.GetRight()) and not ok:
                    if inside(f, x, y) and any(inside(m, x, y) for m in mains):
                        v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(MMf(x), MMf(y)))
                        v.SetViaType(pcbnew.VIATYPE_THROUGH); v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu)
                        v.SetWidth(pcbnew.F_Cu, MMf(0.6)); v.SetDrill(MMf(0.3)); v.SetNetCode(g); b.Add(v)
                        print("bridge via (%.2f, %.2f)" % (x, y)); ok = True; added += 1
                    x += 0.1
                y += 0.1
            if ok:
                break
        if not ok:
            print("NO BRIDGE for component", nodes[c[0]][0])
    if added:
        pcbnew.ZONE_FILLER(b).Fill(b.Zones())
        pcbnew.SaveBoard(os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n), b)
