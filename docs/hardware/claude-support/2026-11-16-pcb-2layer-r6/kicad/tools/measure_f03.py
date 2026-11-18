# -*- coding: utf-8 -*-
"""r5: do khoang cach tam pad IC -> tam pad tu cung net cho cac cap trong bang F03 cua review 14/11 (+ F08 shunt)."""
import sys, math, pcbnew
OLD = {"handset": [("U1", "4", "C1", 8.011), ("U1", "1", "C2", 12.314), ("U1", "1", "C3", 4.110), ("U3", "1", "C6", 13.278)],
       "robot": [("U7", "23", "C1", 14.681), ("U7", "21", "C2", 17.401), ("U7", "12", "C7", 13.101), ("U2", "3", "C10", 11.794),
                 ("U2", "6", "C13", 5.871), ("U4", "4", "C14", 8.599), ("U8", "12", "C16", 8.376), ("U8", "3", "C21", 8.813),
                 ("U6", "12", "C26", 5.383), ("U6", "11", "C24", 6.627), ("U6", "3", "R27", 4.384), ("U6", "6", "R28", 8.549)]}
name, path = sys.argv[1], sys.argv[2]
b = pcbnew.LoadBoard(path)
print("| Cap pad | r4 (mm) | r5 (mm) | Ngan hon? |\n|---|---:|---:|---|")
for (ic, pin, c, old) in OLD[name]:
    u = b.FindFootprintByReference(ic); f = b.FindFootprintByReference(c)
    pp = [p for p in u.Pads() if p.GetNumber() == pin][0]
    nets = [p for p in f.Pads() if p.GetNetCode() == pp.GetNetCode()]
    d = min(math.hypot(pcbnew.ToMM(p.GetPosition().x - pp.GetPosition().x), pcbnew.ToMM(p.GetPosition().y - pp.GetPosition().y)) for p in nets)
    print("| %s.%s (%s) -> %s | %.3f | %.3f | %s |" % (ic, pin, pp.GetNetname().lstrip("/"), c, old, d, "co" if d < old else "KHONG"))
