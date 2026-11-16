# -*- coding: utf-8 -*-
"""r5: noi tay mot moi ho sau Freerouting bang F.Cu stub -> via -> B.Cu -> (via -> F.Cu stub | pad THT).
Tim duong ngan nhat thoa khoang ho >= CLR voi moi track/via/pad khac net va vung cam B.Cu duoi EP.
Usage: python.exe connect_patch.py robot NET REF_A PAD_A REF_B PAD_B [--drop-dangling X,Y ...]
Ket qua phai kiem lai bang DRC; script chi in duong da them."""
import sys, os, math, importlib
import pcbnew
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
M, F = pcbnew.ToMM, pcbnew.FromMM
CLR, TW, VD = 0.2, 0.3, 0.6
name, net, ra, pa, rb, pb = sys.argv[1:7]
path = os.path.join(os.path.dirname(HERE), name, "mobot-%s.kicad_pcb" % name)
D = importlib.import_module("design_" + name).DESIGN
W, H = D["size"]
b = pcbnew.LoadBoard(path)

# --drop-dangling: xoa doan track co mot dau tai (x,y)
drops = [tuple(map(float, a.split(","))) for a in sys.argv[7:] if "," in a and not a.startswith("--")]
if drops:
    dead = []
    for t in b.GetTracks():
        if t.Type() != pcbnew.PCB_TRACE_T:
            continue
        for (x, y) in drops:
            for p in (t.GetStart(), t.GetEnd()):
                if abs(M(p.x) - x) < 0.01 and abs(M(p.y) - y) < 0.01:
                    if all(t is not d for d in dead):
                        dead.append(t)
    for t in dead:
        b.Remove(t)
    print("dropped", len(dead))
    pcbnew.SaveBoard(path, b); b = pcbnew.LoadBoard(path)

nc = b.FindNet("/" + net).GetNetCode()
LAY = {"F": pcbnew.F_Cu, "B": pcbnew.B_Cu}
obs = {"F": [], "B": []}       # ('seg', x0,y0,x1,y1, halfw) | ('rect', x0,y0,x1,y1)
for t in b.GetTracks():
    if t.GetNetCode() == nc:
        continue
    if t.Type() == pcbnew.PCB_VIA_T:
        c = t.GetPosition(); r = M(t.GetWidth(pcbnew.F_Cu)) / 2
        for k in obs:
            obs[k].append(("seg", M(c.x), M(c.y), M(c.x), M(c.y), r))
    else:
        k = "F" if t.GetLayer() == pcbnew.F_Cu else "B"
        s, e = t.GetStart(), t.GetEnd()
        obs[k].append(("seg", M(s.x), M(s.y), M(e.x), M(e.y), M(t.GetWidth()) / 2))
pads = {}
for f in b.GetFootprints():
    for p in f.Pads():
        pads[(f.GetReference(), p.GetNumber())] = p
        if p.GetNetCode() == nc and p.GetNetCode() > 0:
            continue
        bb = p.GetBoundingBox(); R = (M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom()))
        for k in obs:
            if p.IsOnLayer(LAY[k]):
                obs[k].append(("rect",) + R)
for (x0, y0, x1, y1) in D.get("b_track_keepout", []):
    obs["B"].append(("rect", x0, y0, x1, y1))


def pt_seg(px, py, x0, y0, x1, y1):
    dx, dy = x1 - x0, y1 - y0; L = dx * dx + dy * dy
    u = 0 if L == 0 else max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / L))
    return math.hypot(px - x0 - u * dx, py - y0 - u * dy)


def pt_rect(px, py, x0, y0, x1, y1):
    return math.hypot(max(x0 - px, 0, px - x1), max(y0 - py, 0, py - y1))


def clear(k, x0, y0, x1, y1, half):
    if min(x0, x1) < 0.5 + half or min(y0, y1) < 0.5 + half or max(x0, x1) > W - 0.5 - half or max(y0, y1) > H - 0.5 - half:
        return False
    n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 0.05))
    pts = [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]
    for o in obs[k]:
        if o[0] == "seg":
            lim = half + o[5] + CLR
            if min(pt_seg(px, py, *o[1:5]) for (px, py) in pts) < lim:
                return False
        else:
            lim = half + CLR
            if min(pt_rect(px, py, *o[1:5]) for (px, py) in pts) < lim:
                return False
    return True


def ends(ref, num):
    """Diem vao lop B: tam pad THT, hoac via o cuoi stub F.Cu tu pad SMD."""
    p = pads[(ref, num)]; c = p.GetPosition(); cx, cy = M(c.x), M(c.y)
    if p.IsOnLayer(pcbnew.B_Cu):
        return [(0.0, cx, cy, None)]
    out = []
    for a in range(0, 360, 45):
        ux, uy = math.cos(math.radians(a)), math.sin(math.radians(a))
        for i in range(6, 31):
            L = i * 0.1; vx, vy = cx + ux * L, cy + uy * L
            if not clear("F", cx, cy, vx, vy, TW / 2):
                break
            if clear("F", vx, vy, vx, vy, VD / 2) and clear("B", vx, vy, vx, vy, VD / 2):
                out.append((L + 1.0, vx, vy, (cx, cy)))
                break
    return sorted(out)[:40]


FROM = [tuple(map(float, x.split("=")[1].split(","))) for x in sys.argv if x.startswith("--from=")]
A, B = ends(ra, pa), ends(rb, pb)
best = None
# 1) thu duong chi tren F.Cu (thang / L / 45 do) tu diem --from= hoac tam pad A toi tam pad B
pa_ = pads[(ra, pa)].GetPosition(); pb_ = pads[(rb, pb)].GetPosition()
sx, sy = FROM[0] if FROM else (M(pa_.x), M(pa_.y)); tx, ty = M(pb_.x), M(pb_.y)
d = min(abs(tx - sx), abs(ty - sy)); sgx = 1 if tx > sx else -1; sgy = 1 if ty > sy else -1
for mid in ([], [(tx, sy)], [(sx, ty)], [(sx + sgx * d, sy + sgy * d)], [(tx - sgx * d, sy)], [(sx, ty - sgy * d)]):
    pts = [(sx, sy)] + mid + [(tx, ty)]
    if all(clear("F", *pts[i], *pts[i + 1], TW / 2) for i in range(len(pts) - 1)):
        L = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
        if best is None or L < best[0]:
            best = (L, None, None, pts, "F")
if best:
    L, _, _, pts, _ = best
    ni = b.FindNet("/" + net)
    for i in range(len(pts) - 1):
        t = pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(F(pts[i][0]), F(pts[i][1]))); t.SetEnd(pcbnew.VECTOR2I(F(pts[i + 1][0]), F(pts[i + 1][1])))
        t.SetWidth(F(TW)); t.SetLayer(pcbnew.F_Cu); t.SetNet(ni); b.Add(t)
    pcbnew.ZONE_FILLER(b).Fill(b.Zones()); pcbnew.SaveBoard(path, b)
    print("patched %s F.Cu only len %.2f mm: %s" % (net, L, [(round(x, 2), round(y, 2)) for x, y in pts]))
    sys.exit(0)
if FROM:
    A = [(0.0, FROM[0][0], FROM[0][1], None)] if False else A
for (ca, ax, ay, sa) in A:
    for (cb, bx, by, sb) in B:
        for mid in ([], [(bx, ay)], [(ax, by)]):
            pts = [(ax, ay)] + mid + [(bx, by)]
            if all(clear("B", *pts[i], *pts[i + 1], TW / 2) for i in range(len(pts) - 1)):
                L = ca + cb + sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
                if best is None or L < best[0]:
                    best = (L, sa, sb, pts)
if best is None:
    raise SystemExit("KHONG tim duoc duong cho %s (%d diem A, %d diem B)" % (net, len(A), len(B)))
L, sa, sb, pts = best
ni = b.FindNet("/" + net)


def seg(k, x0, y0, x1, y1):
    t = pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(F(x0), F(y0))); t.SetEnd(pcbnew.VECTOR2I(F(x1), F(y1)))
    t.SetWidth(F(TW)); t.SetLayer(LAY[k]); t.SetNet(ni); b.Add(t)


def via(x, y):
    v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(F(x), F(y))); v.SetViaType(pcbnew.VIATYPE_THROUGH)
    v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu); v.SetWidth(pcbnew.F_Cu, F(VD)); v.SetDrill(F(0.3)); v.SetNet(ni); b.Add(v)
for (s, (x, y)) in ((sa, pts[0]), (sb, pts[-1])):
    if s:
        seg("F", s[0], s[1], x, y); via(x, y)
for i in range(len(pts) - 1):
    seg("B", *pts[i], *pts[i + 1])
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(path, b)
print("patched %s len %.2f mm: stubA=%s stubB=%s B.Cu=%s" % (net, L, sa, sb, [(round(x, 2), round(y, 2)) for x, y in pts]))
