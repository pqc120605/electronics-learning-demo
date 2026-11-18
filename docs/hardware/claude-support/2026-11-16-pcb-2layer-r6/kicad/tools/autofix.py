# -*- coding: utf-8 -*-
"""r6: sau route.sh — doc DRC JSON, (1) go doan track lo lung (track_dangling), (2) noi tung cap unconnected
bang A* hai lop (preroute._route, rong 0,2 mm, cho phep via). MOT vong moi lan chay (swig khong nap lai bo an toan);
lap o shell toi khi in 'CLEAN'. Usage: python.exe autofix.py robot|handset"""
import os, sys, json, subprocess, re, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pcbnew, preroute
M = pcbnew.ToMM
K = r"D:\StartupOS\.tools\kicad-10.0.7\bin\kicad-cli.exe"
n = sys.argv[1]
d = os.path.join(os.path.dirname(HERE), n); pcb = os.path.join(d, "mobot-%s.kicad_pcb" % n)
rep = os.path.join(os.path.dirname(os.path.dirname(HERE)), "reports", "%s-autofix-drc.json" % n)
D = importlib.import_module("design_" + n).DESIGN


def drc():
    subprocess.run([K, "pcb", "drc", "--schematic-parity", "--severity-all", "--format", "json", "-o", rep, pcb], capture_output=True)
    return json.load(open(rep, encoding="utf-8"))


def endpoint(it):
    s = it["description"]; x, y = it["pos"]["x"], it["pos"]["y"]
    m = re.match(r"(?:PTH )?[Pp]ad (\S+) \[[^\]]*\] of (\S+)", s)
    if m:
        return "%s:%s" % (m.group(2), m.group(1))
    return "%.4f,%.4f@%s" % (x, y, "B" if "B.Cu" in s else "F")


for rnd in range(1):
    r = drc()
    dang = [v for v in r["violations"] if v["type"] == "track_dangling"]
    un = r["unconnected_items"]
    print("round", rnd, "dangling", len(dang), "unconnected", len(un))
    if not dang and not un:
        print("CLEAN"); sys.exit(0)
    if not un and not dang:
        sys.exit(0)
    b = pcbnew.LoadBoard(pcb)
    if dang and not un:
        # chi go dung doan lo lung: khop net + lop + chieu dai trong mo ta DRC va co mot dau tai vi tri bao
        dead = []
        for v in dang:
            it = v["items"][0]; x, y = it["pos"]["x"], it["pos"]["y"]
            m = re.search(r"\[/?([^\]]+)\] on (\S+), length ([0-9.]+) mm", it["description"])
            if not m:
                continue
            net, lay, ln = m.group(1), m.group(2), float(m.group(3))
            for t in b.GetTracks():
                if t.Type() != pcbnew.PCB_TRACE_T or t.GetNetname().lstrip("/") != net or b.GetLayerName(t.GetLayer()) != lay:
                    continue
                if abs(M(t.GetLength()) - ln) > 0.002:
                    continue
                if any(abs(M(p.x) - x) < 0.002 and abs(M(p.y) - y) < 0.002 for p in (t.GetStart(), t.GetEnd())):
                    if all(t is not q for q in dead):
                        dead.append(t)
        for t in dead:
            b.Remove(t)
        print("  removed dangling", len(dead))
        pcbnew.SaveBoard(pcb, b)
        sys.exit(0)
    for v in un:
        a, c = v["items"][0], v["items"][1]
        net = re.search(r"\[/?([^\]]+)\]", a["description"]).group(1)
        A, B = endpoint(a), endpoint(c)
        added, msg = preroute._route(b, D, net, A, B, 0.2, "FB")
        print("  %-10s %s -> %s : %s" % (net, A, B, msg))
    pcbnew.ZONE_FILLER(b).Fill(b.Zones())
    pcbnew.SaveBoard(pcb, b)
r = drc()
print("final dangling", sum(1 for v in r["violations"] if v["type"] == "track_dangling"), "unconnected", len(r["unconnected_items"]),
      "violations", len(r["violations"]))
