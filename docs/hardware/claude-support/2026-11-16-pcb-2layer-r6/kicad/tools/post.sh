#!/bin/sh
# Post-route chain: DRC -> fix_gnd -> bridge -> silk -> DRC. Usage: sh post.sh handset|robot  (run from the 2026-11-12-pcb-2layer folder)
n=$1; K="D:/StartupOS/.tools/kicad-10.0.7/bin"
drc() { "$K/kicad-cli.exe" pcb drc --schematic-parity --severity-all -o reports/$n-drc.rpt kicad/$n/mobot-$n.kicad_pcb 2>&1 | grep Found; }
drc
"$K/python.exe" kicad/tools/fix_gnd.py $n 2>&1 | grep -E "None|fail|grid|widened|rror"
drc >/dev/null
for i in 1 2 3; do
  pts=$(grep -A3 -E "^.via_dangling" reports/$n-drc.rpt | grep -oE "@\([0-9.]+ mm, [0-9.]+ mm\): Via" | sed -E 's/@\(([0-9.]+) mm, ([0-9.]+) mm\).*/\1,\2/' | tr '\n' ' ')
  [ -z "$pts" ] && break
  "$K/python.exe" kicad/tools/rm_via.py $n $pts 2>&1 | grep removed; drc >/dev/null
done
for m in 0.33 0.22; do M=$m "$K/python.exe" kicad/tools/gnd_comp.py $n --bridge 2>&1 | grep -E "bridge|BRIDGE"; done
"$K/python.exe" kicad/tools/gnd_comp.py $n 2>&1 | grep -v swig | head -6
"$K/python.exe" kicad/tools/fix_silk.py $n 2>&1 | grep -E "F.Fab|not moved|refs placed"
drc
grep -oE "^.[a-z_]+\]" reports/$n-drc.rpt | sort | uniq -c | sort -rn
grep -A4 -E "^\[" reports/$n-drc.rpt | grep -vE "silk" | grep -E "^\[|@" | head -30
"$K/python.exe" kicad/tools/zone_frag.py $n 2>&1 | grep fragments
