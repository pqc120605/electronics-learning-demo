# Set island removal on every copper zone, refill. Usage: zone_islands.py name
import os, sys, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
pcb = os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n)
b = pcbnew.LoadBoard(pcb)
for z in b.Zones():
    if not z.GetIsRuleArea():
        z.SetIslandRemovalMode(pcbnew.ISLAND_REMOVAL_MODE_ALWAYS)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(pcb, b)
print("ok")
