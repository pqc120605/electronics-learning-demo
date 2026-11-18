# Remove vias at given coordinates (mm), refill zones. Usage: rm_via.py name x,y [x,y ...]
import os, sys, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
pcb = os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n)
b = pcbnew.LoadBoard(pcb)
pts = [tuple(float(v) for v in a.split(",")) for a in sys.argv[2:]]
k = 0
for t in list(b.GetTracks()):
    if t.GetClass() == "PCB_VIA":
        p = t.GetPosition()
        for (x, y) in pts:
            if abs(pcbnew.ToMM(p.x) - x) < 0.02 and abs(pcbnew.ToMM(p.y) - y) < 0.02:
                b.Remove(t); k += 1
print("removed", k)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(pcb, b)
