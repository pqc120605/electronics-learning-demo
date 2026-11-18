# -*- coding: utf-8 -*-
"""r5: go track cua cac net chi dinh, roi doi mot linh kien toi vi tri trong gan nhat trong hop cho truoc
(pad cach dong khac net >= CLR, courtyard khong chong). Usage:
  python.exe move_part.py robot REF x0,y0,x1,y1 --rip=NET1,NET2"""
import sys, os, math, pcbnew
HERE = os.path.dirname(os.path.abspath(__file__))
M, F = pcbnew.ToMM, pcbnew.FromMM
CLR = 0.2
name, ref, box = sys.argv[1:4]
rip = ([a.split("=")[1].split(",") for a in sys.argv if a.startswith("--rip=")] or [[]])[0]
bx0, by0, bx1, by1 = map(float, box.split(","))
path = os.path.join(os.path.dirname(HERE), name, "mobot-%s.kicad_pcb" % name)
b = pcbnew.LoadBoard(path)
dead = [t for t in b.GetTracks() if t.GetNetname().lstrip("/") in rip]
for t in dead:
    b.Remove(t)
pcbnew.SaveBoard(path, b); b = pcbnew.LoadBoard(path)
print("ripped", len(dead))
fp = b.FindFootprintByReference(ref)
mynets = {p.GetNetCode() for p in fp.Pads()}
segs = []
for t in b.GetTracks():
    if t.GetNetCode() in mynets:
        continue
    if t.Type() == pcbnew.PCB_VIA_T:
        c = t.GetPosition(); segs.append((M(c.x), M(c.y), M(c.x), M(c.y), M(t.GetWidth(pcbnew.F_Cu)) / 2, True))
    elif t.GetLayer() == pcbnew.F_Cu:
        s, e = t.GetStart(), t.GetEnd(); segs.append((M(s.x), M(s.y), M(e.x), M(e.y), M(t.GetWidth()) / 2, False))
rects, crts = [], []
for f in b.GetFootprints():
    if f.GetReference() == ref:
        continue
    for p in f.Pads():
        if p.IsOnLayer(pcbnew.F_Cu) and p.GetNetCode() not in mynets | {0} or (p.IsOnLayer(pcbnew.F_Cu) and p.GetNetCode() == 0):
            bb = p.GetBoundingBox(); rects.append((M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom())))
    cy = f.GetCourtyard(pcbnew.F_CrtYd).BBox()
    if cy.GetWidth() > 0:
        crts.append((M(cy.GetLeft()), M(cy.GetTop()), M(cy.GetRight()), M(cy.GetBottom())))


def ps(px, py, s):
    x0, y0, x1, y1 = s[:4]; dx, dy = x1 - x0, y1 - y0; L = dx * dx + dy * dy
    u = 0 if L == 0 else max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / L))
    return math.hypot(px - x0 - u * dx, py - y0 - u * dy)


def rr(a, c):
    return math.hypot(max(c[0] - a[2], 0, a[0] - c[2]), max(c[1] - a[3], 0, a[1] - c[3]))
best = None
cx0, cy0 = (bx0 + bx1) / 2, (by0 + by1) / 2
for rot in (0, 90, 180, 270):
    fp.SetOrientationDegrees(rot)
    x = bx0
    while x <= bx1:
        y = by0
        while y <= by1:
            fp.SetPosition(pcbnew.VECTOR2I(F(x), F(y)))
            ok = True
            for p in fp.Pads():
                bb = p.GetBoundingBox(); R = (M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom()))
                # mau diem tren bien pad de do khoang cach toi track
                pts = [(R[0] + (R[2] - R[0]) * i / 4, R[1] + (R[3] - R[1]) * j / 4) for i in range(5) for j in range(5)]
                if any(min(ps(px, py, s) for px, py in pts) < s[4] + CLR for s in segs) or any(rr(R, c) < CLR for c in rects):
                    ok = False; break
            if ok:
                fp.BuildCourtyardCaches(); cyb = fp.GetCourtyard(pcbnew.F_CrtYd).BBox()
                C = (M(cyb.GetLeft()), M(cyb.GetTop()), M(cyb.GetRight()), M(cyb.GetBottom()))
                if any(C[0] < c[2] and C[2] > c[0] and C[1] < c[3] and C[3] > c[1] for c in crts):
                    ok = False
            if ok:
                d = math.hypot(x - cx0, y - cy0)
                if best is None or d < best[0]:
                    best = (d, x, y, rot)
            y += 0.25
        x += 0.25
if best is None:
    raise SystemExit("KHONG co cho trong cho %s trong %s" % (ref, box))
fp.SetOrientationDegrees(best[3]); fp.SetPosition(pcbnew.VECTOR2I(F(best[1]), F(best[2])))
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(path, b)
print("moved %s -> (%.2f, %.2f) rot %d" % (ref, best[1], best[2], best[3]))
