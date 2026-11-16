# Post-route silkscreen cleanup: shrink reference designators and move them (and free
# silkscreen texts) to spots that touch no pad, no other silkscreen item and no hole.
# A reference with no free spot goes to F.Fab (not printed).
# Usage: python fix_silk.py handset|robot
import os, sys
import pcbnew

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
pcb = os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n)
b = pcbnew.LoadBoard(pcb)
T, MM = pcbnew.ToMM, pcbnew.FromMM
SZ, TH, GAP = 0.8, 0.12, 0.2
A0 = pcbnew.EDA_ANGLE(0, pcbnew.DEGREES_T)
eb = b.GetBoardEdgesBoundingBox()
EX0, EY0, EX1, EY1 = T(eb.GetLeft()) + 0.6, T(eb.GetTop()) + 0.6, T(eb.GetRight()) - 0.6, T(eb.GetBottom()) - 0.6


def rect(bb, g=0.0):
    return (T(bb.GetLeft()) - g, T(bb.GetTop()) - g, T(bb.GetRight()) + g, T(bb.GetBottom()) + g)


def hit(a, c):
    return a[0] < c[2] and c[0] < a[2] and a[1] < c[3] and c[1] < a[3]


obst = []       # fixed obstacles: pads, holes, footprint silk graphics
fps = list(b.GetFootprints())
for fp in fps:
    for p in fp.Pads():
        if p.IsOnLayer(pcbnew.F_Cu) or p.IsOnLayer(pcbnew.F_Mask) or p.HasHole():
            obst.append(rect(p.GetBoundingBox(), GAP))
    for g in fp.GraphicalItems():
        if g.GetLayer() == pcbnew.F_SilkS:
            obst.append(rect(g.GetBoundingBox(), GAP))
for d in b.GetDrawings():
    if d.GetLayer() in (pcbnew.F_SilkS, pcbnew.F_Mask) and d.GetClass() != "PCB_TEXT":
        obst.append(rect(d.GetBoundingBox(), GAP))
placed = []     # texts already placed


def free(r):
    if r[0] < EX0 or r[1] < EY0 or r[2] > EX1 or r[3] > EY1:
        return False
    for o in obst:
        if hit(r, o):
            return False
    for o in placed:
        if hit(r, o):
            return False
    return True


def size_of(t):
    t.SetPosition(pcbnew.VECTOR2I(MM(50), MM(50)))
    bb = t.GetBoundingBox()
    return T(bb.GetWidth()), T(bb.GetHeight())


def body(fp):
    xs, ys = [], []
    for p in fp.Pads():
        r = rect(p.GetBoundingBox()); xs += [r[0], r[2]]; ys += [r[1], r[3]]
    for g in fp.GraphicalItems():
        if g.GetLayer() in (pcbnew.F_SilkS, pcbnew.F_CrtYd):
            r = rect(g.GetBoundingBox()); xs += [r[0], r[2]]; ys += [r[1], r[3]]
    if not xs:
        p = fp.GetPosition(); return (T(p.x) - 1, T(p.y) - 1, T(p.x) + 1, T(p.y) + 1)
    return (min(xs), min(ys), max(xs), max(ys))


def spots(bx, w, h):
    cx, cy = (bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2
    out = []
    for k in range(0, 12):
        d = GAP + 0.1 + 0.3 * k
        slides = [0.0]
        for s in range(1, 8):
            slides += [0.4 * s, -0.4 * s]
        for s in slides:
            out.append((cx + s, bx[1] - d - h / 2))
            out.append((cx + s, bx[3] + d + h / 2))
            out.append((bx[0] - d - w / 2, cy + s))
            out.append((bx[2] + d + w / 2, cy + s))
    return out


moved = hidden = 0
order = sorted(fps, key=lambda f: (lambda r: (r[2] - r[0]) * (r[3] - r[1]))(body(f)))
for fp in order:
    ref = fp.Reference()
    if not ref.IsVisible() or ref.GetLayer() != pcbnew.F_SilkS:
        continue
    ref.SetTextSize(pcbnew.VECTOR2I(MM(SZ), MM(SZ))); ref.SetTextThickness(MM(TH))
    ref.SetTextAngle(A0); ref.SetKeepUpright(True)
    ref.SetHorizJustify(pcbnew.GR_TEXT_H_ALIGN_CENTER); ref.SetVertJustify(pcbnew.GR_TEXT_V_ALIGN_CENTER)
    w, h = size_of(ref)
    ok = False
    for (x, y) in spots(body(fp), w, h):
        r = (x - w / 2 - 0.05, y - h / 2 - 0.05, x + w / 2 + 0.05, y + h / 2 + 0.05)
        if free(r):
            ref.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y))); placed.append((r[0] - GAP, r[1] - GAP, r[2] + GAP, r[3] + GAP))
            ok = True; moved += 1; break
    if not ok:
        ref.SetLayer(pcbnew.F_Fab); ref.SetPosition(fp.GetPosition()); hidden += 1
        print("ref to F.Fab:", fp.GetReference())

# free silkscreen texts: keep if already clear, else search around the original spot
tm = tf = 0
for d in b.GetDrawings():
    if d.GetClass() != "PCB_TEXT" or d.GetLayer() != pcbnew.F_SilkS:
        continue
    p = d.GetPosition(); x0, y0 = T(p.x), T(p.y)
    w, h = size_of(d)
    best = None
    for k in range(0, 40):
        dd = 0.5 * k
        for (dx, dy) in ((0, 0),) if k == 0 else ((0, -dd), (0, dd), (dd, 0), (-dd, 0), (dd, -dd), (-dd, -dd), (dd, dd), (-dd, dd)):
            x, y = x0 + dx, y0 + dy
            r = (x - w / 2 - 0.05, y - h / 2 - 0.05, x + w / 2 + 0.05, y + h / 2 + 0.05)
            if free(r):
                best = (x, y, r); break
        if best:
            break
    if best:
        d.SetPosition(pcbnew.VECTOR2I(MM(best[0]), MM(best[1])))
        r = best[2]; placed.append((r[0] - GAP, r[1] - GAP, r[2] + GAP, r[3] + GAP)); tm += 1
    else:
        d.SetPosition(pcbnew.VECTOR2I(MM(x0), MM(y0))); tf += 1
        print("text not moved:", d.GetText())
print("refs placed", moved, "refs to F.Fab", hidden, "texts placed", tm, "texts stuck", tf)
pcbnew.SaveBoard(pcb, b)
