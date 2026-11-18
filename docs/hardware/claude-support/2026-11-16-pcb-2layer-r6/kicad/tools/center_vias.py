# -*- coding: utf-8 -*-
"""r6: chi sua dung cac cap DRC bao track_not_centered_on_via: keo dau track (diem gan via nhat) ve tam via.
Usage: python.exe center_vias.py robot|handset DRC.json"""
import os, sys, json, pcbnew
HERE = os.path.dirname(os.path.abspath(__file__))
n = sys.argv[1]; pcb = os.path.join(os.path.dirname(HERE), n, "mobot-%s.kicad_pcb" % n)
b = pcbnew.LoadBoard(pcb); M = pcbnew.ToMM
d = json.load(open(sys.argv[2], encoding="utf-8"))
k = 0
for v in d["violations"]:
    if v["type"] != "track_not_centered_on_via":
        continue
    tr = [i for i in v["items"] if i["description"].startswith("Track")][0]
    vi = [i for i in v["items"] if i["description"].startswith("Via")][0]
    vx, vy = vi["pos"]["x"], vi["pos"]["y"]
    for t in b.GetTracks():
        if t.Type() != pcbnew.PCB_TRACE_T or not tr["description"].split(" on ")[0].endswith("[" + t.GetNetname() + "]"):
            continue
        for get, setf in ((t.GetStart, t.SetStart), (t.GetEnd, t.SetEnd)):
            p = get(); dd = ((M(p.x) - vx) ** 2 + (M(p.y) - vy) ** 2) ** 0.5
            if 1e-4 < dd < 0.3 and (abs(M(t.GetStart().x) - tr["pos"]["x"]) < 0.002 and abs(M(t.GetStart().y) - tr["pos"]["y"]) < 0.002):
                setf(pcbnew.VECTOR2I(pcbnew.FromMM(vx), pcbnew.FromMM(vy))); k += 1
pcbnew.ZONE_FILLER(b).Fill(b.Zones()); pcbnew.SaveBoard(pcb, b)
print("centered", k)
