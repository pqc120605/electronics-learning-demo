# List filled-polygon fragments of copper zones with bbox and area. Usage: zone_frag.py name
import os, sys, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
b = pcbnew.LoadBoard(os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n))
T = pcbnew.ToMM
for z in b.Zones():
    if z.GetIsRuleArea():
        continue
    lay = z.GetLayer()
    ps = z.GetFilledPolysList(lay)
    print(b.GetLayerName(lay), "fragments", ps.OutlineCount())
    for i in range(ps.OutlineCount()):
        o = ps.Outline(i); bb = o.BBox()
        a = abs(o.Area()) / 1e12
        if a < 60:
            print("  %.1f mm2 (%.2f,%.2f)-(%.2f,%.2f)" % (a, T(bb.GetLeft()), T(bb.GetTop()), T(bb.GetRight()), T(bb.GetBottom())))
