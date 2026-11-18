# -*- coding: utf-8 -*-
"""Two-stage Freerouting run that keeps B.Cu as a near-solid GND plane.
Stage A: B.Cu is declared a power plane, so every net that can be routed on F.Cu alone is.
Stage B: stage-A tracks are locked, B.Cu is opened as a signal layer for the leftovers only.
Usage: python.exe fr_route2.py handset|robot [passesA] [passesB]"""
import sys, os, subprocess, time, re
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pcbnew, mobot_build
name = sys.argv[1]
pA = sys.argv[2] if len(sys.argv) > 2 else "10"; pB = sys.argv[3] if len(sys.argv) > 3 else "10"
JAVA = r"D:\StartupOS\.tools\jre\jdk-25.0.5+8-jre\bin\java.exe"
JAR = r"D:\StartupOS\.tools\freerouting\freerouting.jar"
d = os.path.join(mobot_build.ROOT, name); pcb = os.path.join(d, "mobot-%s.kicad_pcb" % name)
dsn = os.path.join(d, "mobot-%s.dsn" % name); ses = os.path.join(d, "mobot-%s.ses" % name)


def stats(b, tag):
    L = {}
    nv = 0
    for t in b.GetTracks():
        if t.GetClass() == "PCB_VIA":
            nv += 1
        else:
            k = b.GetLayerName(t.GetLayer()); L[k] = L.get(k, 0.0) + pcbnew.ToMM(t.GetLength())
    b.BuildConnectivity()
    print(tag, "track mm", {k: round(v) for k, v in L.items()}, "vias", nv,
          "unconnected", b.GetConnectivity().GetUnconnectedCount(False))


def route(passes, tag):
    if os.path.exists(ses):
        os.remove(ses)
    t = time.time()
    r = subprocess.run([JAVA, "-jar", JAR, "-de", dsn, "-do", ses, "-mp", passes, "--gui.enabled=false"],
                       capture_output=True, text=True, timeout=900)
    print(tag, "freerouting rc", r.returncode, "%.0fs" % (time.time() - t))
    return os.path.exists(ses)


BCOST = os.environ.get("BCOST", "6.0")
SETTINGS = """    (autoroute_settings
      (fanout off)
      (autoroute on)
      (postroute on)
      (vias on)
      (via_costs 30)
      (plane_via_costs 5)
      (start_ripup_costs 100)
      (start_pass_no 1)
      (layer_rule F.Cu
        (active on)
        (preferred_direction horizontal)
        (preferred_direction_trace_costs 1.0)
        (against_preferred_direction_trace_costs 1.2)
      )
      (layer_rule B.Cu
        (active on)
        (preferred_direction vertical)
        (preferred_direction_trace_costs %s)
        (against_preferred_direction_trace_costs %s)
      )
    )
""" % (BCOST, BCOST)
stageA = pcb.replace(".kicad_pcb", ".%s.kicad_pcb" % os.environ.get("STAGE", "stageA"))
SINGLE = "--single" in sys.argv
if SINGLE:
    mobot_build.build(name, do_route=False)
    b = pcbnew.LoadBoard(pcb)
elif "--from-a" in sys.argv and os.path.exists(stageA):
    b = pcbnew.LoadBoard(stageA)
    stats(b, "A(saved)")
else:
    mobot_build.build(name, do_route=False)
    b = pcbnew.LoadBoard(pcb)
    # r6: di tay duong nguon/sense truoc (preroute.py), khoa lai de Freerouting giu nguyen
    import importlib, preroute
    preroute.apply(b, importlib.import_module("design_" + name).DESIGN, d)
    print("dsn export A:", pcbnew.ExportSpecctraDSN(b, dsn))
    txt = open(dsn, encoding="utf-8").read()
    txt2, k = re.subn(r"(\(layer B\.Cu\s*\(type )signal", r"\1power", txt)
    print("B.Cu -> power:", k)
    open(dsn, "w", encoding="utf-8").write(txt2)
    if route(pA, "A"):
        print("ses import A:", pcbnew.ImportSpecctraSES(b, ses))
        stats(b, "A")
        pcbnew.SaveBoard(stageA, b)
        import shutil; shutil.copyfile(pcb.replace('.kicad_pcb', '.kicad_pro'), stageA.replace('.kicad_pcb', '.kicad_pro'))
    else:
        print("A: NO SES")
# Stage-A tracks of nets on IC pins box those pins in; drop them so stage B routes ICs with both layers.
if os.environ.get("RIPU", "0") == "1":
    unets = set()
    for fp in b.GetFootprints():
        if fp.GetReference().startswith("U"):
            for pd in fp.Pads():
                unets.add(pd.GetNetCode())
    k = 0
    for t in list(b.GetTracks()):
        if t.GetNetCode() in unets:
            b.Remove(t); k += 1
    print("ripped IC-net tracks", k)
    import shutil
    rip = pcb.replace(".kicad_pcb", ".stageA2.kicad_pcb")
    shutil.copyfile(pcb.replace(".kicad_pcb", ".kicad_pro"), rip.replace(".kicad_pcb", ".kicad_pro"))
    pcbnew.SaveBoard(rip, b)
    shutil.copyfile(pcb.replace(".kicad_pcb", ".kicad_pro"), rip.replace(".kicad_pcb", ".kicad_pro"))
    b = pcbnew.LoadBoard(rip)      # reload: the swig track list is unusable after Remove()
    stats(b, "A-ripped")
if "--only-a" not in sys.argv:
    for t in b.GetTracks():
        t.SetLocked((not SINGLE) and os.environ.get("LOCK", "1") == "1")
    print("dsn export B:", pcbnew.ExportSpecctraDSN(b, dsn))
    txt = open(dsn, encoding="utf-8").read()
    if BCOST != "0":
        txt = txt.replace("    (boundary", SETTINGS + "    (boundary", 1)
        open(dsn, "w", encoding="utf-8").write(txt)
    print("fixed wires in dsn:", txt.count("(type fix)"), "BCOST", BCOST)
    if route(pB, "B"):
        print("ses import B:", pcbnew.ImportSpecctraSES(b, ses))
        for t in b.GetTracks():
            t.SetLocked(False)
        stats(b, "B")
    else:
        print("B: NO SES")
# stage C: leftovers. Bottom layer gets cheaper each round until everything is connected.
for cc in ("2.0", "1.0", "1.0"):
    b.BuildConnectivity()
    if "--only-a" in sys.argv or b.GetConnectivity().GetUnconnectedCount(False) == 0:
        break
    print("dsn export C:", pcbnew.ExportSpecctraDSN(b, dsn))
    txt = open(dsn, encoding="utf-8").read()
    txt = txt.replace("    (boundary", (SETTINGS.replace(BCOST, cc) if cc != "1.0" else "") + "    (boundary", 1)
    open(dsn, "w", encoding="utf-8").write(txt)
    if route("10", "C cost " + cc):
        print("ses import C:", pcbnew.ImportSpecctraSES(b, ses))
        stats(b, "C")
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(pcb, b)
print("saved")
