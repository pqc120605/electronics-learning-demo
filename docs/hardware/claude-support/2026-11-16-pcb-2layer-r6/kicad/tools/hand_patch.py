# -*- coding: utf-8 -*-
"""r5: doan noi tay sau Freerouting cho cac chan pitch nho router bo sot. Usage: python.exe hand_patch.py handset|robot
Moi doan ghi ro net, lop, toa do (mm). Chay lai sau moi lan route.sh; kiem bang DRC."""
import sys, os, pcbnew
HERE = os.path.dirname(os.path.abspath(__file__))
PATCH = {
    "handset": [],  # r6: LX1/LX2 da di tay o preroute.py
    "robot": [],
}
n = sys.argv[1]
path = os.path.join(os.path.dirname(HERE), n, "mobot-%s.kicad_pcb" % n)
b = pcbnew.LoadBoard(path)
dead = [t for t in b.GetTracks() if t.Type() == pcbnew.PCB_TRACE_T and t.GetNetname().lstrip("/") in [x[0] for x in PATCH[n]]]
if dead:
    for t in dead:
        b.Remove(t)
    pcbnew.SaveBoard(path, b)
    b = pcbnew.LoadBoard(path)      # swig track list khong dung duoc sau Remove(): nap lai
for (net, lay, w, pts) in PATCH[n]:
    ni = b.FindNet("/" + net)
    for (a, c) in zip(pts, pts[1:]):
        t = pcbnew.PCB_TRACK(b)
        t.SetStart(pcbnew.VECTOR2I(pcbnew.FromMM(a[0]), pcbnew.FromMM(a[1]))); t.SetEnd(pcbnew.VECTOR2I(pcbnew.FromMM(c[0]), pcbnew.FromMM(c[1])))
        t.SetWidth(pcbnew.FromMM(w)); t.SetLayer(b.GetLayerID(lay)); t.SetNet(ni); b.Add(t)
    print("patched", net, len(pts) - 1, "segments")
# F04: via nhiet trong EP them SAU route (Freerouting/rm_via xoa via tu do). Bo qua via nao cham track/via net khac.
sys.path.insert(0, HERE)
import importlib
D = importlib.import_module("design_" + n).DESIGN
VD, CLR = 0.6, 0.15
others = [t for t in b.GetTracks()]
def seg_d(px, py, t):
    a, c = t.GetStart(), t.GetEnd(); ax, ay, cx, cy = [pcbnew.ToMM(v) for v in (a.x, a.y, c.x, c.y)]
    dx, dy = cx - ax, cy - ay; L = dx * dx + dy * dy
    u = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
    return ((px - ax - u * dx) ** 2 + (py - ay - u * dy) ** 2) ** 0.5
for (ref, padnum, nx, ny, pitch) in D.get("ep_vias", []):
    pd = [x for x in b.FindFootprintByReference(ref).Pads() if x.GetNumber() == padnum][0]
    cx, cy = pcbnew.ToMM(pd.GetPosition().x), pcbnew.ToMM(pd.GetPosition().y)
    ok = 0
    for i in range(nx):
        for j in range(ny):
            x, y = cx + (i - (nx - 1) / 2) * pitch, cy + (j - (ny - 1) / 2) * pitch
            bad = False
            for t in others:
                if t.GetNetCode() == pd.GetNetCode():
                    continue
                w = pcbnew.ToMM(t.GetWidth(pcbnew.F_Cu) if t.Type() == pcbnew.PCB_VIA_T else t.GetWidth())
                if seg_d(x, y, t) < VD / 2 + w / 2 + CLR:
                    bad = True; break
            if bad:
                continue
            v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(pcbnew.FromMM(x), pcbnew.FromMM(y)))
            v.SetViaType(pcbnew.VIATYPE_THROUGH); v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu)
            v.SetWidth(pcbnew.F_Cu, pcbnew.FromMM(VD)); v.SetDrill(pcbnew.FromMM(0.3)); v.SetNet(pd.GetNet()); b.Add(v); ok += 1
    print("ep vias", ref, ok, "/", nx * ny)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(path, b)
