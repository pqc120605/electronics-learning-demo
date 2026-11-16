# Dump copper items inside a box. Usage: dump_box.py name x0 y0 x1 y1
import os, sys, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]; x0, y0, x1, y1 = [float(v) for v in sys.argv[2:6]]
b = pcbnew.LoadBoard(os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n))
T = pcbnew.ToMM
def inb(p):
    return x0 <= T(p.x) <= x1 and y0 <= T(p.y) <= y1
for t in b.GetTracks():
    if t.GetClass() == "PCB_VIA":
        if inb(t.GetPosition()):
            print("VIA %-10s (%.2f,%.2f)" % (t.GetNetname(), T(t.GetPosition().x), T(t.GetPosition().y)))
    elif inb(t.GetStart()) or inb(t.GetEnd()):
        s, e = t.GetStart(), t.GetEnd()
        print("%s %-10s (%.2f,%.2f)-(%.2f,%.2f) w%.2f" % (b.GetLayerName(t.GetLayer())[0], t.GetNetname(), T(s.x), T(s.y), T(e.x), T(e.y), T(t.GetWidth())))
for fp in b.GetFootprints():
    for p in fp.Pads():
        if inb(p.GetPosition()):
            bb = p.GetBoundingBox()
            print("PAD %s.%s %-10s (%.2f,%.2f)-(%.2f,%.2f) %s" % (fp.GetReference(), p.GetNumber(), p.GetNetname(), T(bb.GetLeft()), T(bb.GetTop()), T(bb.GetRight()), T(bb.GetBottom()), "TH" if p.HasHole() else "smd"))
