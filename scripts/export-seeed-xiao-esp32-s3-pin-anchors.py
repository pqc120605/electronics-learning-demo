"""Generate XIAO ESP32-S3 header anchors from the bundled Seeed OPL KiCad PCB.

Run with KiCad's bundled Python from the electronics-learning-demo directory:
  & 'C:\\Program Files\\KiCad\\9.0\\bin\\python.exe' .\\scripts\\export-seeed-xiao-esp32-s3-pin-anchors.py
"""

import hashlib
import json
from pathlib import Path

import pcbnew


ROOT = Path(__file__).resolve().parents[1]
PCB_RELATIVE = Path("assets/boards/vendor/seeed/opl-xiao-esp32s3/ESP32S3.kicad_pcb")
OUTPUT = ROOT / "src/data/seeed-xiao-esp32-s3.pin-anchors.json"
STEP_INVENTORY = ROOT / "src/data/seeed-xiao-esp32-s3.mesh-inventory.json"

# The STEP converter centers the PCB body and preserves source STEP Y-up.
# KiCad X maps to STEP Z; KiCad Y points down while STEP X points toward USB.
STEP_BODY_BOUNDS_MM = json.loads(STEP_INVENTORY.read_text(encoding="utf-8"))["pcbBodyBoundsMm"]

NET_TO_LABEL = {
    "VBUS": "5V",
    "GND": "GND",
    "VCC_3V3": "3V3",
    "D0/A0": "D0",
    "D1/A1": "D1",
    "D2/A2": "D2",
    "D3/A3": "D3",
    "D4/I2C_SDA": "D4",
    "D5/I2C_SCL": "D5",
    "D6/TX": "D6",
    "D7/RX": "D7",
    "D8/A8/SCK": "D8",
    "D9/A9/MISO": "D9",
    "D10/A10/MOSI": "D10",
}


def mm(iu):
    return pcbnew.ToMM(iu)


def rounded(value):
    return round(value, 6)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


source = ROOT / PCB_RELATIVE
board = pcbnew.LoadBoard(str(source))
if board is None:
    raise SystemExit(f"Could not load KiCad PCB: {source}")

outline = board.GetBoardEdgesBoundingBox()
cad_min_x = mm(outline.GetLeft())
cad_max_x = mm(outline.GetRight())
cad_min_y = mm(outline.GetTop())
cad_max_y = mm(outline.GetBottom())
cad_center_x = (cad_min_x + cad_max_x) / 2
cad_center_y = (cad_min_y + cad_max_y) / 2
step_center_x = (STEP_BODY_BOUNDS_MM["min"][0] + STEP_BODY_BOUNDS_MM["max"][0]) / 2
step_center_y = (STEP_BODY_BOUNDS_MM["min"][1] + STEP_BODY_BOUNDS_MM["max"][1]) / 2
step_center_z = (STEP_BODY_BOUNDS_MM["min"][2] + STEP_BODY_BOUNDS_MM["max"][2]) / 2
step_top_y = STEP_BODY_BOUNDS_MM["max"][1]

footprints = {fp.GetReference(): fp for fp in board.GetFootprints()}
headers = []
seen_labels = set()

for reference, side in (("J2", "left"), ("J1", "right")):
    footprint = footprints.get(reference)
    if footprint is None:
        raise SystemExit(f"Missing expected header footprint {reference}")

    by_net = {}
    for pad in footprint.Pads():
        net_name = pad.GetNetname()
        if net_name not in NET_TO_LABEL:
            continue
        position = pad.GetPosition()
        by_net.setdefault(net_name, []).append((pad.GetNumber(), mm(position.x), mm(position.y)))

    pins = []
    for net_name, pads in by_net.items():
        if len(pads) != 2:
            raise SystemExit(f"{reference} {net_name}: expected two mirrored half-hole pads, got {len(pads)}")
        label = NET_TO_LABEL[net_name]
        if label in seen_labels:
            raise SystemExit(f"Duplicate pin label in source CAD: {label}")
        seen_labels.add(label)

        cad_x = sum(pad[1] for pad in pads) / len(pads)
        cad_y = sum(pad[2] for pad in pads) / len(pads)
        # Align outline centers. The source CAD outline and STEP body differ by
        # at most 0.095 mm along the long axis; no scale or reflection is applied.
        # The GLB converter already subtracts the STEP PCB-body center from
        # every vertex. Anchors must therefore be expressed relative to that
        # same center; adding the STEP center here would offset the pin twice.
        local_x_mm = -(cad_y - cad_center_y)
        local_y_mm = step_top_y - step_center_y
        local_z_mm = cad_x - cad_center_x
        pins.append({
            "id": f"xiao-s3-{label.lower()}",
            "side": side,
            "headerReference": reference,
            "position": 0,
            "padNumber": "/".join(sorted((pad[0] for pad in pads), key=int)),
            "label": label,
            "cadNetName": net_name,
            "cadXmm": rounded(cad_x),
            "cadYmm": rounded(cad_y),
            "anchorMeters": [rounded(local_x_mm / 1000), rounded(local_y_mm / 1000), rounded(local_z_mm / 1000)],
        })

    pins.sort(key=lambda pin: pin["cadYmm"])
    for index, pin in enumerate(pins, start=1):
        pin["position"] = index
    headers.append({"headerReference": reference, "side": side, "pins": pins})

if seen_labels != set(NET_TO_LABEL.values()):
    raise SystemExit(f"Header map incomplete: {sorted(seen_labels)}")

max_long_axis_residual = max(
    abs((cad_max_y - cad_center_y) - (STEP_BODY_BOUNDS_MM["max"][0] - step_center_x)),
    abs((cad_center_y - cad_min_y) - (step_center_x - STEP_BODY_BOUNDS_MM["min"][0])),
)
max_short_axis_residual = max(
    abs((cad_max_x - cad_center_x) - (STEP_BODY_BOUNDS_MM["max"][2] - step_center_z)),
    abs((cad_center_x - cad_min_x) - (step_center_z - STEP_BODY_BOUNDS_MM["min"][2])),
)

output = {
    "boardId": "seeed-xiao-esp32-s3",
    "sourcePcb": PCB_RELATIVE.as_posix(),
    "sourcePcbUrl": "https://github.com/Seeed-Studio/OPL_Kicad_Library/blob/master/Seeed%20Studio%20XIAO%20ESP32S3/ESP32S3.kicad_pcb",
    "sourcePcbSha256": sha256(source),
    "license": "CC BY-SA 4.0",
    "sourceRevision": "Seeed OPL KiCad board; file has no explicit PCB revision metadata",
    "alignedModel": "Seeed Studio XIAO ESP32-S3 regular-board STEP v2",
    "coordinateDerivation": "Average of same-net inner/outer half-hole pad centers from J1/J2; outline-center aligned to the official regular-board STEP. KiCad X→STEP Z, KiCad Y-down→STEP X toward USB; top copper plane from STEP. No scale or reflection.",
    "outlineMm": {
        "cad": {"minX": rounded(cad_min_x), "maxX": rounded(cad_max_x), "minY": rounded(cad_min_y), "maxY": rounded(cad_max_y)},
        "stepPcbBody": STEP_BODY_BOUNDS_MM,
        "maxResidualMm": {"longAxis": rounded(max_long_axis_residual), "shortAxis": rounded(max_short_axis_residual)},
    },
    "headers": headers,
}
OUTPUT.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT.relative_to(ROOT)} using KiCad {pcbnew.GetBuildVersion()}; {len(seen_labels)} pin anchors")
print(f"PCB SHA256 {output['sourcePcbSha256']}; max outline residual long={max_long_axis_residual:.3f} mm, short={max_short_axis_residual:.3f} mm")
