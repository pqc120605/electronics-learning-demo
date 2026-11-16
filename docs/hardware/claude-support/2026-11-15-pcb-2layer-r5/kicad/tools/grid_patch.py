# -*- coding: utf-8 -*-
"""r5: noi mot moi ho bang A* hai lop tren luoi 0,05 mm trong cua so quanh hai dau.
Uu tien F.Cu; doi lop qua via 0,6/0,3 mm (phat 4 mm). Kiem khoang ho CLR voi track/via/pad khac net,
vung cam B.Cu duoi EP va mep bo. Usage:
  python.exe grid_patch.py robot NET (REF:PAD | x,y) (REF:PAD) [--w=0.3]
Ket qua phai kiem bang DRC."""
import sys, os, math, heapq, importlib
import numpy as np
import pcbnew
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
M, F = pcbnew.ToMM, pcbnew.FromMM
G, VD, VIA_COST = 0.05, 0.6, 4.0
name, net, sa, sb = sys.argv[1:5]
TW = float(([a.split("=")[1] for a in sys.argv if a.startswith("--w=")] or ["0.3"])[0])
CLR = float(([a.split("=")[1] for a in sys.argv if a.startswith("--clr=")] or ["0.18"])[0])
path = os.path.join(os.path.dirname(HERE), name, "mobot-%s.kicad_pcb" % name)
D = importlib.import_module("design_" + name).DESIGN
W, H = D["size"]
b = pcbnew.LoadBoard(path)
nc = b.FindNet("/" + net).GetNetCode()
pads = {(f.GetReference(), p.GetNumber()): p for f in b.GetFootprints() for p in f.Pads()}


def endpoint(s):
    if ":" in s:
        p = pads[tuple(s.split(":"))]; c = p.GetPosition()
        return M(c.x), M(c.y), [k for k, L in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)) if p.IsOnLayer(L)]
    x, y = map(float, s.split(",")); return x, y, [0]
ax, ay, al = endpoint(sa); bx, by, bl = endpoint(sb)
x0, y0 = max(0.5, min(ax, bx) - 5), max(0.5, min(ay, by) - 5)
x1, y1 = min(W - 0.5, max(ax, bx) + 5), min(H - 0.5, max(ay, by) + 5)
nx, ny = int((x1 - x0) / G) + 1, int((y1 - y0) / G) + 1
X = x0 + np.arange(nx) * G; Y = y0 + np.arange(ny) * G
XX, YY = np.meshgrid(X, Y)
# blocked[l]: tam track (nua rong TW) khong duoc vao; vblock: tam via khong duoc vao
blocked = [np.zeros((ny, nx), bool), np.zeros((ny, nx), bool)]
vblock = np.zeros((ny, nx), bool)


def mark_seg(l, sx, sy, ex, ey, half):
    for (arr, r) in ((blocked[l], half + TW / 2 + CLR), (vblock, half + VD / 2 + CLR)):
        dx, dy = ex - sx, ey - sy; L = dx * dx + dy * dy
        u = np.zeros_like(XX) if L == 0 else np.clip(((XX - sx) * dx + (YY - sy) * dy) / L, 0, 1)
        arr |= np.hypot(XX - sx - u * dx, YY - sy - u * dy) < r


def mark_rect(l, rx0, ry0, rx1, ry1, extra=0.0):
    for (arr, r) in ((blocked[l], TW / 2 + CLR + extra), (vblock, VD / 2 + CLR + extra)):
        dxm = np.maximum(np.maximum(rx0 - XX, 0), XX - rx1); dym = np.maximum(np.maximum(ry0 - YY, 0), YY - ry1)
        arr |= np.hypot(dxm, dym) < r
for t in b.GetTracks():
    if t.GetNetCode() == nc:
        continue
    if t.Type() == pcbnew.PCB_VIA_T:
        c = t.GetPosition(); r = M(t.GetWidth(pcbnew.F_Cu)) / 2
        for l in (0, 1):
            mark_seg(l, M(c.x), M(c.y), M(c.x), M(c.y), r)
    else:
        s, e = t.GetStart(), t.GetEnd()
        mark_seg(0 if t.GetLayer() == pcbnew.F_Cu else 1, M(s.x), M(s.y), M(e.x), M(e.y), M(t.GetWidth()) / 2)
for p in pads.values():
    if p.GetNetCode() == nc:
        continue
    bb = p.GetBoundingBox()
    for l, L in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)):
        if p.IsOnLayer(L):
            mark_rect(l, M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom()))
for (kx0, ky0, kx1, ky1) in D.get("b_track_keepout", []):
    mark_rect(1, kx0, ky0, kx1, ky1, extra=-CLR)


def cell(x, y):
    return int(round((y - y0) / G)), int(round((x - x0) / G))
sj, si = cell(ax, ay); gj, gi = cell(bx, by)
for (s_, j, i, ls) in ((sa, sj, si, al), (sb, gj, gi, bl)):   # chi mo o tam pad cung net (diem toa do: khong mo)
    for l in ls:
        blocked[l][j, i] = False
D8 = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
goal = {(l, gj, gi) for l in bl}
starts = [(l, sj, si) for l in al]
dist = {s: 0.0 for s in starts}; prev = {}
pq = [(math.hypot(bx - ax, by - ay), 0.0, s) for s in starts]; heapq.heapify(pq)
found = None
while pq:
    f_, g_, s = heapq.heappop(pq)
    if s in goal:
        found = s; break
    if g_ > dist.get(s, 1e18):
        continue
    l, j, i = s
    nbr = []
    for (dj, di) in D8:
        jj, ii = j + dj, i + di
        if 0 <= jj < ny and 0 <= ii < nx and not blocked[l][jj, ii]:
            nbr.append(((l, jj, ii), G * math.hypot(dj, di) * (1.0 if l == 0 else 1.6)))
    if not vblock[j, i] and not blocked[1 - l][j, i]:
        nbr.append(((1 - l, j, i), VIA_COST))
    for (n_, c) in nbr:
        ng = g_ + c
        if ng < dist.get(n_, 1e18):
            dist[n_] = ng; prev[n_] = s
            h = G * math.hypot(n_[1] - gj, n_[2] - gi)
            heapq.heappush(pq, (ng + h, ng, n_))
if not found:
    raise SystemExit("KHONG tim duoc duong cho %s" % net)
seq = [found]
while seq[-1] in prev:
    seq.append(prev[seq[-1]])
seq.reverse()
ni = b.FindNet("/" + net)
pts = [(x0 + s[2] * G, y0 + s[1] * G, s[0]) for s in seq]
pts[0] = (ax, ay, pts[0][2]); pts[-1] = (bx, by, pts[-1][2])
# lam muot: tren moi lop, noi thang toi diem xa nhat con "nhin thay" tren luoi (khong cat o bi chan)
def visible(l, p, q):
    n_ = max(1, int(math.hypot(q[0] - p[0], q[1] - p[1]) / (G / 2)))
    for k in range(n_ + 1):
        x = p[0] + (q[0] - p[0]) * k / n_; y = p[1] + (q[1] - p[1]) * k / n_
        j, i = cell(x, y)
        if blocked[l][j, i] and not (k in (0, n_)):
            return False
    return True
sm = [pts[0]]; k = 0
while k < len(pts) - 1:
    nxt = k + 1
    for m in range(len(pts) - 1, k, -1):
        if all(pts[t][2] == pts[k][2] for t in range(k, m + 1)) and visible(pts[k][2], pts[k], pts[m]):
            nxt = m; break
    sm.append(pts[nxt]); k = nxt
pts = sm
# gom doan thang cung huong, them via tai cho doi lop
segs, vias = [], []
cur = [pts[0]]
for p in pts[1:]:
    q = cur[-1]
    if p[2] != q[2]:
        vias.append((q[0], q[1])); segs.append(cur); cur = [(q[0], q[1], p[2]), p]; continue
    if len(cur) >= 2:
        d1 = (round((cur[-1][0] - cur[-2][0]) / G), round((cur[-1][1] - cur[-2][1]) / G))
        d2 = (round((p[0] - q[0]) / G), round((p[1] - q[1]) / G))
        if d1 == d2:
            cur[-1] = p; continue
    cur.append(p)
segs.append(cur)
n = 0
for sg in segs:
    for (a, c) in zip(sg, sg[1:]):
        if abs(a[0] - c[0]) < 1e-6 and abs(a[1] - c[1]) < 1e-6:
            continue
        t = pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(F(a[0]), F(a[1]))); t.SetEnd(pcbnew.VECTOR2I(F(c[0]), F(c[1])))
        t.SetWidth(F(TW)); t.SetLayer(pcbnew.F_Cu if a[2] == 0 else pcbnew.B_Cu); t.SetNet(ni); b.Add(t); n += 1
for (x, y) in vias:
    v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(F(x), F(y))); v.SetViaType(pcbnew.VIATYPE_THROUGH)
    v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu); v.SetWidth(pcbnew.F_Cu, F(VD)); v.SetDrill(F(0.3)); v.SetNet(ni); b.Add(v)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(path, b)
L = sum(math.hypot(c[0] - a[0], c[1] - a[1]) for sg in segs for a, c in zip(sg, sg[1:]))
print("patched %s: %d doan, %d via, dai %.2f mm, rong %.2f mm" % (net, n, len(vias), L, TW))
