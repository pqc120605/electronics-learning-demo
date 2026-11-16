# Post-route fix: stitch isolated F.Cu GND track islands to the B.Cu GND zone with vias,
# and widen tracks narrower than the board minimum. Reads the DRC report for locations.
# Usage: python fix_gnd.py handset|robot
import os, re, sys, math
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
name = sys.argv[1]
pcb = os.path.join(ROOT, "kicad", name, "mobot-%s.kicad_pcb" % name)
rpt = os.path.join(ROOT, "reports", "%s-drc.rpt" % name)
MM = pcbnew.FromMM
TO = pcbnew.ToMM
VIA_D, VIA_DRILL, MINW = 0.6, 0.3, 0.15
GAP = 0.2          # copper gap kept to other nets
HOLE_GAP = 0.25    # gap kept between hole edges

b = pcbnew.LoadBoard(pcb)
gnd = b.FindNet("/GND")
gcode = gnd.GetNetCode()

segs, vias, pads = [], [], []
for t in b.GetTracks():
    if t.GetClass() == "PCB_VIA":
        p = t.GetPosition()
        vias.append((TO(p.x), TO(p.y), TO(t.GetWidth(pcbnew.F_Cu)) / 2, t.GetNetCode()))
    else:
        s, e = t.GetStart(), t.GetEnd()
        segs.append([TO(s.x), TO(s.y), TO(e.x), TO(e.y), TO(t.GetWidth()) / 2, t.GetNetCode(), t.GetLayer(), t])
for fp in b.GetFootprints():
    for p in fp.Pads():
        bb = p.GetBoundingBox()
        th = p.HasHole()
        cu = p.IsOnLayer(pcbnew.F_Cu) or p.IsOnLayer(pcbnew.B_Cu)
        pads.append((TO(bb.GetLeft()), TO(bb.GetTop()), TO(bb.GetRight()), TO(bb.GetBottom()),
                     p.GetNetCode(), th, p.IsOnLayer(pcbnew.F_Cu), p.IsOnLayer(pcbnew.B_Cu), cu))
KEEP = []
for z in b.Zones():
    if z.GetIsRuleArea():
        zb = z.GetBoundingBox()
        KEEP.append((TO(zb.GetLeft()), TO(zb.GetTop()), TO(zb.GetRight()), TO(zb.GetBottom())))
ebb = b.GetBoardEdgesBoundingBox()
EX0, EY0, EX1, EY1 = TO(ebb.GetLeft()), TO(ebb.GetTop()), TO(ebb.GetRight()), TO(ebb.GetBottom())


def d_seg(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / L))
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))


def d_rect(px, py, r):
    dx = max(r[0] - px, 0, px - r[2]); dy = max(r[1] - py, 0, py - r[3])
    return math.hypot(dx, dy)


def _ccw(ax, ay, bx, by, cx, cy):
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax)


def seg_seg(a, c):
    if _ccw(a[0], a[1], c[0], c[1], c[2], c[3]) != _ccw(a[2], a[3], c[0], c[1], c[2], c[3]) and \
       _ccw(a[0], a[1], a[2], a[3], c[0], c[1]) != _ccw(a[0], a[1], a[2], a[3], c[2], c[3]):
        return 0.0
    return min(d_seg(a[0], a[1], *c), d_seg(a[2], a[3], *c), d_seg(c[0], c[1], *a), d_seg(c[2], c[3], *a))


def via_ok(x, y):
    r = VIA_D / 2
    if x < EX0 + 1 or x > EX1 - 1 or y < EY0 + 1 or y > EY1 - 1:
        return False
    for k in KEEP:
        if k[0] - 0.6 < x < k[2] + 0.6 and k[1] - 0.6 < y < k[3] + 0.6:
            return False
    for s in segs:
        if s[5] != gcode and d_seg(x, y, s[0], s[1], s[2], s[3]) < r + s[4] + GAP:
            return False
    for v in vias:
        d = math.hypot(x - v[0], y - v[1])
        if d < 0.01:
            return False
        if d < VIA_DRILL + HOLE_GAP + 0.2:
            return False
        if v[3] != gcode and d < r + v[2] + GAP:
            return False
    for p in pads:
        d = d_rect(x, y, p)
        if p[5] and d < VIA_DRILL / 2 + HOLE_GAP + 0.1:
            return False
        if not p[8]:
            if d < VIA_DRILL / 2 + HOLE_GAP:
                return False
            continue
        if p[4] != gcode and d < r + GAP:
            return False
        if p[4] == gcode and not p[5] and d < 0.05:
            return False      # no via inside SMD pad
    return True


def stub_ok(x1, y1, x2, y2):
    a = (x1, y1, x2, y2)
    for s in segs:
        if s[6] == pcbnew.F_Cu and s[5] != gcode and seg_seg(a, (s[0], s[1], s[2], s[3])) < 0.1 + s[4] + GAP:
            return False
    for v in vias:
        if v[3] != gcode and d_seg(v[0], v[1], *a) < 0.1 + v[2] + GAP:
            return False
    for p in pads:
        if p[4] != gcode and p[6]:
            n = 8
            for i in range(n + 1):
                if d_rect(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, p) < 0.1 + GAP:
                    return False
    return True


def cluster(seed):
    out, todo = [seed], [seed]
    while todo:
        c = todo.pop()
        for s in segs:
            if s in out or s[5] != gcode or s[6] != pcbnew.F_Cu:
                continue
            for (ax, ay) in ((c[0], c[1]), (c[2], c[3])):
                if d_seg(ax, ay, s[0], s[1], s[2], s[3]) < 0.02:
                    out.append(s); todo.append(s); break
    return out


def samples(cl):
    pts = []
    for s in cl:
        L = math.hypot(s[2] - s[0], s[3] - s[1])
        n = max(1, int(L / 0.2))
        for i in range(n + 1):
            pts.append((s[0] + (s[2] - s[0]) * i / n, s[1] + (s[3] - s[1]) * i / n))
    return pts


def add_via(x, y):
    v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
    v.SetViaType(pcbnew.VIATYPE_THROUGH); v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu)
    try:
        v.SetWidth(pcbnew.F_Cu, MM(VIA_D))
    except Exception:
        v.SetWidth(MM(VIA_D))
    v.SetDrill(MM(VIA_DRILL)); v.SetNet(gnd); b.Add(v)
    vias.append((x, y, VIA_D / 2, gcode))


def add_stub(x1, y1, x2, y2):
    t = pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(MM(x1), MM(y1))); t.SetEnd(pcbnew.VECTOR2I(MM(x2), MM(y2)))
    t.SetWidth(MM(0.2)); t.SetLayer(pcbnew.F_Cu); t.SetNet(gnd); b.Add(t)
    segs.append([x1, y1, x2, y2, 0.1, gcode, pcbnew.F_Cu, t])


def stitch(cl):
    pts = samples(cl)
    for (x, y) in pts:
        if via_ok(x, y):
            add_via(x, y); return "via on track (%.2f, %.2f)" % (x, y)
    for rad in (0.6, 0.9, 1.2, 1.6, 2.0, 2.6):
        for (x, y) in pts:
            for k in range(16):
                a = math.pi * k / 8
                qx, qy = x + rad * math.cos(a), y + rad * math.sin(a)
                if via_ok(qx, qy) and stub_ok(x, y, qx, qy):
                    add_stub(x, y, qx, qy); add_via(qx, qy)
                    return "stub+via (%.2f, %.2f)" % (qx, qy)
    return None


# 1. widen narrow tracks
nw = 0
for s in segs:
    if s[4] * 2 < MINW - 1e-6:
        s[7].SetWidth(MM(MINW)); s[4] = MINW / 2; nw += 1
print("widened", nw)

# 2. stitch GND islands named by the DRC report
txt = open(rpt, encoding="utf-8", errors="replace").read()
done, fail = [], 0
for m in re.finditer(r"\[unconnected_items\][^\n]*\n(?:[^\n@]*\n)?\s*@\(([\d.]+) mm, ([\d.]+) mm\): ([^\n]*)\n\s*@\(([\d.]+) mm, ([\d.]+) mm\): ([^\n]*)", txt):
    for (xs, ys, desc) in ((m.group(1), m.group(2), m.group(3)), (m.group(4), m.group(5), m.group(6))):
        if "[/GND]" not in desc or not desc.startswith("Track"):
            continue
        x, y = float(xs), float(ys)
        seed = None
        for s in segs:
            if s[5] == gcode and s[6] == pcbnew.F_Cu and d_seg(x, y, s[0], s[1], s[2], s[3]) < 0.03:
                seed = s; break
        if seed is None:
            print("no track at", x, y); fail += 1; continue
        cl = cluster(seed)
        if any(id(c) in done for c in cl):
            continue
        r = stitch(cl)
        for c in cl:
            done.append(id(c))
        if r is None:
            fail += 1
        print("island @(%.2f, %.2f) segs %d: %s" % (x, y, len(cl), r))
print("stitch failures", fail)

# 3. F.Cu GND pour (islands removed) + stitching via grid, so B.Cu plane fragments join
if not any((not z.GetIsRuleArea()) and z.GetLayer() == pcbnew.F_Cu for z in b.Zones()):
    z = pcbnew.ZONE(b); z.SetLayer(pcbnew.F_Cu); z.SetNetCode(gcode)
    o = z.Outline(); o.NewOutline()
    for (x, y) in ((EX0 + 0.4, EY0 + 0.4), (EX1 - 0.4, EY0 + 0.4), (EX1 - 0.4, EY1 - 0.4), (EX0 + 0.4, EY1 - 0.4)):
        o.Append(MM(x), MM(y))
    z.SetMinThickness(MM(0.25)); z.SetLocalClearance(MM(0.25)); z.SetAssignedPriority(0)
    z.SetThermalReliefGap(MM(0.25)); z.SetThermalReliefSpokeWidth(MM(0.4)); z.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL)
    z.SetIslandRemovalMode(pcbnew.ISLAND_REMOVAL_MODE_ALWAYS)
    b.Add(z)
ng = 0
BOX = [float(v) for v in os.environ["BOX"].split(",")] if os.environ.get("BOX") else None
if BOX:
    EX0, EY0, EX1, EY1 = BOX[0] - 2.0, BOX[1] - 2.0, BOX[2] + 1.5, BOX[3] + 1.5
STEP = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
yy = EY0 + (float(sys.argv[3]) if len(sys.argv) > 3 else 2.0)
while yy < EY1 - 1.5:
    xx = EX0 + 2.0
    while xx < EX1 - 1.5:
        if via_ok(xx, yy):
            add_via(xx, yy); ng += 1
        xx += STEP
    yy += STEP
print("grid vias", ng)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(pcb, b)
print("saved")
