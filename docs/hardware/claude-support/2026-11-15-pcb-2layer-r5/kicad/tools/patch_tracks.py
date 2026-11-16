# Hand patches for what Freerouting and the post-route scripts left open.
# The coordinates are tied to ONE routing result: after any re-route, rerun DRC and redo these.
# Also: deletes zero-length stubs and nudges tracks that miss pad clearance by a hair
# (reads reports/<board>-drc.rpt, so run DRC first).
# Usage: python patch_tracks.py handset|robot
import os, re, sys, math, pcbnew
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
n = sys.argv[1]
pcb = os.path.join(ROOT, "kicad", n, "mobot-%s.kicad_pcb" % n)
rpt = os.path.join(ROOT, "reports", "%s-drc.rpt" % n)
b = pcbnew.LoadBoard(pcb)
MM, T = pcbnew.FromMM, pcbnew.ToMM
PATCH = {
    "handset": {
        # LX1: U1.3 -> L1.1 (2.7 mm). B1: second SW2 pad, jumper on B.Cu because B2 runs between the pads on F.Cu.
        "add": [("/LX1", 0.25, "F", [(33.19, 33.90), (33.95, 33.90), (34.60, 33.25), (35.60, 33.25)]),
                ("/B1", 0.25, "B", [(2.50, 40.00), (9.00, 40.00)])],
        "via": [],
        "del": [("/B1", (7.40, 38.40), (7.40, 31.89)), ("/B1", (9.00, 40.00), (7.40, 38.40))],
    },
    "robot": {"add": [], "via": [], "del": []},   # r4 layout: fill in after routing if DRC needs it
}[n]


def near(p, q, tol=0.02):
    return abs(T(p.x) - q[0]) < tol and abs(T(p.y) - q[1]) < tol


def V(x, y):
    return pcbnew.VECTOR2I(MM(x), MM(y))


# nudge tracks that miss pad clearance by < 0.03 mm, away from the pad
txt = open(rpt, encoding="utf-8", errors="replace").read()
pads = {}
for fp in b.GetFootprints():
    for p in fp.Pads():
        pads[(fp.GetReference(), p.GetNumber())] = p
nudged = set()
ALLT = list(b.GetTracks())
for m in re.finditer(r"\[clearance\][^\n]*actual ([\d.]+) mm\)\n(?:[^\n@]*\n)?\s*@\(([\d.]+) mm, ([\d.]+) mm\): ([^\n]*)\n\s*@\(([\d.]+) mm, ([\d.]+) mm\): ([^\n]*)", txt):
    items = [(float(m.group(2)), float(m.group(3)), m.group(4)), (float(m.group(5)), float(m.group(6)), m.group(7))]
    trk = [i for i in items if i[2].startswith("Track")]; pad = [i for i in items if i[2].startswith("Pad")]
    if len(trk) != 1 or len(pad) != 1 or 0.15 - float(m.group(1)) > 0.03:
        continue
    pm = re.match(r"Pad (\S+) \[[^\]]*\] of (\S+)", pad[0][2])
    p = pads.get((pm.group(2), pm.group(1))) if pm else None
    if p is None:
        continue
    pc = p.GetPosition()
    for t in ALLT:
        if t.GetClass() == "PCB_VIA" or id(t) in nudged:
            continue
        if near(t.GetStart(), trk[0][:2], 0.002):
            if ("[%s]" % t.GetNetname()) not in trk[0][2]:
                continue
            s, e = t.GetStart(), t.GetEnd()
            mx, my = (s.x + e.x) / 2 - pc.x, (s.y + e.y) / 2 - pc.y
            L = math.hypot(mx, my) or 1.0
            dx, dy = int(MM(0.03) * mx / L), int(MM(0.03) * my / L)
            t.SetStart(pcbnew.VECTOR2I(s.x + dx, s.y + dy)); t.SetEnd(pcbnew.VECTOR2I(e.x + dx, e.y + dy))
            nudged.add(id(t)); break
print("nudged", len(nudged))

na = 0
for (net, w, lay, pts) in PATCH["add"]:
    ni = b.FindNet(net)
    for i in range(len(pts) - 1):
        t = pcbnew.PCB_TRACK(b); t.SetStart(V(*pts[i])); t.SetEnd(V(*pts[i + 1]))
        t.SetWidth(MM(w)); t.SetLayer(pcbnew.F_Cu if lay == "F" else pcbnew.B_Cu); t.SetNet(ni); b.Add(t); na += 1
for (net, x, y) in PATCH["via"]:
    v = pcbnew.PCB_VIA(b); v.SetPosition(V(x, y)); v.SetViaType(pcbnew.VIATYPE_THROUGH)
    v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu); v.SetWidth(pcbnew.F_Cu, MM(0.6)); v.SetDrill(MM(0.3))
    v.SetNet(b.FindNet(net)); b.Add(v); na += 1
print("added", na)
# removals last: after BOARD.Remove() the swig lists cannot be iterated again
k = z = 0
for t in ALLT:
    if t.GetClass() == "PCB_VIA":
        continue
    if T(t.GetLength()) < 0.005:
        b.Remove(t); z += 1; continue
    for (net, a, c) in PATCH["del"]:
        if t.GetNetname() == net and ((near(t.GetStart(), a) and near(t.GetEnd(), c)) or (near(t.GetStart(), c) and near(t.GetEnd(), a))):
            b.Remove(t); k += 1
print("deleted", k, "zero-length removed", z)

pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(pcb, b)
