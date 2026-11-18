# Remove stage-A tracks of every net that touches an IC (ref U*) pin, so the next routing
# stage can route those nets on both layers. Writes <board>.stageA2.kicad_pcb.
# Usage: python rip_ic.py handset|robot
import os, sys, shutil, pcbnew
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import preroute
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
base = os.path.join(ROOT, "kicad", n, "mobot-%s" % n)
b = pcbnew.LoadBoard(base + ".stageA.kicad_pcb")
nets = set()
for fp in b.GetFootprints():
    if fp.GetReference().startswith("U"):
        for pd in fp.Pads():
            nets.add(pd.GetNetCode())
keys = preroute.load_keys(os.path.dirname(base))   # r6: khong go cac doan di tay truoc

def kept(t):
    k_ = preroute.key_of(t)
    return k_ in keys or (k_[0] != "V" and (k_[0], k_[3], k_[4], k_[1], k_[2]) in keys)
k = 0; kk = 0
for t in list(b.GetTracks()):
    if t.GetNetCode() in nets:
        if kept(t):
            kk += 1; continue
        b.Remove(t); k += 1
print("kept prerouted", kk)
pcbnew.SaveBoard(base + ".stageA2.kicad_pcb", b)
shutil.copyfile(base + ".kicad_pro", base + ".stageA2.kicad_pro")
print("ripped IC-net tracks", k)
