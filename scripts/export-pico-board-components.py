"""Export Pico R3a footprints using the read-only board import from KiCad CLI."""
import argparse
import hashlib
import json
import math
from pathlib import Path

from export_pcb_board_assets import load_pcbnew


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("imported_pcb", type=Path, help="Output of kicad-cli pcb import on RPI-PICO-R3a-PUBLIC.brd")
    args = parser.parse_args()

    board_id = "raspberry-pi-pico"
    pin_map = json.loads(Path("src/data/raspberry-pi-pico.j0-pads.json").read_text(encoding="utf-8"))
    original = pin_map["sources"][board_id]
    source_hash = hashlib.sha256(Path(original["file"]).read_bytes()).hexdigest()
    if source_hash != original["sha256"].lower():
        raise SystemExit("Pico source hash changed")
    source = {"file": original["file"], "sha256": source_hash, "revision": "Raspberry Pi Pico R3a",
              "license": "Raspberry Pi permissive design-file license"}
    pcbnew = load_pcbnew()
    board = pcbnew.LoadBoard(str(args.imported_pcb))
    mm = pcbnew.ToMM
    expected = {str(pad["number"]): pad for pad in pin_map["pads"]}
    seen = set()
    components = []
    for footprint in sorted(board.GetFootprints(), key=lambda item: item.GetReference()):
        ref = footprint.GetReference()
        if not ref:
            # Allegro imports unnamed artwork and auxiliary lands as footprints.
            continue
        side = "front" if footprint.GetLayer() == pcbnew.F_Cu else "back"
        pads = []
        extents = []
        for contact in footprint.Pads():
            pos = contact.GetPosition()
            number = str(contact.GetNumber())
            pad = {"padNumber": number, "name": contact.GetNetname() or number,
                   "electricalType": "unspecified", "xMm": mm(pos.x), "yMm": mm(pos.y), "side": side}
            if contact.GetNetname():
                pad["net"] = contact.GetNetname()
            if ref == "J0":
                source_pad = expected.get(number)
                if (not source_pad or number in seen or pad.get("net") != source_pad["net"]
                        or math.hypot(pad["xMm"] - source_pad["xMm"], pad["yMm"] - source_pad["yMm"]) > 0.0001):
                    raise SystemExit(f"Pico J0 pad {number} differs from pinned data")
                seen.add(number)
                pad["pinId"] = f"j0-{number}"
            pads.append(pad)
            extent = contact.GetBoundingBox()
            x, y, w, h = mm(extent.GetX()), mm(extent.GetY()), mm(extent.GetWidth()), mm(extent.GetHeight())
            extents.append((x, y, x + w, y + h))
        bounds = None
        if extents:
            x_min = min(row[0] for row in extents)
            y_min = min(row[1] for row in extents)
            x_max = max(row[2] for row in extents)
            y_max = max(row[3] for row in extents)
            bounds = {"w": x_max - x_min, "h": y_max - y_min, "x": (x_min + x_max) / 2, "y": (y_min + y_max) / 2}
        point = footprint.GetPosition()
        row = {"ref": ref, "value": footprint.GetValue(), "description": "",
               "footprint": str(footprint.GetFPID().GetLibItemName()), "side": side,
               "xMm": mm(point.x), "yMm": mm(point.y), "rotationDeg": footprint.GetOrientationDegrees(),
               "bboxMm": bounds, "pads": pads, "source": source}
        pin_one = next((pad for pad in pads if pad["padNumber"] == "1"), None)
        if pin_one:
            row["pin1"] = {"xMm": pin_one["xMm"], "yMm": pin_one["yMm"]}
        components.append(row)
    if seen != set(expected):
        raise SystemExit("Pico J0 import does not have every reference contact")
    model_hash = hashlib.sha256(Path(f"public/models/{board_id}.glb").read_bytes()).hexdigest()
    output = {"boardId": board_id, "source": source, "modelSha256": model_hash,
              "modelOffsetMm": {"x": 0, "z": 0}, "components": components}
    Path(f"src/data/board-components/{board_id}.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{board_id}: {len(components)} footprints, {len(seen)} J0 pads")


if __name__ == "__main__":
    main()
