"""Extract geometry from the locked Nano Every archive and MB1136C PCB.

Run with the KiCad 10.0.7 Python. The resulting JSON is an input to the GLB
generator. Raw manufacturer files stay in the source directories.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from zipfile import ZipFile

import pcbnew

CONFIG = Path("docs/research/2026-11-26-catalog-model-remaining-13-proposal.json")
APPROVAL = "b4ffbe029a95931441999ba5385a5f05d3976c2e192c515d2d7a62bc071a2841"


def checked(data, spec):
    if len(data) != spec["bytes"] or hashlib.sha256(data).hexdigest() != spec["sha256"]:
        raise ValueError("Input mismatch: " + spec.get("member", spec.get("path", "")))
    return data


def archive_members(spec, members):
    checked(Path(spec["path"]).read_bytes(), spec)
    with ZipFile(spec["path"]) as archive:
        return {Path(m["member"]).suffix: checked(archive.read(m["member"]), m) for m in members}


def nano_layout(config):
    variant = next(b for b in config["boards"] if b["catalogId"] == "arduino-nano-every")
    records = archive_members(config["sourceLocks"]["nano-every-cad.zip"], variant["archiveMembers"])
    pins = {"JP2": {}, "JP3": {}}
    for line in records[".ipc"].decode("ascii").splitlines():
        match = re.search(r"(JP[23])\s*-\s*(\d+).*?D\s*(\d+)P.*?X\s*([+-]?\d+)Y\s*([+-]?\d+)", line)
        if match:
            ref, pad, drill, x, y = match.groups()
            pins[ref][int(pad)] = [round(int(x) * .00254, 4), round(int(y) * .00254, 4), int(drill) * .0254]
    if any(sorted(row) != list(range(1, 16)) for row in pins.values()):
        raise ValueError("Nano Every IPC must contain 30 drilled header pads")
    placement = {}
    for line in records[".mnt"].decode("ascii").splitlines():
        fields = line.split()
        if len(fields) >= 4 and re.fullmatch(r"[A-Z]+\d+", fields[0]):
            placement[fields[0]] = [float(fields[1]), float(fields[2]), float(fields[3])]
    return {"headers": pins, "placement": placement}


def nucleo_layout(config, out, cli):
    source = config["sourceLocks"]["st-mb1136-board-project"]
    raw = archive_members(source, source["memberChecks"])[".PcbDoc"]
    altium, imported = out / "MB1136.PcbDoc", out / "mb1136-verified.kicad_pcb"
    altium.write_bytes(raw)
    subprocess.run([cli, "pcb", "import", "--format", "altium", "-o", str(imported), str(altium)], check=True)
    board = pcbnew.LoadBoard(str(imported))
    edges = [point for shape in board.GetDrawings() if shape.GetLayer() == pcbnew.Edge_Cuts
             for point in [pcbnew.ToMM(shape.GetStart()), pcbnew.ToMM(shape.GetEnd())]]
    x0, z0 = min(p[0] for p in edges), min(p[1] for p in edges)
    width, length = max(p[0] for p in edges) - x0, max(p[1] for p in edges) - z0
    if (round(width, 2), round(length, 2)) != (70, 83) or len(edges) != 8:
        raise ValueError("Unexpected MB1136C Edge.Cuts")

    def point(position):
        x, z = pcbnew.ToMM(position)
        return [round(x - x0 - width / 2, 4), round(z - z0 - length / 2, 4)]

    headers = {"CN5": 10, "CN6": 8, "CN7": 38, "CN8": 6, "CN9": 8, "CN10": 38}
    footprints = {f.GetReference(): f for f in board.GetFootprints()}
    placement_refs = ["CN1", "CN2", "CN4", "U1", "U2", "U5", "B1", "B2", "LD1", "LD2", "LD3", "JP1", "JP5", "JP6"]
    placement = {ref: point(footprints[ref].GetPosition()) for ref in placement_refs}
    pads = {}
    for ref, count in headers.items():
        pads[ref] = {int(p.GetNumber()): point(p.GetPosition()) for p in footprints[ref].Pads()}
        if sorted(pads[ref]) != list(range(1, count + 1)):
            raise ValueError("Unexpected pads on " + ref)
    mounts = [point(p.GetPosition()) for f in footprints.values() for p in f.Pads() if pcbnew.ToMM(p.GetDrillSize())[0] >= 2.7]
    auxiliary = {ref: [point(p.GetPosition()) for p in footprints[ref].Pads()]
                 for ref in ("CN2", "CN4", "JP1", "JP5", "JP6")}
    return {"size": [round(width, 4), round(length, 4)], "headers": pads, "placement": placement,
            "mounts": mounts, "auxiliary": auxiliary}


if __name__ == "__main__":
    import sys
    out, cli = Path(sys.argv[1]), sys.argv[2]
    raw = CONFIG.read_bytes()
    if hashlib.sha256(raw).hexdigest() != APPROVAL:
        raise ValueError("Unapproved catalog configuration")
    config = json.loads(raw)
    out.mkdir(parents=True, exist_ok=True)
    data = {"nano": nano_layout(config), "nucleo": nucleo_layout(config, out, cli)}
    (out / "verified-layouts.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
