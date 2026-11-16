# Remove stage-A tracks of every net that touches an IC (ref U*) pin, so the next routing
# stage can route those nets on both layers. Writes <board>.stageA2.kicad_pcb.
# Usage: python rip_ic.py handset|robot
import os, sys, shutil, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
base = os.path.join(ROOT, "kicad", n, "mobot-%s" % n)
b = pcbnew.LoadBoard(base + ".stageA.kicad_pcb")
nets = set()
for fp in b.GetFootprints():
    if fp.GetReference().startswith("U"):
        for pd in fp.Pads():
            nets.add(pd.GetNetCode())
k = 0
for t in list(b.GetTracks()):
    if t.GetNetCode() in nets:
        b.Remove(t); k += 1
pcbnew.SaveBoard(base + ".stageA2.kicad_pcb", b)
shutil.copyfile(base + ".kicad_pro", base + ".stageA2.kicad_pro")
print("ripped IC-net tracks", k)
