# -*- coding: utf-8 -*-
"""Route a MoBot board with Freerouting. Usage: python.exe fr_route.py handset|robot [passes]"""
import sys, os, subprocess, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pcbnew, mobot_build
name = sys.argv[1]; passes = sys.argv[2] if len(sys.argv) > 2 else "20"
JAVA = r"D:\StartupOS\.tools\jre\jdk-25.0.5+8-jre\bin\java.exe"
JAR = r"D:\StartupOS\.tools\freerouting\freerouting.jar"
mobot_build.build(name, do_route=False)
d = os.path.join(mobot_build.ROOT, name); pcb = os.path.join(d, "mobot-%s.kicad_pcb" % name)
dsn = os.path.join(d, "mobot-%s.dsn" % name); ses = os.path.join(d, "mobot-%s.ses" % name)
if os.path.exists(ses): os.remove(ses)
b = pcbnew.LoadBoard(pcb)
print("dsn export:", pcbnew.ExportSpecctraDSN(b, dsn))
t = time.time()
r = subprocess.run([JAVA, "-jar", JAR, "-de", dsn, "-do", ses, "-mp", passes, "--gui.enabled=false"],
                   capture_output=True, text=True, timeout=2400)
print("freerouting rc", r.returncode, "%.0fs" % (time.time() - t))
print((r.stdout or "")[-1500:]); print((r.stderr or "")[-800:])
if os.path.exists(ses):
    print("ses import:", pcbnew.ImportSpecctraSES(b, ses))
    pcbnew.ZONE_FILLER(b).Fill(b.Zones())
    pcbnew.SaveBoard(pcb, b)
    print("tracks", len(b.GetTracks()))
else:
    print("NO SES")
