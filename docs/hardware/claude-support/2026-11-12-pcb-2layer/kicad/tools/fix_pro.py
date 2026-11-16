# Rewrite <board>.kicad_pro with the project rules (pcbnew.SaveBoard can reset it to defaults).
# Usage: python fix_pro.py handset|robot
import os, sys, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import mobot_build
n = sys.argv[1]
D = importlib.import_module("design_" + n).DESIGN
proj = "mobot-" + n
mobot_build.write_project(os.path.join(mobot_build.ROOT, n, proj + ".kicad_pro"), proj,
                          {"clearance": D.get("clearance", 0.15), "power": sorted(D.get("netclass", {}))})
print("project rules rewritten")
