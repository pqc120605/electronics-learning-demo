#!/bin/sh
# Full flow for one board. Usage: sh kicad/tools/route.sh handset|robot   (run from the 2026-11-12-pcb-2layer folder)
# A: F.Cu only (B.Cu kept as GND plane) -> rip nets on IC pins -> B: both layers, B.Cu 3x cost -> C: leftovers -> post.sh
n=$1; K="D:/StartupOS/.tools/kicad-10.0.7/bin"; L=reports/$n-route2.txt
(cd kicad/tools && "$K/python.exe" fr_route2.py $n 10 10 --only-a) > $L 2>&1
"$K/python.exe" kicad/tools/fix_pro.py $n >> $L 2>&1
"$K/python.exe" kicad/tools/rip_ic.py $n >> $L 2>&1
(cd kicad/tools && STAGE=stageA2 LOCK=0 BCOST=${BCOST:-3.0} "$K/python.exe" fr_route2.py $n 10 15 --from-a) >> $L 2>&1
"$K/python.exe" kicad/tools/fix_pro.py $n >> $L 2>&1
grep -E "WARN|track mm|ripped|rc |Traceback|Error" $L
sh kicad/tools/post.sh $n 2>&1
