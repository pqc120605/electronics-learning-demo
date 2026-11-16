# -*- coding: utf-8 -*-
"""r5 robot: di lai tay MA2 va doan ISEN_B quanh U6 (DRV8833) de mo lane y=25,68 cho MB2 (U6.5).
Toa do lay tu ban route ngay 15/11 (Freerouting + hand_patch). Chay truoc connect_patch.py MB2."""
import os, pcbnew
HERE = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(os.path.dirname(HERE), "robot", "mobot-robot.kicad_pcb")
M, F = pcbnew.ToMM, pcbnew.FromMM
RIP = [  # (net, layer, x0, y0, x1, y1) — chi MA2; ISEN_B giu nguyen (via 83,17;25,34 nam giua hai pad R27)
    ("MA2", "F", 81.56, 26.37, 81.95, 25.98), ("MA2", "F", 81.95, 25.98, 85.08, 25.98), ("MA2", "F", 87.1, 28.0, 85.08, 25.98),
    ("MA2", "F", 80.91, 26.37, 80.86, 26.32), ("MA2", "F", 81.56, 26.37, 80.91, 26.37),
]
ADD = [  # (net, layer, width, points)
    # MA2 ha xuong y=26,32 (0,3 mm): cach pad1 R27 (y>=26,65) 0,18 mm
    ("MA2", "F", 0.3, [(80.86, 26.32), (85.4, 26.32), (87.1, 28.0)]),
    # MB2 (U6.5) luon giua via ISEN_B (day 25,64) va MA2 (dinh 26,17): tam y=25,905, rong 0,2 mm -> khe 0,165 mm moi ben
    ("MB2", "F", 0.2, [(80.86, 25.68), (81.9, 25.68), (82.125, 25.905), (85.0, 25.905)]),
]
VIAS = []
b = pcbnew.LoadBoard(path)
dead = []
for t in b.GetTracks():
    if t.Type() != pcbnew.PCB_TRACE_T and t.Type() != pcbnew.PCB_VIA_T:
        continue
    n = t.GetNetname().lstrip("/")
    if t.Type() == pcbnew.PCB_VIA_T:
        c = t.GetPosition()
        continue
    L = "F" if t.GetLayer() == pcbnew.F_Cu else "B"
    s, e = (M(t.GetStart().x), M(t.GetStart().y)), (M(t.GetEnd().x), M(t.GetEnd().y))
    for (rn, rl, x0, y0, x1, y1) in RIP:
        if rn == n and rl == L:
            for (p, q) in ((s, e), (e, s)):
                if abs(p[0] - x0) < 0.02 and abs(p[1] - y0) < 0.02 and abs(q[0] - x1) < 0.02 and abs(q[1] - y1) < 0.02:
                    dead.append(t)
print("rip", len(dead), "/", len(RIP))
for t in dead:
    b.Remove(t)
pcbnew.SaveBoard(path, b); b = pcbnew.LoadBoard(path)
have = {(round(M(t.GetPosition().x), 2), round(M(t.GetPosition().y), 2)) for t in b.GetTracks() if t.Type() == pcbnew.PCB_VIA_T}
for (net, lay, w, pts) in ADD:
    ni = b.FindNet("/" + net)
    for (a, c) in zip(pts, pts[1:]):
        t = pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(F(a[0]), F(a[1]))); t.SetEnd(pcbnew.VECTOR2I(F(c[0]), F(c[1])))
        t.SetWidth(F(w)); t.SetLayer(pcbnew.F_Cu if lay == "F" else pcbnew.B_Cu); t.SetNet(ni); b.Add(t)
for (net, x, y) in VIAS:
    if (round(x, 2), round(y, 2)) in have:
        continue
    v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(F(x), F(y))); v.SetViaType(pcbnew.VIATYPE_THROUGH)
    v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu); v.SetWidth(pcbnew.F_Cu, F(0.6)); v.SetDrill(F(0.3)); v.SetNet(b.FindNet("/" + net)); b.Add(v)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(path, b)
print("done")
