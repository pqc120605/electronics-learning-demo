# -*- coding: utf-8 -*-
"""r6 robot: sua cum U7 sau route. Buoc 'rip': go net BTST va chuoi VBAT_PROT quet duoi chan 11-12 (chan duong REGN).
Buoc 'route': di lai REGN, BTST, C6 bang preroute._route (A*, khe ho 0,19 mm, cho phep via). Chay: rip roi route (2 tien trinh)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pcbnew, preroute, importlib
M = pcbnew.ToMM
pcb = os.path.join(os.path.dirname(HERE), "robot", "mobot-robot.kicad_pcb")
b = pcbnew.LoadBoard(pcb)
if sys.argv[1] == "rip":
    CHAIN = [((13.0, 58.95), (12.7, 60.3)), ((12.7, 60.3), (11.85, 61.15)), ((11.85, 61.15), (11.5, 61.3))]
    dead = []
    for t in b.GetTracks():
        n = t.GetNetname().lstrip("/")
        if n in ("BTST", "REGN"):
            dead.append(t); continue
        if n == "VBAT_PROT" and t.Type() == pcbnew.PCB_TRACE_T:
            s, e = (M(t.GetStart().x), M(t.GetStart().y)), (M(t.GetEnd().x), M(t.GetEnd().y))
            for (a, c) in CHAIN:
                if all(abs(u - v) < 0.02 for u, v in zip(s + e, a + c)) or all(abs(u - v) < 0.02 for u, v in zip(e + s, a + c)):
                    dead.append(t)
    for t in dead:
        b.Remove(t)
    pcbnew.SaveBoard(pcb, b)
    print("ripped", len(dead))
else:
    D = importlib.import_module("design_robot").DESIGN
    for (net, a, c, w) in (("REGN", "U7:11", "C8:1", 0.25), ("BTST", "U7:12", "C7:1", 0.25), ("VBAT_PROT", "C6:1", "U7:13", 0.25)):
        added, msg = preroute._route(b, D, net, a, c, w, "FB")
        print(net, a, "->", c, msg)
    pcbnew.ZONE_FILLER(b).Fill(b.Zones())
    pcbnew.SaveBoard(pcb, b)
