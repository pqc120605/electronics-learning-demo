#!/usr/bin/env python3
"""Export source-traceable PCB geometry for a supported board viewer.

Run with KiCad's bundled Python so its pcbnew module is available:
  "C:\\Program Files\\KiCad\\9.0\\bin\\python.exe" scripts/export_pcb_board_assets.py
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOARD_SOURCES = {
    "arduino-uno-r3": ROOT / "assets/boards/arduino-reference/arduino-uno-r3-official-import.kicad_pcb",
    "arduino-nano-classic": ROOT / "assets/boards/arduino-reference/arduino-nano-classic-official-import.kicad_pcb",
    "arduino-mega-2560-r3": ROOT / "assets/boards/arduino-reference/arduino-mega-2560-r3-official-import.kicad_pcb",
    "esp32-devkit": ROOT / "assets/boards/esp32-devkit-v1-30pin/esp32-devkit-v1-30pin.kicad_pcb",
    "stm32-bluepill-sinakarvandi": ROOT / "assets/boards/community/stm32-bluepill-sinakarvandi/bluepill_board/bluepill_board.kicad_pcb",
}
BOARD_OUTPUTS = {
    "arduino-uno-r3": "arduino-uno-r3-rev3",
    "arduino-nano-classic": "arduino-nano-classic",
    "arduino-mega-2560-r3": "arduino-mega-2560-r3",
    "esp32-devkit": "esp32-devkit-v1-30pin",
    "stm32-bluepill-sinakarvandi": "stm32-bluepill-sinakarvandi",
}
BOARD_METADATA = {
    "arduino-uno-r3": {
        "revision": "Arduino Uno Rev3 · source CAD import",
        "attribution": "Arduino Uno Rev3 CAD files; derived board geometry must retain CC BY-SA 4.0 attribution and share-alike terms. See assets/boards/arduino-reference/upstream-cad/License.txt.",
        "license": "CC BY-SA 4.0 (verify upstream archive terms before redistribution)",
    },
    "arduino-nano-classic": {
        "revision": "Arduino Nano classic · source CAD import (V3.3)",
        "attribution": "Arduino Nano CAD files; retain CC BY-SA 4.0 attribution and share-alike terms. See assets/boards/arduino-reference/upstream-cad/nano-classic/A00005-cad-files/License.txt.",
        "license": "CC BY-SA 4.0 (verify upstream archive terms before redistribution)",
    },
    "arduino-mega-2560-r3": {
        "revision": "Arduino Mega 2560 Rev3 · source CAD import",
        "attribution": "Arduino Mega 2560 Rev3 CAD files; retain CC BY-SA 4.0 attribution and share-alike terms. See assets/boards/arduino-reference/upstream-cad/mega-2560-r3/A000067-cad-files/License.txt.",
        "license": "CC BY-SA 4.0 (verify upstream archive terms before redistribution)",
    },
    "esp32-devkit": {
        "revision": "ESP32 Dev Kit Clone · Brij Modi reference design",
        "attribution": "ESP32 Dev Kit Clone by Brij Modi; upstream README declares MIT. Preserve author attribution and source link: https://github.com/BrijModi/ESP32-Dev-Kit-Clone. Standard KiCad package models retain their own licenses.",
        "license": "MIT declared by upstream README; KiCad package models have separate licenses",
    },
    "stm32-bluepill-sinakarvandi": {
        "revision": "SinaKarvandi PCB-Designs · bluepill_board · archive SHA-256 B2233F0D69FE57DB2A85BC31F6817F9F44DFCB23D9BE5BB19703C8BA68C8E4DC",
        "attribution": "SinaKarvandi, PCB-Designs, bluepill_board. Source archive and source board are preserved in assets/boards/community/stm32-bluepill-sinakarvandi/; the source design is distributed under GNU GPL-3.0.",
        "license": "GPL-3.0 (community source design); KiCad 3D library package models retain their own license",
        "source_archive_sha256": "b2233f0d69fe57db2a85bc31f6817f9f44dfcb23d9be5bb19703c8ba68c8e4dc",
    },
}


def load_pcbnew():
    try:
        import pcbnew  # type: ignore
        return pcbnew
    except ImportError as exc:
        raise SystemExit(
            "Không tìm thấy pcbnew. Hãy chạy script bằng Python đi kèm KiCad 9, "
            "ví dụ: \"C:\\Program Files\\KiCad\\9.0\\bin\\python.exe\" "
            "scripts/export_pcb_board_assets.py"
        ) from exc


def mm(pcbnew, point):
    return [round(pcbnew.ToMM(point.x), 4), round(pcbnew.ToMM(point.y), 4)]


def normalized(pcbnew, point, min_x, min_y):
    x, y = mm(pcbnew, point)
    return [round(x - min_x, 4), round(y - min_y, 4)]


def pad_shape_name(pcbnew, shape):
    names = {
        pcbnew.PAD_SHAPE_CIRCLE: "circle",
        pcbnew.PAD_SHAPE_RECT: "rect",
        pcbnew.PAD_SHAPE_OVAL: "oval",
        pcbnew.PAD_SHAPE_TRAPEZOID: "trapezoid",
        pcbnew.PAD_SHAPE_ROUNDRECT: "roundrect",
        pcbnew.PAD_SHAPE_CHAMFERED_RECT: "chamfered-rect",
        pcbnew.PAD_SHAPE_CUSTOM: "custom",
    }
    return names.get(shape, "unknown")


def net_metadata(board):
    result = {}
    for code, net_info in board.GetNetsByNetcode().items():
        name = net_info.GetNetname()
        result[str(code)] = {"id": str(code), "name": str(name), "kind": "unclassified"}
    for net in result.values():
        if net["name"].lower() == "gnd":
            net["kind"] = "ground"
        elif net["name"].startswith("+") or net["name"] in ("VIN", "USBVCC", "PWRIN"):
            net["kind"] = "power"
        elif net["name"]:
            net["kind"] = "signal"
    return result


def edge_paths(pcbnew, board, min_x, min_y):
    edges = []
    for item in board.GetDrawings():
        if item.GetLayerName() != "Edge.Cuts":
            continue
        start = normalized(pcbnew, item.GetStart(), min_x, min_y)
        end = normalized(pcbnew, item.GetEnd(), min_x, min_y)
        width = round(pcbnew.ToMM(item.GetWidth()), 4)
        if item.GetShape() == pcbnew.SHAPE_T_SEGMENT:
            edges.append({"start": start, "end": end, "width": width, "center": None})
        elif item.GetShape() == pcbnew.SHAPE_T_ARC:
            center = normalized(pcbnew, item.GetCenter(), min_x, min_y)
            edges.append({"start": start, "end": end, "width": width, "center": center})
    remaining = list(edges)
    paths = []
    epsilon = 0.002

    def same(a, b):
        return math.dist(a, b) <= epsilon

    while remaining:
        first = remaining.pop(0)
        start = first["start"]
        current = first["end"]
        commands = [f"M {start[0]} {start[1]}"]

        def append_edge(edge, reverse=False):
            nonlocal current
            a, b = (edge["end"], edge["start"]) if reverse else (edge["start"], edge["end"])
            if edge["center"] is None:
                commands.append(f"L {b[0]} {b[1]}")
            else:
                center = edge["center"]
                radius = round(math.dist(a, center), 4)
                cross = (a[0] - center[0]) * (b[1] - center[1]) - (a[1] - center[1]) * (b[0] - center[0])
                sweep = 1 if cross > 0 else 0
                commands.append(f"A {radius} {radius} 0 0 {sweep} {b[0]} {b[1]}")
            current = b

        append_edge(first)
        guard = 0
        while not same(current, start) and remaining and guard < len(edges) + 1:
            guard += 1
            found = None
            reverse = False
            for index, edge in enumerate(remaining):
                if same(edge["start"], current):
                    found = index
                    break
                if same(edge["end"], current):
                    found = index
                    reverse = True
                    break
            if found is None:
                break
            append_edge(remaining.pop(found), reverse)
        if same(current, start):
            commands.append("Z")
        paths.append(" ".join(commands))
    return paths


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--board-id", choices=sorted(BOARD_SOURCES), default="arduino-uno-r3")
    parser.add_argument("--source", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    source = (args.source or BOARD_SOURCES[args.board_id]).resolve()
    default_output = (ROOT / "assets/boards/archive/stm32-bluepill-sinakarvandi/manifest.json"
                     if args.board_id == "stm32-bluepill-sinakarvandi"
                     else ROOT / "public/boards" / BOARD_OUTPUTS[args.board_id] / "manifest.json")
    output = (args.output or default_output).resolve()
    if not source.is_file():
        raise SystemExit(f"Không tìm thấy file CAD nguồn: {source}")

    pcbnew = load_pcbnew()
    board = pcbnew.LoadBoard(str(source))
    if board is None:
        raise SystemExit(f"KiCad không đọc được board: {source}")
    bounds = board.GetBoardEdgesBoundingBox()
    min_x = pcbnew.ToMM(bounds.GetX())
    min_y = pcbnew.ToMM(bounds.GetY())
    width = pcbnew.ToMM(bounds.GetWidth())
    height = pcbnew.ToMM(bounds.GetHeight())
    nets = net_metadata(board)

    components = []
    for footprint in board.GetFootprints():
        position = normalized(pcbnew, footprint.GetPosition(), min_x, min_y)
        pads = []
        for pad in footprint.Pads():
            pad_layers = [layer_name for layer_name, layer_id in (("F.Cu", pcbnew.F_Cu), ("B.Cu", pcbnew.B_Cu)) if pad.GetLayerSet().Contains(layer_id)]
            pads.append({
                "number": str(pad.GetNumber()),
                "x": normalized(pcbnew, pad.GetPosition(), min_x, min_y)[0],
                "y": normalized(pcbnew, pad.GetPosition(), min_x, min_y)[1],
                "width": round(pcbnew.ToMM(pad.GetSize().x), 4),
                "height": round(pcbnew.ToMM(pad.GetSize().y), 4),
                "shape": pad_shape_name(pcbnew, pad.GetShape()),
                "rotation": round(pad.GetOrientationDegrees(), 3),
                "layer": pad_layers[0] if pad_layers else "F.Cu",
                "layers": pad_layers,
                "netId": str(pad.GetNetCode()) if pad.GetNetCode() else None,
                "netName": pad.GetNetname() or "Chưa nối net",
            })
        components.append({
            "reference": footprint.GetReference(),
            "value": footprint.GetValue(),
            "footprint": footprint.GetFPID().GetLibItemName(),
            "x": position[0],
            "y": position[1],
            "rotation": round(footprint.GetOrientationDegrees(), 3),
            "side": "front" if footprint.GetLayerName() == "F.Cu" else "back",
            "pads": pads,
        })

    features = []
    tracks = list(board.GetTracks())
    for index, track in enumerate(tracks):
        layer = track.GetLayerName()
        net_code = track.GetNetCode()
        net_id = str(net_code) if net_code else None
        if track.GetClass() == "PCB_VIA":
            point = normalized(pcbnew, track.GetPosition(), min_x, min_y)
            features.append({
                "id": f"via-{index}", "kind": "via", "layerId": "both",
                "netId": net_id, "netName": track.GetNetname() or "Chưa nối net",
                "x": point[0], "y": point[1],
                "diameter": round(pcbnew.ToMM(track.GetWidth(pcbnew.F_Cu)), 4),
                "drill": round(pcbnew.ToMM(track.GetDrill()), 4),
            })
        elif track.GetClass() == "PCB_TRACK":
            start = normalized(pcbnew, track.GetStart(), min_x, min_y)
            end = normalized(pcbnew, track.GetEnd(), min_x, min_y)
            features.append({
                "id": f"track-{index}", "kind": "track", "layerId": layer,
                "netId": net_id, "netName": track.GetNetname() or "Chưa nối net",
                "x1": start[0], "y1": start[1], "x2": end[0], "y2": end[1],
                "width": round(pcbnew.ToMM(track.GetWidth()), 4),
            })

    zone_filler = pcbnew.ZONE_FILLER(board)
    zone_filler.Fill(board.Zones())
    for zone_index, zone in enumerate(board.Zones()):
        layer = zone.GetLayerName()
        polyset = zone.GetFilledPolysList(zone.GetLayer())
        for polygon_index in range(polyset.OutlineCount()):
            polygon = polyset.Outline(polygon_index)
            contours = []
            for contour in [polygon] + [polyset.Hole(polygon_index, hole_index) for hole_index in range(polyset.HoleCount(polygon_index))]:
                points = [normalized(pcbnew, contour.CPoint(i), min_x, min_y) for i in range(contour.GetPointCount())]
                contours.append(points)
            features.append({
                "id": f"zone-{zone_index}-{polygon_index}", "kind": "zone", "layerId": layer,
                "netId": str(zone.GetNetCode()) if zone.GetNetCode() else None,
                "netName": zone.GetNetname() or "Chưa nối net", "contours": contours,
            })

    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    manifest = {
        "schemaVersion": 1,
        "boardId": args.board_id,
        "revision": BOARD_METADATA[args.board_id]["revision"],
        "sourceFiles": [os.path.relpath(source, ROOT).replace(os.sep, "/")],
        "sourceHash": source_hash,
        **({"sourceArchiveSha256": BOARD_METADATA[args.board_id]["source_archive_sha256"]} if args.board_id == "stm32-bluepill-sinakarvandi" else {}),
        "attribution": BOARD_METADATA[args.board_id]["attribution"],
        "license": BOARD_METADATA[args.board_id]["license"],
        "units": "mm",
        "bounds": {"width": round(width, 4), "height": round(height, 4)},
        "layers": [
            {"id": "F.Cu", "label": "Đồng mặt trên", "side": "front"},
            {"id": "B.Cu", "label": "Đồng mặt dưới", "side": "back"},
        ],
        "outline": edge_paths(pcbnew, board, min_x, min_y),
        "components": sorted(components, key=lambda item: item["reference"]),
        "nets": list(nets.values()),
        "copperFeatures": features,
        "pinToNet": {"D13/SCK": "8"} if args.board_id == "arduino-uno-r3" else {},
        "verifiedMappings": ([{
            "lessonId": "blink",
            "codePin": 13,
            "pinLabel": "D13/SCK",
            "netId": "8",
            "sourcePads": [
                {"reference": "ZU4", "pad": "19"},
                {"reference": "IOH0", "pad": "6"},
                {"reference": "ICSP0", "pad": "3"},
                {"reference": "TP_13", "pad": "X"},
            ],
            "description": "Mapping chỉ tới net SCK của chân D13 trên board CAD; không khẳng định đường đó nối tới LED onboard.",
        }] if args.board_id == "arduino-uno-r3" else []),
        "checkedOmissions": [
            "This is a source-CAD copper view, not an electrical simulation or a proof that every physical clone/revision matches.",
            *(["3D package bodies are not manufacturer-specific scans.", "This source maps D13/SCK to CAD net SCK; no lesson-to-onboard-LED route is enabled until the complete physical chain is independently reviewed."] if args.board_id == "arduino-uno-r3" else []),
            *(["Package bodies are schematic references; verify exact fitted parts and physical board revision separately."] if args.board_id != "arduino-uno-r3" else []),
            "Copper-zone fill is computed by KiCad pcbnew from the checked-in board source during export.",
        ],
        "verification": "source-reviewed",
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"), default=str) + "\n"
    output.write_text(serialized, encoding="utf-8")
    if args.board_id == "stm32-bluepill-sinakarvandi":
        runtime_manifest = ROOT / "assets/boards/archive/stm32-bluepill-sinakarvandi/runtime-manifest.json"
        runtime_manifest.write_text(serialized, encoding="utf-8")
    print(f"Exported {len(components)} components, {len(features)} copper features and {len(nets)} nets")
    print(f"Source SHA-256: {source_hash}")
    print(f"Manifest: {output}")


if __name__ == "__main__":
    main()
